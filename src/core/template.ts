/** Expand header/footer tokens. Shared by both engines so behaviour matches. */
export interface TemplateContext {
  page: number;
  pages: number;
  title?: string;
  date?: string;
}

export function expandTemplate(tpl: string, ctx: TemplateContext): string {
  return tpl
    .replace(/\{\{\s*page\s*\}\}/g, String(ctx.page))
    .replace(/\{\{\s*pages\s*\}\}/g, String(ctx.pages))
    .replace(/\{\{\s*title\s*\}\}/g, ctx.title ?? "")
    .replace(/\{\{\s*date\s*\}\}/g, ctx.date ?? "");
}

/**
 * Wrap server-rendered component markup in a complete HTML document so engines
 * receive a well-formed page (with optional `<head>` content for fonts/styles).
 * Used by the React/Vue adapters. If `body` already looks like a full document
 * it is returned unchanged.
 */
export function wrapHtmlDocument(
  body: string,
  opts: { head?: string; lang?: string } = {}
): string {
  if (/<html[\s>]/i.test(body)) return body;
  const lang = opts.lang ?? "en";
  const head = opts.head ?? "";
  return (
    `<!doctype html><html lang="${lang}"><head>` +
    `<meta charset="utf-8">${head}</head><body>${body}</body></html>`
  );
}
