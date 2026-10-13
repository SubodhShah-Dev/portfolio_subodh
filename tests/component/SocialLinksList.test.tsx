import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SocialLinksList } from "../../src/components/public/SocialLinksList";
import type { SocialLink } from "../../src/types/socialLink";

function makeLink(overrides: Partial<SocialLink> = {}): SocialLink {
  return {
    id: "l1",
    status: "published",
    order: 0,
    platform: "GitHub",
    label: "GitHub",
    url: "https://github.com/example",
    ...overrides,
  } as SocialLink;
}

describe("SocialLinksList", () => {
  it("renders the icon image when iconUrl is set", () => {
    render(<SocialLinksList links={[makeLink({ iconUrl: "/icons/github.svg" })]} />);

    const icon = screen.getByRole("presentation", { hidden: true });
    expect(icon).toHaveAttribute("src", "/icons/github.svg");
    expect(icon.className).toContain("dark:invert");
  });

  it("falls back to the text-only pill when no icon is set", () => {
    render(<SocialLinksList links={[makeLink()]} />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.queryByRole("presentation", { hidden: true })).not.toBeInTheDocument();
  });
});
