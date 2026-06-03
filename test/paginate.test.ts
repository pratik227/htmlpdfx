import { describe, it, expect } from "vitest";
import { computePageSlices } from "../src/core/paginate.js";

describe("computePageSlices", () => {
  it("splits a tall document into equal full pages", () => {
    const slices = computePageSlices({ totalPx: 3000, pagePx: 1000 });
    expect(slices).toEqual([
      { start: 0, end: 1000 },
      { start: 1000, end: 2000 },
      { start: 2000, end: 3000 },
    ]);
  });

  it("does not emit a trailing blank page when content fits exactly", () => {
    const slices = computePageSlices({ totalPx: 2000, pagePx: 1000 });
    expect(slices).toHaveLength(2);
    expect(slices[slices.length - 1]!.end).toBe(2000);
  });

  it("ends a page at a forced break (the html2pdf pagebreak fix)", () => {
    const slices = computePageSlices({
      totalPx: 2000,
      pagePx: 1000,
      breaks: [600],
    });
    expect(slices[0]).toEqual({ start: 0, end: 600 });
    expect(slices[1]!.start).toBe(600);
  });

  it("never cuts through an avoid range — backs up to its top", () => {
    const slices = computePageSlices({
      totalPx: 2000,
      pagePx: 1000,
      avoid: [{ start: 950, end: 1100 }],
    });
    // natural cut at 1000 lands inside [950,1100) -> page ends at 950
    expect(slices[0]).toEqual({ start: 0, end: 950 });
  });

  it("falls back to a full page when an avoid block is taller than a page", () => {
    const slices = computePageSlices({
      totalPx: 2000,
      pagePx: 1000,
      avoid: [{ start: 0, end: 1500 }],
    });
    // can't back up past start -> must still advance
    expect(slices[0]!.end).toBeGreaterThan(0);
    expect(slices.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty content", () => {
    expect(computePageSlices({ totalPx: 0, pagePx: 1000 })).toEqual([
      { start: 0, end: 0 },
    ]);
  });

  it("throws on a non-positive page height", () => {
    expect(() => computePageSlices({ totalPx: 100, pagePx: 0 })).toThrow();
  });
});
