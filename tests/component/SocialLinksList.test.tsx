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
    iconUrl: "/icons/github.svg",
    ...overrides,
  } as SocialLink;
}

describe("SocialLinksList", () => {
  it("renders an icon-only anchor labelled with the link name", () => {
    render(<SocialLinksList links={[makeLink()]} />);

    const anchor = screen.getByRole("link", { name: "GitHub" });
    expect(anchor).toHaveAttribute("href", "https://github.com/example");
    expect(anchor).toHaveAttribute("target", "_blank");

    const icon = screen.getByRole("presentation", { hidden: true });
    expect(icon).toHaveAttribute("src", "/icons/github.svg");
    expect(icon.className).toContain("size-6");
  });

  it("inverts icons on the dark band and not on paper", () => {
    const { rerender } = render(<SocialLinksList links={[makeLink()]} />);
    expect(
      screen.getByRole("presentation", { hidden: true }).className,
    ).toContain("invert");

    rerender(<SocialLinksList links={[makeLink()]} tone="paper" />);
    expect(
      screen.getByRole("presentation", { hidden: true }).className,
    ).toContain("dark:invert");
  });

  it("renders nothing when a link has no icon asset", () => {
    render(<SocialLinksList links={[makeLink({ iconUrl: "" })]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
