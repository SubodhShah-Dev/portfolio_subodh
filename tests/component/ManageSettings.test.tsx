import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deleteField } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ManageSettings from "../../src/pages/admin/ManageSettings";
import {
  getSiteSettings,
  updateSiteSettings,
} from "../../src/services/settingsService";
import { createAppError } from "../../src/utils/firebaseErrors";
import { DEFAULT_SECTION_VISIBILITY } from "../../src/types/settings";

vi.mock("../../src/services/settingsService", () => ({
  getSiteSettings: vi.fn(),
  updateSiteSettings: vi.fn(),
}));

const getMock = vi.mocked(getSiteSettings);
const updateMock = vi.mocked(updateSiteSettings);

describe("ManageSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue(null);
    updateMock.mockResolvedValue(undefined);
  });

  it("offers settings creation when none exist", async () => {
    render(<ManageSettings />);

    expect(await screen.findByText("Site settings not created yet")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("saves site settings with default sections", async () => {
    const user = userEvent.setup();
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.type(screen.getByLabelText(/^Site title/), "Ada's Portfolio");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          siteTitle: "Ada's Portfolio",
          sections: { ...DEFAULT_SECTION_VISIBILITY },
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText(/^Site title/)).not.toBeInTheDocument(),
    );
  });

  it("persists a disabled site", async () => {
    const user = userEvent.setup();
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.click(screen.getByLabelText("Site enabled"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      ),
    );
  });

  it("shows the summary for existing settings", async () => {
    getMock.mockResolvedValue({
      id: "main",
      siteTitle: "Ada's Portfolio",
      enabled: true,
      sections: { ...DEFAULT_SECTION_VISIBILITY, contact: false },
      updatedAt: { toDate: () => new Date() } as never,
    });
    render(<ManageSettings />);

    expect(await screen.findByText("Ada's Portfolio")).toBeInTheDocument();
    expect(screen.getByText("site live")).toBeInTheDocument();
    expect(screen.getByText("Contact: off")).toBeInTheDocument();
  });

  it("clears a removed field with a field deletion", async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValue({
      id: "main",
      siteTitle: "Ada's Portfolio",
      navIconUrl: "https://example.com/logo.png",
      enabled: true,
      sections: { ...DEFAULT_SECTION_VISIBILITY },
      updatedAt: { toDate: () => new Date() } as never,
    });
    render(<ManageSettings />);
    await user.click(await screen.findByRole("button", { name: "Edit settings" }));

    await user.clear(await screen.findByLabelText(/^Nav icon URL/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const input = updateMock.mock.calls[0]?.[0];
    expect(input?.navIconUrl).toEqual(deleteField());
    expect(input?.siteTitle).toBe("Ada's Portfolio");
  });

  it("saves a nav icon path and validates it", async () => {
    const user = userEvent.setup();
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.type(screen.getByLabelText(/^Nav icon URL/), "/brand/logo.jpg");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          navIconUrl: "/brand/logo.jpg",
        }),
      ),
    );
  });

  it("rejects invalid nav icon URLs without saving", async () => {
    const user = userEvent.setup();
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.type(
      screen.getByLabelText(/^Nav icon URL/),
      "javascript:alert(1)",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Nav icon URL must be a valid http(s) URL."),
    ).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("surfaces service failures inside the form", async () => {
    const user = userEvent.setup();
    updateMock.mockRejectedValue(createAppError("permission-denied"));
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /do not have permission/i,
    );
    expect(screen.getByLabelText(/^Site title/)).toBeInTheDocument();
  });
});
