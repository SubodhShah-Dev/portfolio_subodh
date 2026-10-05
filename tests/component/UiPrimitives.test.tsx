import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "../../src/components/ui/Alert";
import { Badge, StatusBadge } from "../../src/components/ui/Badge";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { FormField } from "../../src/components/ui/FormField";

describe("Alert", () => {
  it("announces errors assertively with role=alert", () => {
    render(
      <Alert tone="error" title="Save failed">
        Check your connection.
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Save failed");
    expect(alert).toHaveTextContent("Check your connection.");
  });

  it("invokes the dismiss control", () => {
    let dismissed = false;
    render(
      <Alert tone="success" onDismiss={() => (dismissed = true)}>
        Saved.
      </Alert>,
    );
    screen.getByRole("button", { name: "Dismiss message" }).click();
    expect(dismissed).toBe(true);
  });
});

describe("StatusBadge", () => {
  it("renders each publication state", () => {
    const { rerender } = render(<StatusBadge status="published" />);
    expect(screen.getByText("published")).toBeInTheDocument();
    rerender(<StatusBadge status="draft" />);
    expect(screen.getByText("draft")).toBeInTheDocument();
    rerender(<StatusBadge status="archived" />);
    expect(screen.getByText("archived")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("applies the requested tone", () => {
    render(<Badge tone="red">3 unread</Badge>);
    expect(screen.getByText("3 unread").className).toContain("text-red-400");
  });
});

describe("EmptyState", () => {
  it("renders title, description, and optional action", () => {
    render(
      <EmptyState
        title="No projects yet"
        description="Create one to get started."
        action={<button type="button">Create project</button>}
      />,
    );
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByText("Create one to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
  });
});

describe("FormField", () => {
  it("links the label to the control and announces errors", () => {
    render(
      <>
        <FormField label="Title" htmlFor="title" required error="Title is required.">
          <input id="title" />
        </FormField>
      </>,
    );
    const input = screen.getByLabelText(/Title/);
    expect(input).toHaveAttribute("id", "title");
    const error = screen.getByRole("alert");
    expect(error).toHaveAttribute("id", "title-error");
    expect(error).toHaveTextContent("Title is required.");
  });

  it("shows hint text when there is no error", () => {
    render(
      <FormField label="Headline" htmlFor="headline" hint="Shown under your name.">
        <input id="headline" />
      </FormField>,
    );
    expect(screen.getByText("Shown under your name.")).toHaveAttribute(
      "id",
      "headline-hint",
    );
  });
});
