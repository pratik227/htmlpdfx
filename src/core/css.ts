import { mmToIn } from "../utils/units.js";
import type { NormalizedOptions } from "./options.js";

/**
 * Build the CSS injected into the document before rendering.
 *
 * This is where reliable page breaks come from: we translate the user's
 * selectors into real CSS `break-*` rules (with legacy `page-break-*`
 * fallbacks) that a real layout engine honours, and we set an explicit
 * `@page` size so Chromium paginates to the exact paper we asked for.
 */
export function buildInjectedCss(opts: NormalizedOptions): string {
  const parts: string[] = [];

  // Exact page geometry for the chromium engine. Margins are handled by the
  // engine (so headers/footers can live in the margin box), so @page margin
  // is 0 here and content padding is applied separately when needed.
  const wIn = mmToIn(opts.page.widthMm).toFixed(4);
  const hIn = mmToIn(opts.page.heightMm).toFixed(4);
  parts.push(`@page { size: ${wIn}in ${hIn}in; margin: 0; }`);

  const { before, after, avoid, mode } = opts.pageBreak;

  if (before.length) {
    parts.push(
      `${before.join(", ")} { break-before: page; page-break-before: always; }`
    );
  }
  if (after.length) {
    parts.push(
      `${after.join(", ")} { break-after: page; page-break-after: always; }`
    );
  }
  if (avoid.length) {
    parts.push(
      `${avoid.join(", ")} { break-inside: avoid; page-break-inside: avoid; }`
    );
  }

  // Legacy `.html2pdf__page-break` break element (kept for easy migration).
  if (mode.includes("legacy")) {
    parts.push(
      `.html2pdf__page-break { break-after: page; page-break-after: always; display: block; height: 0; }`
    );
  }

  // "avoid-all": keep common atomic blocks from being split.
  if (mode.includes("avoid-all")) {
    parts.push(
      `tr, img, svg, canvas, figure, blockquote, pre, li, table, h1, h2, h3, h4, h5, h6 { break-inside: avoid; page-break-inside: avoid; }`
    );
  }

  // Smart pagination: zero-config print-CSS that fixes the most common
  // "my PDF looks wrong" problems. Enabled by default; fully tunable.
  const sp = opts.smartPagination;
  if (sp) {
    if (sp.repeatTableHeaders) {
      // Re-print table headers/footers on every page the table spans.
      parts.push(`thead { display: table-header-group; }`);
      parts.push(`tfoot { display: table-footer-group; }`);
    }
    if (sp.avoidSplit) {
      // Never slice these atomic blocks across a page boundary.
      parts.push(
        `tr, img, svg, canvas, figure, blockquote, pre, li { break-inside: avoid; page-break-inside: avoid; }`
      );
    }
    if (sp.keepHeadingsWithContent) {
      // A heading should never be the last thing on a page.
      parts.push(
        `h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; }`
      );
    }
    // Orphan/widow control for flowing text.
    parts.push(
      `p, li, blockquote { orphans: ${sp.orphans}; widows: ${sp.widows}; }`
    );
  }

  // Make backgrounds/colors print as authored (the #1 "colors missing" fix).
  parts.push(
    `* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`
  );

  if (opts.canvas.background) {
    parts.push(`html { background: ${opts.canvas.background}; }`);
  }

  if (opts.css) parts.push(opts.css);

  return parts.join("\n");
}

/** Wrap an injected stylesheet so it can be appended to <head>. */
export function styleTag(css: string): string {
  return `<style data-htmlpdfx="injected">\n${css}\n</style>`;
}
