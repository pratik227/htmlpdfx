# Getting started

## Install

```bash
npm i htmlpdfx
```

The **core has no runtime dependencies** — the PDF writer and the DOM rasterizer
are built in. You only add an engine when you want the high-fidelity path:

```bash
# Node / Bun — real Chromium: selectable text, perfect CSS, native page breaks
npm i puppeteer          # bundles Chromium
# or
npm i playwright

# Browser — nothing to install; the built-in renderer is used
```

## Your first PDF

::: code-group

```ts [Node / Bun]
import { toPdf } from "htmlpdfx";

const pdf = await toPdf("<h1>Hello</h1>", { format: "a4", margin: 15 });
await pdf.save("hello.pdf");
```

```ts [Browser]
import { toPdf } from "htmlpdfx";

const pdf = await toPdf(
  { element: document.getElementById("invoice")! },
  { format: "a4", margin: 12 },
);
await pdf.download("invoice.pdf");
```

```ts [Fluent / html2pdf.js style]
import htmlpdfx from "htmlpdfx";

await htmlpdfx()
  .from(document.getElementById("invoice")!)
  .set({ margin: 10, pageBreak: { avoid: [".row"] } })
  .save("invoice.pdf");
```

:::

## Inputs

```ts
toPdf("<h1>hi</h1>");                                  // HTML string
toPdf({ html, baseUrl: "https://cdn.example.com/" });  // HTML + base URL
toPdf({ url: "https://example.com" });                  // live URL  (chromium)
toPdf({ file: "/abs/report.html" });                    // local file (chromium)
toPdf({ element: domNode });                            // DOM node  (browser)
```

## Getting the bytes

Every render returns a `PdfResult`:

```ts
const pdf = await toPdf(html);

pdf.bytes;            // Uint8Array
pdf.pageCount;        // number of pages
pdf.engine;           // "chromium" | "canvas"
await pdf.save("out.pdf");      // Node/Bun: write to disk
await pdf.download("out.pdf");  // Browser: trigger download
pdf.toBlob();         // browser Blob
pdf.toDataUrl();      // data: URL
pdf.toArrayBuffer();  // ArrayBuffer
```

## Runtime support

| Runtime    | Default engine | Needs                         |
| ---------- | -------------- | ----------------------------- |
| Node ≥ 18  | `chromium`     | `puppeteer` or `playwright`   |
| Bun        | `chromium`     | `puppeteer` or `playwright`   |
| Browser    | `canvas`       | nothing (built-in)            |
