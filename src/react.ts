/**
 * htmlpdfx/react — render a React element to a PDF on the server.
 *
 * ```ts
 * import { toPdfFromReact } from "htmlpdfx/react";
 * import Invoice from "./Invoice";
 *
 * const pdf = await toPdfFromReact(<Invoice order={order} />, {
 *   format: "a4",
 *   footer: { template: "Page {{page}} / {{pages}}" },
 * });
 * await pdf.save("invoice.pdf");
 * ```
 *
 * `react` and `react-dom` are **optional peer dependencies** — only needed if
 * you import this entry point.
 */

import type { HtmlPdfxOptions, PdfResult } from "./types.js";
import { toPdf } from "./index.js";
import { wrapHtmlDocument } from "./core/template.js";
import { requirePeer } from "./core/peer.js";

export interface ReactPdfOptions extends HtmlPdfxOptions {
  /** Markup injected into `<head>` (e.g. `<style>`/font links) when the
   *  element doesn't render a full document. */
  head?: string;
  /** Document language attribute. Default `"en"`. */
  lang?: string;
}

/** Server-render a React element to static HTML, then to a PDF. */
export async function toPdfFromReact(
  element: unknown,
  options: ReactPdfOptions = {}
): Promise<PdfResult> {
  const mod = await requirePeer<{
    renderToStaticMarkup?: (el: unknown) => string;
    default?: { renderToStaticMarkup?: (el: unknown) => string };
  }>("react-dom/server", "toPdfFromReact");

  const renderToStaticMarkup =
    mod.renderToStaticMarkup ?? mod.default?.renderToStaticMarkup;
  if (typeof renderToStaticMarkup !== "function") {
    throw new Error(
      "htmlpdfx/react: could not find renderToStaticMarkup in react-dom/server."
    );
  }

  const { head, lang, ...pdfOptions } = options;
  const body = renderToStaticMarkup(element);
  const html = wrapHtmlDocument(body, { head, lang });
  return toPdf({ html, baseUrl: pdfOptions.baseUrl }, pdfOptions);
}
