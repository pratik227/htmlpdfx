# Options

Every option, with its default. Options are validated and normalised before an engine sees them, so an invalid page size or margin fails immediately rather than producing a strange PDF.

```ts
interface HtmlPdfxOptions {
  engine?: "auto" | "chromium" | "canvas";   // default "auto"
  format?: "a0".."a6" | "letter" | "legal" | "tabloid" | "ledger"; // default "a4"
  pageSize?: { width: Length; height: Length }; // overrides format
  orientation?: "portrait" | "landscape";    // default "portrait"
  unit?: "mm" | "cm" | "in" | "pt" | "px";    // default "mm"
  margin?: Margin;                            // default 10mm
  pageBreak?: PageBreakOptions;
  smartPagination?: boolean | SmartPaginationOptions; // default true
  header?: { template: string; height?: Length };
  footer?: { template: string; height?: Length };
  metadata?: { title?; author?; subject?; keywords?: string[]; creator? };
  baseUrl?: string;                           // resolve relative assets
  css?: string;                               // extra CSS injected last
  canvas?: CanvasEngineOptions;
  chromium?: ChromiumEngineOptions;
  onProgress?: (e: ProgressEvent) => void;
  silent?: boolean;
}
```

`Length` is a number (in the active `unit`) or a string like `"15mm"`, `"1in"`,
`"96px"`.

## Margin

```ts
margin: 10                       // all sides
margin: [10, 20]                 // [vertical, horizontal]
margin: [10, 20, 10, 20]         // [top, right, bottom, left]
margin: { top: 25, bottom: 20 }  // per side
```

## PageBreakOptions

```ts
interface PageBreakOptions {
  before?: string[];   // break-before: page
  after?: string[];    // break-after: page
  avoid?: string[];    // break-inside: avoid
  mode?: ("css" | "legacy" | "avoid-all")[]; // default ["css","legacy"]
}
```

## SmartPaginationOptions

Zero-config print-CSS, on by default. Pass `false` to disable, or tune:

```ts
interface SmartPaginationOptions {
  repeatTableHeaders?: boolean;       // <thead>/<tfoot> on every page (default true)
  avoidSplit?: boolean;               // don't split rows/images/figures (default true)
  keepHeadingsWithContent?: boolean;  // headings not stranded (default true)
  orphans?: number;                   // min lines kept at page bottom (default 3)
  widows?: number;                    // min lines carried to next page (default 3)
}
```

## CanvasEngineOptions (browser)

```ts
interface CanvasEngineOptions {
  scale?: number;            // default 2 (device px)
  imageType?: "jpeg" | "png" | "webp"; // default "jpeg"
  imageQuality?: number;     // 0–1, default 0.95
  background?: string;       // default white
}
```

## ChromiumEngineOptions (Node/Bun)

```ts
interface ChromiumEngineOptions {
  mediaScreen?: boolean;     // default false (print media)
  printBackground?: boolean; // default true
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "fonts"; // default "networkidle"
  scale?: number;            // 0.1–2, default 1
  browser?: Browser;         // reuse an existing instance
  launchArgs?: string[];
  driver?: "puppeteer" | "puppeteer-core" | "playwright" | "playwright-core";
  executablePath?: string;
  timeout?: number;          // ms, default 30000
  outline?: boolean;         // bookmarks from headings, default false
  tagged?: boolean;          // accessible (PDF/UA-style) output, default true
}
```

## createRenderer (server pooling)

Keep one Chromium browser warm and reuse it across renders (~10× throughput):

```ts
import { createRenderer } from "htmlpdfx";

const renderer = await createRenderer(baseOptions?);
await renderer.warmup();                       // optional eager launch
const pdf = await renderer.toPdf(input, perCallOptions?);
renderer.isOpen;                               // boolean
await renderer.close();                        // free the browser
```
