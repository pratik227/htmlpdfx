/**
 * Crawl the built docs site with Playwright and verify every internal link
 * resolves (no 404s). Usage: serve the built site, then:
 *   BASE=http://localhost:4173 node test/check-links.mjs
 */
import { chromium } from "playwright";

const BASE = (process.env.BASE || "http://localhost:4173").replace(/\/$/, "");

const browser = await chromium.launch();
const page = await browser.newPage();

const seen = new Set();
const queue = ["/"];
const broken = [];
const statusCache = new Map();

function normalize(href) {
  try {
    const u = new URL(href, BASE);
    if (u.origin !== new URL(BASE).origin) return null; // external — skip
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

async function statusOf(path) {
  if (statusCache.has(path)) return statusCache.get(path);
  const res = await page.request.get(BASE + path);
  statusCache.set(path, res.status());
  return res.status();
}

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);

  const status = await statusOf(path);
  if (status >= 400) {
    broken.push({ path, status, from: "(queued)" });
    continue;
  }

  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    const norm = normalize(href);
    if (norm === null) continue; // external
    const s = await statusOf(norm);
    if (s >= 400) {
      broken.push({ path: norm, status: s, from: path });
    } else if (!seen.has(norm)) {
      queue.push(norm);
    }
  }
}

await browser.close();

console.log(`Checked ${seen.size} pages, ${statusCache.size} unique links.`);
if (broken.length) {
  console.error(`\n✗ ${broken.length} broken link(s):`);
  for (const b of broken) console.error(`  ${b.status}  ${b.path}   (linked from ${b.from})`);
  process.exit(1);
}
console.log("✓ All internal links resolve.");
