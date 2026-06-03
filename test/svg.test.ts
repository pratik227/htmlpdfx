import { describe, it, expect } from "vitest";
import {
  buildSvg,
  svgDataUrl,
  dataUrlToBytes,
  escapeAttr,
} from "../src/dom/svg.js";

describe("svg helpers", () => {
  it("wraps markup in an svg/foreignObject of the right size", () => {
    const svg = buildSvg("<p>hi</p>", 400, 600, "#fff");
    expect(svg).toContain('width="400"');
    expect(svg).toContain('height="600"');
    expect(svg).toContain("foreignObject");
    expect(svg).toContain('xmlns="http://www.w3.org/1999/xhtml"');
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain("<p>hi</p>");
  });

  it("omits the background rect when none given", () => {
    expect(buildSvg("<p>x</p>", 10, 10)).not.toContain("<rect");
  });

  it("escapes attribute values", () => {
    expect(escapeAttr('a"<>&')).toBe("a&quot;&lt;&gt;&amp;");
  });

  it("produces a usable svg data url", () => {
    const url = svgDataUrl(buildSvg("<p>x</p>", 1, 1));
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(url.split(",")[1]!)).toContain("<p>x</p>");
  });

  it("decodes base64 data urls to bytes", () => {
    // "%PDF" base64 = JVBERg==
    const bytes = dataUrlToBytes("data:image/jpeg;base64,JVBERg==");
    expect(Array.from(bytes)).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it("decodes percent-encoded data urls to bytes", () => {
    const bytes = dataUrlToBytes("data:text/plain,AB");
    expect(Array.from(bytes)).toEqual([0x41, 0x42]);
  });
});
