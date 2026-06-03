# Engines

htmlpdfx ships two rendering engines behind one API. `engine: "auto"` (the
default) picks the best one for the current runtime.

## `chromium` — high fidelity (Node / Bun)

Drives a real browser through **Puppeteer or Playwright** (whichever is
installed) and uses its native `page.pdf()`.

- ✅ **Selectable, searchable vector text**
- ✅ Perfect CSS — flexbox, grid, web fonts, `oklch()`/`lab()` colors
- ✅ Native CSS page breaks (`break-before`, `break-inside: avoid`, `@page`)
- ✅ Repeating `<thead>` on multi-page tables (browser behaviour)
- ✅ Clickable links preserved
- ✅ Headers/footers with page numbers

```ts
await toPdf(html, {
  engine: "chromium",
  chromium: {
    waitUntil: "networkidle",   // wait for assets
    printBackground: true,
    scale: 1,
    // browser: myExistingBrowser,   // reuse a launched instance
    // executablePath: "/path/to/chrome",
  },
});
```

Driver detection order: `puppeteer` → `playwright` → `puppeteer-core` →
`playwright-core`. Force one with `chromium.driver`.

## `canvas` — built-in (browser)

A **fully self-contained** pipeline — no `jspdf`, no `html2canvas`:

1. Clone the target node and inline its *computed* styles.
2. Inline images as data URLs (fixes CORS/blank-image races).
3. Rasterize via an SVG `<foreignObject>` — so the **browser itself** lays out
   the content. Modern CSS like `oklch()` (Tailwind v4) that crashes
   html2canvas just works.
4. Slice into pages with our page-break-aware slicer.
5. Assemble the PDF with our own writer (page-number footers are real text).

```ts
await toPdf({ element: node }, {
  engine: "canvas",
  canvas: {
    scale: 2,            // device pixel ratio (sharper at higher values)
    imageType: "jpeg",   // jpeg | png | webp
    imageQuality: 0.95,
    background: "#ffffff",
  },
});
```

Because it rasterizes, the body text in the `canvas` engine is not selectable.
Use the `chromium` engine when you need a true text layer.

## Choosing explicitly

```ts
toPdf(html, { engine: "auto" });     // default
toPdf(html, { engine: "chromium" }); // throws if no driver installed
toPdf(html, { engine: "canvas" });   // throws outside a browser
```

Errors are typed — catch `HtmlPdfxError` and branch on `error.code`
(`NO_ENGINE`, `ENGINE_UNAVAILABLE`, `INVALID_INPUT`, …).
