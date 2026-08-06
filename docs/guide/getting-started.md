# Getting started

Install, render, save. On Node and Bun you get the high-fidelity Chromium engine without a second step; in the browser there's nothing extra to install at all.

<Steps>

<Step title="Install">

```bash
npm i htmlpdfx
```

On **Node** and **Bun** this also brings [Puppeteer](https://pptr.dev) — which bundles Chromium — as an **optional** dependency, so <EngineBadge engine="chromium" /> works out of the box.

Because it's optional, the install stays resilient: if the Chromium download is unavailable (CI caches, offline, browser-only targets), `npm i htmlpdfx` still succeeds and the built-in renderer is used instead.

Prefer a different driver? Install one and htmlpdfx detects it automatically:

```bash
npm i playwright        # or: playwright-core / puppeteer-core
```

</Step>

<Step title="Render your first PDF">

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

</Step>

<Step title="Take the bytes wherever you need them">

Every render returns a `PdfResult`, so the same call works for a file, an HTTP response, or a download:

```ts
const pdf = await toPdf(html);

pdf.bytes; // Uint8Array
pdf.pageCount; // number of pages
pdf.engine; // "chromium" | "canvas" — which tier actually ran

await pdf.save("out.pdf"); // Node / Bun: write to disk
await pdf.download("out.pdf"); // Browser: trigger a download
pdf.toBlob(); // Blob
pdf.toDataUrl(); // data: URL
pdf.toArrayBuffer(); // ArrayBuffer
```

</Step>

</Steps>

<Callout type="note" title="No required runtime dependencies">

The PDF writer and the DOM rasterizer are written from scratch and ship inside the package — no `jspdf`, no `html2canvas`. The Chromium engine is purely additive.

</Callout>

## Inputs

Pass a string, a URL, a file, or a live DOM node. The input decides which engines can serve it:

```ts
toPdf("<h1>hi</h1>"); // HTML string          — either engine
toPdf({ html, baseUrl: "https://cdn.example.com/" }); // HTML + base URL      — either engine
toPdf({ url: "https://example.com" }); // live URL             — chromium
toPdf({ file: "/abs/report.html" }); // local file           — chromium
toPdf({ element: domNode }); // DOM node             — canvas (browser)
```

## Runtime support

| Runtime   | Default engine | Needs                       |
| --------- | -------------- | --------------------------- |
| Node ≥ 18 | `chromium`     | `puppeteer` or `playwright` |
| Bun       | `chromium`     | `puppeteer` or `playwright` |
| Browser   | `canvas`       | nothing (built in)          |

Force one with `{ engine: "chromium" }` or `{ engine: "canvas" }`; the default `auto` picks per runtime.

## Without a bundler

A prebuilt UMD/IIFE global ships in the package and is served by the CDNs, so the browser needs no npm at all:

```html
<!-- Global build → window.htmlpdfx -->
<script src="https://unpkg.com/htmlpdfx"></script>
<script>
  htmlpdfx
    .toPdf(document.getElementById("invoice"))
    .then((pdf) => pdf.download("invoice.pdf"));
</script>

<!-- …or ES modules straight from a CDN -->
<script type="module">
  import { toPdf } from "https://esm.sh/htmlpdfx";
</script>
```

<Callout type="warning" title="The browser build is the canvas tier">

No Chromium means no vector text: body text is rasterized into the page image, so it can't be selected or searched. For selectable output, render server-side. See [what each engine supports](/capabilities).

</Callout>

## Next

<CardGroup :cols="3">

<Card title="Choose an engine" icon="engines" href="/guide/engines">

How `auto` decides, and when to override it.

</Card>

<Card title="Page breaks" icon="breaks" href="/guide/page-breaks">

Forced breaks, and blocks that must stay whole.

</Card>

<Card title="Headers & footers" icon="headers" href="/guide/headers-footers">

Page numbers and repeating furniture.

</Card>

</CardGroup>
