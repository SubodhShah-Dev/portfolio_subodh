import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it, vi } from "vitest";

import Home from "../../src/pages/public/Home";
import {
  HIDDEN_FLAGS,
  makeCertification,
  makeEducation,
  makeExperience,
  makeLayoutData,
  makeProfile,
  makeProject,
  makeSkill,
  makeSocialLink,
} from "../fixtures/publicContent";

function renderHome(data: ReturnType<typeof makeLayoutData>) {
  const router = createMemoryRouter(
    [
      {
        id: "public",
        path: "/",
        loader: () => Promise.resolve(data),
        children: [{ index: true, element: <Home /> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

const richData = makeLayoutData({
  profile: makeProfile(),
  flags: {
    hero: true,
    about: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    certifications: true,
    contact: true,
  },
  skills: [makeSkill()],
  experience: [makeExperience()],
  education: [makeEducation()],
  certifications: [makeCertification()],
  projects: [makeProject({ title: "Fixture project" })],
});

describe("Home", () => {
  it("renders every enabled section from loader data", async () => {
    renderHome(richData);

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Certifications" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fixture project/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Download resume" }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty portfolio without fabricated content", async () => {
    renderHome(makeLayoutData());

    expect(await screen.findByRole("heading", { name: "Portfolio" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Name/)).not.toBeInTheDocument();
    expect(screen.queryByText("Download resume")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /GitHub/ })).not.toBeInTheDocument();
  });

  it("shows the social links in the hero when configured", async () => {
    renderHome(
      makeLayoutData({
        profile: makeProfile(),
        flags: { ...HIDDEN_FLAGS, hero: true },
        socialLinks: [makeSocialLink()],
      }),
    );

    const github = await screen.findByRole("link", { name: /GitHub/ });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("presents homepage projects as a carousel showcase", async () => {
    renderHome(
      makeLayoutData({
        profile: makeProfile(),
        flags: { ...HIDDEN_FLAGS, projects: true },
        projects: [
          makeProject({ title: "Alpha app" }),
          makeProject({ id: "project-2", title: "Beta service" }),
        ],
      }),
    );

    const region = await screen.findByRole("region", {
      name: "Projects showcase",
    });
    expect(region).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to slide 1" }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Alpha app/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Beta service/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View all projects" }),
    ).toBeInTheDocument();
  });

  it("switches the desktop showcase to a static grid with a featured bento cell", async () => {
    // Desktop breakpoint true, everything else (reduced motion, color
    // scheme) keeps the setup stub's false.
    vi.stubGlobal(
      "matchMedia",
      (query: string): MediaQueryList => ({
        matches: query.includes("min-width: 1024px"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    );
    try {
      renderHome(
        makeLayoutData({
          profile: makeProfile(),
          flags: { ...HIDDEN_FLAGS, projects: true },
          projects: [
            makeProject({ title: "Alpha app", featured: true }),
            makeProject({ id: "project-2", title: "Beta service" }),
          ],
        }),
      );

      expect(
        await screen.findByRole("link", { name: /Alpha app/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Projects showcase" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Next slide" }),
      ).not.toBeInTheDocument();
      expect(document.querySelector("[data-featured-hero]")).not.toBeNull();
      expect(
        screen.getByRole("link", { name: /Beta service/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "View all projects" }),
      ).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("respects disabled sections even when content exists", async () => {
    renderHome(
      makeLayoutData({
        profile: makeProfile(),
        flags: {
          hero: true,
          about: false,
          skills: false,
          projects: false,
          experience: false,
          education: false,
          certifications: false,
          contact: false,
        },
        skills: [makeSkill()],
        projects: [makeProject()],
      }),
    );

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Contact" })).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
  });
});
