import { describe, it, expect } from "vitest";
import { normalizeOptions } from "../src/core/options.js";

describe("normalizeOptions", () => {
  it("applies sensible defaults", () => {
    const o = normalizeOptions();
    expect(o.engine).toBe("auto");
    expect(o.unit).toBe("mm");
    expect(o.orientation).toBe("portrait");
    expect(o.page.widthMm).toBeCloseTo(210, 1); // A4
    expect(o.page.heightMm).toBeCloseTo(297, 1);
    expect(o.margin).toEqual({ topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 });
  });

  it("swaps dimensions for landscape", () => {
    const o = normalizeOptions({ orientation: "landscape" });
    expect(o.page.widthMm).toBeCloseTo(297, 1);
    expect(o.page.heightMm).toBeCloseTo(210, 1);
  });

  it("honours explicit pageSize over format", () => {
    const o = normalizeOptions({
      pageSize: { width: "100mm", height: "200mm" },
    });
    expect(o.page.widthMm).toBe(100);
    expect(o.page.heightMm).toBe(200);
  });

  it("parses scalar, tuple, and object margins", () => {
    expect(normalizeOptions({ margin: 5 }).margin).toEqual({
      topMm: 5,
      rightMm: 5,
      bottomMm: 5,
      leftMm: 5,
    });
    expect(normalizeOptions({ margin: [10, 20] }).margin).toEqual({
      topMm: 10,
      rightMm: 20,
      bottomMm: 10,
      leftMm: 20,
    });
    expect(
      normalizeOptions({ margin: { top: 1, bottom: 2 } }).margin
    ).toEqual({ topMm: 1, rightMm: 0, bottomMm: 2, leftMm: 0 });
  });

  it("respects the active unit for numeric margins", () => {
    const o = normalizeOptions({ unit: "in", margin: 1 });
    expect(o.margin.topMm).toBeCloseTo(25.4, 5);
  });

  it("defaults pageBreak mode to css+legacy", () => {
    expect(normalizeOptions().pageBreak.mode).toEqual(["css", "legacy"]);
  });

  it("rejects a 3-element margin array", () => {
    expect(() =>
      normalizeOptions({ margin: [1, 2, 3] as never })
    ).toThrow();
  });

  it("defaults to tagged (accessible) output, no outline", () => {
    const o = normalizeOptions();
    expect(o.chromium.tagged).toBe(true);
    expect(o.chromium.outline).toBe(false);
  });

  it("honors explicit outline/tagged toggles", () => {
    const o = normalizeOptions({ chromium: { outline: true, tagged: false } });
    expect(o.chromium.outline).toBe(true);
    expect(o.chromium.tagged).toBe(false);
  });
});
