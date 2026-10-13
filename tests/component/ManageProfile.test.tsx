import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deleteField } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ManageProfile from "../../src/pages/admin/ManageProfile";
import {
  getProfile,
  updateContactProfile,
  updateProfile,
} from "../../src/services/profileService";
import type { PortfolioProfile } from "../../src/types/profile";

vi.mock("../../src/services/profileService", () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateContactProfile: vi.fn(),
}));

const getMock = vi.mocked(getProfile);
const updateMock = vi.mocked(updateProfile);
const updateContactMock = vi.mocked(updateContactProfile);

function makeProfile(): PortfolioProfile {
  return {
    public: {
      id: "public",
      name: "Subodh Shah",
      role: "Engineer",
      headline: "Builder of things",
      bio: "Short bio.",
      location: "Kathmandu",
    },
    contact: {
      id: "contact",
      email: "ada@example.com",
      phone: "9800000000",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMock.mockResolvedValue(makeProfile());
  updateMock.mockResolvedValue(undefined);
  updateContactMock.mockResolvedValue(undefined);
});

describe("ManageProfile clearing optional fields", () => {
  it("sends field deletions for cleared location, email, and phone", async () => {
    const user = userEvent.setup();
    render(<ManageProfile />);
    await user.click(await screen.findByRole("button", { name: "Edit profile" }));

    await user.clear(screen.getByLabelText(/^Location/));
    await user.clear(screen.getByLabelText(/^Email/));
    await user.clear(screen.getByLabelText(/^Phone/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateContactMock).toHaveBeenCalledTimes(1));
    const contactInput = updateContactMock.mock.calls[0]?.[0];
    expect(contactInput?.email).toEqual(deleteField());
    expect(contactInput?.phone).toEqual(deleteField());
    const publicInput = updateMock.mock.calls[0]?.[0];
    expect(publicInput?.location).toEqual(deleteField());
  });

  it("saves a blank email without a required error", async () => {
    const user = userEvent.setup();
    render(<ManageProfile />);
    await user.click(await screen.findByRole("button", { name: "Edit profile" }));

    await user.clear(screen.getByLabelText(/^Email/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateContactMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Email is required."),
    ).not.toBeInTheDocument();
  });

  it("still rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ManageProfile />);
    await user.click(await screen.findByRole("button", { name: "Edit profile" }));

    await user.clear(screen.getByLabelText(/^Email/));
    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Email must be a valid email address."),
    ).toBeInTheDocument();
    expect(updateContactMock).not.toHaveBeenCalled();
  });

  it("keeps non-blank values as trimmed strings", async () => {
    const user = userEvent.setup();
    render(<ManageProfile />);
    await user.click(await screen.findByRole("button", { name: "Edit profile" }));

    await user.clear(screen.getByLabelText(/^Phone/));
    await user.type(screen.getByLabelText(/^Phone/), "  9811111111  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateContactMock).toHaveBeenCalledTimes(1));
    const contactInput = updateContactMock.mock.calls[0]?.[0];
    expect(contactInput?.phone).toBe("9811111111");
    expect(contactInput?.email).toBe("ada@example.com");
  });
});
