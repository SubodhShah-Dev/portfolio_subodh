import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "../../src/components/public/ContactForm";
import { submitContactMessage } from "../../src/services/messageService";
import { createAppError } from "../../src/utils/firebaseErrors";

vi.mock("../../src/services/messageService", () => ({
  submitContactMessage: vi.fn(),
}));

const submitMock = vi.mocked(submitContactMessage);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Name/), "Grace Hopper");
  await user.type(screen.getByLabelText(/^Email/), "grace@example.com");
  await user.type(
    screen.getByLabelText(/^Message/),
    "I would like to discuss a project.",
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submission and reports required fields", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Message is required.")).toBeInTheDocument();
  });

  it("rejects malformed email addresses", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/^Name/), "Grace Hopper");
    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    await user.type(
      screen.getByLabelText(/^Message/),
      "I would like to discuss a project.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(submitMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Email must be a valid email address."),
    ).toBeInTheDocument();
  });

  it("submits trimmed values and confirms success", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValueOnce("message-id");
    render(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText(/Your message has been sent/)).toBeInTheDocument();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith({
      name: "Grace Hopper",
      email: "grace@example.com",
      message: "I would like to discuss a project.",
    });
    expect(screen.getByLabelText(/^Name/)).toHaveValue("");
    expect(screen.getByLabelText(/^Message/)).toHaveValue("");
  });

  it("shows a safe error and keeps the form values on failure", async () => {
    const user = userEvent.setup();
    submitMock.mockRejectedValueOnce(
      createAppError("network", "A network error occurred. Check your connection and try again."),
    );
    render(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText(
        "A network error occurred. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Grace Hopper");
    expect(screen.queryByText(/Your message has been sent/)).not.toBeInTheDocument();
  });
});
