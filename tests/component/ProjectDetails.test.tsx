import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";

import ProjectDetails from "../../src/pages/public/ProjectDetails";
import { makeProject } from "../fixtures/publicContent";

function renderDetails(project: ReturnType<typeof makeProject> | null) {
  const router = createMemoryRouter(
    [
      {
        path: "/projects/:id",
        loader: () => Promise.resolve({ project }),
        element: <ProjectDetails />,
      },
    ],
    { initialEntries: ["/projects/p1"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("ProjectDetails", () => {
  it("renders a full project page from loader data", async () => {
    renderDetails(
      makeProject({
        title: "Deep project",
        subtitle: "Everything at once",
        description: "Long-form overview.",
        features: ["Search", "Export"],
        techStack: ["React"],
        liveDemoUrl: "https://example.com",
        githubUrl: "https://github.com/example/repo",
        architecture: "Monolith with workers.",
        featured: true,
      }),
    );

    expect(await screen.findByRole("heading", { name: "Deep project" })).toBeInTheDocument();
    expect(screen.getByText("Everything at once")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Features" })).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Architecture" })).toBeInTheDocument();

    const demo = screen.getByRole("link", { name: "Live demo" });
    expect(demo).toHaveAttribute("target", "_blank");
    const source = screen.getByRole("link", { name: "Source code" });
    expect(source.getAttribute("rel")).toContain("noopener");

    expect(screen.getByRole("link", { name: "← Back to projects" })).toBeInTheDocument();
  });

  it("renders Not Found for missing, draft, or archived projects", async () => {
    renderDetails(null);

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });

  it("omits optional links and sections that have no data", async () => {
    renderDetails(
      makeProject({
        title: "Sparse project",
        description: "",
        features: [],
        techStack: [],
      }),
    );

    expect(await screen.findByRole("heading", { name: "Sparse project" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Features" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live demo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Source code" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Gallery" })).not.toBeInTheDocument();
  });

  it("renders the gallery strip and opens the lightbox from a thumbnail", async () => {
    renderDetails(
      makeProject({
        title: "Gallery project",
        description: "",
        features: [],
        techStack: [],
        images: [
          "https://example.com/one.png",
          "https://example.com/two.png",
          "https://example.com/three.png",
        ],
      }),
    );

    expect(await screen.findByRole("heading", { name: "Gallery project" })).toBeInTheDocument();
    const gallery = screen.getByRole("region", { name: "Gallery" });
    expect(gallery).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Gallery project screenshot/ })).toHaveLength(3);
    expect(
      screen.queryByRole("dialog", { name: "Image viewer" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));

    const dialog = await screen.findByRole("dialog", { name: "Image viewer" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByAltText("Gallery image 1 of 3"),
    ).toHaveAttribute("src", "https://example.com/one.png");

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(
      screen.getByAltText("Gallery image 2 of 3"),
    ).toHaveAttribute("src", "https://example.com/two.png");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Image viewer" }),
    ).not.toBeInTheDocument();
  });
});
