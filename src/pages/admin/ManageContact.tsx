import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { EntityForm } from "../../components/admin/EntityForm";
import { CheckboxField, TextField, TextAreaField } from "../../components/admin/fields";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAsync } from "../../hooks/useAsync";
import { useMutation } from "../../hooks/useMutation";
import type { ContactSettings, ContactSettingsInput } from "../../types/contact";
import {
  getContactSettings,
  updateContactSettings,
} from "../../services/contactService";
import { emailError, fieldErrors } from "../../utils/validation";

interface FormValues {
  enabled: boolean;
  title: string;
  description: string;
  email: string;
  phone: string;
  location: string;
}

const EMPTY_VALUES: FormValues = {
  enabled: true,
  title: "",
  description: "",
  email: "",
  phone: "",
  location: "",
};

function toValues(settings: ContactSettings | null): FormValues {
  if (settings === null) return EMPTY_VALUES;
  return {
    enabled: settings.enabled,
    title: settings.title ?? "",
    description: settings.description ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    location: settings.location ?? "",
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    email: emailError("Email", values.email),
  });
}

export default function ManageContact() {
  const settings = useAsync<ContactSettings | null>(getContactSettings, []);
  const save = useMutation<FormValues, void>((values) => {
    const input: ContactSettingsInput = {
      enabled: values.enabled,
      ...(values.title.trim() !== "" ? { title: values.title.trim() } : {}),
      ...(values.description.trim() !== ""
        ? { description: values.description.trim() }
        : {}),
      ...(values.email.trim() !== "" ? { email: values.email.trim() } : {}),
      ...(values.phone.trim() !== "" ? { phone: values.phone.trim() } : {}),
      ...(values.location.trim() !== "" ? { location: values.location.trim() } : {}),
    };
    return updateContactSettings(input);
  });

  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openForm = (existing: ContactSettings | null) => {
    save.reset();
    setValues(toValues(existing));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const result = await save.execute(values);
    if (result.ok) {
      setFormOpen(false);
      settings.reload();
    }
  };

  return (
    <AdminPageShell
      title="Contact"
      description="Configure the public contact section — what visitors see and how they reach you."
      actions={
        !formOpen && settings.data !== null ? (
          <Button onClick={() => openForm(settings.data)}>Edit settings</Button>
        ) : undefined
      }
    >
      {formOpen && (
        <EntityForm
          title="Contact section settings"
          submitting={save.status === "submitting"}
          error={save.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <CheckboxField
            label="Contact section enabled"
            id="contact-enabled"
            checked={values.enabled}
            hint="When off, the public site hides the entire contact section."
            onChange={(enabled) => setValues((current) => ({ ...current, enabled }))}
          />
          <TextField
            label="Section title"
            id="contact-title"
            value={values.title}
            onChange={(title) => setValues((current) => ({ ...current, title }))}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Section description"
              id="contact-description"
              rows={3}
              value={values.description}
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
          <TextField
            label="Display email"
            id="contact-email"
            type="email"
            value={values.email}
            error={errors.email}
            hint="Shown publicly only if you enter it here."
            onChange={(email) => setValues((current) => ({ ...current, email }))}
          />
          <TextField
            label="Display phone"
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(phone) => setValues((current) => ({ ...current, phone }))}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Location"
              id="contact-location"
              value={values.location}
              hint="Shown publicly — e.g. a city or region."
              onChange={(location) =>
                setValues((current) => ({ ...current, location }))
              }
            />
          </div>
        </EntityForm>
      )}

      {save.status === "success" && !formOpen && (
        <div className="mb-4">
          <Alert tone="success" onDismiss={save.reset}>
            Contact settings saved.
          </Alert>
        </div>
      )}

      <AsyncContent
        state={settings}
        empty={
          <EmptyState
            title="Contact section not configured yet"
            description="Set up the contact section to control what visitors see."
            action={<Button onClick={() => openForm(null)}>Set up contact section</Button>}
          />
        }
      >
        {(data) => (
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-slate-100">
                {data.title !== undefined && data.title !== "" ? data.title : "Contact section"}
              </h2>
              <Badge tone={data.enabled ? "emerald" : "slate"}>
                {data.enabled ? "enabled" : "disabled"}
              </Badge>
            </div>
            {data.description !== undefined && (
              <p className="mt-2 text-sm text-slate-400">{data.description}</p>
            )}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["Email", data.email],
                ["Phone", data.phone],
                ["Location", data.location],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-0.5 break-all text-slate-300">
                    {value !== undefined && value !== "" ? value : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </AsyncContent>
    </AdminPageShell>
  );
}
