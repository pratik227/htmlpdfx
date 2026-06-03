import type { Engine, EngineRenderResult } from "./types.js";
import type { NormalizedOptions } from "../core/options.js";
import type { ResolvedInput } from "../core/input.js";
import { buildInjectedCss } from "../core/css.js";
import { computePageSlices, type AvoidRange } from "../core/paginate.js";
import { fail } from "../utils/errors.js";
import { isBrowserRuntime } from "../runtime.js";
import { mmToPt, mmToPx } from "../utils/units.js";
import { PdfWriter, type EmbeddableImage } from "../pdf/writer.js";
import { renderDomToImage } from "../dom/rasterize.js";
import { dataUrlToBytes } from "../dom/svg.js";
import { expandTemplate } from "../core/template.js";
import { resolveImageType, canExportForeignObject } from "../dom/capabilities.js";

/** CSS reference: 96px = 1in = 25.4mm. */
const MM_PER_PX = 25.4 / 96;
const mmToPxCss = (mm: number) => mm / MM_PER_PX;

/**
 * Browser engine. Fully self-contained: it rasterizes the DOM with our own
 * SVG-foreignObject renderer and assembles the PDF with our own writer — no
 * html2canvas, no jsPDF.
 */
export const canvasEngine: Engine = {
  name: "canvas",

  async isAvailable(): Promise<boolean> {
    return isBrowserRuntime() && typeof document !== "undefined";
  },

  async render(
    input: ResolvedInput,
    opts: NormalizedOptions
  ): Promise<EngineRenderResult> {
    if (!isBrowserRuntime() || typeof document === "undefined") {
      fail(
        "UNSUPPORTED_RUNTIME",
        "The canvas engine only runs in a browser.",
        "Use the chromium engine in Node/Bun."
      );
    }

    if (!(await canExportForeignObject())) {
      fail(
        "RENDER_FAILED",
        "This browser taints the canvas when rasterizing the DOM (known WebKit/Safari limitation with foreignObject).",
        "Render server-side with the chromium engine, or pre-rasterize via the print dialog."
      );
    }

    // Pick an image format this browser can actually export (Safari ≠ webp).
    const imageType = resolveImageType(opts.canvas.imageType);

    const { element, cleanup } = mountInput(input, opts);
    try {
      const contentWidthMm =
        opts.page.widthMm - opts.margin.leftMm - opts.margin.rightMm;
      const contentHeightMm =
        opts.page.heightMm - opts.margin.topMm - opts.margin.bottomMm;
      const widthPx = Math.round(mmToPxCss(contentWidthMm));

      const { image, widthPx: laidWidth, heightPx } = await renderDomToImage(
        element,
        {
          scale: opts.canvas.scale,
          widthPx,
          background: opts.canvas.background ?? "#ffffff",
        }
      );

      // Page-break geometry, in *scaled* device px to match the slicer.
      const scale = opts.canvas.scale;
      const totalPx = heightPx * scale;
      const pagePx = mmToPxCss(contentHeightMm) * scale;
      const breaks = collectBreakOffsets(element, opts).map((p) => p * scale);
      const avoid = collectAvoidRanges(element, opts).map((r) => ({
        start: r.start * scale,
        end: r.end * scale,
      }));

      const slices = computePageSlices({ totalPx, pagePx, breaks, avoid });

      const doc = new PdfWriter({
        title: opts.metadata.title,
        author: opts.metadata.author,
        subject: opts.metadata.subject,
        keywords: opts.metadata.keywords?.join(", "),
        creator: opts.metadata.creator,
      });

      const pageWidthPt = mmToPt(opts.page.widthMm);
      const pageHeightPt = mmToPt(opts.page.heightMm);
      const contentWidthPt = mmToPt(contentWidthMm);
      const marginLeftPt = mmToPt(opts.margin.leftMm);
      const marginTopPt = mmToPt(opts.margin.topMm);

      const mime = `image/${imageType}`;
      slices.forEach((slice, i) => {
        const page = doc.addPage(pageWidthPt, pageHeightPt);
        const sliceScaledPx = slice.end - slice.start;
        if (sliceScaledPx > 0) {
          const band = document.createElement("canvas");
          band.width = Math.max(1, Math.round(laidWidth * scale));
          band.height = Math.max(1, Math.ceil(sliceScaledPx));
          const ctx = band.getContext("2d")!;
          ctx.fillStyle = opts.canvas.background ?? "#ffffff";
          ctx.fillRect(0, 0, band.width, band.height);
          // Draw the matching CSS-px band of the source image into the band.
          ctx.drawImage(
            image,
            0,
            slice.start / scale,
            laidWidth,
            sliceScaledPx / scale,
            0,
            0,
            band.width,
            band.height
          );

          const embeddable = encodeBand(band, ctx, imageType, mime, opts.canvas.imageQuality);
          const bandHeightPt = (sliceScaledPx / scale) * 0.75; // cssPx → pt
          page.drawImage(embeddable, marginLeftPt, marginTopPt, contentWidthPt, bandHeightPt);
        }

        stampHeaderFooter(page, opts, i + 1, slices.length, pageHeightPt);
      });

      return { bytes: doc.toBytes(), pageCount: slices.length };
    } finally {
      cleanup();
    }
  },
};

