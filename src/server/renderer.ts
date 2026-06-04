/**
 * A long-lived PDF renderer that keeps one Chromium browser warm and reuses it
 * across many renders. Launching Chromium costs ~300–700ms; reusing a warm
 * browser drops per-render overhead to tens of milliseconds — typically a
 * ~10× throughput win for servers generating many PDFs.
 *
 * ```ts
 * import { createRenderer } from "htmlpdfx";
 *
 * const renderer = await createRenderer({ format: "a4" });
 * try {
 *   const a = await renderer.toPdf("<h1>One</h1>");
 *   const b = await renderer.toPdf("<h1>Two</h1>", { landscape: true });
 *   await a.save("a.pdf");
 *   await b.save("b.pdf");
 * } finally {
 *   await renderer.close();
 * }
 * ```
 *
 * Server runtimes only (Node/Bun/Deno).
 */

import type { HtmlPdfxInput, HtmlPdfxOptions, PdfResult } from "../types.js";
import { render } from "../core/render.js";
import { normalizeOptions } from "../core/options.js";
import { launchChromiumBrowser } from "../engine/chromium.js";

export interface PdfRenderer {
  /** Render an input to PDF using the warm browser. Accepts per-call options. */
  toPdf(input: HtmlPdfxInput, options?: HtmlPdfxOptions): Promise<PdfResult>;
  /** Eagerly launch the browser (otherwise it launches on first render). */
  warmup(): Promise<void>;
  /** Whether the browser is currently launched. */
  readonly isOpen: boolean;
  /** Close the browser and free resources. Safe to call more than once. */
  close(): Promise<void>;
}

function mergeOptions(
  base: HtmlPdfxOptions,
  perCall: HtmlPdfxOptions,
  browser: unknown
): HtmlPdfxOptions {
  return {
    ...base,
    ...perCall,
    // Always use the warm browser via the chromium engine.
    engine: "chromium",
    chromium: { ...base.chromium, ...perCall.chromium, browser },
  };
}

/**
 * Create a renderer backed by a single warm Chromium browser. `baseOptions`
 * apply to every render and can be overridden per call.
 */
export async function createRenderer(
  baseOptions: HtmlPdfxOptions = {}
): Promise<PdfRenderer> {
  let browser: any = null;
  let closing: Promise<void> | null = null;

  async function ensureBrowser(): Promise<any> {
    if (browser) return browser;
    const launched = await launchChromiumBrowser(normalizeOptions(baseOptions));
    browser = launched.browser;
    return browser;
  }

  const renderer: PdfRenderer = {
    get isOpen() {
      return browser != null;
    },
    async warmup() {
      await ensureBrowser();
    },
    async toPdf(input, options = {}) {
      const b = await ensureBrowser();
      return render(input, mergeOptions(baseOptions, options, b));
    },
    async close() {
      if (closing) return closing;
      if (!browser) return;
      const b = browser;
      browser = null;
      closing = (async () => {
        try {
          await b.close();
        } finally {
          closing = null;
        }
      })();
      return closing;
    },
  };

  return renderer;
}
