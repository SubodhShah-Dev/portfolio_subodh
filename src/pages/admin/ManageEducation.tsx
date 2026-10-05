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
import type { Education, EducationInput } from "../../types/education";
import {
  createEducation,
  deleteEducation,
  getAllEducation,
  reorderEducation,
  setEducationStatus,
  updateEducation,
} from "../../services/educationService";
import { fieldErrors, requiredError } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<Education, EducationInput> = {
  getAll: getAllEducation,
  create: createEducation,
  update: updateEducation,
  remove: deleteEducation,
  setStatus: setEducationStatus,
  reorder: reorderEducation,
};

interface FormValues {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  institutionUrl: string;
  description: string;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  institutionUrl: "",
  description: "",
  status: "published",
};

function toValues(item: Education | null): FormValues {
  if (item === null) return EMPTY_VALUES;
  return {
    institution: item.institution,
    degree: item.degree,
    field: item.field ?? "",
    startDate: item.startDate,
    endDate: item.endDate ?? "",
    institutionUrl: item.institutionUrl ?? "",
    description: item.description ?? "",
    status: item.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    institution: requiredError("Institution", values.institution),
    degree: requiredError("Degree", values.degree),
    startDate: requiredError("Start date", values.startDate),
    institutionUrl: urlError(values.institutionUrl, { label: "Institution URL" }),
  });
}

export default function ManageEducation() {
  const collection = useOrderedCollection<Education, EducationInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Education | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Education) => {
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

    const input: EducationInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      institution: values.institution.trim(),
      degree: values.degree.trim(),
      startDate: values.startDate.trim(),
      ...(values.field.trim() !== "" ? { field: values.field.trim() } : {}),
      ...(values.endDate.trim() !== "" ? { endDate: values.endDate.trim() } : {}),
      ...(values.institutionUrl.trim() !== ""
        ? { institutionUrl: values.institutionUrl.trim() }
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
      title="Education"
      description="Manage education history shown on the public site."
      actions={<Button onClick={openCreate}>Add education</Button>}
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add education" : `Edit ${editing.institution}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Institution"
            id="edu-institution"
            required
            value={values.institution}
            error={errors.institution}
            onChange={(institution) =>
              setValues((current) => ({ ...current, institution }))
            }
          />
          <TextField
            label="Degree"
            id="edu-degree"
            required
            value={values.degree}
            error={errors.degree}
            hint="e.g. Bachelor of Science"
            onChange={(degree) => setValues((current) => ({ ...current, degree }))}
          />
          <TextField
            label="Field of study"
            id="edu-field"
            value={values.field}
            onChange={(field) => setValues((current) => ({ ...current, field }))}
          />
          <TextField
            label="Institution URL"
            id="edu-url"
            type="url"
            value={values.institutionUrl}
            error={errors.institutionUrl}
            onChange={(institutionUrl) =>
              setValues((current) => ({ ...current, institutionUrl }))
            }
          />
          <TextField
            label="Start date"
            id="edu-start"
            required
            value={values.startDate}
            error={errors.startDate}
            hint="Free-form — e.g. 2018 or September 2018."
            onChange={(startDate) =>
              setValues((current) => ({ ...current, startDate }))
            }
          />
          <TextField
            label="End date"
            id="edu-end"
            value={values.endDate}
            hint="Leave empty if ongoing."
            onChange={(endDate) => setValues((current) => ({ ...current, endDate }))}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              id="edu-description"
              rows={3}
              value={values.description}
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
          <SelectField
            label="Status"
            id="edu-status"
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
            title="No education entries yet"
            description="Education you add appears in the public education section."
            action={<Button onClick={openCreate}>Add your first entry</Button>}
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <ContentRow
                key={item.id}
                title={item.institution}
                meta={[
                  [item.degree, item.field].filter(Boolean).join(", "),
                  [item.startDate, item.endDate ?? "Present"].join(" – "),
                ]
                  .filter((entry) => entry !== "")
                  .join(" · ")}
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
        title="Delete this education entry?"
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
