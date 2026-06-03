/** Runtime detection. Lets the auto engine pick the right backend. */

export type Runtime = "node" | "bun" | "deno" | "browser" | "worker" | "unknown";

const g = globalThis as Record<string, unknown>;

export function detectRuntime(): Runtime {
  if (typeof g.Bun !== "undefined") return "bun";
  if (typeof g.Deno !== "undefined") return "deno";
  if (
    typeof g.process !== "undefined" &&
    (g.process as { versions?: { node?: string } }).versions?.node
  ) {
    return "node";
  }
  if (typeof g.window !== "undefined" && typeof g.document !== "undefined") {
    return "browser";
  }
  if (typeof g.self !== "undefined" && typeof g.importScripts === "function") {
    return "worker";
  }
  return "unknown";
}

export function isServerRuntime(rt: Runtime = detectRuntime()): boolean {
  return rt === "node" || rt === "bun" || rt === "deno";
}

export function isBrowserRuntime(rt: Runtime = detectRuntime()): boolean {
  return rt === "browser" || rt === "worker";
}

/** Dynamically import an optional dependency; returns null if absent. */
export async function optionalImport<T = unknown>(
  name: string
): Promise<T | null> {
  try {
    // Indirect import so bundlers leave it as a runtime require.
    const mod = (await import(/* @vite-ignore */ name)) as { default?: T } & T;
    return (mod.default ?? mod) as T;
  } catch {
    return null;
  }
}
