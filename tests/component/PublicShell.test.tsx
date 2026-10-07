import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import PublicLayout from "../../src/layouts/PublicLayout";
import { HIDDEN_FLAGS, makeLayoutData, makeProfile } from "../fixtures/publicContent";

function renderShell() {
  const data = makeLayoutData({
    profile: makeProfile(),
    flags: { ...HIDDEN_FLAGS, about: true, contact: true },
    activeResume: {
      id: "r1",
      source: "external",
      downloadUrl: "https://example.com/resume.pdf",
      isActive: true,
      updatedAt: Timestamp.now(),
    },
  });
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

describe("PublicShell interactions", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  it("toggles the document theme from the header button", async () => {
    renderShell();

    const toggle = await screen.findByRole("button", {
      name: "Switch to dark theme",
    });
    fireEvent.click(toggle);

    expect(document.documentElement.classList).toContain("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.classList).not.toContain("dark");
  });

  it("opens the command palette with Ctrl+K and closes it with Escape", async () => {
    renderShell();
    await screen.findAllByText("Ada Lovelace");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const input = await screen.findByPlaceholderText("Type a command or search…");
    expect(input).toBeTruthy();
    expect(screen.getByText("Navigate")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search…")).toBeNull();
  });

  it("opens the mobile menu and reveals its links and actions", async () => {
    renderShell();

    const menuButton = await screen.findByRole("button", {
      name: "Open navigation menu",
    });
    fireEvent.click(menuButton);

    expect(document.getElementById("public-menu")).not.toBeNull();
    expect(
      document.getElementById("public-menu"),
    ).toHaveTextContent("Download resume");

    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    await waitFor(() => {
      expect(document.getElementById("public-menu")).toBeNull();
    });
  });
});