interface Mounted {
  element: HTMLElement;
  cleanup: () => void;
}

function mountInput(input: ResolvedInput, opts: NormalizedOptions): Mounted {
  const contentWidthMm =
    opts.page.widthMm - opts.margin.leftMm - opts.margin.rightMm;
  const widthPx = Math.round(mmToPxCss(contentWidthMm));

  if (input.kind === "element") {
    return { element: input.element as HTMLElement, cleanup: () => {} };
  }
  if (input.kind === "url" || input.kind === "file") {
    fail(
      "INVALID_INPUT",
      "The canvas engine cannot navigate to URLs.",
      "Fetch the HTML yourself and pass { html }, or use the chromium engine."
    );
  }

  const host = document.createElement("div");
  host.setAttribute("data-htmlpdfx-host", "");
  host.style.cssText = `position:fixed; left:-99999px; top:0; width:${widthPx}px; background:${opts.canvas.background ?? "#ffffff"};`;
  host.innerHTML = input.html;

  const style = document.createElement("style");
  style.textContent = buildInjectedCss(opts);
  host.appendChild(style);

  document.body.appendChild(host);
  return { element: host, cleanup: () => host.remove() };
}

function stampHeaderFooter(
  page: ReturnType<PdfWriter["addPage"]>,
  opts: NormalizedOptions,
  pageNum: number,
  pageTotal: number,
  pageHeightPt: number
): void {
  const expand = (tpl: string) =>
    expandTemplate(tpl, {
      page: pageNum,
      pages: pageTotal,
      title: opts.metadata.title,
    });

  if (opts.header) {
    page.drawText(expand(opts.header.template), mmToPt(opts.margin.leftMm), mmToPt(opts.margin.topMm) * 0.6, {
      size: 9,
      color: [0.3, 0.3, 0.3],
    });
  }
  if (opts.footer) {
    page.drawText(
      expand(opts.footer.template),
      mmToPt(opts.margin.leftMm),
      pageHeightPt - mmToPt(opts.margin.bottomMm) * 0.4,
      { size: 9, color: [0.3, 0.3, 0.3] }
    );
  }
}

function collectBreakOffsets(root: HTMLElement, opts: NormalizedOptions): number[] {
  const offsets: number[] = [];
  const rootTop = root.getBoundingClientRect().top;

  const beforeSel = [...opts.pageBreak.before];
  const afterSel = [...opts.pageBreak.after];
  if (opts.pageBreak.mode.includes("legacy")) beforeSel.push(".html2pdf__page-break");

  for (const sel of beforeSel) {
    safeQuery(root, sel).forEach((el) => {
      offsets.push(el.getBoundingClientRect().top - rootTop);
    });
  }
  for (const sel of afterSel) {
    safeQuery(root, sel).forEach((el) => {
      offsets.push(el.getBoundingClientRect().bottom - rootTop);
    });
  }
  return offsets.filter((o) => o > 0);
}

function collectAvoidRanges(root: HTMLElement, opts: NormalizedOptions): AvoidRange[] {
  const ranges: AvoidRange[] = [];
  const rootTop = root.getBoundingClientRect().top;
  const selectors = [...opts.pageBreak.avoid];
  if (opts.pageBreak.mode.includes("avoid-all")) {
    selectors.push("tr", "img", "table", "figure", "li", "h1", "h2", "h3", "pre", "blockquote");
  }
  for (const sel of selectors) {
    safeQuery(root, sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      ranges.push({ start: r.top - rootTop, end: r.bottom - rootTop });
    });
  }
  return ranges;
}

/** Encode a page band into an embeddable PDF image (cross-browser). */
function encodeBand(
  band: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imageType: "jpeg" | "png" | "webp",
  mime: string,
  quality: number
): EmbeddableImage {
  if (imageType === "jpeg") {
    return {
      format: "jpeg",
      bytes: dataUrlToBytes(band.toDataURL(mime, quality)),
      pxWidth: band.width,
      pxHeight: band.height,
    };
  }
  // Lossless path: embed raw RGB (drop alpha onto the white-filled band).
  const { data } = ctx.getImageData(0, 0, band.width, band.height);
  const rgb = new Uint8Array(band.width * band.height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i]!;
    rgb[j + 1] = data[i + 1]!;
    rgb[j + 2] = data[i + 2]!;
  }
  return { format: "raw-rgb", bytes: rgb, pxWidth: band.width, pxHeight: band.height };
}

function safeQuery(root: HTMLElement, selector: string): HTMLElement[] {
  try {
    return Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  } catch {
    return [];
  }
}
