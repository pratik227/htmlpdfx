/**
 * Pure helpers for the SVG-foreignObject rasterization technique.
 *
 * Kept dependency- and DOM-free so the string assembly can be unit-tested in
 * Node. The DOM-touching parts live in `rasterize.ts`.
 */

/** Wrap serialized XHTML markup in an SVG/foreignObject document. */
export function buildSvg(
  xhtml: string,
  widthPx: number,
  heightPx: number,
  background?: string
): string {
  const bg = background
    ? `<rect width="100%" height="100%" fill="${escapeAttr(background)}"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}">` +
    bg +
    `<foreignObject x="0" y="0" width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${widthPx}px;height:${heightPx}px;">` +
    xhtml +
    `</div>` +
    `</foreignObject>` +
    `</svg>`
  );
}

/** Build a `data:image/svg+xml` URL from an SVG string. */
export function svgDataUrl(svg: string): string {
  // encodeURIComponent keeps it valid without base64 bloat.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert a `data:` URL's base64/percent payload into raw bytes. */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(5, comma); // strip "data:"
  const payload = dataUrl.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const G = globalThis as Record<string, any>;
    const binary =
      typeof G.atob === "function"
        ? G.atob(payload)
        : G.Buffer.from(payload, "base64").toString("binary");
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) & 0xff;
    return out;
  }
  const decoded = decodeURIComponent(payload);
  const out = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) out[i] = decoded.charCodeAt(i) & 0xff;
  return out;
}
