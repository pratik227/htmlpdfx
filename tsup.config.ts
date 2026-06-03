import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    browser: "src/browser.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // Heavy engines are optional peer deps — never bundle them.
  external: [
    "puppeteer",
    "puppeteer-core",
    "playwright",
    "playwright-core",
    "node:fs/promises",
    "node:fs",
    "node:path",
    "node:url",
  ],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
