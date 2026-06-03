import type { HtmlPdfxInput } from "../types.js";
import { fail } from "../utils/errors.js";

export type ResolvedInput =
  | { kind: "html"; html: string; baseUrl?: string }
  | { kind: "url"; url: string }
  | { kind: "file"; file: string }
  | { kind: "element"; element: unknown };

const URL_RE = /^(https?:|file:)\/\//i;

/** Normalize the many accepted input shapes into a tagged union. */
export function resolveInput(
  input: HtmlPdfxInput,
  fallbackBaseUrl?: string
): ResolvedInput {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (URL_RE.test(trimmed)) return { kind: "url", url: trimmed };
    // Looks like markup → treat as HTML, otherwise wrap bare text.
    const html = /<[a-z!/]/i.test(trimmed) ? input : `<div>${escapeHtml(input)}</div>`;
    return { kind: "html", html, baseUrl: fallbackBaseUrl };
  }

  if (input && typeof input === "object") {
    if ("html" in input && typeof input.html === "string") {
      return { kind: "html", html: input.html, baseUrl: input.baseUrl ?? fallbackBaseUrl };
    }
    if ("url" in input && typeof input.url === "string") {
      return { kind: "url", url: input.url };
    }
    if ("file" in input && typeof input.file === "string") {
      return { kind: "file", file: input.file };
    }
    if ("element" in input && input.element != null) {
      return { kind: "element", element: input.element };
    }
  }

  return fail(
    "INVALID_INPUT",
    "Unsupported input.",
    "Pass an HTML string, a URL, { html }, { url }, { file }, or { element }."
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
