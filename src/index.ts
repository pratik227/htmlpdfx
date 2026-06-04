/**
 * htmlpdfx — modern HTML-to-PDF for JS & TS across Node, Bun, and the browser.
 *
 * @example Functional
 * ```ts
 * import { toPdf } from "htmlpdfx";
 * const pdf = await toPdf("<h1>Hi</h1>", { format: "a4", margin: 15 });
 * await pdf.save("out.pdf");
 * ```
 *
 * @example Fluent (html2pdf.js-style)
 * ```ts
 * import htmlpdfx from "htmlpdfx";
 * await htmlpdfx().from(el).set({ margin: 10 }).save("out.pdf");
 * ```
 */

import type {
  EngineName,
  HtmlPdfxInput,
  HtmlPdfxOptions,
  PageFormat,
  PdfResult,
} from "./types.js";
import { render } from "./core/render.js";
import { isBrowserRuntime } from "./runtime.js";

export type * from "./types.js";
export { HtmlPdfxError } from "./utils/errors.js";
export type { ErrorCode } from "./utils/errors.js";
export { computePageSlices } from "./core/paginate.js";
export { engineCapabilities, describeEngines } from "./core/capabilities.js";
export type { EngineId, EngineCapability } from "./core/capabilities.js";
export { createRenderer } from "./server/renderer.js";
export type { PdfRenderer } from "./server/renderer.js";
export { detectRuntime } from "./runtime.js";
// Low-level building blocks (advanced / zero-dependency usage).
export { PdfWriter, PdfPage } from "./pdf/writer.js";
export type { EmbeddableImage, JpegImage, FlateRgbImage } from "./pdf/writer.js";
export { renderDomToImage, rasterizeElement } from "./dom/rasterize.js";

/** Primary functional API: render `input` to a PDF result handle. */
export function toPdf(
  input: HtmlPdfxInput,
  options?: HtmlPdfxOptions
): Promise<PdfResult> {
  return render(input, options);
}

/** Reusable option presets for common documents. */
export const presets = {
  /** A4 portrait, comfortable margins, print backgrounds. */
  document: {
    format: "a4",
    orientation: "portrait",
    margin: 15,
    chromium: { printBackground: true },
  } satisfies HtmlPdfxOptions,
  /** Edge-to-edge, no margins — good for full-bleed designs/tickets. */
  fullBleed: {
    margin: 0,
    chromium: { printBackground: true },
  } satisfies HtmlPdfxOptions,
  /** US Letter report with page numbers in the footer. */
  report: {
    format: "letter",
    margin: { top: 25, bottom: 25, left: 18, right: 18 },
    footer: { template: "Page {{page}} / {{pages}}", height: 12 },
  } satisfies HtmlPdfxOptions,
} as const;

/**
 * Fluent builder. Chainable and awaitable; mirrors the html2pdf.js surface so
 * existing code ports with minimal changes.
 */
export class HtmlPdfxBuilder implements PromiseLike<PdfResult> {
  #input: HtmlPdfxInput | undefined;
  #options: HtmlPdfxOptions = {};

  /** Set the source (HTML string, URL, `{html}`, `{url}`, `{file}`, `{element}`). */
  from(input: HtmlPdfxInput, options?: HtmlPdfxOptions): this {
    this.#input = input;
    if (options) Object.assign(this.#options, options);
    return this;
  }

  /** Merge options. */
  set(options: HtmlPdfxOptions): this {
    Object.assign(this.#options, options);
    return this;
  }

  /** Force a specific engine. */
  using(engine: EngineName): this {
    this.#options.engine = engine;
    return this;
  }

  /** Shortcut for `set({ format })`. */
  to(format: PageFormat): this {
    this.#options.format = format;
    return this;
  }

  /** Execute and return the result handle. */
  render(): Promise<PdfResult> {
    if (this.#input == null) {
      return Promise.reject(
        new Error("htmlpdfx: call .from(input) before rendering.")
      );
    }
    return render(this.#input, this.#options);
  }

  then<T1 = PdfResult, T2 = never>(
    onfulfilled?: ((v: PdfResult) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return this.render().then(onfulfilled, onrejected);
  }

  catch<T = never>(
    onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null
  ): Promise<PdfResult | T> {
    return this.render().catch(onrejected);
  }

  /**
   * Save the PDF. In Node/Bun writes to `target` (path). In the browser this
   * triggers a download named `target` — matching html2pdf.js semantics.
   */
  async save(target = "document.pdf"): Promise<PdfResult> {
    const result = await this.render();
    if (isBrowserRuntime()) await result.download(target);
    else await result.save(target);
    return result;
  }

  /** Trigger a browser download (or write to disk in Node/Bun). */
  async download(filename = "document.pdf"): Promise<PdfResult> {
    const result = await this.render();
    await result.download(filename);
    return result;
  }

  /** html2pdf.js-style output. `type`: `arraybuffer` | `blob` | `datauristring` | `bytes`. */
  async output(
    type: "arraybuffer" | "blob" | "datauristring" | "bytes" = "bytes"
  ): Promise<ArrayBuffer | Blob | string | Uint8Array> {
    const result = await this.render();
    switch (type) {
      case "arraybuffer":
        return result.toArrayBuffer();
      case "blob":
        return result.toBlob();
      case "datauristring":
        return result.toDataUrl();
      default:
        return result.toBuffer();
    }
  }
}

/** Create a fluent builder. Optionally seed it with input/options. */
export function htmlpdfx(
  input?: HtmlPdfxInput,
  options?: HtmlPdfxOptions
): HtmlPdfxBuilder {
  const b = new HtmlPdfxBuilder();
  if (input != null) b.from(input, options);
  return b;
}

/** Drop-in alias for teams migrating from html2pdf.js. */
export const html2pdf = htmlpdfx;

export default htmlpdfx;
