/**
 * htmlpdfx/vue — render a Vue component to a PDF on the server.
 *
 * ```ts
 * import { toPdfFromVue } from "htmlpdfx/vue";
 * import Invoice from "./Invoice.vue";
 *
 * const pdf = await toPdfFromVue(Invoice, {
 *   props: { order },
 *   format: "a4",
 *   footer: { template: "Page {{page}} / {{pages}}" },
 * });
 * await pdf.save("invoice.pdf");
 * ```
 *
 * `vue` and `@vue/server-renderer` are **optional peer dependencies** — only
 * needed if you import this entry point.
 */

import type { HtmlPdfxOptions, PdfResult } from "./types.js";
import { toPdf } from "./index.js";
import { wrapHtmlDocument } from "./core/template.js";
import { requirePeer } from "./core/peer.js";

export interface VuePdfOptions extends HtmlPdfxOptions {
  /** Props passed to the root component. */
  props?: Record<string, unknown>;
  /** Markup injected into `<head>` (e.g. `<style>`/font links). */
  head?: string;
  /** Document language attribute. Default `"en"`. */
  lang?: string;
}

/** Server-render a Vue component to HTML, then to a PDF. */
export async function toPdfFromVue(
  component: unknown,
  options: VuePdfOptions = {}
): Promise<PdfResult> {
  const vue = await requirePeer<{
    createSSRApp?: (comp: unknown, props?: Record<string, unknown>) => unknown;
  }>("vue", "toPdfFromVue");
  const renderer = await requirePeer<{
    renderToString?: (app: unknown) => Promise<string>;
  }>("@vue/server-renderer", "toPdfFromVue");

  if (typeof vue.createSSRApp !== "function") {
    throw new Error("htmlpdfx/vue: could not find createSSRApp in vue.");
  }
  if (typeof renderer.renderToString !== "function") {
    throw new Error(
      "htmlpdfx/vue: could not find renderToString in @vue/server-renderer."
    );
  }

  const { props, head, lang, ...pdfOptions } = options;
  const app = vue.createSSRApp(component, props);
  const body = await renderer.renderToString(app);
  const html = wrapHtmlDocument(body, { head, lang });
  return toPdf({ html, baseUrl: pdfOptions.baseUrl }, pdfOptions);
}
