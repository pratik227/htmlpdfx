# htmlpdfx

> Modern HTML → PDF for JavaScript & TypeScript. One unified API across **Node**, **Bun**, and the **browser**.

`htmlpdfx` is built around a simple idea: use a **real browser engine** when one is available (Node/Bun) for **selectable vector text, perfect CSS (flex/grid/web fonts), and native page breaks**; and in the browser, use a **fully self-contained renderer + PDF writer** (no third-party dependencies). One unified API, the best engine for each runtime.

```ts
import { toPdf } from "htmlpdfx";

const pdf = await toPdf("<h1>Hello</h1>", { format: "a4", margin: 15 });
await pdf.save("hello.pdf");          // Node / Bun
// pdf.download("hello.pdf")          // Browser
// pdf.toBuffer() / toBlob() / toDataUrl()
```

## What you get

| Capability | htmlpdfx |
| --- | --- |
| Selectable text | **Vector, selectable text** (chromium engine) |
| Page breaks | Real CSS `break-*` + a measured slicer that **never cuts atomic blocks** |
| Large documents | Paginated natively / sliced safely — no blank pages |
| Modern CSS | flexbox, grid, web fonts, `oklch()`/`lab()` colors |
| Images & fonts | Every `<img>` and `document.fonts` awaited before render |
| Fit to page | Content reflows to the printable width |
| One runtime API | **Node, Bun, browser** |
| Dependencies | **Zero** runtime deps (Puppeteer/Playwright optional, server only) |

## Install

```bash
npm i htmlpdfx
```

**No required runtime dependencies.** The PDF writer and the DOM rasterizer are
written from scratch and ship inside the package — no `jspdf`, no `html2canvas`.

- **Node / Bun** → [Puppeteer](https://pptr.dev) (bundles Chromium) is installed
  automatically as an **optional dependency**, so the high-fidelity engine
  (selectable vector text, perfect CSS, native page breaks) works out of the box.
- **Browser** → nothing else to install; the built-in renderer is used.

Because Puppeteer is *optional*, `npm i htmlpdfx` still succeeds if its Chromium
download is unavailable (CI, offline, browser-only) — htmlpdfx falls back to the
built-in renderer. Prefer a different driver? Install one and it's auto-detected:

```bash
npm i playwright        # or: playwright-core / puppeteer-core
```

### Without a bundler (CDN / `<script>`)

In the browser you don't need npm at all. A prebuilt **UMD/IIFE global** ships
in the package and is served by the CDNs, exposing `window.htmlpdfx`:

```html
<script src="https://unpkg.com/htmlpdfx"></script>
<!-- or: https://cdn.jsdelivr.net/npm/htmlpdfx -->
<script>
  // `htmlpdfx` is the global namespace; use any export off it.
  const { toPdf } = htmlpdfx;
  toPdf(document.getElementById("invoice"), { margin: 12 })
    .then((pdf) => pdf.download("invoice.pdf"));

  // Fluent / html2pdf.js style is on the factory export:
  // htmlpdfx.htmlpdfx().from(el).save("invoice.pdf");
</script>
```

Prefer modern ES modules straight from a CDN — no build step, no global:

```html
<script type="module">
  import { toPdf } from "https://esm.sh/htmlpdfx";
  const pdf = await toPdf(document.getElementById("invoice"));
  await pdf.download("invoice.pdf");
</script>
```

> The browser build uses the self-contained canvas engine (no Chromium). For
> selectable text / vector output, render server-side with the Chromium engine.

## Two APIs

**Functional:**

```ts
import { toPdf } from "htmlpdfx";
const pdf = await toPdf({ url: "https://example.com" }, { format: "letter" });
```

**Fluent (drop-in for html2pdf.js users):**

```ts
import htmlpdfx from "htmlpdfx";

await htmlpdfx()
  .from(document.getElementById("invoice"))
  .set({ margin: 10, pageBreak: { avoid: [".row"] } })
  .save("invoice.pdf");
```

> `html2pdf` is exported as an alias of `htmlpdfx` to ease migration.

## Page breaks that actually work

```ts
await toPdf(html, {
  pageBreak: {
    before: [".chapter"],     // start each chapter on a new page
    avoid:  [".card", "tr"],  // never split these across pages
    mode:   ["css", "legacy"] // honour CSS break-* and .html2pdf__page-break
  },
});
```

## Inputs

A string of HTML, a URL, or a descriptor:

```ts
toPdf("<h1>hi</h1>");
toPdf({ html: "<h1>hi</h1>", baseUrl: "https://cdn.example.com/" });
toPdf({ url: "https://example.com" });   // chromium engine
toPdf({ file: "/abs/path/report.html" }); // chromium engine
toPdf({ element: domNode });              // canvas engine (browser)
```

## Runtime & engine support

| Runtime | Default engine | Needs |
| --- | --- | --- |
| Node ≥18 | `chromium` | `puppeteer` or `playwright` |
| Bun | `chromium` | `puppeteer` or `playwright` |
| Browser | `canvas` | nothing (built-in) |

Force one with `{ engine: "chromium" | "canvas" }`.

## Cross-platform & cross-browser

Verified in CI on **Ubuntu, Windows, and macOS** (Node 18/20/22 + Bun), and the
browser renderer is tested in **Chromium (Chrome/Edge), Firefox, and WebKit
(Safari)** via Playwright — each produces a valid multi-page PDF.

```bash
npm test            # unit + issue-coverage suite (Node/Bun)
npm run test:browser # Chromium + Firefox + WebKit rendering
```

## Docs

Full guide, API reference, and a migration guide live in the VitePress site:

```bash
npm run docs:dev
```

## License

MIT © Pratik Patel
