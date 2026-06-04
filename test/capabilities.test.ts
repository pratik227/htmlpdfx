import { describe, it, expect } from "vitest";
import { engineCapabilities, describeEngines } from "../src/core/capabilities.js";

describe("engineCapabilities", () => {
  it("marks chromium as the high-fidelity tier with selectable text & links", () => {
    const c = engineCapabilities.chromium;
    expect(c.tier).toBe("high-fidelity");
    expect(c.selectableText).toBe(true);
    expect(c.clickableLinks).toBe(true);
    expect(c.repeatTableHeaders).toBe(true);
  });

  it("is honest that canvas is best-effort: no selectable text or links", () => {
    const c = engineCapabilities.canvas;
    expect(c.tier).toBe("best-effort");
    expect(c.selectableText).toBe(false);
    expect(c.clickableLinks).toBe(false);
    expect(c.runsIn).toEqual(["browser"]);
  });

  it("describeEngines summarizes both tiers", () => {
    const s = describeEngines();
    expect(s).toContain("chromium");
    expect(s).toContain("canvas");
  });
});
