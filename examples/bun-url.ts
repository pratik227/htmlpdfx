// Bun example: render a live URL to PDF. Requires `bun add puppeteer`.
// Run: bun examples/bun-url.ts
import { toPdf } from "htmlpdfx";

const pdf = await toPdf(
  { url: "https://example.com" },
  {
    format: "letter",
    orientation: "portrait",
    margin: { top: 20, bottom: 20, left: 15, right: 15 },
    chromium: { waitUntil: "networkidle", printBackground: true },
  },
);

await pdf.save("example-com.pdf");
console.log(`Saved ${pdf.pageCount} page(s) in ${Math.round(pdf.durationMs)}ms`);
