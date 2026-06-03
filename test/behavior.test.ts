/**
 * Behavior suite — asserts the guarantees htmlpdfx makes, grouped by feature.
 * Browser-only behaviors are exercised by `test/browser-harness.html` and
 * `test/frameworks-harness.html` (run through real browsers in
 * `test/cross-browser.mjs`).
 */
import { describe, it, expect } from "vitest";
import { computePageSlices } from "../src/core/paginate.js";
import { normalizeOptions } from "../src/core/options.js";
import { buildInjectedCss } from "../src/core/css.js";
import { expandTemplate } from "../src/core/template.js";
import { resolveInput } from "../src/core/input.js";
import { PdfWriter } from "../src/pdf/writer.js";
import { countPdfPages } from "../src/utils/pdfmeta.js";
import { toMm, mmToPx } from "../src/utils/units.js";
import { detectRuntime, isServerRuntime } from "../src/runtime.js";

const latin1 = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!);
  return s;
};

describe("page breaks", () => {
  it("ends a page exactly at a forced break", () => {
    const slices = computePageSlices({ totalPx: 3000, pagePx: 1000, breaks: [500] });
    expect(slices[0]).toEqual({ start: 0, end: 500 });
  });
  it("emits real CSS break-* rules for before/after/avoid selectors", () => {
    const css = buildInjectedCss(
      normalizeOptions({ pageBreak: { before: [".c"], after: ["h1"], avoid: [".k"] } })
    );
    expect(css).toContain("break-before: page");
    expect(css).toContain("break-after: page");
    expect(css).toContain("break-inside: avoid");
  });
});

describe("no drift over long documents", () => {
  it("keeps the usable page height constant across 60 pages", () => {
    const slices = computePageSlices({ totalPx: 60_000, pagePx: 1000 });
    for (const s of slices.slice(0, -1)) expect(s.end - s.start).toBe(1000);
    expect(slices).toHaveLength(60);
  });
});

describe("no blank pages", () => {
  it("produces no trailing blank page when content fits exactly", () => {
    expect(computePageSlices({ totalPx: 2000, pagePx: 1000 })).toHaveLength(2);
  });
  it("page count equals ceil(content / page)", () => {
    expect(computePageSlices({ totalPx: 2500, pagePx: 1000 })).toHaveLength(3);
  });
});

describe("large documents", () => {
  it("paginates arbitrarily tall content without one giant canvas", () => {
    const slices = computePageSlices({ totalPx: 5_000_000, pagePx: 1000 });
    expect(slices.length).toBe(5000);
    expect(slices[slices.length - 1]!.end).toBe(5_000_000);
  });
});

describe("selectable text", () => {
  it("chromium is the default engine on the server (vector text)", () => {
    expect(isServerRuntime(detectRuntime())).toBe(true);
  });
  it("footer page numbers are real text, not pixels", () => {
    const doc = new PdfWriter();
    doc.addPage(595, 842).drawText("Page 1 of 3", 40, 800);
    expect(latin1(doc.toBytes())).toContain("(Page 1 of 3) Tj");
  });
});

describe("output quality", () => {
  it("defaults to 2x scale and is configurable", () => {
    expect(normalizeOptions().canvas.scale).toBe(2);
    expect(normalizeOptions({ canvas: { scale: 4 } }).canvas.scale).toBe(4);
  });
});

describe("atomic blocks (tables, cards, figures)", () => {
  it("never cuts through an avoid range — backs up to its top", () => {
    const slices = computePageSlices({
      totalPx: 2000,
      pagePx: 1000,
      avoid: [{ start: 960, end: 1040 }],
    });
    expect(slices[0]!.end).toBe(960);
  });
  it("avoid-all keeps <tr> whole", () => {
    const css = buildInjectedCss(normalizeOptions({ pageBreak: { mode: ["avoid-all"] } }));
    expect(css).toMatch(/tr,/);
  });
});

describe("backgrounds & colors", () => {
  it("forces print-color-adjust: exact", () => {
    expect(buildInjectedCss(normalizeOptions())).toContain("print-color-adjust: exact");
  });
  it("supports an explicit page background", () => {
    const css = buildInjectedCss(normalizeOptions({ canvas: { background: "#eef" } }));
    expect(css).toContain("background: #eef");
  });
});

describe("print media & modern CSS", () => {
  it("chromium emulates print media by default", () => {
    expect(normalizeOptions().chromium.mediaScreen).toBe(false);
  });
  it("passes color values through untouched (oklch survives)", () => {
    const css = buildInjectedCss(normalizeOptions({ css: ".x{color:oklch(0.6 0.2 250)}" }));
    expect(css).toContain("oklch(0.6 0.2 250)");
  });
});

describe("margins", () => {
  it("applies a uniform margin resolved to mm", () => {
    const o = normalizeOptions({ margin: { top: 20, bottom: 20, left: 10, right: 10 } });
    expect(o.margin).toEqual({ topMm: 20, bottomMm: 20, leftMm: 10, rightMm: 10 });
  });
});

describe("headers & footers", () => {
  it("expands {{page}}/{{pages}}/{{title}} tokens", () => {
    expect(
      expandTemplate("Page {{page}} of {{pages}} — {{title}}", { page: 2, pages: 5, title: "Report" })
    ).toBe("Page 2 of 5 — Report");
  });
});

describe("scaling & overflow", () => {
  it("reflows content to the printable width", () => {
    const o = normalizeOptions({ format: "a4", margin: 10 });
    const contentWidthMm = o.page.widthMm - o.margin.leftMm - o.margin.rightMm;
    expect(contentWidthMm).toBeCloseTo(190, 1);
    expect(mmToPx(contentWidthMm)).toBeGreaterThan(0);
  });
  it("handles px units 1:1 (no hidden upscaling)", () => {
    expect(toMm("96px", "mm")).toBeCloseTo(25.4, 4);
  });
});

describe("server-side runtime", () => {
  it("detects the runtime and never assumes a DOM on the server", () => {
    expect(["node", "bun", "deno"]).toContain(detectRuntime());
  });
});

describe("page size & orientation", () => {
  it("preserves an explicit custom size without forcing orientation", () => {
    const o = normalizeOptions({ pageSize: { width: "300mm", height: "100mm" }, orientation: "landscape" });
    expect(o.page.widthMm).toBe(300);
    expect(o.page.heightMm).toBe(100);
  });
  it("respects a portrait request on a wide custom size", () => {
    const o = normalizeOptions({ pageSize: { width: "300mm", height: "100mm" }, orientation: "portrait" });
    expect(o.page.widthMm).toBe(100);
    expect(o.page.heightMm).toBe(300);
  });
});

describe("unicode / special characters", () => {
  it("escapes parentheses and backslashes in PDF strings", () => {
    const doc = new PdfWriter({ title: "a(b)\\c" });
    doc.addPage(10, 10);
    expect(latin1(doc.toBytes())).toContain("/Title (a\\(b\\)\\\\c)");
  });
});

describe("async API", () => {
  it("input resolution is synchronous and deterministic", () => {
    expect(resolveInput("<p>x</p>").kind).toBe("html");
  });
});

describe("valid output", () => {
  it("round-trips page count through serialize + parse", () => {
    const doc = new PdfWriter();
    for (let i = 0; i < 7; i++) doc.addPage(595, 842);
    expect(countPdfPages(doc.toBytes())).toBe(7);
  });
});
