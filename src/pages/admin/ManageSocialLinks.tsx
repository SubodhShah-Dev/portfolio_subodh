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
import type { SocialLink, SocialLinkInput } from "../../types/socialLink";
import {
  createSocialLink,
  deleteSocialLink,
  getAllSocialLinks,
  reorderSocialLinks,
  setSocialLinkStatus,
  updateSocialLink,
} from "../../services/socialLinkService";
import { fieldErrors, requiredError } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const adapter: CollectionAdapter<SocialLink, SocialLinkInput> = {
  getAll: getAllSocialLinks,
  create: createSocialLink,
  update: updateSocialLink,
  remove: deleteSocialLink,
  setStatus: setSocialLinkStatus,
  reorder: reorderSocialLinks,
};

interface FormValues {
  platform: string;
  label: string;
  url: string;
  iconUrl: string;
  status: ContentStatus;
}

const EMPTY_VALUES: FormValues = {
  platform: "",
  label: "",
  url: "",
  iconUrl: "",
  status: "published",
};

function toValues(link: SocialLink | null): FormValues {
  if (link === null) return EMPTY_VALUES;
  return {
    platform: link.platform,
    label: link.label,
    url: link.url,
    iconUrl: link.iconUrl ?? "",
    status: link.status,
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    platform: requiredError("Platform", values.platform),
    label: requiredError("Label", values.label),
    url: urlError(values.url, { label: "URL", required: true }),
    iconUrl: urlError(values.iconUrl, { label: "Icon URL" }),
  });
}

export default function ManageSocialLinks() {
  const collection = useOrderedCollection<SocialLink, SocialLinkInput>(adapter);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<SocialLink | null>(null);

  const openCreate = () => {
    collection.saveState.reset();
    setEditing(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (link: SocialLink) => {
    collection.saveState.reset();
    setEditing(link);
    setValues(toValues(link));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: SocialLinkInput = {
      status: values.status,
      order: editing?.order ?? collection.list.data?.length ?? 0,
      platform: values.platform.trim(),
      label: values.label.trim(),
      url: values.url.trim(),
      ...(values.iconUrl.trim() !== "" ? { iconUrl: values.iconUrl.trim() } : {}),
    };
    const result = await collection.save(editing?.id ?? null, input);
    if (result.ok) setFormOpen(false);
  };

  return (
    <AdminPageShell
      title="Social Links"
      description="Manage external profiles shown in the site footer and sidebar."
      actions={<Button onClick={openCreate}>Add link</Button>}
    >
      {formOpen && (
        <EntityForm
          title={editing === null ? "Add link" : `Edit ${editing.label}`}
          submitting={collection.saveState.status === "submitting"}
          error={collection.saveState.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Platform"
            id="link-platform"
            required
            value={values.platform}
            error={errors.platform}
            hint="Free-form — e.g. GitHub, LinkedIn, Mastodon."
            onChange={(platform) =>
              setValues((current) => ({ ...current, platform }))
            }
          />
          <TextField
            label="Label"
            id="link-label"
            required
            value={values.label}
            error={errors.label}
            hint="The visible text, e.g. “GitHub”."
            onChange={(label) => setValues((current) => ({ ...current, label }))}
          />
          <TextField
            label="URL"
            id="link-url"
            type="url"
            required
            value={values.url}
            error={errors.url}
            onChange={(url) => setValues((current) => ({ ...current, url }))}
          />
          <TextField
            label="Icon URL"
            id="link-icon"
            type="url"
            value={values.iconUrl}
            error={errors.iconUrl}
            onChange={(iconUrl) =>
              setValues((current) => ({ ...current, iconUrl }))
            }
          />
          <SelectField
            label="Status"
            id="link-status"
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
            title="No social links yet"
            description="Links you add appear in the public site footer."
            action={<Button onClick={openCreate}>Add your first link</Button>}
          />
        }
      >
        {(links) => (
          <ul className="space-y-3">
            {links.map((link, index) => (
              <ContentRow
                key={link.id}
                title={link.label}
                meta={`${link.platform} · ${link.url}`}
                status={link.status}
                busy={collection.actionBusy}
                isFirst={index === 0}
                isLast={index === links.length - 1}
                onStatusChange={(status) => void collection.changeStatus(link, status)}
                onMoveUp={() => void collection.move(links.map((entry) => entry.id), index, -1)}
                onMoveDown={() => void collection.move(links.map((entry) => entry.id), index, 1)}
                onEdit={() => openEdit(link)}
                onDelete={() => setPendingDelete(link)}
              />
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this link?"
        description="The link disappears from the public site immediately."
        confirmLabel="Delete"
        destructive
        busy={collection.actionBusy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const link = pendingDelete;
          if (link === null) return;
          void collection.remove(link).then(() => setPendingDelete(null));
          }}
      />
    </AdminPageShell>
  );
}
