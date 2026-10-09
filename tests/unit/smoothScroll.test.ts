import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollToId } from "../../src/utils/smoothScroll";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("scrollToId", () => {
  it("flies immediately when the anchor already exists", () => {
    const section = document.createElement("section");
    section.id = "contact";
    document.body.appendChild(section);
    const scrollIntoView = vi.spyOn(section, "scrollIntoView");

    scrollToId("contact");

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("polls one frame at a time until the anchor mounts", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    scrollToId("late");
    expect(document.getElementById("late")).toBeNull();
    expect(frames).toHaveLength(1);

    const late = document.createElement("section");
    late.id = "late";
    document.body.appendChild(late);
    const scrollIntoView = vi.spyOn(late, "scrollIntoView");

    frames.shift()?.(0);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);
  });

  it("gives up after the frame cap so a dead hash cannot loop", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    scrollToId("missing");
    let flushed = 0;
    while (frames.length > 0 && flushed < 500) {
      frames.shift()?.(flushed);
      flushed += 1;
    }

    expect(document.getElementById("missing")).toBeNull();
    expect(frames).toHaveLength(0);
    expect(flushed).toBeLessThan(500);
  });
});
