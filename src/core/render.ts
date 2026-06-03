import type { HtmlPdfxInput, HtmlPdfxOptions, PdfResult } from "../types.js";
import { normalizeOptions } from "./options.js";
import { resolveInput } from "./input.js";
import { selectEngine } from "../engine/index.js";
import { createResult } from "./result.js";

function now(): number {
  const p = (globalThis as any).performance;
  return typeof p?.now === "function" ? p.now() : Date.now();
}

/** The single code path every public entry point funnels through. */
export async function render(
  input: HtmlPdfxInput,
  options: HtmlPdfxOptions = {}
): Promise<PdfResult> {
  const started = now();
  const opts = normalizeOptions(options);
  const emit = opts.onProgress;

  emit?.({ stage: "resolve-input", message: "Resolving input" });
  const resolved = resolveInput(input, opts.baseUrl);

  emit?.({ stage: "select-engine", message: "Selecting engine" });
  const engine = await selectEngine(opts);
  emit?.({
    stage: "select-engine",
    message: `Using "${engine.name}" engine`,
    detail: { engine: engine.name },
  });

  emit?.({ stage: "render", message: "Rendering", progress: 0 });
  const { bytes, pageCount } = await engine.render(resolved, opts);

  emit?.({
    stage: "finalize",
    message: "Done",
    progress: 1,
    detail: { pageCount },
  });

  return createResult(bytes, pageCount, engine.name, now() - started);
}
