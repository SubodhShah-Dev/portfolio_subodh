import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deleteField } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ManageContact from "../../src/pages/admin/ManageContact";
import {
  getContactSettings,
  updateContactSettings,
} from "../../src/services/contactService";
import type { ContactSettings } from "../../src/types/contact";

vi.mock("../../src/services/contactService", () => ({
  getContactSettings: vi.fn(),
  updateContactSettings: vi.fn(),
}));

const getMock = vi.mocked(getContactSettings);
const updateMock = vi.mocked(updateContactSettings);

function makeSettings(): ContactSettings {
  return {
    id: "main",
    title: "Get in touch",
    description: "Say hello.",
    email: "ada@example.com",
    phone: "9800000000",
    location: "Kathmandu",
    enabled: true,
    updatedAt: { toDate: () => new Date() } as never,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMock.mockResolvedValue(makeSettings());
  updateMock.mockResolvedValue(undefined);
});

describe("ManageContact clearing optional fields", () => {
  it("sends field deletions for cleared title, email, and phone", async () => {
    const user = userEvent.setup();
    render(<ManageContact />);
    await user.click(await screen.findByRole("button", { name: "Edit settings" }));

    await user.clear(screen.getByLabelText(/^Section title/));
    await user.clear(screen.getByLabelText(/^Display email/));
    await user.clear(screen.getByLabelText(/^Display phone/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const input = updateMock.mock.calls[0]?.[0];
    expect(input?.title).toEqual(deleteField());
    expect(input?.email).toEqual(deleteField());
    expect(input?.phone).toEqual(deleteField());
    expect(input?.enabled).toBe(true);
  });

  it("saves a blank email without a required error", async () => {
    const user = userEvent.setup();
    render(<ManageContact />);
    await user.click(await screen.findByRole("button", { name: "Edit settings" }));

    await user.clear(screen.getByLabelText(/^Display email/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
  });

  it("still rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ManageContact />);
    await user.click(await screen.findByRole("button", { name: "Edit settings" }));

    await user.clear(screen.getByLabelText(/^Display email/));
    await user.type(screen.getByLabelText(/^Display email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Email must be a valid email address."),
    ).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
