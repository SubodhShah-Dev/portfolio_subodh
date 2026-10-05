import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { ContentRow } from "../../components/admin/ContentRow";
import { EntityForm } from "../../components/admin/EntityForm";
import { TextField, SelectField } from "../../components/admin/fields";
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
import type { Skill, SkillInput } from "../../types/skill";
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  reorderSkills,
  setSkillStatus,
  updateSkill,
} from "../../services/skillService";
import { fieldErrors, requiredError } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<Skill, SkillInput> = {
  getAll: getAllSkills,
  create: createSkill,
  update: updateSkill,
  remove: deleteSkill,
  setStatus: setSkillStatus,
  reorder: reorderSkills,
};

interface FormValues {
  name: string;
  category: string;
  iconUrl: string;
  proficiency: string;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  name: "",
  category: "",
  iconUrl: "",
  proficiency: "",
  status: "published",
};

function toValues(skill: Skill | null): FormValues {
  if (skill === null) return EMPTY_VALUES;
  return {
    name: skill.name,
    category: skill.category,
    iconUrl: skill.iconUrl ?? "",
    proficiency: skill.proficiency !== undefined ? String(skill.proficiency) : "",
    status: skill.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  const proficiency = values.proficiency.trim();
  return fieldErrors({
    name: requiredError("Name", values.name),
    category: requiredError("Category", values.category),
    iconUrl: urlError(values.iconUrl, { label: "Icon URL" }),
    proficiency:
      proficiency === "" || /^[1-5]$/.test(proficiency)
        ? null
        : "Proficiency must be a number from 1 to 5.",
  });
}

export default function ManageSkills() {
  const collection = useOrderedCollection<Skill, SkillInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (skill: Skill) => {
    collection.saveState.reset();
    setEditing(skill);
    setValues(toValues(skill));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: SkillInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      name: values.name.trim(),
      category: values.category.trim(),
      ...(values.iconUrl.trim() !== "" ? { iconUrl: values.iconUrl.trim() } : {}),
      ...(values.proficiency.trim() !== ""
        ? { proficiency: Number(values.proficiency.trim()) }
        : {}),
    };
    const result = await collection.save(editing?.id ?? null, input);
    if (result.ok) setFormOpen(false);
  };

  return (
    <AdminPageShell
      title="Skills"
      description="Manage skills, categories, and proficiency."
      actions={
        <Button onClick={openCreate} aria-expanded={formOpen && editing === null}>
          Add skill
        </Button>
      }
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add skill" : `Edit ${editing.name}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Name"
            id="skill-name"
            required
            value={values.name}
            error={errors.name}
            onChange={(name) => setValues((current) => ({ ...current, name }))}
          />
          <TextField
            label="Category"
            id="skill-category"
            required
            value={values.category}
            error={errors.category}
            hint="Categories come from your own entries — e.g. Languages, Tools."
            onChange={(category) =>
              setValues((current) => ({ ...current, category }))
            }
          />
          <TextField
            label="Icon URL"
            id="skill-icon"
            type="url"
            value={values.iconUrl}
            error={errors.iconUrl}
            onChange={(iconUrl) => setValues((current) => ({ ...current, iconUrl }))}
          />
          <TextField
            label="Proficiency"
            id="skill-proficiency"
            inputMode="numeric"
            value={values.proficiency}
            error={errors.proficiency}
            hint="Optional — a number from 1 to 5."
            onChange={(proficiency) =>
              setValues((current) => ({ ...current, proficiency }))
            }
          />
          <SelectField
            label="Status"
            id="skill-status"
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
            title="No skills yet"
            description="Skills you add appear on the public homepage skills section once published."
            action={<Button onClick={openCreate}>Add your first skill</Button>}
          />
        }
      >
        {(skills) => (
          <ul className="space-y-3">
            {skills.map((skill, index) => (
              <ContentRow
                key={skill.id}
                title={skill.name}
                meta={[skill.category, skill.proficiency !== undefined ? `${skill.proficiency}/5` : null]
                  .filter((entry) => entry !== null)
                  .join(" · ")}
                status={skill.status}
                busy={collection.actionBusy}
                isFirst={index === 0}
                isLast={index === skills.length - 1}
                onStatusChange={(status) => void collection.changeStatus(skill, status)}
                onMoveUp={() => void collection.move(skills.map((entry) => entry.id), index, -1)}
                onMoveDown={() => void collection.move(skills.map((entry) => entry.id), index, 1)}
                onEdit={() => openEdit(skill)}
                onDelete={() => setPendingDelete(skill)}
              />
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this skill?"
        description="This permanently removes the skill from the portfolio. Published sections update immediately."
        confirmLabel="Delete"
        destructive
        busy={collection.actionBusy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const skill = pendingDelete;
          if (skill === null) return;
          void collection.remove(skill).then(() => setPendingDelete(null));
          }}
      />
    </AdminPageShell>
  );
}
