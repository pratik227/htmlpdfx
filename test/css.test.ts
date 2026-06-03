import { describe, it, expect } from "vitest";
import { buildInjectedCss } from "../src/core/css.js";
import { normalizeOptions } from "../src/core/options.js";

describe("buildInjectedCss", () => {
  it("emits an @page rule sized to the paper", () => {
    const css = buildInjectedCss(normalizeOptions({ format: "a4" }));
    expect(css).toMatch(/@page\s*\{\s*size:\s*8\.2\d+in 11\.6\d+in/);
  });

  it("translates break selectors into real break-* rules", () => {
    const css = buildInjectedCss(
      normalizeOptions({
        pageBreak: { before: [".chapter"], after: ["h1"], avoid: [".card"] },
      })
    );
    expect(css).toContain(".chapter { break-before: page; page-break-before: always; }");
    expect(css).toContain("h1 { break-after: page; page-break-after: always; }");
    expect(css).toContain(".card { break-inside: avoid; page-break-inside: avoid; }");
  });

  it("adds the legacy html2pdf page-break selector by default", () => {
    const css = buildInjectedCss(normalizeOptions());
    expect(css).toContain(".html2pdf__page-break");
  });

  it("forces print-color-adjust so backgrounds survive", () => {
    const css = buildInjectedCss(normalizeOptions());
    expect(css).toContain("print-color-adjust: exact");
  });

  it("appends avoid-all rules when requested", () => {
    const css = buildInjectedCss(
      normalizeOptions({ pageBreak: { mode: ["avoid-all"] } })
    );
    expect(css).toMatch(/tr,.*\{ break-inside: avoid/);
  });

  it("inlines user css last", () => {
    const css = buildInjectedCss(normalizeOptions({ css: ".x{color:red}" }));
    expect(css.trim().endsWith(".x{color:red}")).toBe(true);
  });
});
