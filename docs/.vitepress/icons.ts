/**
 * Icons for the docs site — Solar (https://icon-sets.iconify.design/solar/)
 * via Iconify, inlined at build time.
 *
 * Nothing is fetched at runtime: the SVGs are resolved during the Vite build
 * and shipped as markup. That keeps the docs working offline and under a strict
 * CSP, which feels right for a library that ships no runtime dependencies.
 *
 * Docs and components refer to icons by *role* ("engines", "warning"), never by
 * Solar's name, so an icon can be re-pointed in one place without touching a
 * single page.
 */
import { createRequire } from "node:module";
import type { Plugin } from "vite";
import {
  getIconData,
  iconToSVG,
  iconToHTML,
  replaceIDs,
} from "@iconify/utils";

// createRequire rather than a JSON import: this module is loaded by the
// VitePress config in plain Node, where JSON import assertions are still fussy.
const require = createRequire(import.meta.url);
const solar = require("@iconify-json/solar/icons.json");

/** Role -> Solar icon name (minus the `solar:` prefix). */
export const ICONS = {
  // Sidebar and navigation
  start: "rocket-2-linear",
  engines: "cpu-bolt-linear",
  breaks: "scissors-linear", // a page, cut
  headers: "notes-linear",
  frameworks: "widget-5-linear",
  compatibility: "global-linear",
  architecture: "structure-linear",
  migration: "transfer-horizontal-linear",
  api: "code-square-linear",
  options: "tuning-2-linear",
  result: "file-check-linear",
  capabilities: "checklist-minimalistic-linear",

  // Callouts
  note: "info-circle-linear",
  tip: "lightbulb-bolt-linear",
  warning: "danger-triangle-linear",
  danger: "shield-warning-linear",

  // Engine tiers — a real browser, and a raster image
  chromium: "global-linear",
  canvas: "gallery-linear",

  // Support marks
  yes: "check-circle-linear",
  partial: "minus-circle-linear",
  no: "close-circle-linear",

  // Utility
  copy: "copy-linear",
  check: "check-circle-linear",
  node: "server-2-linear",
  browser: "monitor-smartphone-linear",
  doc: "document-text-linear",
  layers: "layers-minimalistic-linear",
  search: "magnifer-linear",
  arrow: "arrow-right-linear",
  bolt: "bolt-linear",
  print: "printer-2-linear",
  text: "text-square-linear",
  link: "link-round-angle-linear",
  pen: "pen-linear",
} as const;

export type IconRole = keyof typeof ICONS;

/** Resolve a role (or a raw `solar:name`) to an inline `<svg>` string. */
export function iconSvg(
  name: IconRole | string,
  { size = "1em", cls = "hpx-icon" }: { size?: string; cls?: string } = {},
): string {
  const solarName =
    (ICONS as Record<string, string>)[name] ?? name.replace(/^solar:/, "");
  const data = getIconData(solar, solarName);
  if (!data) {
    throw new Error(
      `Unknown Solar icon: "${name}" (resolved to "${solarName}"). ` +
        `Add it to ICONS in docs/.vitepress/icons.ts, and check the name at ` +
        `https://icon-sets.iconify.design/solar/`,
    );
  }
  const { attributes, body } = iconToSVG(data, { height: size });
  return iconToHTML(replaceIDs(body), {
    ...attributes,
    class: cls,
    "aria-hidden": "true",
  });
}

/**
 * A sidebar label: icon + text. VitePress renders sidebar `text` with v-html
 * (VPSidebarItem.vue), which is what lets an icon live in there at all.
 */
export function navItem(icon: IconRole, text: string) {
  return `<span class="hpx-nav-item">${iconSvg(icon)}<span>${text}</span></span>`;
}

/** Every registered icon as role -> svg, for the client bundle. */
export function iconMap(): Record<string, string> {
  return Object.fromEntries(
    Object.keys(ICONS).map((role) => [role, iconSvg(role as IconRole)]),
  );
}

/**
 * Serves the resolved icon set to client components as `virtual:hpx-icons`.
 * Build-time only — no Iconify code reaches the browser.
 */
export function hpxIcons(): Plugin {
  const ID = "virtual:hpx-icons";
  const RESOLVED = "\0" + ID;
  return {
    name: "hpx-icons",
    resolveId(id) {
      return id === ID ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      return `export default ${JSON.stringify(iconMap())}`;
    },
  };
}
