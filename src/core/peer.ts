import { fail } from "../utils/errors.js";

/**
 * Import an optional peer dependency (a framework the adapter integrates with),
 * or fail with a clean, actionable error instead of a raw module-not-found.
 *
 * Returns the module namespace so callers can read named exports.
 */
export async function requirePeer<T = Record<string, unknown>>(
  name: string,
  feature: string
): Promise<T> {
  try {
    // Indirect import so bundlers leave it as a runtime resolution.
    return (await import(/* @vite-ignore */ name)) as T;
  } catch {
    return fail(
      "MISSING_PEER",
      `${feature} requires "${name}", which is not installed.`,
      `Install it as a peer dependency: \`npm i ${name}\`.`
    );
  }
}
