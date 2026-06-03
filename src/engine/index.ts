import type { Engine } from "./types.js";
import type { NormalizedOptions } from "../core/options.js";
import { detectRuntime, isBrowserRuntime, isServerRuntime } from "../runtime.js";
import { fail } from "../utils/errors.js";

/**
 * Resolve which engine to use.
 *
 * `auto` prefers the highest-fidelity engine available in the current runtime:
 * Chromium on the server, canvas in the browser.
 */
export async function selectEngine(opts: NormalizedOptions): Promise<Engine> {
  const rt = detectRuntime();

  if (opts.engine === "chromium") {
    const { chromiumEngine } = await import("./chromium.js");
    if (!(await chromiumEngine.isAvailable(opts))) {
      fail(
        "ENGINE_UNAVAILABLE",
        "Engine 'chromium' was requested but is not available.",
        isServerRuntime(rt)
          ? "Install puppeteer or playwright."
          : "The chromium engine only runs in Node/Bun/Deno."
      );
    }
    return chromiumEngine;
  }

  if (opts.engine === "canvas") {
    const { canvasEngine } = await import("./canvas.js");
    if (!(await canvasEngine.isAvailable(opts))) {
      fail(
        "ENGINE_UNAVAILABLE",
        "Engine 'canvas' was requested but is not available.",
        "The canvas engine only runs in a browser (needs a DOM)."
      );
    }
    return canvasEngine;
  }

  // auto
  if (isServerRuntime(rt)) {
    const { chromiumEngine } = await import("./chromium.js");
    if (await chromiumEngine.isAvailable(opts)) return chromiumEngine;
    fail(
      "NO_ENGINE",
      "No rendering engine available in this Node/Bun runtime.",
      "Install a Chromium driver: `npm i puppeteer` (recommended) or `npm i playwright`."
    );
  }

  if (isBrowserRuntime(rt)) {
    const { canvasEngine } = await import("./canvas.js");
    if (await canvasEngine.isAvailable(opts)) return canvasEngine;
    fail(
      "NO_ENGINE",
      "No rendering engine available in this browser.",
      "A DOM (document) is required for the canvas engine."
    );
  }

  return fail(
    "UNSUPPORTED_RUNTIME",
    `Could not detect a supported runtime (got "${rt}").`
  );
}
