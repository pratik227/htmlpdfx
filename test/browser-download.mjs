/**
 * Drive the browser examples with Playwright and verify each one actually
 * downloads a valid PDF — proving htmlpdfx works client-side via a UMD global,
 * an ES-module import map, and from React- and Vue-rendered DOM.
 *
 * Run: `npm run build && npm run test:browser-download`
 * In CI set `HTMLPDFX_BROWSER_REQUIRE=1` so a missing browser is a failure.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REQUIRE = process.env.HTMLPDFX_BROWSER_REQUIRE === "1";

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".map": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split("?")[0]));
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const PAGES = [
  { name: "UMD global", url: "/examples/browser/umd.html" },
  { name: "ESM import map", url: "/examples/browser.html" },
  { name: "Vue (ESM)", url: "/examples/browser/vue.html" },
  { name: "React (UMD)", url: "/examples/browser/react.html" },
];

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  server.close();
  if (!REQUIRE) {
    console.log(`SKIP: could not launch Chromium (${err.code || err.message}).`);
    process.exit(0);
  }
  console.error("Failed to launch Chromium:", err);
  process.exit(1);
}

let failures = 0;
for (const p of PAGES) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  try {
    await page.goto(base + p.url, { waitUntil: "networkidle" });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.click("#download, #go"),
    ]);
    const path = await download.path();
    const bytes = await readFile(path);
    const header = bytes.subarray(0, 5).toString("latin1");
    const ok = header === "%PDF-" && bytes.length > 1000;
    if (ok) {
      console.log(`  ✓ ${p.name}: downloaded ${download.suggestedFilename()} (${bytes.length} bytes)`);
    } else {
      failures++;
      console.error(`  ✗ ${p.name}: invalid PDF (header="${header}", ${bytes.length} bytes)`);
    }
  } catch (err) {
    failures++;
    console.error(`  ✗ ${p.name}: ${err.message}`);
    if (errors.length) console.error(`      page errors: ${errors.join(" | ")}`);
  } finally {
    await ctx.close();
  }
}

await browser.close();
server.close();

if (failures > 0) {
  console.error(`\nBROWSER DOWNLOAD FAILED: ${failures}/${PAGES.length} page(s) failed.`);
  process.exit(1);
}
console.log("\nBROWSER DOWNLOAD PASSED: every example produced a valid PDF.");
