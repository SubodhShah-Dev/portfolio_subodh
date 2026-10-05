import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "../../src/pages/admin/Dashboard";
import { getAllCertifications } from "../../src/services/certificationService";
import { getAllEducation } from "../../src/services/educationService";
import { getAllExperience } from "../../src/services/experienceService";
import { getProfile } from "../../src/services/profileService";
import { getMessages } from "../../src/services/messageService";
import { getAllProjects } from "../../src/services/projectService";
import { getAllSkills } from "../../src/services/skillService";
import { getAllSocialLinks } from "../../src/services/socialLinkService";
import { getSiteSettings } from "../../src/services/settingsService";
import { getResumes } from "../../src/services/resumeService";
import { createAppError } from "../../src/utils/firebaseErrors";

vi.mock("../../src/services/profileService", () => ({ getProfile: vi.fn() }));
vi.mock("../../src/services/messageService", () => ({ getMessages: vi.fn() }));
vi.mock("../../src/services/projectService", () => ({ getAllProjects: vi.fn() }));
vi.mock("../../src/services/skillService", () => ({ getAllSkills: vi.fn() }));
vi.mock("../../src/services/educationService", () => ({ getAllEducation: vi.fn() }));
vi.mock("../../src/services/experienceService", () => ({ getAllExperience: vi.fn() }));
vi.mock("../../src/services/certificationService", () => ({
  getAllCertifications: vi.fn(),
}));
vi.mock("../../src/services/socialLinkService", () => ({
  getAllSocialLinks: vi.fn(),
}));
vi.mock("../../src/services/resumeService", () => ({ getResumes: vi.fn() }));
vi.mock("../../src/services/settingsService", () => ({ getSiteSettings: vi.fn() }));

const profileMock = vi.mocked(getProfile);
const messagesMock = vi.mocked(getMessages);
const projectsMock = vi.mocked(getAllProjects);
const skillsMock = vi.mocked(getAllSkills);
const settingsMock = vi.mocked(getSiteSettings);
const resumesMock = vi.mocked(getResumes);

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/admin/dashboard"]}>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMock.mockResolvedValue(null);
    messagesMock.mockResolvedValue([]);
    projectsMock.mockResolvedValue([]);
    skillsMock.mockResolvedValue([]);
    settingsMock.mockResolvedValue(null);
    resumesMock.mockResolvedValue([]);
    vi.mocked(getAllEducation).mockResolvedValue([]);
    vi.mocked(getAllExperience).mockResolvedValue([]);
    vi.mocked(getAllCertifications).mockResolvedValue([]);
    vi.mocked(getAllSocialLinks).mockResolvedValue([]);
  });

  it("guides a brand-new portfolio to the profile", async () => {
    renderDashboard();

    expect(
      await screen.findByText("Your portfolio has no content yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projects: 0 projects" }),
    ).toBeInTheDocument();
  });

  it("summarizes content counts and site status", async () => {
    profileMock.mockResolvedValue({
      public: {
        id: "public",
        name: "Ada Lovelace",
        role: "Engineer",
        headline: "Hello",
        bio: "Bio",
      },
      contact: { id: "contact" },
    });
    projectsMock.mockResolvedValue([
      { id: "p1", status: "published", order: 0 } as never,
      { id: "p2", status: "draft", order: 1 } as never,
    ]);
    settingsMock.mockResolvedValue({
      id: "main",
      enabled: false,
      sections: {} as never,
      updatedAt: { toDate: () => new Date() } as never,
    });
    renderDashboard();

    expect(
      await screen.findByRole("link", { name: "Projects: 2 projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("paused")).toBeInTheDocument();
    expect(screen.queryByText("Your portfolio has no content yet")).not.toBeInTheDocument();
  });

  it("highlights unread messages", async () => {
    messagesMock.mockResolvedValue([
      {
        id: "m1",
        name: "Ada",
        email: "ada@example.com",
        message: "Hi",
        read: false,
        createdAt: { toDate: () => new Date() } as never,
      },
      {
        id: "m2",
        name: "Grace",
        email: "grace@example.com",
        message: "Hello",
        read: true,
        createdAt: { toDate: () => new Date() } as never,
      },
    ]);
    renderDashboard();

    expect(await screen.findByText("1 unread")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Messages: 2 messages" }),
    ).toBeInTheDocument();
  });

  it("shows a retry action when loading fails", async () => {
    const user = userEvent.setup();
    projectsMock.mockRejectedValue(createAppError("network"));
    renderDashboard();

    const retry = await screen.findByRole("button", { name: "Try again" });
    expect(retry).toBeInTheDocument();

    projectsMock.mockResolvedValue([]);
    await user.click(retry);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument(),
    );
  });
});
