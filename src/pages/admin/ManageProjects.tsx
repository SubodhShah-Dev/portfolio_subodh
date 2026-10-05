import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { ContentRow } from "../../components/admin/ContentRow";
import { EntityForm } from "../../components/admin/EntityForm";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "../../components/admin/fields";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useOrderedCollection,
  type CollectionAdapter,
} from "../../hooks/useOrderedCollection";
import { CONTENT_STATUSES, type ContentStatus } from "../../types/common";
import type { Project, ProjectInput } from "../../types/project";
import {
  createProject,
  deleteProject,
  getAllProjects,
  reorderProjects,
  setProjectStatus,
  updateProject,
} from "../../services/projectService";
import {
  fieldErrors,
  joinList,
  parseList,
  requiredError,
} from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<Project, ProjectInput> = {
  getAll: getAllProjects,
  create: createProject,
  update: updateProject,
  remove: deleteProject,
  setStatus: setProjectStatus,
  reorder: reorderProjects,
};

interface FormValues {
  title: string;
  subtitle: string;
  description: string;
  techStack: string;
  features: string;
  githubUrl: string;
  liveDemoUrl: string;
  thumbnailUrl: string;
  date: string;
  architecture: string;
  featured: boolean;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  title: "",
  subtitle: "",
  description: "",
  techStack: "",
  features: "",
  githubUrl: "",
  liveDemoUrl: "",
  thumbnailUrl: "",
  date: "",
  architecture: "",
  featured: false,
  status: "draft",
};

function toValues(item: Project | null): FormValues {
  if (item === null) return EMPTY_VALUES;
  return {
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    techStack: joinList(item.techStack ?? []),
    features: joinList(item.features ?? []),
    githubUrl: item.githubUrl ?? "",
    liveDemoUrl: item.liveDemoUrl ?? "",
    thumbnailUrl: item.thumbnailUrl ?? "",
    date: item.date ?? "",
    architecture: item.architecture ?? "",
    featured: item.featured,
    status: item.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    title: requiredError("Title", values.title),
    description: requiredError("Description", values.description),
    githubUrl: urlError(values.githubUrl, { label: "GitHub URL" }),
    liveDemoUrl: urlError(values.liveDemoUrl, { label: "Live demo URL" }),
    thumbnailUrl: urlError(values.thumbnailUrl, { label: "Thumbnail URL" }),
  });
}

export default function ManageProjects() {
  const collection = useOrderedCollection<Project, ProjectInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Project) => {
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

    const input: ProjectInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      description: values.description.trim(),
      techStack: parseList(values.techStack),
      features: parseList(values.features),
      featured: values.featured,
      ...(values.githubUrl.trim() !== ""
        ? { githubUrl: values.githubUrl.trim() }
        : {}),
      ...(values.liveDemoUrl.trim() !== ""
        ? { liveDemoUrl: values.liveDemoUrl.trim() }
        : {}),
      ...(values.thumbnailUrl.trim() !== ""
        ? { thumbnailUrl: values.thumbnailUrl.trim() }
        : {}),
      ...(values.date.trim() !== "" ? { date: values.date.trim() } : {}),
      ...(values.architecture.trim() !== ""
        ? { architecture: values.architecture.trim() }
        : {}),
    };
    const result = await collection.save(editing?.id ?? null, input);
    if (result.ok) setFormOpen(false);
  };

  return (
    <AdminPageShell
      title="Projects"
      description="Manage portfolio projects shown on the public site."
      actions={<Button onClick={openCreate}>Add project</Button>}
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add project" : `Edit ${editing.title}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Title"
            id="project-title"
            required
            value={values.title}
            error={errors.title}
            onChange={(title) => setValues((current) => ({ ...current, title }))}
          />
          <TextField
            label="Subtitle"
            id="project-subtitle"
            value={values.subtitle}
            onChange={(subtitle) =>
              setValues((current) => ({ ...current, subtitle }))
            }
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              id="project-description"
              required
              rows={5}
              value={values.description}
              error={errors.description}
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
          <TextAreaField
            label="Tech stack"
            id="project-tech"
            rows={3}
            value={values.techStack}
            hint="Comma or newline separated."
            onChange={(techStack) =>
              setValues((current) => ({ ...current, techStack }))
            }
          />
          <TextAreaField
            label="Key features"
            id="project-features"
            rows={3}
            value={values.features}
            hint="One per line or comma separated."
            onChange={(features) =>
              setValues((current) => ({ ...current, features }))
            }
          />
          <TextField
            label="GitHub URL"
            id="project-github"
            type="url"
            value={values.githubUrl}
            error={errors.githubUrl}
            onChange={(githubUrl) =>
              setValues((current) => ({ ...current, githubUrl }))
            }
          />
          <TextField
            label="Live demo URL"
            id="project-live"
            type="url"
            value={values.liveDemoUrl}
            error={errors.liveDemoUrl}
            onChange={(liveDemoUrl) =>
              setValues((current) => ({ ...current, liveDemoUrl }))
            }
          />
          <TextField
            label="Thumbnail URL"
            id="project-thumbnail"
            type="url"
            value={values.thumbnailUrl}
            error={errors.thumbnailUrl}
            onChange={(thumbnailUrl) =>
              setValues((current) => ({ ...current, thumbnailUrl }))
            }
          />
          <TextField
            label="Date"
            id="project-date"
            value={values.date}
            hint="Free-form — e.g. 2024 or June 2024."
            onChange={(date) => setValues((current) => ({ ...current, date }))}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Architecture notes"
              id="project-architecture"
              rows={3}
              value={values.architecture}
              hint="Optional — how the project is put together."
              onChange={(architecture) =>
                setValues((current) => ({ ...current, architecture }))
              }
            />
          </div>
          <CheckboxField
            label="Featured project"
            id="project-featured"
            checked={values.featured}
            hint="Featured projects are highlighted in the public grid."
            onChange={(featured) => setValues((current) => ({ ...current, featured }))}
          />
          <SelectField
            label="Status"
            id="project-status"
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
            title="No projects yet"
            description="Projects you add appear in the public projects section once published."
            action={<Button onClick={openCreate}>Add your first project</Button>}
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <ContentRow
                key={item.id}
                title={item.title}
                meta={[
                  item.subtitle,
                  item.techStack.length > 0
                    ? `${item.techStack.length} technologies`
                    : null,
                ]
                  .filter((entry) => entry !== null && entry !== "")
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
              >
                {item.featured && <Badge tone="sky">Featured</Badge>}
              </ContentRow>
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this project?"
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
