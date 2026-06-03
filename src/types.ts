/**
 * Public type definitions for htmlpdfx.
 *
 * Each option targets a concrete HTML-to-PDF concern: reliable page breaks,
 * no blank pages, full CSS support, awaited images, content that fits the
 * page width, and selectable text.
 */

/** Named paper sizes (case-insensitive). */
export type PageFormat =
  | "a0"
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6"
  | "letter"
  | "legal"
  | "tabloid"
  | "ledger";

export type Orientation = "portrait" | "landscape";

export type Unit = "mm" | "cm" | "in" | "pt" | "px";

/** A length expressed as a number (in the active unit) or a CSS-style string. */
export type Length = number | `${number}${Unit}` | `${number}`;

/** Margin can be uniform, or per-side. */
export type Margin =
  | Length
  | [Length, Length]
  | [Length, Length, Length, Length]
  | {
      top?: Length;
      right?: Length;
      bottom?: Length;
      left?: Length;
    };

/** Explicit page dimensions, overriding `format`. */
export interface PageSize {
  width: Length;
  height: Length;
}

/**
 * Which rendering engine to use.
 * - `auto` (default): pick the best engine available in the current runtime.
 * - `chromium`: real browser via Puppeteer/Playwright (vector text, perfect CSS).
 * - `canvas`: browser-only built-in rasterizer + PDF writer (no deps).
 */
export type EngineName = "auto" | "chromium" | "canvas";

/**
 * Page-break behaviour. Maps cleanly to CSS `break-*`, and is enforced by the
 * measured slicer in the browser engine.
 */
export interface PageBreakOptions {
  /** CSS selectors that should start on a new page (`break-before: page`). */
  before?: string[];
  /** CSS selectors that should force a page break after (`break-after: page`). */
  after?: string[];
  /** CSS selectors that must not be split across pages (`break-inside: avoid`). */
  avoid?: string[];
  /**
   * Convenience modes:
   * - `css`: honour existing CSS `break-*` / legacy `page-break-*` rules.
   * - `legacy`: honour `.html2pdf__page-break` elements.
   * - `avoid-all`: never split common block elements (tables, figures, li, …).
   */
  mode?: Array<"css" | "legacy" | "avoid-all">;
}

/** Header/footer rendered on every page (chromium engine). */
export interface HeaderFooterOptions {
  /** HTML template. Supports `{{page}}`, `{{pages}}`, `{{title}}`, `{{date}}`. */
  template: string;
  /** Height reserved for it, in the active unit. */
  height?: Length;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}

/** Options for the canvas (browser-only) engine. */
export interface CanvasEngineOptions {
  /** Device pixel scale for rasterization. Higher = sharper but larger. Default 2. */
  scale?: number;
  /** Image format embedded into the PDF. Default `jpeg` for smaller files. */
  imageType?: "jpeg" | "png" | "webp";
  /** JPEG/WEBP quality 0–1. Default 0.95. */
  imageQuality?: number;
  /** Background color when the source has none (avoids transparent→black). */
  background?: string;
}

/** Options for the chromium (Puppeteer/Playwright) engine. */
export interface ChromiumEngineOptions {
  /** Emulate screen instead of print media. Default false (print media). */
  mediaScreen?: boolean;
  /** Print background graphics/colors. Default true. */
  printBackground?: boolean;
  /** Wait condition before printing. Default `networkidle`. */
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "fonts";
  /** CSS scale of the webpage rendering. 0.1–2. Default 1. */
  scale?: number;
  /** Reuse an existing puppeteer/playwright Browser instance. */
  browser?: unknown;
  /** Extra launch args (e.g. `--no-sandbox`). */
  launchArgs?: string[];
  /** Force a specific driver instead of auto-detecting. */
  driver?: "puppeteer" | "puppeteer-core" | "playwright" | "playwright-core";
  /** Path to a Chromium executable (for *-core drivers). */
  executablePath?: string;
  /** Per-render navigation/render timeout in ms. Default 30000. */
  timeout?: number;
}

/** Full options accepted by every entry point. */
export interface HtmlPdfxOptions {
  /** Rendering engine. Default `auto`. */
  engine?: EngineName;
  /** Paper size. Default `a4`. Ignored if `pageSize` is set. */
  format?: PageFormat;
  /** Explicit page dimensions (wins over `format`). */
  pageSize?: PageSize;
  /** Page orientation. Default `portrait`. */
  orientation?: Orientation;
  /** Unit used for numeric `margin`, `pageSize`, etc. Default `mm`. */
  unit?: Unit;
  /** Page margins. Default `10mm`. */
  margin?: Margin;
  /** Page-break control. */
  pageBreak?: PageBreakOptions;
  /** Repeating header (chromium engine). */
  header?: HeaderFooterOptions;
  /** Repeating footer (chromium engine). */
  footer?: HeaderFooterOptions;
  /** Document metadata embedded in the PDF. */
  metadata?: PdfMetadata;
  /** Base URL used to resolve relative asset paths in HTML strings. */
  baseUrl?: string;
  /** Extra CSS injected into the document before rendering. */
  css?: string;
  /** Engine-specific tuning. */
  canvas?: CanvasEngineOptions;
  chromium?: ChromiumEngineOptions;
  /** Receive diagnostic logs (page count, chosen engine, timings, warnings). */
  onProgress?: (event: ProgressEvent) => void;
  /** Suppress all console warnings. Default false. */
  silent?: boolean;
}

export interface ProgressEvent {
  stage:
    | "resolve-input"
    | "select-engine"
    | "prepare"
    | "render"
    | "paginate"
    | "finalize";
  message: string;
  /** 0–1 when known. */
  progress?: number;
  detail?: Record<string, unknown>;
}

/**
 * Accepted input forms:
 * - HTML string
 * - URL string (`http(s)://` or `file://`)
 * - `{ html }` / `{ url }` / `{ file }` descriptor
 * - a DOM `Element` (browser only)
 */
export type HtmlPdfxInput =
  | string
  | { html: string; baseUrl?: string }
  | { url: string }
  | { file: string }
  | { element: unknown };

/** The result handle returned by every render. */
export interface PdfResult {
  /** Raw PDF bytes. */
  bytes: Uint8Array;
  /** Number of pages in the produced PDF. */
  pageCount: number;
  /** Engine that produced this PDF. */
  engine: Exclude<EngineName, "auto">;
  /** Render wall-time in ms. */
  durationMs: number;
  /** Write to disk (Node/Bun) — throws in the browser. */
  save(path: string): Promise<void>;
  /** Trigger a browser download (browser) or write to disk (Node/Bun). */
  download(filename?: string): Promise<void>;
  /** Get bytes as a Node/Bun Buffer-like Uint8Array. */
  toBuffer(): Uint8Array;
  /** Browser Blob (throws outside the browser). */
  toBlob(): Blob;
  /** `data:application/pdf;base64,…` data URL. */
  toDataUrl(): string;
  /** ArrayBuffer view of the bytes. */
  toArrayBuffer(): ArrayBuffer;
}
