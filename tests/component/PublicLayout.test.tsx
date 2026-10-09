import { render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it, vi } from "vitest";

import PublicLayout from "../../src/layouts/PublicLayout";
import * as smoothScroll from "../../src/utils/smoothScroll";
import type * as SmoothScrollModule from "../../src/utils/smoothScroll";
import {
  HIDDEN_FLAGS,
  makeLayoutData,
  makeProfile,
  makeSocialLink,
} from "../fixtures/publicContent";

vi.mock("../../src/utils/smoothScroll", async (importOriginal) => {
  const actual = await importOriginal<typeof SmoothScrollModule>();
  return { ...actual, scrollToTop: vi.fn() };
});

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

  it("keeps the raw email address out of the footer", async () => {
    renderLayout(
      makeLayoutData({
        profile: makeProfile({
          contact: { id: "contact", email: "ada@example.com" },
        }),
        flags: { ...HIDDEN_FLAGS, contact: true },
      }),
    );

    const sayHello = await screen.findByRole("link", { name: "Say hello" });
    expect(sayHello).toHaveAttribute("href", "mailto:ada@example.com");
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });

  it("routes the hash-less scroll reset through smooth scrollToTop", async () => {
    vi.mocked(smoothScroll.scrollToTop).mockClear();
    renderLayout(makeLayoutData());

    await screen.findByRole("navigation", { name: "Site navigation" });
    await waitFor(() =>
      expect(smoothScroll.scrollToTop).toHaveBeenCalledTimes(1),
    );
  });

  it("shows a paused notice instead of the site when disabled", async () => {
    renderLayout(makeLayoutData({ siteEnabled: false }));

    expect(await screen.findByText("Temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Site navigation" })).not.toBeInTheDocument();
    expect(screen.queryByText("Page content")).not.toBeInTheDocument();
  });
});
