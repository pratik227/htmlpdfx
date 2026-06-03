import { describe, it, expect } from "vitest";
import { toMm, mmToPx, mmToIn, mmToPt } from "../src/utils/units.js";

describe("units", () => {
  it("treats bare numbers as the default unit", () => {
    expect(toMm(10, "mm")).toBe(10);
    expect(toMm(1, "cm")).toBe(10);
    expect(toMm(1, "in")).toBeCloseTo(25.4, 5);
  });

  it("parses suffixed strings regardless of default unit", () => {
    expect(toMm("1in", "mm")).toBeCloseTo(25.4, 5);
    expect(toMm("96px", "mm")).toBeCloseTo(25.4, 5);
    expect(toMm("72pt", "mm")).toBeCloseTo(25.4, 5);
    expect(toMm("2cm", "in")).toBe(20);
  });

  it("round-trips mm conversions", () => {
    expect(mmToIn(25.4)).toBeCloseTo(1, 5);
    expect(mmToPx(25.4)).toBeCloseTo(96, 5);
    expect(mmToPt(25.4)).toBeCloseTo(72, 5);
  });

  it("rejects garbage", () => {
    expect(() => toMm("abc" as never, "mm")).toThrow();
  });
});
