#!/usr/bin/env node
/**
 * Makes the docs readable by coding agents (Claude Code, Codex, Grok, Cursor…).
 *
 * Runs after `vitepress build` and writes into the built site:
 *
 *   /llms.txt        an index — titles, one-line summaries, and links
 *   /llms-full.txt   every page's prose in one file, for a single fetch
 *   /<path>.md       each page's markdown source, beside its HTML
 *
 * Why: an agent asked "does htmlpdfx support selectable text in the browser?"
 * should be able to read the answer instead of guessing from an older library's
 * API. Rendered HTML is a poor source — nav chrome, no code fences — so we ship
 * the markdown as well.
 *
 * The capability matrix is a Vue component fed from data, so it wouldn't appear
 * in the markdown at all. It gets rendered into a real table here; otherwise
 * llms-full.txt would silently omit the 23 rows agents most need.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");
const outDir = join(docsDir, ".vitepress", "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/** Every markdown page, excluding VitePress internals. */
function pages(dir = docsDir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".vitepress" || entry === "public" || entry === "node_modules") continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) pages(abs, acc);
    else if (entry.endsWith(".md")) acc.push(abs);
  }
  return acc;
}

/** `docs/guide/engines.md` -> `/guide/engines` */
const routeOf = (abs) =>
  "/" + relative(docsDir, abs).split(sep).join("/").replace(/(index)?\.md$/, "").replace(/\/$/, "");

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data, body: src.slice(m[0].length) };
}

/** The capability matrix as markdown, so agents see the real support table. */
async function capabilityTable() {
  const { CAPABILITIES, TIERS } = await import(
    join(docsDir, ".vitepress", "data", "capabilities.js")
  );
  const mark = { full: "yes", partial: "partial", none: "no" };
  const out = [
    `Support per engine. "partial" means best-effort, not broken.`,
    "",
    `| Capability | ${TIERS.chromium.label} (${TIERS.chromium.tier}) | ${TIERS.canvas.label} (${TIERS.canvas.tier}) | Notes |`,
    "| --- | --- | --- | --- |",
  ];
  for (const group of CAPABILITIES) {
    out.push(`| **${group.group}** | | | |`);
    for (const c of group.items) {
      const note = c.note.replace(/\|/g, "\\|");
      out.push(`| ${c.title} | ${mark[c.chromium]} | ${mark[c.canvas]} | ${note} |`);
    }
  }
  return out.join("\n");
}

/** Strip the bits that are markup rather than meaning. */
function toPlainMarkdown(body, matrix) {
  return body
    // Component slots: keep the contents, drop the tags.
    .replace(/^<CapabilityMatrix\s*\/>\s*$/m, matrix)
    .replace(/^<PipelineDiagram\s*\/>\s*$/m, "")
    .replace(/^<HomeHero\s*\/>\s*$/m, "")
    .replace(/^<\/?(?:CardGroup|Card|Steps|Step|Callout|EngineBadge|TierMark|Icon)\b[^>]*>\s*$/gm, "")
    // Inline badges read as noise mid-sentence.
    .replace(/<(?:EngineBadge|TierMark|Icon)\b[^>]*\/>/g, "")
    // VitePress container syntax.
    .replace(/^:::\s*(?:code-group|tip|info|warning|danger)?[^\n]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const all = pages().sort();
const matrix = await capabilityTable();

const docs = all.map((abs) => {
  const src = readFileSync(abs, "utf8");
  const { data, body } = frontmatter(src);
  const clean = toPlainMarkdown(body, matrix);
  const h1 = clean.match(/^#\s+(.+)$/m);
  // The whole first paragraph, unwrapped — a single source line is usually a
  // sentence fragment, which reads as a truncated summary.
  const para = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("<") && !p.startsWith("|") && !p.startsWith("```"));
  const lead = (para ?? "").replace(/\s*\n\s*/g, " ");
  return {
    route: routeOf(abs),
    mdPath: "/" + relative(docsDir, abs).split(sep).join("/"),
    title: data.title || (h1 ? h1[1] : "Untitled"),
    summary: (data.description || lead)
      .replace(/[*_`]|\[([^\]]*)\]\([^)]*\)/g, "$1")
      .trim(),
    markdown: clean,
    src,
  };
});

// The home page leads the index; everything else stays alphabetical.
docs.sort((a, b) => (a.route === "/" ? -1 : b.route === "/" ? 1 : a.route.localeCompare(b.route)));

const section = (route) =>
  route.startsWith("/guide") ? "Guide" : route.startsWith("/api") ? "API reference" : "Overview";

// --- /llms.txt (the llmstxt.org convention: index + summaries) --------------
const index = [
  `# ${pkg.name}`,
  "",
  `> ${pkg.description}`,
  "",
  `Version ${pkg.version}. ${pkg.license} licensed. Repository: ${pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")}`,
  "",
  "There are two rendering engines and they are NOT equivalent. `chromium`",
  "(server-side, via puppeteer or playwright) produces selectable vector text and",
  "honours real CSS pagination. `canvas` (browser, zero-dependency) rasterizes the",
  "DOM — the text in the PDF is an image. Any answer about what htmlpdfx supports",
  "depends on which engine is in play; see the capability matrix below.",
  "",
  `Every page is also available as markdown at the same path with a \`.md\` suffix,`,
  "and the complete text of the documentation is at /llms-full.txt.",
  "",
];
for (const group of ["Overview", "Guide", "API reference"]) {
  const items = docs.filter((d) => section(d.route) === group);
  if (!items.length) continue;
  index.push(`## ${group}`, "");
  for (const d of items) {
    index.push(`- [${d.title}](${d.mdPath})${d.summary ? `: ${d.summary}` : ""}`);
  }
  index.push("");
}
index.push("## Capabilities", "", matrix, "");

// --- /llms-full.txt --------------------------------------------------------
const full = [
  `# ${pkg.name} ${pkg.version} — complete documentation`,
  "",
  `> ${pkg.description}`,
  "",
  "This single file contains every documentation page. Sections are separated by",
  "`---` and each one names its source path.",
  "",
];
for (const d of docs) {
  full.push("---", "", `Source: ${d.mdPath}`, "", d.markdown, "");
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "llms.txt"), index.join("\n"));
writeFileSync(join(outDir, "llms-full.txt"), full.join("\n"));

// --- /<path>.md — the markdown source beside each page --------------------
for (const d of docs) {
  const dest = join(outDir, d.mdPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, d.src);
}

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1);
console.log(
  `agent docs: llms.txt (${kb(index.join("\n"))} kB), ` +
    `llms-full.txt (${kb(full.join("\n"))} kB), ` +
    `${docs.length} markdown sources`,
);
