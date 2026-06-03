/**
 * Best-effort PDF page counter that works on raw bytes without a parser.
 *
 * Strategy: prefer the `/Count N` on the page-tree root; fall back to counting
 * `/Type /Page` objects (excluding `/Pages`). Returns at least 1.
 */
export function countPdfPages(bytes: Uint8Array): number {
  // Decode as latin1 so byte offsets line up with characters.
  let text = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    text += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  // 1) /Count on a /Type /Pages node (the page tree root).
  const countMatches = [
    ...text.matchAll(/\/Type\s*\/Pages\b[\s\S]{0,200}?\/Count\s+(\d+)/g),
    ...text.matchAll(/\/Count\s+(\d+)[\s\S]{0,200}?\/Type\s*\/Pages\b/g),
  ];
  if (countMatches.length) {
    const max = Math.max(...countMatches.map((m) => Number.parseInt(m[1]!, 10)));
    if (max > 0) return max;
  }

  // 2) Count individual page objects.
  const pageObjects = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  if (pageObjects && pageObjects.length > 0) return pageObjects.length;

  return 1;
}
