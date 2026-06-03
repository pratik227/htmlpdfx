# PdfResult

Every render resolves to a `PdfResult`.

```ts
interface PdfResult {
  bytes: Uint8Array;          // raw PDF bytes
  pageCount: number;          // number of pages
  engine: "chromium" | "canvas";
  durationMs: number;         // render wall-time

  save(path: string): Promise<void>;       // Node/Bun: write to disk
  download(filename?: string): Promise<void>; // browser download / disk write
  toBuffer(): Uint8Array;
  toBlob(): Blob;             // browser
  toDataUrl(): string;        // data:application/pdf;base64,…
  toArrayBuffer(): ArrayBuffer;
}
```

## Examples

```ts
const pdf = await toPdf(html);

// Node / Bun
await pdf.save("/tmp/out.pdf");

// Browser
await pdf.download("invoice.pdf");
const url = pdf.toDataUrl();
iframe.src = url;

// Anywhere
const bytes = pdf.toBuffer();   // Uint8Array — upload, hash, store, …
```

## Progress

```ts
await toPdf(html, {
  onProgress: (e) => console.log(e.stage, e.message, e.progress),
});
// resolve-input → select-engine → render → finalize
```
