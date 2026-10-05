import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";

import Projects from "../../src/pages/public/Projects";
import { makeLayoutData, makeProject } from "../fixtures/publicContent";

const data = makeLayoutData({
  flags: {
    hero: false,
    about: false,
    skills: false,
    projects: true,
    experience: false,
    education: false,
    certifications: false,
    contact: false,
  },
  projects: [
    makeProject({ id: "p1", title: "Alpha app", techStack: ["React", "TypeScript"] }),
    makeProject({ id: "p2", title: "Beta service", techStack: ["Go"], order: 1 }),
  ],
});

function renderProjects() {
  const router = createMemoryRouter(
    [
      {
        id: "public",
        path: "/projects",
        loader: () => Promise.resolve(data),
        element: <Projects />,
      },
    ],
    { initialEntries: ["/projects"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("Projects", () => {
  it("lists published projects with a technology filter", async () => {
    const user = userEvent.setup();
    renderProjects();

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alpha app/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Beta service/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("link", { name: /Alpha app/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Beta service/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("link", { name: /Alpha app/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Beta service/ })).toBeInTheDocument();
  });

  it("shows an honest empty state when nothing is published", async () => {
    const router = createMemoryRouter(
      [
        {
          id: "public",
          path: "/projects",
          loader: () =>
            Promise.resolve(
              makeLayoutData({
                flags: {
                  hero: false,
                  about: false,
                  skills: false,
                  projects: false,
                  experience: false,
                  education: false,
                  certifications: false,
                  contact: false,
                },
              }),
            ),
          element: <Projects />,
        },
      ],
      { initialEntries: ["/projects"] },
    );
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("No projects to show")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
  });
});
