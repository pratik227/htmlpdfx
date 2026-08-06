<!--
Thanks for contributing! Please read CONTRIBUTING.md if you haven't — in
particular the "Hard constraints" section, which is the fastest way to have a
PR sent back.
-->

## What does this change?

<!-- And why. Link any related issue: "Fixes #12". -->

## Which tier does it affect?

- [ ] chromium (server-side, high fidelity)
- [ ] canvas (browser, best effort)
- [ ] Both
- [ ] Neither — build, docs, CI, or types only

## Checks I ran locally

<!-- Please actually run these rather than ticking optimistically; CI runs them
     on Ubuntu + Windows + macOS across Node 18/20/22 and Bun. -->

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:browser` <sub>(only if you touched the canvas engine or the rasterizer)</sub>
- [ ] `npm run test:e2e` <sub>(only if you touched the chromium engine or the PDF writer)</sub>
- [ ] `npm run docs:build` <sub>(only if you touched docs)</sub>

## For a user-visible change

<!-- All three are required — see "Adding a capability" in CONTRIBUTING.md. -->

- [ ] Added a test that **fails without this change**
- [ ] Updated the capability matrix in **both** `docs/capabilities.md` and
      `engineCapabilities` — and marked each tier honestly (`⚠️`/`❌` are useful
      information; overstating the canvas tier is worse than admitting a gap)
- [ ] Added a `CHANGELOG.md` entry under `## [Unreleased]`

## Constraints

- [ ] No new **required** runtime dependency, and no `jspdf` / `html2canvas`
- [ ] Nothing assumes a DOM on the server, or `process` in the browser
- [ ] Any new error is a typed `HtmlPdfxError` with a stable code
