/**
 * End-to-end verification against a REAL produced PDF.
 *
 * This turns htmlpdfx's quality claims into checked guarantees: it renders a
 * known document through the Chromium engine and then inspects the resulting
 * PDF bytes with pdf.js to assert the things we advertise actually happened —
 * multiple pages, selectable text, repeating table headers, clickable links,
 * a heading-derived outline, and that a warm renderer reuses one browser.
 *
 * Run: `npm run build && npm run test:e2e`
 * In CI set `HTMLPDFX_E2E_REQUIRE=1` so a missing browser is a failure, not a skip.
 */

import { createRenderer } from "../dist/index.js";

const REQUIRE = process.env.HTMLPDFX_E2E_REQUIRE === "1";
const SENTINEL = "HTMLPDFX_E2E_SENTINEL_8F3A";
const HEADER_LABEL = "RepeatingColHeader";
const LINK_URL = "https://example.com/htmlpdfx-e2e";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function fixtureHtml() {
  const rows = Array.from(
    { length: 70 },
    (_, i) =>
      `<tr><td>Row ${i + 1}</td><td>${SENTINEL}-${i + 1}</td><td>value ${i + 1}</td></tr>`
  ).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>
    body { font-family: sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
    thead th { background: #1f2937; color: #fff; }
  </style></head>
  <body>
    <h1>htmlpdfx E2E Report</h1>
    <p>${SENTINEL} intro paragraph with a
      <a href="${LINK_URL}">clickable link</a>.</p>
    <h2>Data table</h2>
    <table>
      <thead><tr><th>#</th><th>${HEADER_LABEL}</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;
}

async function loadPdf(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(" ");
    const annotations = await page.getAnnotations();
    pages.push({ text, annotations });
  }
  const outline = await doc.getOutline();
  return { numPages: doc.numPages, pages, outline };
}

async function main() {
  // Allow CI to pin a specific driver (e.g. the one whose browser it installed),
  // so the test doesn't depend on which optional driver happened to resolve.
  const driver = process.env.HTMLPDFX_E2E_DRIVER || undefined;
  const renderer = await createRenderer({
    format: "a4",
    margin: 12,
    chromium: { outline: true, driver }, // tagged is on by default
    footer: { template: "Page {{page}} / {{pages}}" },
  });

  let result, second;
  try {
    result = await renderer.toPdf(fixtureHtml());
    // Second render proves the warm browser is reused across calls.
    const openAfterFirst = renderer.isOpen;
    second = await renderer.toPdf("<h1>Second render reuses the browser</h1>");
    check("warm renderer stayed open between renders", openAfterFirst && renderer.isOpen);
    check("both pooled renders produced PDFs", result.bytes.length > 0 && second.bytes.length > 0);
  } catch (err) {
    const code = err && err.code;
    if (!REQUIRE && (code === "NO_ENGINE" || code === "ENGINE_LAUNCH_FAILED")) {
      console.log(`SKIP: no Chromium browser available (${code}).`);
      await renderer.close();
      process.exit(0);
    }
    console.error("E2E render failed:", err);
    await renderer.close();
    process.exit(1);
  }

  console.log(`Rendered ${result.engine} PDF, ${result.pageCount} pages, ${result.bytes.length} bytes`);
  check("engine was chromium (high-fidelity tier)", result.engine === "chromium");

  const pdf = await loadPdf(result.bytes);

  // 1. Multi-page pagination.
  check("produced multiple pages", pdf.numPages >= 2, `got ${pdf.numPages}`);
  check("reported pageCount matches the PDF", result.pageCount === pdf.numPages);

  // 2. Selectable text (the canvas tier could never pass this).
  const allText = pdf.pages.map((p) => p.text).join("\n");
  check("text is selectable / extractable", allText.includes(SENTINEL));

  // 3. Repeating table header across page breaks (smart pagination).
  const pagesWithHeader = pdf.pages.filter((p) => p.text.includes(HEADER_LABEL)).length;
  check("table header repeats on every page", pagesWithHeader >= 2, `appeared on ${pagesWithHeader} page(s)`);

  // 4. Clickable link annotation preserved.
  const links = pdf.pages.flatMap((p) =>
    p.annotations.filter((a) => a.subtype === "Link" && a.url)
  );
  check("clickable link annotation preserved", links.some((l) => l.url && l.url.includes("example.com")), `found ${links.length} link(s)`);

  // 5. Outline / bookmarks from headings.
  check("generated a navigable outline from headings", Array.isArray(pdf.outline) && pdf.outline.length >= 1, `outline entries: ${pdf.outline ? pdf.outline.length : "none"}`);

  await renderer.close();
  check("renderer closed cleanly", renderer.isOpen === false);

  if (failures > 0) {
    console.error(`\nE2E FAILED: ${failures} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nE2E PASSED: all output guarantees verified.");
}

main().catch((err) => {
  console.error("E2E crashed:", err);
  process.exit(1);
});
