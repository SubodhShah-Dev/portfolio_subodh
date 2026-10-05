import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("rejects invalid logo URLs without saving", async () => {
    const user = userEvent.setup();
    render(<ManageSettings />);
    await screen.findByText("Site settings not created yet");

    await user.click(screen.getByRole("button", { name: "Create settings" }));
    await user.type(screen.getByLabelText(/^Logo URL/), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Logo URL must be a valid http(s) URL."),
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
