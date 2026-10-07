import { useState, type FormEvent } from "react";

import { useMutation } from "../../hooks/useMutation";
import { submitContactMessage } from "../../services/messageService";
import type { ContactMessageInput } from "../../types/message";
import {
  emailError,
  firstError,
  maxLengthError,
  minLengthError,
  requiredError,
} from "../../utils/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5_000;

type FieldName = "name" | "email" | "message";
type FieldErrors = Partial<Record<FieldName, string | null>>;

/**
 * Public contact form (§19, §20).
 *
 * Validates before submitting, guards against double sends (§43), and only
 * ever reports normalized, safe messages. A successful send clears the form.
 */
export function ContactForm() {
  const [values, setValues] = useState<ContactMessageInput>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const mutation = useMutation((input: ContactMessageInput) =>
    submitContactMessage(input),
  );

  function updateField(field: FieldName, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): FieldErrors {
    return {
      name: firstError(
        requiredError("Name", values.name),
        maxLengthError("Name", values.name, 100),
      ),
      email: firstError(
        emailError("Email", values.email),
        maxLengthError("Email", values.email, 200),
      ),
      message: firstError(
        requiredError("Message", values.message),
        minLengthError("Message", values.message, MESSAGE_MIN),
        maxLengthError("Message", values.message, MESSAGE_MAX),
      ),
    };
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSent(false);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((entry) => entry !== null && entry !== undefined)) {
      return;
    }

    const result = await mutation.execute({
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    });
    if (result.ok) {
      setValues({ name: "", email: "", message: "" });
      setErrors({});
      setSent(true);
    }
  }

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} noValidate className="space-y-4">
      <FormField label="Name" htmlFor="contact-name" error={errors.name} variant="light" required>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          className="input"
          value={values.name}
          aria-invalid={errors.name != null || undefined}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Email" htmlFor="contact-email" error={errors.email} variant="light" required>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          className="input"
          value={values.email}
          aria-invalid={errors.email != null || undefined}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </FormField>

      <FormField
        label="Message"
        htmlFor="contact-message"
        error={errors.message}
        hint={`At least ${MESSAGE_MIN} characters.`}
        variant="light"
        required
      >
        <textarea
          id="contact-message"
          rows={5}
          className="input resize-y"
          value={values.message}
          aria-invalid={errors.message != null || undefined}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </FormField>

      {mutation.status === "error" && mutation.error !== null && (
        <Alert tone="error" variant="light">{mutation.error.message}</Alert>
      )}
      {sent && (
        <Alert tone="success" variant="light" onDismiss={() => setSent(false)}>
          Your message has been sent. Thank you for reaching out.
        </Alert>
      )}

      <Button type="submit" loading={mutation.status === "submitting"}>
        Send message
      </Button>
    </form>
  );
}
