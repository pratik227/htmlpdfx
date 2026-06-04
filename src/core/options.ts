import type {
  HtmlPdfxOptions,
  Length,
  Margin,
  Orientation,
  Unit,
} from "../types.js";
import { fail } from "../utils/errors.js";
import { toMm } from "../utils/units.js";
import {
  applyOrientation,
  resolveFormat,
  type ResolvedPageSize,
} from "./pagesize.js";

export interface NormalizedMargin {
  topMm: number;
  rightMm: number;
  bottomMm: number;
  leftMm: number;
}

/** Fully resolved, unit-free configuration consumed by engines. */
export interface NormalizedOptions {
  engine: NonNullable<HtmlPdfxOptions["engine"]>;
  unit: Unit;
  orientation: Orientation;
  page: ResolvedPageSize;
  margin: NormalizedMargin;
  pageBreak: {
    before: string[];
    after: string[];
    avoid: string[];
    mode: Array<"css" | "legacy" | "avoid-all">;
  };
  smartPagination: {
    repeatTableHeaders: boolean;
    avoidSplit: boolean;
    keepHeadingsWithContent: boolean;
    orphans: number;
    widows: number;
  } | null;
  header?: { template: string; heightMm?: number };
  footer?: { template: string; heightMm?: number };
  metadata: NonNullable<HtmlPdfxOptions["metadata"]>;
  baseUrl?: string;
  css?: string;
  canvas: {
    scale: number;
    imageType: "jpeg" | "png" | "webp";
    imageQuality: number;
    background?: string;
  };
  chromium: {
    mediaScreen: boolean;
    printBackground: boolean;
    waitUntil: "load" | "domcontentloaded" | "networkidle" | "fonts";
    scale: number;
    browser?: unknown;
    launchArgs: string[];
    driver?:
      | "puppeteer"
      | "puppeteer-core"
      | "playwright"
      | "playwright-core";
    executablePath?: string;
    timeout: number;
  };
  onProgress?: HtmlPdfxOptions["onProgress"];
  silent: boolean;
}

function normalizeMargin(margin: Margin | undefined, unit: Unit): NormalizedMargin {
  if (margin == null) {
    const d = toMm(10, "mm");
    return { topMm: d, rightMm: d, bottomMm: d, leftMm: d };
  }
  const m = (v: Length) => toMm(v, unit);

  if (Array.isArray(margin)) {
    if (margin.length === 2) {
      const [v, h] = margin;
      return { topMm: m(v), rightMm: m(h), bottomMm: m(v), leftMm: m(h) };
    }
    if (margin.length === 4) {
      const [t, r, b, l] = margin;
      return { topMm: m(t), rightMm: m(r), bottomMm: m(b), leftMm: m(l) };
    }
    fail(
      "INVALID_OPTIONS",
      `margin array must have 2 or 4 entries, got ${(margin as Length[]).length}`
    );
  }
  if (typeof margin === "object") {
    const d = toMm(0, unit);
    return {
      topMm: margin.top != null ? m(margin.top) : d,
      rightMm: margin.right != null ? m(margin.right) : d,
      bottomMm: margin.bottom != null ? m(margin.bottom) : d,
      leftMm: margin.left != null ? m(margin.left) : d,
    };
  }
  const v = m(margin);
  return { topMm: v, rightMm: v, bottomMm: v, leftMm: v };
}

function normalizeSmartPagination(
  sp: HtmlPdfxOptions["smartPagination"]
): NormalizedOptions["smartPagination"] {
  // Default: enabled with all behaviors on. `false` disables it entirely.
  if (sp === false) return null;
  const o = sp == null || sp === true ? {} : sp;
  return {
    repeatTableHeaders: o.repeatTableHeaders ?? true,
    avoidSplit: o.avoidSplit ?? true,
    keepHeadingsWithContent: o.keepHeadingsWithContent ?? true,
    orphans: o.orphans ?? 3,
    widows: o.widows ?? 3,
  };
}

export function normalizeOptions(opts: HtmlPdfxOptions = {}): NormalizedOptions {
  const unit: Unit = opts.unit ?? "mm";
  const orientation: Orientation = opts.orientation ?? "portrait";

  let page: ResolvedPageSize;
  if (opts.pageSize) {
    page = applyOrientation(
      toMm(opts.pageSize.width, unit),
      toMm(opts.pageSize.height, unit),
      orientation
    );
  } else {
    page = resolveFormat(opts.format ?? "a4", orientation);
  }

  const pb = opts.pageBreak ?? {};

  return {
    smartPagination: normalizeSmartPagination(opts.smartPagination),
    engine: opts.engine ?? "auto",
    unit,
    orientation,
    page,
    margin: normalizeMargin(opts.margin, unit),
    pageBreak: {
      before: pb.before ?? [],
      after: pb.after ?? [],
      avoid: pb.avoid ?? [],
      mode: pb.mode ?? ["css", "legacy"],
    },
    header: opts.header
      ? {
          template: opts.header.template,
          heightMm:
            opts.header.height != null ? toMm(opts.header.height, unit) : undefined,
        }
      : undefined,
    footer: opts.footer
      ? {
          template: opts.footer.template,
          heightMm:
            opts.footer.height != null ? toMm(opts.footer.height, unit) : undefined,
        }
      : undefined,
    metadata: opts.metadata ?? {},
    baseUrl: opts.baseUrl,
    css: opts.css,
    canvas: {
      scale: opts.canvas?.scale ?? 2,
      imageType: opts.canvas?.imageType ?? "jpeg",
      imageQuality: opts.canvas?.imageQuality ?? 0.95,
      background: opts.canvas?.background,
    },
    chromium: {
      mediaScreen: opts.chromium?.mediaScreen ?? false,
      printBackground: opts.chromium?.printBackground ?? true,
      waitUntil: opts.chromium?.waitUntil ?? "networkidle",
      scale: opts.chromium?.scale ?? 1,
      browser: opts.chromium?.browser,
      launchArgs: opts.chromium?.launchArgs ?? [],
      driver: opts.chromium?.driver,
      executablePath: opts.chromium?.executablePath,
      timeout: opts.chromium?.timeout ?? 30000,
    },
    onProgress: opts.onProgress,
    silent: opts.silent ?? false,
  };
}
