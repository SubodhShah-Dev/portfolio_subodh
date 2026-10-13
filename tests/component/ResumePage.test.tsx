import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import Resume from "../../src/pages/public/Resume";
import type { PublicLayoutData } from "../../src/loaders/publicLoaders";
import { makeLayoutData } from "../fixtures/publicContent";

function renderResume(activeResume: PublicLayoutData["activeResume"]) {
  const router = createMemoryRouter(
    [
      {
        id: "public",
        path: "/resume",
        loader: () => Promise.resolve(makeLayoutData({ activeResume })),
        element: <Resume />,
      },
    ],
    { initialEntries: ["/resume"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("Resume page", () => {
  it("renders the active CV inline with a download link", async () => {
    const { container } = renderResume({
      id: "r1",
      source: "external",
      downloadUrl: "https://example.com/resume.pdf",
      fileName: "Ada CV.pdf",
      isActive: true,
      updatedAt: Timestamp.now(),
    });

    expect(
      await screen.findByRole("heading", { name: "Resume" }),
    ).toBeInTheDocument();
    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("src", "https://example.com/resume.pdf");
    expect(frame).toHaveAttribute("title", "Resume preview");
    expect(screen.getByText("Ada CV.pdf")).toBeInTheDocument();

    const download = screen.getByRole("link", { name: /Download/ });
    expect(download).toHaveAttribute("href", "https://example.com/resume.pdf");
    expect(download).toHaveAttribute("target", "_blank");
  });

  it("renders Not Found when no resume is active", async () => {
    renderResume(null);

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
