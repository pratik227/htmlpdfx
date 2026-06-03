# Migrating from html2pdf.js

htmlpdfx exports an `html2pdf` alias and a compatible fluent builder, so most
code ports with a one-line import change.

## Before

```js
import html2pdf from "html2pdf.js";

html2pdf()
  .from(element)
  .set({
    margin: 10,
    filename: "doc.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"], avoid: ".row" },
  })
  .save();
```

## After

```ts
import htmlpdfx from "htmlpdfx";

htmlpdfx()
  .from(element)
  .set({
    margin: 10,
    format: "a4",
    orientation: "portrait",
    canvas: { scale: 2, imageType: "jpeg", imageQuality: 0.98 },
    pageBreak: { mode: ["css", "legacy"], avoid: [".row"] },
  })
  .save("doc.pdf");
```

## Option mapping

| html2pdf.js               | htmlpdfx                                  |
| ------------------------- | ----------------------------------------- |
| `filename`                | argument to `.save("name.pdf")`           |
| `image.type` / `quality`  | `canvas.imageType` / `canvas.imageQuality`|
| `html2canvas.scale`       | `canvas.scale`                            |
| `html2canvas: {...}`      | *removed — htmlpdfx has its own renderer, no html2canvas* |
| `jsPDF.unit`              | `unit`                                    |
| `jsPDF.format`            | `format` or `pageSize`                    |
| `jsPDF.orientation`       | `orientation`                             |
| `pagebreak`               | `pageBreak` (note the camelCase + arrays) |
| `.outputPdf('blob')`      | `.output('blob')`                         |

## Key differences

- **`avoid` takes an array** of selectors: `avoid: [".row"]`.
- On the **server** you get vector, selectable text for free (install
  `puppeteer`). No more flattened-image PDFs.
- The legacy `.html2pdf__page-break` element still works (`mode: ["legacy"]`).
- The builder is a real promise — `await htmlpdfx().from(el)` resolves to a
  `PdfResult`, and `.then()` chains work without the old worker quirks.

## From jsPDF `.html()`

```ts
// jsPDF
const doc = new jsPDF();
doc.html(element, { callback: (d) => d.save("out.pdf") });

// htmlpdfx
await toPdf({ element }, { format: "a4" }).then((p) => p.save("out.pdf"));
```
