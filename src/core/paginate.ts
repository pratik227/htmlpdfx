/**
 * Pure pagination math shared by the canvas engine.
 *
 * Given the total content height, the usable height per page, a set of forced
 * break offsets, and "avoid" ranges that must not be split, compute the slice
 * boundaries for each page.
 *
 * Forced breaks end a page exactly where requested, and a page never ends in
 * the middle of an atomic block — it backs up to the block's top instead.
 */

export interface AvoidRange {
  /** inclusive start offset (px) */
  start: number;
  /** exclusive end offset (px) */
  end: number;
}

export interface Slice {
  start: number;
  end: number;
}

export interface PaginateInput {
  /** total rendered height in px */
  totalPx: number;
  /** usable content height per page in px (must be > 0) */
  pagePx: number;
  /** forced break offsets (px), e.g. break-before/after element tops */
  breaks?: number[];
  /** ranges that must not be split across a page boundary */
  avoid?: AvoidRange[];
}

export function computePageSlices(input: PaginateInput): Slice[] {
  const { totalPx, pagePx } = input;
  if (pagePx <= 0) throw new Error("pagePx must be > 0");
  if (totalPx <= 0) return [{ start: 0, end: 0 }];

  const breaks = [...(input.breaks ?? [])]
    .filter((b) => b > 0 && b < totalPx)
    .sort((a, b) => a - b);
  const avoid = [...(input.avoid ?? [])].sort((a, b) => a.start - b.start);

  const slices: Slice[] = [];
  let start = 0;
  // Hard cap to avoid pathological infinite loops.
  const maxPages = Math.ceil(totalPx / pagePx) + breaks.length + 2;

  while (start < totalPx && slices.length < maxPages) {
    const naturalEnd = start + pagePx;

    if (naturalEnd >= totalPx) {
      slices.push({ start, end: totalPx });
      break;
    }

    let end = naturalEnd;

    // 1) Forced break: end the page at the last forced break within this window.
    const forced = lastBreakWithin(breaks, start, naturalEnd);
    if (forced != null) {
      end = forced;
    } else {
      // 2) Avoid: if the natural cut lands inside an atomic block, back up to
      //    the block's top — but only if that still makes forward progress.
      const blocking = avoid.find(
        (r) => r.start > start && r.start < naturalEnd && naturalEnd < r.end
      );
      if (blocking) end = blocking.start;
    }

    // Safety: never produce a zero/negative-height page (block taller than a
    // page, or a break exactly at `start`) — fall back to a full page.
    if (end <= start) end = naturalEnd;

    slices.push({ start, end });
    start = end;
  }

  return slices;
}

function lastBreakWithin(
  breaks: number[],
  start: number,
  end: number
): number | null {
  let found: number | null = null;
  for (const b of breaks) {
    if (b > start && b <= end) found = b;
    else if (b > end) break;
  }
  return found;
}
