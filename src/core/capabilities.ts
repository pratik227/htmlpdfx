/**
 * A truthful, machine-readable description of what each rendering engine can
 * and cannot do. htmlpdfx has two tiers and they are *not* equivalent — being
 * explicit about that is the point. Use this to drive docs, feature flags, or
 * a runtime warning when a feature a user asked for isn't supported by the
 * engine that will actually run.
 */

export type EngineId = "chromium" | "canvas";

export interface EngineCapability {
  engine: EngineId;
  /**
   * `high-fidelity` — the real browser layout/print engine. The PDF *is* the
   * webpage. `best-effort` — a DOM rasterizer; a faithful screenshot, but not
   * a true reflow.
   */
  tier: "high-fidelity" | "best-effort";
  /** Real, selectable/searchable vector text (not a flattened image). */
  selectableText: boolean;
  /** Crisp vector graphics at any zoom. */
  vectorGraphics: boolean;
  /** `<a href>` preserved as clickable PDF link annotations. */
  clickableLinks: boolean;
  /** Native CSS pagination (`break-*`, `@page`) honored by a layout engine. */
  nativePageBreaks: boolean;
  /** `<thead>`/`<tfoot>` repeat on every page a table spans. */
  repeatTableHeaders: boolean;
  /** Full modern CSS: flexbox, grid, custom properties, modern color spaces. */
  fullCssSupport: boolean;
  /** Repeating page header/footer with `{{page}}` / `{{pages}}` tokens. */
  headerFooter: boolean;
  /** Runtimes this engine runs in. */
  runsIn: string[];
  /** What must be present for this engine to be selected. */
  requires: string;
  /** Plain-language summary, including honest limitations. */
  notes: string;
}

export const engineCapabilities: Record<EngineId, EngineCapability> = {
  chromium: {
    engine: "chromium",
    tier: "high-fidelity",
    selectableText: true,
    vectorGraphics: true,
    clickableLinks: true,
    nativePageBreaks: true,
    repeatTableHeaders: true,
    fullCssSupport: true,
    headerFooter: true,
    runsIn: ["node", "bun", "deno"],
    requires: "a Chromium driver (puppeteer — bundled — or playwright)",
    notes:
      "The browser's own print-to-PDF. Output matches the webpage because it " +
      "is rendered by the same engine. Recommended for anything user-facing.",
  },
  canvas: {
    engine: "canvas",
    tier: "best-effort",
    selectableText: false,
    vectorGraphics: false,
    clickableLinks: false,
    nativePageBreaks: true, // via the measured slicer, not a layout engine
    repeatTableHeaders: false,
    fullCssSupport: false,
    headerFooter: true,
    runsIn: ["browser"],
    requires: "a DOM (browser only); no extra install",
    notes:
      "A zero-dependency DOM rasterizer for when Chromium isn't available. " +
      "Body text is rasterized (not selectable), links are flattened, and very " +
      "advanced CSS may differ. Great as a graceful fallback, not a replacement.",
  },
};

/**
 * Human-readable, one-line summary of the two tiers — handy for logs/CLIs.
 */
export function describeEngines(): string {
  return (
    "chromium (high-fidelity: selectable text, links, native breaks, repeat " +
    "table headers) · canvas (best-effort: rasterized fallback, browser-only)"
  );
}
