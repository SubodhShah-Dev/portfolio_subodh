import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ManageMessages from "../../src/pages/admin/ManageMessages";
import {
  deleteMessage,
  getMessages,
  markMessageRead,
} from "../../src/services/messageService";
import { createAppError } from "../../src/utils/firebaseErrors";
import type { ContactMessage } from "../../src/types/message";

vi.mock("../../src/services/messageService", () => ({
  getMessages: vi.fn(),
  markMessageRead: vi.fn(),
  deleteMessage: vi.fn(),
}));

const getMock = vi.mocked(getMessages);
const markMock = vi.mocked(markMessageRead);
const deleteMock = vi.mocked(deleteMessage);

function makeMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    id: "msg-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "I would like to discuss a project.",
    read: false,
    createdAt: {
      toDate: () => new Date("2026-01-15T10:30:00Z"),
    } as ContactMessage["createdAt"],
    ...overrides,
  };
}

describe("ManageMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue([]);
    markMock.mockResolvedValue(undefined);
    deleteMock.mockResolvedValue(undefined);
  });

  it("shows an honest empty state", async () => {
    render(<ManageMessages />);
    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
  });

  it("renders messages with unread indicators", async () => {
    getMock.mockResolvedValue([
      makeMessage(),
      makeMessage({
        id: "msg-2",
        name: "Grace Hopper",
        message: "Thanks for your portfolio!",
        read: true,
      }),
    ]);
    render(<ManageMessages />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("unread")).toBeInTheDocument();
    expect(screen.getByText("1 unread")).toBeInTheDocument();
    expect(
      screen.getByText("I would like to discuss a project."),
    ).toBeInTheDocument();
  });

  it("toggles read state from the row action", async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValue([makeMessage()]);
    render(<ManageMessages />);

    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Mark read" }));

    await waitFor(() => expect(markMock).toHaveBeenCalledWith("msg-1", true));
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("deletes only after explicit confirmation", async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValue([makeMessage()]);
    render(<ManageMessages />);

    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteMock).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Delete this message?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("msg-1"));
  });

  it("surfaces action failures", async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValue([makeMessage()]);
    markMock.mockRejectedValue(createAppError("permission-denied"));
    render(<ManageMessages />);

    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Mark read" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /do not have permission/i,
    );
  });
});
