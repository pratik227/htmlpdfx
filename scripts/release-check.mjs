#!/usr/bin/env node
/**
 * Pre-publish checks, run by hand before `npm publish`.
 *
 * Publishing is deliberately manual for this project, so these gates live here
 * rather than in CI. They're the cheap checks that catch the mistakes you only
 * notice after a version is permanently on the registry: a version with no
 * changelog entry, a tarball missing an entry point, or an entry point that
 * doesn't actually import.
 *
 *   npm run release:check
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();

const problems = [];
const notes = [];
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => {
  problems.push(m);
  console.log(`  FAIL  ${m}`);
};
const warn = (m) => {
  notes.push(m);
  console.log(`  warn  ${m}`);
};

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const { name, version } = pkg;

console.log(`\n${name}@${version} — pre-publish checks\n`);

// --- 1. The changelog has an entry for this version ------------------------
const changelog = readFileSync("CHANGELOG.md", "utf8");
if (new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m").test(changelog)) {
  ok(`CHANGELOG.md has a "## [${version}]" section`);
} else {
  bad(
    `CHANGELOG.md has no "## [${version}]" section — move the Unreleased ` +
      `entries under a heading for this version`,
  );
}

// --- 2. Nothing uncommitted ------------------------------------------------
try {
  const dirty = sh("git", ["status", "--porcelain"]);
  if (dirty) {
    warn(
      `working tree has ${dirty.split("\n").length} uncommitted change(s) — ` +
        `you'd be publishing code that isn't in git`,
    );
  } else {
    ok("working tree is clean");
  }
} catch {
  warn("not a git repository — skipped the clean-tree check");
}

// --- 3. This version isn't already on the registry ------------------------
try {
  const published = sh("npm", ["view", `${name}@${version}`, "version"], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (published === version) {
    bad(
      `${name}@${version} is already published — npm will reject this. Bump ` +
        `the version first (npm version patch|minor|major --no-git-tag-version)`,
    );
  }
} catch {
  ok(`${version} is not on the registry yet`);
}

// --- 4. The tarball contains, and can load, every entry point -------------
const dir = mkdtempSync(join(tmpdir(), "htmlpdfx-release-"));
try {
  const tgz = sh("npm", ["pack", "--silent", "--pack-destination", dir]);
  sh("tar", ["xzf", join(dir, tgz), "-C", dir]);
  const root = join(dir, "package");

  const required = [
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "dist/browser.js",
    "dist/react.js",
    "dist/vue.js",
    "dist/htmlpdfx.global.js",
    "README.md",
    "LICENSE",
  ];
  const missing = required.filter((f) => {
    try {
      readFileSync(join(root, f));
      return false;
    } catch {
      return true;
    }
  });
  if (missing.length) bad(`tarball is missing: ${missing.join(", ")}`);
  else ok(`tarball contains all ${required.length} required files`);

  const EXPORTS = ["toPdf", "htmlpdfx", "html2pdf", "createRenderer"];
  const check = `
    const missing = [];
    const m = await import(${JSON.stringify(join(root, "dist/index.js"))});
    for (const k of ${JSON.stringify(EXPORTS)}) if (!(k in m)) missing.push('esm:' + k);
    const { createRequire } = await import("node:module");
    const req = createRequire(${JSON.stringify(join(root, "x.cjs"))});
    const c = req("./dist/index.cjs");
    for (const k of ${JSON.stringify(EXPORTS)}) if (!(k in c)) missing.push('cjs:' + k);
    if (missing.length) { console.error(missing.join(', ')); process.exit(1); }
  `;
  try {
    sh(process.execPath, ["--input-type=module", "-e", check], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    ok(`ESM and CJS both resolve ${EXPORTS.join(", ")}`);
  } catch (err) {
    bad(`entry points failed to load: ${String(err.stderr || err).trim()}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// --- Verdict --------------------------------------------------------------
console.log("");
if (problems.length) {
  console.error(
    `${problems.length} problem(s) must be fixed before publishing.\n`,
  );
  process.exit(1);
}
console.log(
  notes.length
    ? `Ready to publish, with ${notes.length} warning(s) above.\n`
    : "Ready to publish.\n",
);
console.log("  npm publish --access public\n");
