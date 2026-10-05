import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AsyncContent } from "../../src/components/ui/AsyncContent";
import { createAppError } from "../../src/utils/firebaseErrors";

const skeleton = <div data-testid="skeleton">Loading…</div>;
const empty = <div data-testid="empty">Nothing saved yet.</div>;

describe("AsyncContent", () => {
  it("renders the loading skeleton", () => {
    render(
      <AsyncContent
        state={{ data: null, status: "loading", error: null, reload: vi.fn() }}
        skeleton={skeleton}
        empty={empty}
      >
        {(data) => <p>{data}</p>}
      </AsyncContent>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders errors with a working retry action", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const error = createAppError("network", "Connection lost.");
    render(
      <AsyncContent
        state={{ data: null, status: "error", error, reload }}
        skeleton={skeleton}
        empty={empty}
      >
        {(data) => <p>{data}</p>}
      </AsyncContent>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state", () => {
    render(
      <AsyncContent
        state={{ data: [], status: "empty", error: null, reload: vi.fn() }}
        skeleton={skeleton}
        empty={empty}
      >
        {() => <p>never</p>}
      </AsyncContent>,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });

  it("renders children with data on success", () => {
    render(
      <AsyncContent
        state={{ data: "Ada Lovelace", status: "success", error: null, reload: vi.fn() }}
        skeleton={skeleton}
        empty={empty}
      >
        {(data) => <p>Profile: {data}</p>}
      </AsyncContent>,
    );
    expect(screen.getByText("Profile: Ada Lovelace")).toBeInTheDocument();
  });

  it("falls back to empty when a nullable result is null", () => {
    render(
      <AsyncContent
        state={{ data: null, status: "success", error: null, reload: vi.fn() }}
        skeleton={skeleton}
        empty={empty}
      >
        {() => <p>never</p>}
      </AsyncContent>,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });
});
