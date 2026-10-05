import { useState } from "react";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormField } from "../../components/ui/FormField";
import { TextField } from "../../components/admin/fields";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { useAsync } from "../../hooks/useAsync";
import { useMutation } from "../../hooks/useMutation";
import type { Resume } from "../../types/resume";
import {
  deleteResume,
  getResumes,
  saveExternalResume,
  setActiveResume,
  uploadResume,
} from "../../services/resumeService";
import { fieldErrors } from "../../utils/validation";
import { urlError } from "../../utils/urlValidation";
import { validateResumeFile } from "../../utils/resumeValidation";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ManageResume() {
  const resumes = useAsync<Resume[]>(getResumes, [], {
    isEmpty: (items) => items.length === 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const upload = useMutation<File, void>((selected) => uploadResume(selected).then(() => undefined));

  const [externalUrl, setExternalUrl] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const external = useMutation<string, void>((url) =>
    saveExternalResume({ downloadUrl: url, ...(externalName.trim() !== "" ? { fileName: externalName.trim() } : {}) }).then(
      () => undefined,
    ),
  );

  const [pendingDelete, setPendingDelete] = useState<Resume | null>(null);
  const action = useMutation<() => Promise<void>, void>((run) => run());

  const onPickFile = (picked: File | null) => {
    upload.reset();
    if (picked === null) {
      setFile(null);
      setFileError(null);
      return;
    }
    const issue = validateResumeFile(picked);
    if (issue !== null) {
      setFile(null);
      setFileError(issue);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const submitUpload = async () => {
    if (file === null) {
      setFileError("Choose a PDF file to upload.");
      return;
    }
    const result = await upload.execute(file);
    if (result.ok) {
      setFile(null);
      resumes.reload();
    }
  };

  const submitExternal = async () => {
    const errors = fieldErrors({
      downloadUrl: urlError(externalUrl, { label: "Resume URL", required: true }),
    });
    setExternalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const result = await external.execute(externalUrl.trim());
    if (result.ok) {
      setExternalUrl("");
      setExternalName("");
      resumes.reload();
    }
  };

  return (
    <AdminPageShell
      title="Resume"
      description="Upload a PDF or provide an external link — exactly one resume is active at a time."
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-semibold text-slate-100">Upload a PDF</h2>
          <p className="mt-1 text-sm text-slate-500">
            PDF only, up to 10 MB. The file is stored privately and served through a
            download link.
          </p>
          {upload.error !== null && (
            <div className="mt-4">
              <Alert tone="error">{upload.error.message}</Alert>
            </div>
          )}
          <div className="mt-4 space-y-3">
            <FormField
              label="Resume file"
              htmlFor="resume-file"
              error={fileError}
              hint={file !== null ? `Selected: ${file.name} (${formatBytes(file.size)})` : undefined}
            >
              <input
                id="resume-file"
                type="file"
                accept="application/pdf"
                className="block w-full cursor-pointer text-sm text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-slate-700 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-300 hover:file:border-emerald-500/50"
                onChange={(event) => onPickFile(event.target.files?.[0] ?? null)}
              />
            </FormField>
            <Button onClick={() => void submitUpload()} loading={upload.status === "submitting"}>
              Upload resume
            </Button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-slate-100">Or use an external URL</h2>
          <p className="mt-1 text-sm text-slate-500">
            Link to a resume hosted anywhere — e.g. Google Drive or your own domain.
          </p>
          {external.error !== null && (
            <div className="mt-4">
              <Alert tone="error">{external.error.message}</Alert>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <TextField
              label="Resume URL"
              id="resume-url"
              type="url"
              required
              value={externalUrl}
              error={externalErrors.downloadUrl}
              placeholder="https://…"
              onChange={(value) => setExternalUrl(value)}
            />
            <TextField
              label="File name (optional)"
              id="resume-name"
              value={externalName}
              hint="Shown as the download label."
              onChange={(value) => setExternalName(value)}
            />
            <Button onClick={() => void submitExternal()} loading={external.status === "submitting"}>
              Save URL
            </Button>
          </div>
        </section>
      </div>

      {action.error !== null && (
        <div className="mb-4">
          <Alert tone="error" onDismiss={action.reset}>
            {action.error.message}
          </Alert>
        </div>
      )}

      <AsyncContent
        state={resumes}
        empty={
          <EmptyState
            title="No resume yet"
            description="Upload a PDF or save an external URL above — visitors will be able to download whichever one is active."
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((resume) => (
              <li key={resume.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-slate-100">
                      {resume.fileName !== undefined && resume.fileName !== ""
                        ? resume.fileName
                        : resume.downloadUrl}
                    </p>
                    <Badge tone={resume.source === "storage" ? "sky" : "slate"}>
                      {resume.source}
                    </Badge>
                    {resume.isActive && <Badge tone="emerald">active</Badge>}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {resume.fileSize !== undefined ? `${formatBytes(resume.fileSize)} · ` : ""}
                    {resume.downloadUrl}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!resume.isActive && (
                    <Button
                      variant="secondary"
                      disabled={action.status === "submitting"}
                      onClick={() =>
                        void action.execute(() => setActiveResume(resume.id)).then((result) => {
                          if (result.ok) resumes.reload();
                        })
                      }
                    >
                      Set active
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    disabled={action.status === "submitting"}
                    onClick={() => setPendingDelete(resume)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this resume?"
        description="The metadata is removed and any uploaded file is cleaned up best-effort. Public downloads stop immediately."
        confirmLabel="Delete"
        destructive
        busy={action.status === "submitting"}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const resume = pendingDelete;
          if (resume === null) return;
          void action
            .execute(() => deleteResume(resume.id))
            .then((result) => {
              if (result.ok) resumes.reload();
              setPendingDelete(null);
            });
        }}
      />
    </AdminPageShell>
  );
}
