import { describe, it, expect } from "vitest";
import { countPdfPages } from "../src/utils/pdfmeta.js";

const enc = (s: string) => new TextEncoder().encode(s);

describe("countPdfPages", () => {
  it("reads /Count from the page tree root", () => {
    const bytes = enc("%PDF-1.4\n3 0 obj<< /Type /Pages /Kids[...] /Count 7 >>endobj");
    expect(countPdfPages(bytes)).toBe(7);
  });

  it("reads /Count when it precedes /Type /Pages", () => {
    const bytes = enc("<< /Count 4 /Type /Pages >>");
    expect(countPdfPages(bytes)).toBe(4);
  });

  it("falls back to counting /Type /Page objects", () => {
    const bytes = enc(
      "1 0 obj<</Type /Page>>endobj 2 0 obj<</Type /Page>>endobj"
    );
    expect(countPdfPages(bytes)).toBe(2);
  });

  it("does not confuse /Pages with /Page", () => {
    const bytes = enc("<< /Type /Pages >> << /Type /Page >>");
    // /Count missing -> count /Type /Page (one), not /Pages
    expect(countPdfPages(bytes)).toBe(1);
  });

  it("returns at least 1", () => {
    expect(countPdfPages(enc("garbage"))).toBe(1);
  });
});
