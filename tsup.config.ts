import { defineConfig } from "tsup";

const engineExternals = [
  "puppeteer",
  "puppeteer-core",
  "playwright",
  "playwright-core",
  "react",
  "react-dom",
  "react-dom/server",
  "vue",
  "@vue/server-renderer",
];

const nodeBuiltins = ["node:fs/promises", "node:fs", "node:path", "node:url"];

export default defineConfig([
  // ESM + CJS package builds (consumed via `import`/`require` and bundlers).
  {
    entry: {
      index: "src/index.ts",
      browser: "src/browser.ts",
      react: "src/react.ts",
      vue: "src/vue.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    // Heavy engines are optional peer deps — never bundle them.
    external: [...engineExternals, ...nodeBuiltins],
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".js" };
    },
  },
  // Standalone UMD/IIFE global for direct <script> / CDN use in the browser.
  // Exposes `window.htmlpdfx`. Only the canvas engine ever runs here; the
  // Chromium/Node code path is dynamically imported and never reached in a
  // browser, so the Node built-ins below are safe to mark external.
  {
    entry: { htmlpdfx: "src/browser.ts" },
    format: ["iife"],
    globalName: "htmlpdfx",
    platform: "browser",
    dts: false,
    clean: false,
    sourcemap: true,
    minify: true,
    splitting: false,
    treeshake: true,
    external: [...engineExternals, ...nodeBuiltins],
    outExtension() {
      return { js: ".global.js" };
    },
  },
]);
