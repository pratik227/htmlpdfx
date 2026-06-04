/** Typed errors so callers can branch on `error.code`. */

export type ErrorCode =
  | "NO_ENGINE"
  | "ENGINE_UNAVAILABLE"
  | "ENGINE_LAUNCH_FAILED"
  | "INVALID_INPUT"
  | "INVALID_OPTIONS"
  | "RENDER_FAILED"
  | "UNSUPPORTED_RUNTIME"
  | "IO_ERROR";

export class HtmlPdfxError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;

  constructor(code: ErrorCode, message: string, hint?: string) {
    super(hint ? `${message}\n  → ${hint}` : message);
    this.name = "HtmlPdfxError";
    this.code = code;
    this.hint = hint;
  }
}

export function fail(code: ErrorCode, message: string, hint?: string): never {
  throw new HtmlPdfxError(code, message, hint);
}
