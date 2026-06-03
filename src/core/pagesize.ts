import type { Orientation, PageFormat } from "../types.js";

/** ISO/US paper sizes in millimetres, portrait orientation. */
export const PAGE_FORMATS_MM: Record<PageFormat, [number, number]> = {
  a0: [841, 1189],
  a1: [594, 841],
  a2: [420, 594],
  a3: [297, 420],
  a4: [210, 297],
  a5: [148, 210],
  a6: [105, 148],
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
  tabloid: [279.4, 431.8],
  ledger: [431.8, 279.4],
};

export interface ResolvedPageSize {
  /** width in mm (after orientation) */
  widthMm: number;
  /** height in mm (after orientation) */
  heightMm: number;
}

export function resolveFormat(
  format: PageFormat,
  orientation: Orientation
): ResolvedPageSize {
  const dims = PAGE_FORMATS_MM[format];
  if (!dims) {
    throw new Error(`Unknown page format: "${format}"`);
  }
  const [portW, portH] = dims;
  return orientation === "landscape"
    ? { widthMm: portH, heightMm: portW }
    : { widthMm: portW, heightMm: portH };
}

export function applyOrientation(
  widthMm: number,
  heightMm: number,
  orientation: Orientation
): ResolvedPageSize {
  const isLandscape = widthMm > heightMm;
  if (orientation === "landscape" && !isLandscape) {
    return { widthMm: heightMm, heightMm: widthMm };
  }
  if (orientation === "portrait" && isLandscape) {
    return { widthMm: heightMm, heightMm: widthMm };
  }
  return { widthMm, heightMm };
}
