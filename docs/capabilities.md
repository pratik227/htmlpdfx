# Capabilities

What htmlpdfx handles, and where each behavior is verified in the test suite.

Legend — **C** = chromium engine, **B** = built-in browser (canvas) engine.

| Capability | Behavior | Engine | Verified by |
|---|---|:--:|---|
| Page breaks | Pages end exactly at forced breaks; `before`/`after`/`avoid` honored | C · B | `paginate.test`, `behavior.test` |
| No blank pages | Page count is exactly `ceil(content / page)`; no leading/trailing blanks | C · B | `paginate.test`, `behavior.test` |
| Large documents | Tall content paginates via per-page bands — no over-tall canvas | B | `behavior.test` |
| Atomic blocks | Table rows, cards, figures never split across a page | C · B | `paginate.test`, `behavior.test` |
| Selectable text | Real vector text layer; footer page numbers are selectable | C · B | `behavior.test`, `pdfwriter.test` |
| Images | Every image awaited before render; inlined to avoid CORS taint | C · B | `behavior.test`, harness |
| Web fonts | `document.fonts.ready` awaited; fonts embedded | C · B | harness |
| Modern CSS | flexbox, grid, CSS variables, `oklch()`/`lab()` colors | C · B | `css.test`, frameworks harness |
| Background colors | `print-color-adjust: exact`; explicit page background | C · B | `behavior.test` |
| Margins | Uniform margins applied to every page, including continuations | C · B | `behavior.test` |
| Headers & footers | `{{page}}` / `{{pages}}` / `{{title}}` tokens on every page | C · B | `behavior.test` |
| Page size & orientation | Explicit size/orientation preserved; never auto-flipped | C · B | `behavior.test` |
| Scaling / overflow | Content reflows to printable width; `px` handled 1:1 | C · B | `behavior.test`, `units.test` |
| Unicode / i18n | Any glyph renders; PDF strings safely escaped | C | `behavior.test` |
| RTL / bidi | Browser bidi engine | C | C |
| Clickable links | `<a href>` preserved as link annotations | C | C |
| Quality / DPI | Configurable device scale (default 2×) | B | `behavior.test` |
| Cross-browser | Valid PDF in Chromium, Firefox, and WebKit (Safari) | B | `cross-browser.mjs` |
| Cross-platform | Windows / Ubuntu / macOS, Node 18–22 + Bun | C · B | CI matrix |
| Server-side | Runs headless; no `window`/`document` assumptions | C | `behavior.test`, `runtime.test` |
| Valid output | Structurally valid PDF (header, xref offsets, trailer) | C · B | `pdfwriter.test` |

## Roadmap

Not yet implemented (documented limitations):

- **Interactive form fields** (AcroForm widgets).
- **Password / encryption** (user/owner passwords, permission flags).

For a selectable text layer use the **chromium** engine; the built-in browser
engine rasterizes body text.

## Run the checks

```bash
npm test             # full unit + behavior suite
npm run test:browser # Chromium + Firefox + WebKit rendering
```
