/**
 * The two-tier capability matrix, as data.
 *
 * This is the single source of truth for what the docs claim each engine can
 * do. `key` points at the corresponding field on `engineCapabilities`
 * (src/core/capabilities.ts) where one exists, so the prose and the
 * machine-readable version can be checked against each other.
 *
 * Be honest here. A `partial` or `none` is useful information; overstating the
 * canvas tier is worse than admitting a gap.
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

export const CAPABILITIES: CapabilityGroup[] = [
  {
    group: "Text and vectors",
    items: [
      {
        title: "Selectable, searchable text",
        key: "selectableText",
        chromium: "full",
        canvas: "none",
        note: "The canvas tier rasterizes body text into the page image, so it can't be selected, searched, or copied.",
      },
      {
        title: "Vector graphics, crisp at any zoom",
        key: "vectorGraphics",
        chromium: "full",
        canvas: "none",
        note: "Canvas embeds a raster image, so zooming in shows pixels.",
      },
      {
        title: "Clickable links",
        key: "clickableLinks",
        chromium: "full",
        canvas: "none",
        note: "`<a href>` becomes a real PDF link annotation in Chromium; it's flattened into the image in canvas.",
      },
      {
        title: "Unicode and i18n",
        chromium: "full",
        canvas: "full",
        note: "Any glyph the browser can render. PDF strings are escaped safely in both tiers.",
      },
      {
        title: "RTL and bidirectional text",
        chromium: "full",
        canvas: "partial",
        note: "Chromium uses the real bidi engine. Canvas depends on what the host browser resolves before rasterizing.",
      },
    ],
  },
  {
    group: "Pagination",
    items: [
      {
        title: "Native CSS page breaks",
        key: "nativePageBreaks",
        chromium: "full",
        canvas: "partial",
        note: "`break-before`, `break-after`, `break-inside` and `@page` are honoured by a real layout engine in Chromium. Canvas approximates them with a measured slicer.",
      },
      {
        title: "Never splits an atomic block",
        chromium: "full",
        canvas: "full",
        note: "Both tiers back up to the top of a table row, card, or figure rather than cutting through it.",
      },
      {
        title: "Repeating table headers",
        key: "repeatTableHeaders",
        chromium: "full",
        canvas: "none",
        note: "`<thead>` repeats on every page a table spans — free in Chromium via `table-header-group`.",
      },
      {
        title: "No blank pages",
        chromium: "full",
        canvas: "full",
        note: "Page count is exactly `ceil(content / page)`, with no trailing blank.",
      },
      {
        title: "Headers and footers",
        key: "headerFooter",
        chromium: "full",
        canvas: "full",
        note: "`{{page}}`, `{{pages}}` and `{{title}}` tokens. Selectable text in Chromium; rasterized in canvas.",
      },
    ],
  },
  {
    group: "CSS and layout",
    items: [
      {
        title: "Modern CSS — grid, flexbox, oklch()",
        key: "fullCssSupport",
        chromium: "full",
        canvas: "partial",
        note: "Canvas depends on the host browser's `foreignObject` support for advanced CSS.",
      },
      {
        title: "Web fonts",
        chromium: "full",
        canvas: "full",
        note: "`document.fonts.ready` is awaited before rendering, and fonts are embedded.",
      },
      {
        title: "Background colours and images",
        chromium: "full",
        canvas: "full",
        note: "`print-color-adjust: exact` is forced, so backgrounds survive.",
      },
      {
        title: "Page size and orientation",
        chromium: "full",
        canvas: "full",
        note: "Never silently auto-flipped — an explicit custom size is preserved as given.",
      },
    ],
  },
  {
    group: "Document features",
    items: [
      {
        title: "Outline and bookmarks",
        chromium: "full",
        canvas: "none",
        note: "Generated from heading structure with `chromium: { outline: true }`.",
      },
      {
        title: "Tagged, accessible output (PDF/UA)",
        chromium: "full",
        canvas: "none",
        note: "On by default in the Chromium tier.",
      },
      {
        title: "Interactive form fields",
        chromium: "none",
        canvas: "none",
        note: "AcroForm widgets aren't implemented yet. Tracked on the roadmap.",
      },
      {
        title: "Password and encryption",
        chromium: "none",
        canvas: "none",
        note: "User and owner passwords and permission flags aren't implemented yet. Tracked on the roadmap.",
      },
    ],
  },
  {
    group: "Running it",
    items: [
      {
        title: "Runs server-side, headless",
        chromium: "full",
        canvas: "none",
        note: "The canvas tier needs a DOM, so it's browser-only.",
      },
      {
        title: "Runs in the browser",
        chromium: "none",
        canvas: "full",
        note: "Exactly the inverse — this is why `auto` picks per runtime.",
      },
      {
        title: "Warm-browser pooling",
        chromium: "full",
        canvas: "none",
        note: "`createRenderer()` keeps one browser open across renders.",
      },
      {
        title: "Configurable DPI and scale",
        chromium: "full",
        canvas: "full",
        note: "Canvas defaults to 2× device scale.",
      },
      {
        title: "No install required",
        chromium: "partial",
        canvas: "full",
        note: "Puppeteer ships as an optional dependency, so Chromium arrives with it — but it is a download. The canvas tier needs nothing.",
      },
    ],
  },
];

/** The two tiers, for headers and badges. */
export const TIERS = {
  chromium: {
    label: "Chromium",
    tier: "High fidelity",
    icon: "chromium" as const,
    blurb: "The browser's own print-to-PDF. The PDF is the webpage.",
  },
  canvas: {
    label: "Canvas",
    tier: "Best effort",
    icon: "canvas" as const,
    blurb: "A zero-dependency DOM rasterizer for browser-only builds.",
  },
};
