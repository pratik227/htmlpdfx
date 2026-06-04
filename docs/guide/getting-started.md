# Getting started

## Install

```bash
npm i htmlpdfx
```

On **Node / Bun**, this also pulls in [Puppeteer](https://pptr.dev) (which bundles
Chromium) as an **optional dependency** — so the high-fidelity engine (selectable
text, perfect CSS, native page breaks) works out of the box with no extra step.

The install is resilient: Puppeteer is *optional*, so if its Chromium download is
unavailable (CI caches, offline, or browser-only targets) `npm i htmlpdfx` still
succeeds and the built-in renderer is used instead.

```bash
# Node / Bun — Chromium ships by default via the optional puppeteer dependency.
# Nothing else to install.

# Prefer Playwright or a system Chrome instead? Install one of these and
# htmlpdfx will detect and use it automatically:
npm i playwright          # or: playwright-core / puppeteer-core

# Browser — nothing to install; the built-in renderer is used.
```

> The **core has no required runtime dependencies** — the PDF writer and DOM
> rasterizer are built in. The Chromium engine is purely additive.

### Without a bundler (CDN / `<script>`)

A prebuilt UMD/IIFE global ships in the package and is served by the CDNs:

```html
<!-- Global build → window.htmlpdfx -->
<script src="https://unpkg.com/htmlpdfx"></script>
<script>
  htmlpdfx.toPdf(document.getElementById("invoice")).then((pdf) =>
    pdf.download("invoice.pdf")
  );
</script>

<!-- …or ES modules straight from a CDN -->
<script type="module">
  import { toPdf } from "https://esm.sh/htmlpdfx";
</script>
```

The browser build uses the self-contained canvas engine — no Chromium, no
install.

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
