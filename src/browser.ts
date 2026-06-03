/**
 * Browser entry point.
 *
 * Identical public API to the main entry, but this build is what bundlers pick
 * up via the `browser` field — it never references Node built-ins, so it ships
 * clean to the web. In the browser the `auto` engine resolves to `canvas`
 * (the built-in renderer + PDF writer — no third-party dependencies).
 */
export * from "./index.js";
export { default } from "./index.js";
