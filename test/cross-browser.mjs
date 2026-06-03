/**
 * Cross-browser verification: runs the browser harness in Chromium, Firefox,
 * and WebKit (the Safari engine) and asserts each produces a valid multi-page
 * PDF with the built-in canvas engine.
 *
 *   node test/cross-browser.mjs
 *
 * Requires: npm i -D playwright && npx playwright install
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".map": "application/json" };

const server = createServer(async (req, res) => {
  try {
    const url = (req.url || "/").split("?")[0];
    const file = join(root, url);
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const engines = [
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
];

let failures = 0;
for (const [name, type] of engines) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/test/browser-harness.html`, { waitUntil: "load" });
    const result = await page.evaluate(async () => await window.__run());
    const r = result.canvasEngine;
    const ok = r && r.ok && r.pageCount >= 1 && r.header === "%PDF-1.7";
    console.log(
      `${ok ? "✅" : "❌"} ${name.padEnd(9)} engine=${r?.engine} pages=${r?.pageCount} bytes=${r?.bytes} ${r?.error ? "ERR=" + r.error : ""}`
    );
    if (!ok) failures++;
  } catch (e) {
    console.log(`❌ ${name.padEnd(9)} threw: ${e.message}`);
    failures++;
  } finally {
    await browser.close();
  }
}

server.close();
if (failures) {
  console.error(`\n${failures} browser(s) failed`);
  process.exit(1);
}
console.log("\n✅ All browsers produced a valid PDF");
