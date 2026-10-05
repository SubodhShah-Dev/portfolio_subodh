import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ManageSkills from "../../src/pages/admin/ManageSkills";
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  reorderSkills,
  setSkillStatus,
  updateSkill,
} from "../../src/services/skillService";
import { createAppError } from "../../src/utils/firebaseErrors";
import type { Skill } from "../../src/types/skill";

vi.mock("../../src/services/skillService", () => ({
  getAllSkills: vi.fn(),
  createSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  setSkillStatus: vi.fn(),
  reorderSkills: vi.fn(),
}));

const getAllMock = vi.mocked(getAllSkills);
const createMock = vi.mocked(createSkill);
const updateMock = vi.mocked(updateSkill);
const deleteMock = vi.mocked(deleteSkill);
const setStatusMock = vi.mocked(setSkillStatus);
const reorderMock = vi.mocked(reorderSkills);

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "skill-1",
    name: "TypeScript",
    category: "Languages",
    status: "published",
    order: 0,
    createdAt: { toDate: () => new Date() } as Skill["createdAt"],
    updatedAt: { toDate: () => new Date() } as Skill["updatedAt"],
    ...overrides,
  };
}

describe("ManageSkills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([]);
    createMock.mockResolvedValue("skill-1");
    updateMock.mockResolvedValue(undefined);
    deleteMock.mockResolvedValue(undefined);
    setStatusMock.mockResolvedValue(undefined);
    reorderMock.mockResolvedValue(undefined);
  });

  it("shows an honest empty state when no skills exist", async () => {
    render(<ManageSkills />);

    expect(await screen.findByText("No skills yet")).toBeInTheDocument();
  });

  it("renders the loaded skills with status controls", async () => {
    getAllMock.mockResolvedValue([
      makeSkill(),
      makeSkill({ id: "skill-2", name: "React", category: "Frameworks", order: 1 }),
    ]);
    render(<ManageSkills />);

    expect(await screen.findByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Status for/)).toHaveLength(2);
  });

  it("validates required fields and does not submit", async () => {
    const user = userEvent.setup();
    render(<ManageSkills />);

    await screen.findByText("No skills yet");
    await user.click(screen.getByRole("button", { name: "Add skill" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Category is required.")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a skill from the form and reloads the list", async () => {
    const user = userEvent.setup();
    render(<ManageSkills />);
    await screen.findByText("No skills yet");

    await user.click(screen.getByRole("button", { name: "Add skill" }));
    await user.type(screen.getByLabelText(/^Name/), "TypeScript");
    await user.type(screen.getByLabelText(/^Category/), "Languages");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "TypeScript",
        category: "Languages",
        status: "published",
        order: 0,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText(/^Name/)).not.toBeInTheDocument(),
    );
  });

  it("surfaces service failures inside the form", async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(createAppError("permission-denied"));
    render(<ManageSkills />);
    await screen.findByText("No skills yet");

    await user.click(screen.getByRole("button", { name: "Add skill" }));
    await user.type(screen.getByLabelText(/^Name/), "TypeScript");
    await user.type(screen.getByLabelText(/^Category/), "Languages");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /do not have permission/i,
    );
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
  });

  it("updates status from the row select", async () => {
    const user = userEvent.setup();
    getAllMock.mockResolvedValue([makeSkill()]);
    render(<ManageSkills />);

    await screen.findByText("TypeScript");
    await user.selectOptions(screen.getByLabelText("Status for TypeScript"), "draft");

    await waitFor(() => expect(setStatusMock).toHaveBeenCalledWith("skill-1", "draft"));
  });

  it("reorders with the move buttons", async () => {
    const user = userEvent.setup();
    getAllMock.mockResolvedValue([
      makeSkill(),
      makeSkill({ id: "skill-2", name: "React", order: 1 }),
    ]);
    render(<ManageSkills />);

    await screen.findByText("React");
    await user.click(screen.getByRole("button", { name: "Move React up" }));

    await waitFor(() =>
      expect(reorderMock).toHaveBeenCalledWith(["skill-2", "skill-1"]),
    );
  });

  it("deletes only after explicit confirmation", async () => {
    const user = userEvent.setup();
    getAllMock.mockResolvedValue([makeSkill()]);
    render(<ManageSkills />);

    await screen.findByText("TypeScript");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteMock).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Delete this skill?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("skill-1"));
  });

  it("edits an existing skill prefilled", async () => {
    const user = userEvent.setup();
    getAllMock.mockResolvedValue([makeSkill()]);
    render(<ManageSkills />);

    await screen.findByText("TypeScript");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText(/^Name/)).toHaveValue("TypeScript");
    await user.clear(screen.getByLabelText(/^Name/));
    await user.type(screen.getByLabelText(/^Name/), "TypeScript (advanced)");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        "skill-1",
        expect.objectContaining({ name: "TypeScript (advanced)" }),
      ),
    );
  });
});
