/**
 * Types for capabilities.js.
 *
 * The data lives in plain ESM rather than TypeScript so that both the Vue
 * components and the plain-Node docs generator (scripts/gen-llms.mjs) can
 * import it without a compile step — the generator runs on Node 20, which
 * can't strip types.
 */

/** full = works properly · partial = best effort · none = not supported */
export type Support = "full" | "partial" | "none";

export interface Capability {
  title: string;
  /** Field on `engineCapabilities`, when this row has a code equivalent. */
  key?: string;
  chromium: Support;
  canvas: Support;
  /** Why the two tiers differ. Shown under the row title. */
  note: string;
}

export interface CapabilityGroup {
  group: string;
  items: Capability[];
}

export const CAPABILITIES: CapabilityGroup[];

export const TIERS: Record<
  "chromium" | "canvas",
  { label: string; tier: string; icon: "chromium" | "canvas"; blurb: string }
>;
