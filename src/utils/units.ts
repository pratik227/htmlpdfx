import type { Length, Unit } from "../types.js";

/** Conversion factors to millimetres (the internal canonical unit). */
const MM_PER_UNIT: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72, // 1pt = 1/72in
  px: 25.4 / 96, // CSS reference pixel: 96px = 1in
};

const UNIT_RE = /^(-?\d*\.?\d+)\s*(mm|cm|in|pt|px)?$/i;

/** Parse a Length into millimetres, using `defaultUnit` for bare numbers. */
export function toMm(value: Length, defaultUnit: Unit): number {
  if (typeof value === "number") {
    return value * MM_PER_UNIT[defaultUnit];
  }
  const match = UNIT_RE.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid length: "${value}"`);
  }
  const num = Number.parseFloat(match[1]!);
  const unit = (match[2]?.toLowerCase() as Unit | undefined) ?? defaultUnit;
  return num * MM_PER_UNIT[unit];
}

export function mmToUnit(mm: number, unit: Unit): number {
  return mm / MM_PER_UNIT[unit];
}

export function mmToPx(mm: number): number {
  return mm / MM_PER_UNIT.px;
}

export function mmToIn(mm: number): number {
  return mm / MM_PER_UNIT.in;
}

export function mmToPt(mm: number): number {
  return mm / MM_PER_UNIT.pt;
}
