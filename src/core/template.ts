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
