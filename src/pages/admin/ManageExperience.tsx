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
import type { Experience, ExperienceInput } from "../../types/experience";
import {
  createExperience,
  deleteExperience,
  getAllExperience,
  reorderExperience,
  setExperienceStatus,
  updateExperience,
} from "../../services/experienceService";
import {
  fieldErrors,
  joinList,
  parseList,
  requiredError,
} from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<Experience, ExperienceInput> = {
  getAll: getAllExperience,
  create: createExperience,
  update: updateExperience,
  remove: deleteExperience,
  setStatus: setExperienceStatus,
  reorder: reorderExperience,
};

interface FormValues {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  technologies: string;
  companyUrl: string;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  company: "",
  role: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  technologies: "",
  companyUrl: "",
  status: "published",
};

function toValues(item: Experience | null): FormValues {
  if (item === null) return EMPTY_VALUES;
  return {
    company: item.company,
    role: item.role,
    description: item.description,
    startDate: item.startDate,
    endDate: item.endDate ?? "",
    location: item.location ?? "",
    technologies: joinList(item.technologies ?? []),
    companyUrl: item.companyUrl ?? "",
    status: item.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    company: requiredError("Company", values.company),
    role: requiredError("Role", values.role),
    description: requiredError("Description", values.description),
    startDate: requiredError("Start date", values.startDate),
    companyUrl: urlError(values.companyUrl, { label: "Company URL" }),
  });
}

export default function ManageExperience() {
  const collection = useOrderedCollection<Experience, ExperienceInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Experience | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Experience) => {
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

    const input: ExperienceInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      company: values.company.trim(),
      role: values.role.trim(),
      description: values.description.trim(),
      startDate: values.startDate.trim(),
      technologies: parseList(values.technologies),
      ...(values.endDate.trim() !== "" ? { endDate: values.endDate.trim() } : {}),
      ...(values.location.trim() !== "" ? { location: values.location.trim() } : {}),
      ...(values.companyUrl.trim() !== ""
        ? { companyUrl: values.companyUrl.trim() }
        : {}),
    };
    const result = await collection.save(editing?.id ?? null, input);
    if (result.ok) setFormOpen(false);
  };

  return (
    <AdminPageShell
      title="Experience"
      description="Manage work history shown on the public site."
      actions={<Button onClick={openCreate}>Add experience</Button>}
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add experience" : `Edit ${editing.role} — ${editing.company}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Company"
            id="exp-company"
            required
            value={values.company}
            error={errors.company}
            onChange={(company) => setValues((current) => ({ ...current, company }))}
          />
          <TextField
            label="Role"
            id="exp-role"
            required
            value={values.role}
            error={errors.role}
            onChange={(role) => setValues((current) => ({ ...current, role }))}
          />
          <TextField
            label="Start date"
            id="exp-start"
            required
            value={values.startDate}
            error={errors.startDate}
            hint="Free-form — e.g. Jan 2022."
            onChange={(startDate) =>
              setValues((current) => ({ ...current, startDate }))
            }
          />
          <TextField
            label="End date"
            id="exp-end"
            value={values.endDate}
            hint="Leave empty if current."
            onChange={(endDate) => setValues((current) => ({ ...current, endDate }))}
          />
          <TextField
            label="Location"
            id="exp-location"
            value={values.location}
            onChange={(location) => setValues((current) => ({ ...current, location }))}
          />
          <TextField
            label="Company URL"
            id="exp-url"
            type="url"
            value={values.companyUrl}
            error={errors.companyUrl}
            onChange={(companyUrl) =>
              setValues((current) => ({ ...current, companyUrl }))
            }
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              id="exp-description"
              required
              rows={4}
              value={values.description}
              error={errors.description}
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Technologies"
              id="exp-technologies"
              rows={2}
              value={values.technologies}
              hint="Comma or newline separated — e.g. React, Node.js, PostgreSQL."
              onChange={(technologies) =>
                setValues((current) => ({ ...current, technologies }))
              }
            />
          </div>
          <SelectField
            label="Status"
            id="exp-status"
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
            title="No experience entries yet"
            description="Work history you add appears in the public experience section."
            action={<Button onClick={openCreate}>Add your first entry</Button>}
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <ContentRow
                key={item.id}
                title={`${item.role} — ${item.company}`}
                meta={[
                  [item.startDate, item.endDate ?? "Present"].join(" – "),
                  item.location ?? "",
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
        title="Delete this experience entry?"
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
