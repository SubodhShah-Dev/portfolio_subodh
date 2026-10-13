import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";

import { ProjectCard } from "../../src/components/public/ProjectCard";
import { makeProject } from "../fixtures/publicContent";

function renderCard(project: ReturnType<typeof makeProject>) {
  const router = createMemoryRouter(
    [{ path: "/", element: <ProjectCard project={project} /> }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("ProjectCard", () => {
  it("renders the stretched title link, date, and description", () => {
    renderCard(
      makeProject({
        title: "Card project",
        subtitle: "A subtitle",
        description: "Long description here.",
        date: "2024",
      }),
    );

    expect(
      screen.getByRole("link", { name: "Card project" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("Long description here.")).toBeInTheDocument();
  });

  it("shows a hover-play video in the media frame when previewVideoUrl is set", () => {
    renderCard(
      makeProject({
        title: "Video project",
        thumbnailUrl: "/projects/thumb.png",
        previewVideoUrl: "/videos/preview.mp4",
      }),
    );

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "/videos/preview.mp4");
    expect(video).toHaveAttribute("poster", "/projects/thumb.png");
    expect(video).toHaveAttribute("aria-hidden", "true");
  });

  it("renders Source and Live demo buttons only when the URLs exist", () => {
    const { rerender } = renderCard(
      makeProject({
        title: "No links",
        githubUrl: "",
        liveDemoUrl: "",
      }),
    );
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
    expect(screen.queryByText("Live demo")).not.toBeInTheDocument();

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <ProjectCard
              project={makeProject({
                title: "With links",
                githubUrl: "https://github.com/example/repo",
                liveDemoUrl: "https://example.com",
              })}
            />
          ),
        },
      ],
      { initialEntries: ["/"] },
    );
    rerender(<RouterProvider router={router} />);

    const source = screen.getByText("Source").closest("a");
    expect(source).toHaveAttribute("href", "https://github.com/example/repo");
    const demo = screen.getByText("Live demo").closest("a");
    expect(demo).toHaveAttribute("href", "https://example.com");
  });

  it("renders the lifecycle chip and hides it when unset", () => {
    renderCard(makeProject({ title: "Chip", lifecycle: "shipped" }));
    expect(screen.getByText("Shipped")).toBeInTheDocument();
  });
});
