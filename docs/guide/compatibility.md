# Compatibility

htmlpdfx is built to run everywhere JavaScript does, and its output is verified
on every major OS and browser engine in CI.

## Operating systems

| OS       | Node 18 | Node 20 | Node 22 | Bun |
| -------- | :-----: | :-----: | :-----: | :-: |
| Ubuntu   |   ✅    |   ✅    |   ✅    | ✅  |
| Windows  |   ✅    |   ✅    |   ✅    | —   |
| macOS    |   ✅    |   ✅    |   ✅    | ✅  |

File paths are resolved with `pathToFileURL`, so Windows drive letters and
spaces in paths work the same as POSIX paths.

## Browsers (canvas engine)

The built-in browser renderer is tested through Playwright in:

| Engine  | Browsers                | Status |
| ------- | ----------------------- | :----: |
| Chromium | Chrome, Edge, Brave, Opera | ✅ |
| Firefox  | Firefox                 | ✅ |
| WebKit   | **Safari** (macOS/iOS)  | ✅ |

Cross-browser handling built in:

- **Image format fallback** — Safari can't export WebP from a canvas, so a
  `webp` request automatically falls back to JPEG (then PNG).
- **Tainted-canvas guard** — if a browser taints the canvas while rasterizing
  the DOM, htmlpdfx throws a clear, actionable `RENDER_FAILED` error instead of
  a cryptic `SecurityError`.
- **Lossless path** — `imageType: "png"` embeds raw RGB (no decoder needed), so
  it's valid in every reader and browser.

## Runtimes

`detectRuntime()` distinguishes Node, Bun, Deno, browser, and web worker, and
the `auto` engine picks accordingly — no global monkey-patching, and no
`window is not defined` errors on the server.

## Running the checks yourself

```bash
npm test             # unit + issue-coverage suite
npm run test:browser # Chromium + Firefox + WebKit (needs `npx playwright install`)
```
