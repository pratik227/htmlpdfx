# Architecture

htmlpdfx is intentionally small and layered. The **core has zero runtime
dependencies** — both the PDF writer and the DOM rasterizer are written from
scratch and live in the package.

```
toPdf(input, options)
        │
   normalizeOptions ──► one canonical, unit-free config (mm internally)
        │
   resolveInput ──────► { html | url | file | element }
        │
   selectEngine ──────► auto → chromium (server) | canvas (browser)
        │
   ┌────┴───────────────────────────────┐
   │ chromium engine                     │ canvas engine (browser)
   │  • puppeteer / playwright           │  • renderDomToImage (SVG foreignObject)
   │  • page.pdf() — vector text         │  • computePageSlices  (page breaks)
   │  • native CSS page breaks           │  • PdfWriter          (own PDF writer)
   └────┬───────────────────────────────┘
        │
   PdfResult ─────────► bytes / save / download / toBlob / toDataUrl
```

## Why not jsPDF + html2canvas?

Those libraries rasterize HTML into a single image, which is the root cause of
most of their bugs: non-selectable text, blank pages past the canvas size
limit, ignored page breaks, dropped modern CSS. htmlpdfx instead:

- uses a **real browser** when one is available (vector output, real CSS); and
- in the browser, ships its **own** renderer + PDF writer so there are no heavy
  peer dependencies to install, mismatch, or break on new CSS features.

## Modules

| Module                  | Responsibility                                            |
| ----------------------- | --------------------------------------------------------- |
| `core/options.ts`       | Normalize options → canonical mm-based config             |
| `core/pagesize.ts`      | Paper sizes + orientation                                 |
| `core/paginate.ts`      | Page-break-aware slicing (pure, fully tested)             |
| `core/css.ts`           | Injected `@page` + `break-*` + color-adjust CSS           |
| `core/template.ts`      | Header/footer token expansion                             |
| `pdf/writer.ts`         | Dependency-free PDF writer (images, text, metadata)       |
| `dom/rasterize.ts`      | DOM → image via SVG `foreignObject` (browser)             |
| `engine/chromium.ts`    | Puppeteer/Playwright engine                               |
| `engine/canvas.ts`      | Built-in browser engine                                   |

## Building blocks are exported

Advanced users can use the primitives directly:

```ts
import { PdfWriter, renderDomToImage, computePageSlices } from "htmlpdfx";
```
