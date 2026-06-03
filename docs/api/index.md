# API overview

## `toPdf(input, options?)`

The primary functional API. Returns `Promise<PdfResult>`.

```ts
import { toPdf } from "htmlpdfx";
const pdf = await toPdf("<h1>Hi</h1>", { format: "a4" });
```

## `htmlpdfx(input?, options?)` / default export

Creates a chainable, awaitable [builder](#builder).

```ts
import htmlpdfx from "htmlpdfx";
await htmlpdfx().from(el).set({ margin: 10 }).save("out.pdf");
```

`html2pdf` is exported as an alias.

## Builder

| Method                  | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `.from(input, opts?)`   | Set the source.                                          |
| `.set(options)`         | Merge options.                                           |
| `.using(engine)`        | Force `"auto" \| "chromium" \| "canvas"`.                |
| `.to(format)`           | Shortcut for `.set({ format })`.                         |
| `.render()`             | Resolve to a `PdfResult`.                                |
| `.save(target?)`        | Save to disk (Node/Bun) or download (browser).           |
| `.download(filename?)`  | Trigger a browser download / write to disk.              |
| `.output(type)`         | `"bytes" \| "arraybuffer" \| "blob" \| "datauristring"`. |
| `await builder`         | Resolves to a `PdfResult` (thenable).                    |

## Presets

```ts
import { presets, toPdf } from "htmlpdfx";

await toPdf(html, presets.report);   // Letter + page-number footer
await toPdf(html, presets.document); // A4 + comfortable margins
await toPdf(html, presets.fullBleed); // no margins
```

## Low-level building blocks

```ts
import { PdfWriter, renderDomToImage, computePageSlices, detectRuntime } from "htmlpdfx";
```

## Errors

All thrown errors are `HtmlPdfxError` with a `.code`:

```ts
import { HtmlPdfxError } from "htmlpdfx";

try {
  await toPdf(html);
} catch (e) {
  if (e instanceof HtmlPdfxError && e.code === "NO_ENGINE") {
    // prompt to install puppeteer
  }
}
```

Codes: `NO_ENGINE`, `ENGINE_UNAVAILABLE`, `INVALID_INPUT`, `INVALID_OPTIONS`,
`RENDER_FAILED`, `UNSUPPORTED_RUNTIME`, `IO_ERROR`.
