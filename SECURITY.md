# Security Policy

## Supported versions

Security fixes land on the latest published 1.x, released as a patch version.
There are no long-term support branches for older majors.

| Version | Supported |
| ------- | :-------: |
| 1.x     |    ✅     |

## `npm audit` findings

**htmlpdfx declares no runtime dependencies**, so `npm audit --omit=dev` on this
repository reports zero vulnerabilities and nothing from our tree reaches your
production install. The only thing `npm i htmlpdfx` can add is `puppeteer`, as an
optional dependency.

Running a full `npm audit` here does report advisories, and they are all in build
tooling — currently `vite` and `esbuild`, reached through `vitepress`. Both
advisories concern a **development server** reading local files, so they affect
someone running `vitepress dev` on their own machine, not the built static docs
and not the published package. VitePress has no release that resolves them yet,
so they stay visible until it ships one.

Please don't file these as vulnerabilities in htmlpdfx. If you find a dev
dependency advisory that *is* reachable from shipped code, that's a real report —
see below.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/pratik227/htmlpdfx/security/advisories/new)
(Security → Report a vulnerability). If that is unavailable to you, email
**pratikpatelpp802@gmail.com** with `htmlpdfx security` in the subject.

Please include:

- the version of htmlpdfx and which engine (`chromium` or `canvas`),
- the runtime (Node / Bun / browser) and OS,
- a minimal HTML or options payload that reproduces it,
- what an attacker gains.

You can expect an acknowledgement within **5 business days** and a status
update at least every 10 days until the issue is resolved. Fixes are released
as a patch version with a GitHub Security Advisory; credit is given unless you
ask otherwise.

## Threat model — read this before reporting

htmlpdfx converts HTML into PDF. **HTML input is treated as trusted code**,
which has consequences worth stating plainly:

- **Rendering untrusted HTML executes it.** The chromium engine loads your
  markup in a real browser: scripts run, and `<img>`, `<link>`, `@font-face`,
  and `fetch()` reach the network from wherever the renderer runs. If you feed
  htmlpdfx user-submitted HTML, that user can make requests from your server —
  including to internal addresses (SSRF). This is inherent to browser-based PDF
  rendering, not a bug in htmlpdfx.
- **`{ url }` and `{ file }` inputs fetch what you point them at.** `file`
  reads from the local filesystem via `pathToFileURL`. Never build either from
  unsanitised user input.
- **Sandboxing is the caller's job.** If you must render untrusted content, run
  it in an isolated container or VM with egress restricted to what you actually
  need, and consider passing your driver's own sandbox flags through
  `chromium.launchOptions`.

Reports that amount to "untrusted HTML can run script / load a remote URL" are
expected behaviour and documented above.

**In scope** and genuinely interesting:

- Escaping bugs in the PDF writer that let content forge PDF object structure
  (e.g. breaking out of a string or stream via crafted text or metadata).
- Options that traverse or write outside the path passed to `save()`.
- A crash, unbounded allocation, or hang reachable from plausible input.
- Anything that leaks the host environment into the PDF unexpectedly.
