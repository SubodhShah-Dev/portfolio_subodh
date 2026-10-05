import type { FormEvent, ReactNode } from "react";

import type { AppError } from "../../types/common";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

interface EntityFormProps {
  title: string;
  /** While submitting, Save shows a spinner and Cancel is disabled (§43). */
  submitting: boolean;
  error: AppError | null;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/**
 * Standard card wrapper for every admin editor (§61): heading, normalized
 * mutation error, field grid, and an always-visible Save/Cancel action row —
 * never hover-revealed (§54).
 */
export function EntityForm({
  title,
  submitting,
  error,
  onSubmit,
  onCancel,
  children,
}: EntityFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="card mb-6 p-6" onSubmit={handleSubmit} noValidate>
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      {error !== null && (
        <div className="mt-4">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" loading={submitting}>
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
