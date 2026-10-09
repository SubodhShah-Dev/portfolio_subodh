import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileStack } from "../../src/components/public/ProfileStack";

const IMAGES = [
  "https://example.com/a.jpg",
  "https://example.com/b.jpg",
  "https://example.com/c.jpg",
];

describe("ProfileStack", () => {
  it("renders nothing when there are no photos", () => {
    const { container } = render(<ProfileStack images={[]} name="Ada Lovelace" />);
    expect(container.firstChild).toBeNull();
  });

  it("cycles the counter on click and loops back to the start", () => {
    render(<ProfileStack images={IMAGES} name="Ada Lovelace" />);
    const deck = screen.getByRole("button", { name: "Show next profile photo" });

    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    fireEvent.click(deck);
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
    fireEvent.click(deck);
    expect(screen.getByText("03 / 03")).toBeInTheDocument();
    fireEvent.click(deck);
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
  });

  it("labels every photo in the deck", () => {
    render(<ProfileStack images={IMAGES} name="Ada Lovelace" />);
    expect(
      screen.getByAltText("Ada Lovelace — profile photo 1 of 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Ada Lovelace — profile photo 2 of 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Ada Lovelace — profile photo 3 of 3"),
    ).toBeInTheDocument();
  });

  it("renders a single photo as a static frame without controls", () => {
    render(<ProfileStack images={[IMAGES[0]]} name="Ada Lovelace" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByAltText("Ada Lovelace — profile")).toBeInTheDocument();
    expect(screen.queryByText(/\d{2} \/ \d{2}/)).toBeNull();
  });
});
