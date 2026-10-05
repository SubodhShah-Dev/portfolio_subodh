import { render, screen } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";

import PublicLayout from "../../src/layouts/PublicLayout";
import {
  HIDDEN_FLAGS,
  makeLayoutData,
  makeProfile,
  makeSocialLink,
} from "../fixtures/publicContent";

function renderLayout(data: ReturnType<typeof makeLayoutData>) {
  const router = createMemoryRouter(
    [
      {
        id: "public",
        path: "/",
        loader: () => Promise.resolve(data),
        element: <PublicLayout />,
        children: [{ index: true, element: <p>Page content</p> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("PublicLayout", () => {
  it("shows the profile brand and only enabled section links", async () => {
    renderLayout(
      makeLayoutData({
        profile: makeProfile(),
        flags: { ...HIDDEN_FLAGS, about: true, contact: true },
      }),
    );

    expect((await screen.findAllByText("Ada Lovelace")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Software Engineer").length).toBeGreaterThan(0);

    const navigation = screen.getByRole("navigation", { name: "Site navigation" });
    expect(navigation).toHaveTextContent("About");
    expect(navigation).toHaveTextContent("Contact");
    expect(navigation).not.toHaveTextContent("Skills");
    expect(navigation).not.toHaveTextContent("Experience");
  });

  it("provides the resume download and social links in the sidebar footer", async () => {
    renderLayout(
      makeLayoutData({
        activeResume: {
          id: "r1",
          source: "external",
          downloadUrl: "https://example.com/resume.pdf",
          isActive: true,
          updatedAt: Timestamp.now(),
        },
        socialLinks: [makeSocialLink()],
      }),
    );

    const resume = await screen.findByRole("link", { name: "Download resume" });
    expect(resume).toHaveAttribute("href", "https://example.com/resume.pdf");
    expect(screen.getByRole("link", { name: /GitHub/ })).toBeInTheDocument();
  });

  it("renders the footer with owner attribution", async () => {
    renderLayout(
      makeLayoutData({
        profile: makeProfile(),
        footerText: "Built with care.",
      }),
    );

    expect(await screen.findByText("Built with care.")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`© \\d{4} Ada Lovelace`)),
    ).toBeInTheDocument();
  });

  it("shows a paused notice instead of the site when disabled", async () => {
    renderLayout(makeLayoutData({ siteEnabled: false }));

    expect(await screen.findByText("Temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Site navigation" })).not.toBeInTheDocument();
    expect(screen.queryByText("Page content")).not.toBeInTheDocument();
  });
});
