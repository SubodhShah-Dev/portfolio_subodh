import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { ContentRow } from "../../components/admin/ContentRow";
import { EntityForm } from "../../components/admin/EntityForm";
import { TextField, TextAreaField, SelectField } from "../../components/admin/fields";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useOrderedCollection,
  type CollectionAdapter,
} from "../../hooks/useOrderedCollection";
import { CONTENT_STATUSES, type ContentStatus } from "../../types/common";
import type { Certification, CertificationInput } from "../../types/certification";
import {
  createCertification,
  deleteCertification,
  getAllCertifications,
  reorderCertifications,
  setCertificationStatus,
  updateCertification,
} from "../../services/certificationService";
import { fieldErrors, requiredError } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<Certification, CertificationInput> = {
  getAll: getAllCertifications,
  create: createCertification,
  update: updateCertification,
  remove: deleteCertification,
  setStatus: setCertificationStatus,
  reorder: reorderCertifications,
};

interface FormValues {
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
  description: string;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  title: "",
  issuer: "",
  issueDate: "",
  credentialUrl: "",
  description: "",
  status: "published",
};

function toValues(item: Certification | null): FormValues {
  if (item === null) return EMPTY_VALUES;
  return {
    title: item.title,
    issuer: item.issuer,
    issueDate: item.issueDate ?? "",
    credentialUrl: item.credentialUrl ?? "",
    description: item.description ?? "",
    status: item.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    title: requiredError("Title", values.title),
    issuer: requiredError("Issuer", values.issuer),
    credentialUrl: urlError(values.credentialUrl, { label: "Credential URL" }),
  });
}

export default function ManageCertifications() {
  const collection = useOrderedCollection<Certification, CertificationInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Certification) => {
    collection.saveState.reset();
    setEditing(item);
    setValues(toValues(item));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: CertificationInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      title: values.title.trim(),
      issuer: values.issuer.trim(),
      ...(values.issueDate.trim() !== "" ? { issueDate: values.issueDate.trim() } : {}),
      ...(values.credentialUrl.trim() !== ""
        ? { credentialUrl: values.credentialUrl.trim() }
        : {}),
      ...(values.description.trim() !== ""
        ? { description: values.description.trim() }
        : {}),
    };
    const result = await collection.save(editing?.id ?? null, input);
    if (result.ok) setFormOpen(false);
  };

  return (
    <AdminPageShell
      title="Certifications"
      description="Manage certifications and credentials shown on the public site."
      actions={<Button onClick={openCreate}>Add certification</Button>}
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add certification" : `Edit ${editing.title}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Title"
            id="cert-title"
            required
            value={values.title}
            error={errors.title}
            onChange={(title) => setValues((current) => ({ ...current, title }))}
          />
          <TextField
            label="Issuer"
            id="cert-issuer"
            required
            value={values.issuer}
            error={errors.issuer}
            onChange={(issuer) => setValues((current) => ({ ...current, issuer }))}
          />
          <TextField
            label="Issue date"
            id="cert-date"
            value={values.issueDate}
            hint="Free-form — e.g. March 2024 or 2024-03."
            onChange={(issueDate) =>
              setValues((current) => ({ ...current, issueDate }))
            }
          />
          <TextField
            label="Credential URL"
            id="cert-url"
            type="url"
            value={values.credentialUrl}
            error={errors.credentialUrl}
            onChange={(credentialUrl) =>
              setValues((current) => ({ ...current, credentialUrl }))
            }
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              id="cert-description"
              rows={3}
              value={values.description}
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
          <SelectField
            label="Status"
            id="cert-status"
            value={values.status}
            options={CONTENT_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(status) =>
              setValues((current) => ({
                ...current,
                status: status as ContentStatus,
              }))
            }
          />
        </EntityForm>
      )}

      {collection.actionError !== null && (
        <div className="mb-4">
          <Alert tone="error" onDismiss={collection.clearActionError}>
            {collection.actionError.message}
          </Alert>
        </div>
      )}

      <AsyncContent
        state={collection.list}
        empty={
          <EmptyState
            title="No certifications yet"
            description="Certifications you add appear in the public certifications section."
            action={<Button onClick={openCreate}>Add your first certification</Button>}
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <ContentRow
                key={item.id}
                title={item.title}
                meta={[item.issuer, item.issueDate].filter(Boolean).join(" · ")}
                status={item.status}
                busy={collection.actionBusy}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                onStatusChange={(status) => void collection.changeStatus(item, status)}
                onMoveUp={() => void collection.move(items.map((entry) => entry.id), index, -1)}
                onMoveDown={() => void collection.move(items.map((entry) => entry.id), index, 1)}
                onEdit={() => openEdit(item)}
                onDelete={() => setPendingDelete(item)}
              />
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this certification?"
        description="This permanently removes it from the portfolio."
        confirmLabel="Delete"
        destructive
        busy={collection.actionBusy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const item = pendingDelete;
          if (item === null) return;
          void collection.remove(item).then(() => setPendingDelete(null));
          }}
      />
    </AdminPageShell>
  );
}
