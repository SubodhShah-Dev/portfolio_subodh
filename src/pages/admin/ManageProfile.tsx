import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { EntityForm } from "../../components/admin/EntityForm";
import { TextField, TextAreaField } from "../../components/admin/fields";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAsync } from "../../hooks/useAsync";
import { useMutation } from "../../hooks/useMutation";
import type { PortfolioProfile } from "../../types/profile";
import {
  getProfile,
  updateContactProfile,
  updateProfile,
} from "../../services/profileService";
import { emailError, fieldErrors, requiredError } from "../../utils/validation";
import { galleryUrlsError, parseImageLines } from "../../utils/urlValidation";

interface FormValues {
  name: string;
  role: string;
  headline: string;
  bio: string;
  /** Profile photo URLs — one per line (textarea content). */
  profileImageUrls: string;
  location: string;
  email: string;
  phone: string;
}

const EMPTY_VALUES: FormValues = {
  name: "",
  role: "",
  headline: "",
  bio: "",
  profileImageUrls: "",
  location: "",
  email: "",
  phone: "",
};

function toValues(profile: PortfolioProfile | null): FormValues {
  if (profile === null) return EMPTY_VALUES;
  const urls = profile.public.profileImageUrls ?? [];
  return {
    name: profile.public.name,
    role: profile.public.role,
    headline: profile.public.headline,
    bio: profile.public.bio,
    profileImageUrls:
      urls.length > 0 ? urls.join("\n") : (profile.public.profileImageUrl ?? ""),
    location: profile.public.location ?? "",
    email: profile.contact.email ?? "",
    phone: profile.contact.phone ?? "",
  };
}

function validate(values: FormValues): Record<string, string> {
  return fieldErrors({
    name: requiredError("Name", values.name),
    role: requiredError("Role", values.role),
    headline: requiredError("Headline", values.headline),
    bio: requiredError("Bio", values.bio),
    profileImageUrls: galleryUrlsError(values.profileImageUrls, "Profile image URL"),
    email: emailError("Email", values.email),
  });
}

export default function ManageProfile() {
  const profile = useAsync<PortfolioProfile | null>(getProfile, []);
  const save = useMutation<FormValues, void>(async (values) => {
    const imageUrls = parseImageLines(values.profileImageUrls);
    const publicInput = {
      name: values.name.trim(),
      role: values.role.trim(),
      headline: values.headline.trim(),
      bio: values.bio.trim(),
      // The deck is the source of truth; the legacy single URL always mirrors
      // its front card so older readers stay correct.
      profileImageUrls: imageUrls,
      profileImageUrl: imageUrls[0] ?? "",
      ...(values.location.trim() !== "" ? { location: values.location.trim() } : {}),
    };
    const contactInput = {
      ...(values.email.trim() !== "" ? { email: values.email.trim() } : {}),
      ...(values.phone.trim() !== "" ? { phone: values.phone.trim() } : {}),
    };
    await Promise.all([updateProfile(publicInput), updateContactProfile(contactInput)]);
  });

  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openForm = (existing: PortfolioProfile | null) => {
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
      profile.reload();
    }
  };

  return (
    <AdminPageShell
      title="Profile"
      description="Your public identity — name, headline, bio, and contact details."
      actions={
        !formOpen ? (
          <Button onClick={() => openForm(profile.data)}>
            {profile.data === null ? "Create profile" : "Edit profile"}
          </Button>
        ) : undefined
      }
    >
      {formOpen && (
        <EntityForm
          title={profile.data === null ? "Create profile" : "Edit profile"}
          submitting={save.status === "submitting"}
          error={save.error}
          onSubmit={() => void submit()}
          onCancel={() => setFormOpen(false)}
        >
          <TextField
            label="Name"
            id="profile-name"
            required
            value={values.name}
            error={errors.name}
            onChange={(name) => setValues((current) => ({ ...current, name }))}
          />
          <TextField
            label="Role"
            id="profile-role"
            required
            value={values.role}
            error={errors.role}
            hint="Your primary title — e.g. Software Engineer."
            onChange={(role) => setValues((current) => ({ ...current, role }))}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Headline"
              id="profile-headline"
              required
              value={values.headline}
              error={errors.headline}
              hint="One sentence shown under your name."
              onChange={(headline) =>
                setValues((current) => ({ ...current, headline }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Bio"
              id="profile-bio"
              required
              rows={5}
              value={values.bio}
              error={errors.bio}
              onChange={(bio) => setValues((current) => ({ ...current, bio }))}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Profile image URLs"
              id="profile-images"
              rows={3}
              value={values.profileImageUrls}
              error={errors.profileImageUrls}
              hint="One URL per line. The first photo fronts the About stack."
              onChange={(profileImageUrls) =>
                setValues((current) => ({ ...current, profileImageUrls }))
              }
            />
          </div>
          <TextField
            label="Location"
            id="profile-location"
            value={values.location}
            onChange={(location) =>
              setValues((current) => ({ ...current, location }))
            }
          />
          <TextField
            label="Email"
            id="profile-email"
            type="email"
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(email) => setValues((current) => ({ ...current, email }))}
          />
          <TextField
            label="Phone"
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(phone) => setValues((current) => ({ ...current, phone }))}
          />
        </EntityForm>
      )}

      {save.status === "success" && !formOpen && (
        <div className="mb-4">
          <Alert tone="success" onDismiss={save.reset}>
            Profile saved.
          </Alert>
        </div>
      )}

      <AsyncContent
        state={profile}
        empty={
          <EmptyState
            title="No profile yet"
            description="Create your profile to populate the homepage hero and about section."
            action={<Button onClick={() => openForm(null)}>Create your profile</Button>}
          />
        }
      >
        {(data) => (
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-100">
                {data.public.name}
              </h2>
              <Badge tone="sky">{data.public.role}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-300">{data.public.headline}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-400">
              {data.public.bio}
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Location", data.public.location],
                [
                  "Images",
                  (data.public.profileImageUrls ?? []).length > 0
                    ? data.public.profileImageUrls?.join(", ")
                    : data.public.profileImageUrl,
                ],
                ["Email", data.contact.email],
                ["Phone", data.contact.phone],
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
