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
import {
  DEFAULT_SECTION_VISIBILITY,
  type SectionVisibility,
  type SiteSettings,
  type SiteSettingsInput,
} from "../../types/settings";
import { getSiteSettings, updateSiteSettings } from "../../services/settingsService";
import { fieldErrors } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";

const SECTION_LABELS: Record<keyof SectionVisibility, string> = {
  hero: "Hero",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  contact: "Contact",
};

interface FormValues {
  enabled: boolean;
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  sections: SectionVisibility;
}

const EMPTY_VALUES: FormValues = {
  enabled: true,
  siteTitle: "",
  siteDescription: "",
  logoUrl: "",
  faviconUrl: "",
  footerText: "",
  sections: { ...DEFAULT_SECTION_VISIBILITY },
};

function toValues(settings: SiteSettings | null): FormValues {
  if (settings === null) return EMPTY_VALUES;
  return {
    enabled: settings.enabled,
    siteTitle: settings.siteTitle ?? "",
    siteDescription: settings.siteDescription ?? "",
    logoUrl: settings.logoUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    footerText: settings.footerText ?? "",
    sections: { ...DEFAULT_SECTION_VISIBILITY, ...settings.sections },
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    logoUrl: urlError(values.logoUrl, { label: "Logo URL" }),
    faviconUrl: urlError(values.faviconUrl, { label: "Favicon URL" }),
  });
}

export default function ManageSettings() {
  const settings = useAsync<SiteSettings | null>(getSiteSettings, []);
  const save = useMutation<FormValues, void>((values) => {
    const input: SiteSettingsInput = {
      enabled: values.enabled,
      sections: values.sections,
      ...(values.siteTitle.trim() !== "" ? { siteTitle: values.siteTitle.trim() } : {}),
      ...(values.siteDescription.trim() !== ""
        ? { siteDescription: values.siteDescription.trim() }
        : {}),
      ...(values.logoUrl.trim() !== "" ? { logoUrl: values.logoUrl.trim() } : {}),
      ...(values.faviconUrl.trim() !== ""
        ? { faviconUrl: values.faviconUrl.trim() }
        : {}),
      ...(values.footerText.trim() !== ""
        ? { footerText: values.footerText.trim() }
        : {}),
    };
    return updateSiteSettings(input);
  });

  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openForm = (existing: SiteSettings | null) => {
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
      title="Settings"
      description="Site-wide configuration — branding, homepage sections, and availability."
      actions={
        !formOpen ? (
          <Button onClick={() => openForm(settings.data)}>
            {settings.data === null ? "Create settings" : "Edit settings"}
          </Button>
        ) : undefined
      }
    >
      {formOpen && (
        <EntityForm
          title="Site settings"
          submitting={save.status === "submitting"}
          error={save.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <CheckboxField
            label="Site enabled"
            id="settings-enabled"
            checked={values.enabled}
            hint="When off, visitors see a paused notice instead of the portfolio."
            onChange={(enabled) => setValues((current) => ({ ...current, enabled }))}
          />
          <div />
          <TextField
            label="Site title"
            id="settings-title"
            value={values.siteTitle}
            hint="Shown in the browser tab when no page title is set."
            onChange={(siteTitle) =>
              setValues((current) => ({ ...current, siteTitle }))
            }
          />
          <TextField
            label="Logo URL"
            id="settings-logo"
            type="url"
            value={values.logoUrl}
            error={errors.logoUrl}
            onChange={(logoUrl) => setValues((current) => ({ ...current, logoUrl }))}
          />
          <TextField
            label="Favicon URL"
            id="settings-favicon"
            type="url"
            value={values.faviconUrl}
            error={errors.faviconUrl}
            onChange={(faviconUrl) =>
              setValues((current) => ({ ...current, faviconUrl }))
            }
          />
          <TextField
            label="Footer text"
            id="settings-footer"
            value={values.footerText}
            onChange={(footerText) =>
              setValues((current) => ({ ...current, footerText }))
            }
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Site description"
              id="settings-description"
              rows={3}
              value={values.siteDescription}
              hint="Used for meta descriptions and fallback copy."
              onChange={(siteDescription) =>
                setValues((current) => ({ ...current, siteDescription }))
              }
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-slate-300">
              Homepage sections
            </legend>
            <div className="grid gap-3 border border-slate-800 p-4 sm:grid-cols-2">
              {(Object.keys(SECTION_LABELS) as (keyof SectionVisibility)[]).map(
                (section) => (
                  <CheckboxField
                    key={section}
                    label={SECTION_LABELS[section]}
                    id={`section-${section}`}
                    checked={values.sections[section]}
                    onChange={(checked) =>
                      setValues((current) => ({
                        ...current,
                        sections: { ...current.sections, [section]: checked },
                      }))
                    }
                  />
                ),
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Hidden sections never render — a section also stays hidden when it has no
              published content.
            </p>
          </fieldset>
        </EntityForm>
      )}

      {save.status === "success" && !formOpen && (
        <div className="mb-4">
          <Alert tone="success" onDismiss={save.reset}>
            Settings saved.
          </Alert>
        </div>
      )}

      <AsyncContent
        state={settings}
        empty={
          <EmptyState
            title="Site settings not created yet"
            description="Create settings to control branding, sections, and availability."
            action={<Button onClick={() => openForm(null)}>Set up your site settings</Button>}
          />
        }
      >
        {(data) => (
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-slate-100">
                {data.siteTitle !== undefined && data.siteTitle !== ""
                  ? data.siteTitle
                  : "Untitled site"}
              </h2>
              <Badge tone={data.enabled ? "emerald" : "red"}>
                {data.enabled ? "site live" : "site paused"}
              </Badge>
            </div>
            {data.siteDescription !== undefined && (
              <p className="mt-2 text-sm text-slate-400">{data.siteDescription}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(SECTION_LABELS) as (keyof SectionVisibility)[]).map(
                (section) => (
                  <Badge
                    key={section}
                    tone={(data.sections ?? DEFAULT_SECTION_VISIBILITY)[section] ? "emerald" : "slate"}
                  >
                    {SECTION_LABELS[section]}:{" "}
                    {(data.sections ?? DEFAULT_SECTION_VISIBILITY)[section] ? "on" : "off"}
                  </Badge>
                ),
              )}
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["Logo URL", data.logoUrl],
                ["Favicon URL", data.faviconUrl],
                ["Footer text", data.footerText],
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
