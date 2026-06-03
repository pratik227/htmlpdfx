import { describe, it, expect } from "vitest";
import { PdfWriter, type JpegImage } from "../src/pdf/writer.js";
import { countPdfPages } from "../src/utils/pdfmeta.js";

const latin1 = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!);
  return s;
};

const fakeJpeg = (): JpegImage => ({
  format: "jpeg",
  bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]),
  pxWidth: 100,
  pxHeight: 50,
});

describe("PdfWriter", () => {
  it("produces a valid PDF header and trailer", () => {
    const doc = new PdfWriter();
    doc.addPage(595, 842);
    const bytes = doc.toBytes();
    const text = latin1(bytes);
    expect(text.startsWith("%PDF-1.7")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("startxref");
  });

  it("reports the right page count both ways", () => {
    const doc = new PdfWriter();
    doc.addPage(595, 842);
    doc.addPage(595, 842);
    doc.addPage(595, 842);
    expect(doc.pageCount).toBe(3);
    const bytes = doc.toBytes();
    expect(latin1(bytes)).toContain("/Type /Pages /Count 3");
    expect(countPdfPages(bytes)).toBe(3);
  });

  it("writes xref offsets that actually point at their objects", () => {
    const doc = new PdfWriter({ title: "x" });
    doc.addPage(200, 200).drawImage(fakeJpeg(), 10, 10, 100, 50);
    const bytes = doc.toBytes();
    const text = latin1(bytes);

    // Parse the xref table and verify every offset lands on "N 0 obj".
    const startxref = Number(/startxref\s+(\d+)/.exec(text)![1]);
    const section = text.slice(startxref);
    // startxref must point exactly at the xref table.
    expect(section.startsWith("xref")).toBe(true);
    const header = /xref\s+0 (\d+)/.exec(section)!;
    const count = Number(header[1]);
    const entryRe = /(\d{10}) (\d{5}) (n|f) ?/g;
    const entries = [...section.matchAll(entryRe)];
    expect(entries.length).toBe(count);

    for (let objNum = 1; objNum < count; objNum++) {
      const offset = Number(entries[objNum]![1]);
      expect(text.slice(offset)).toMatch(new RegExp(`^${objNum} 0 obj`));
    }
  });

  it("embeds an image XObject with DCTDecode", () => {
    const doc = new PdfWriter();
    doc.addPage(200, 200).drawImage(fakeJpeg(), 0, 0, 100, 50);
    const text = latin1(doc.toBytes());
    expect(text).toContain("/Subtype /Image");
    expect(text).toContain("/Filter /DCTDecode");
    expect(text).toContain("/Width 100");
    expect(text).toContain("Do Q");
  });

  it("embeds metadata in the Info dictionary", () => {
    const doc = new PdfWriter({
      title: "My Report",
      author: "Acme",
      keywords: "a, b",
      date: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)),
    });
    doc.addPage(200, 200);
    const text = latin1(doc.toBytes());
    expect(text).toContain("/Title (My Report)");
    expect(text).toContain("/Author (Acme)");
    expect(text).toContain("/Keywords (a, b)");
    expect(text).toContain("/CreationDate (D:20260102030405Z)");
  });

  it("escapes parentheses in metadata strings", () => {
    const doc = new PdfWriter({ title: "a (b) c" });
    doc.addPage(10, 10);
    expect(latin1(doc.toBytes())).toContain("/Title (a \\(b\\) c)");
  });

  it("adds a Helvetica font resource when text is drawn", () => {
    const doc = new PdfWriter();
    doc.addPage(200, 200).drawText("Page 1 of 2", 10, 20, { size: 9 });
    const text = latin1(doc.toBytes());
    expect(text).toContain("/BaseFont /Helvetica");
    expect(text).toContain("(Page 1 of 2) Tj");
  });

  it("defaults to a blank A4 page when none are added", () => {
    const bytes = new PdfWriter().toBytes();
    expect(countPdfPages(bytes)).toBe(1);
  });
});
