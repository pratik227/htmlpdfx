import type { EngineName, PdfResult } from "../types.js";
import { fail } from "../utils/errors.js";
import { isBrowserRuntime, isServerRuntime } from "../runtime.js";

function toBase64(bytes: Uint8Array): string {
  const G = globalThis as Record<string, any>;
  if (typeof G.Buffer !== "undefined") {
    return G.Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return G.btoa(binary);
}

export function createResult(
  bytes: Uint8Array,
  pageCount: number,
  engine: Exclude<EngineName, "auto">,
  durationMs: number
): PdfResult {
  return {
    bytes,
    pageCount,
    engine,
    durationMs,

    toBuffer: () => bytes,

    toArrayBuffer: () =>
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer,

    toDataUrl: () => `data:application/pdf;base64,${toBase64(bytes)}`,

    toBlob: () => {
      if (typeof (globalThis as any).Blob === "undefined") {
        fail("UNSUPPORTED_RUNTIME", "Blob is not available in this runtime.");
      }
      return new Blob([bytes as BlobPart], { type: "application/pdf" });
    },

    async save(path: string) {
      if (!isServerRuntime()) {
        fail(
          "UNSUPPORTED_RUNTIME",
          "save(path) only works in Node/Bun.",
          "In the browser use download(filename)."
        );
      }
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path, bytes);
    },

    async download(filename = "document.pdf") {
      if (isBrowserRuntime()) {
        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      if (isServerRuntime()) {
        const { writeFile } = await import("node:fs/promises");
        await writeFile(filename, bytes);
        return;
      }
      fail("UNSUPPORTED_RUNTIME", "download() is not supported in this runtime.");
    },
  };
}
