/**
 * Browser capability detection so the canvas engine degrades gracefully across
 * Chrome, Firefox, Safari/WebKit, and Edge.
 */

let cachedImageTypes: Set<string> | null = null;

/** Which canvas image MIME types this browser can actually export. */
export function supportedImageTypes(): Set<string> {
  if (cachedImageTypes) return cachedImageTypes;
  const types = new Set<string>(["image/png"]); // universally supported
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    for (const t of ["image/jpeg", "image/webp"]) {
      const url = c.toDataURL(t);
      if (url.startsWith(`data:${t}`)) types.add(t);
    }
  } catch {
    /* keep png-only */
  }
  cachedImageTypes = types;
  return types;
}

/**
 * Resolve the requested image type to one the browser supports.
 * Safari/WebKit, for example, cannot export `image/webp`, so we fall back to
 * JPEG and then PNG.
 */
export function resolveImageType(
  requested: "jpeg" | "png" | "webp"
): "jpeg" | "png" | "webp" {
  const supported = supportedImageTypes();
  const order: Array<"jpeg" | "png" | "webp"> =
    requested === "webp"
      ? ["webp", "jpeg", "png"]
      : requested === "jpeg"
        ? ["jpeg", "png"]
        : ["png"];
  for (const t of order) {
    if (supported.has(`image/${t}`)) return t;
  }
  return "png";
}

/**
 * WebKit historically taints a canvas after drawing an SVG that contains a
 * `<foreignObject>`, which makes `toDataURL()` throw a SecurityError. Probe
 * for it once so the engine can surface a clear, actionable error instead of
 * a cryptic security exception.
 */
export async function canExportForeignObject(): Promise<boolean> {
  try {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2">` +
      `<foreignObject width="2" height="2">` +
      `<div xmlns="http://www.w3.org/1999/xhtml">x</div>` +
      `</foreignObject></svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const img = await loadProbe(url);
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 2;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    c.toDataURL("image/png"); // throws if tainted
    return true;
  } catch {
    return false;
  }
}

function loadProbe(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("probe timeout")), 3000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("probe failed"));
    };
    img.src = src;
  });
}
