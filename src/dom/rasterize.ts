/**
 * Dependency-free DOM → canvas rasterizer (replaces html2canvas).
 *
 * Technique: clone the node, inline every element's *computed* style, inline
 * images as data URLs, then render the clone through an SVG `<foreignObject>`
 * onto a canvas. Because the browser itself lays out the foreignObject, modern
 * CSS — flexbox, grid, and `oklch()`/`lab()` colors (Tailwind v4) — renders
 * natively.
 */
import { buildSvg, svgDataUrl } from "./svg.js";

export interface RasterizeOptions {
  /** device pixel scale (higher = sharper). */
  scale: number;
  /** layout width in CSS px (content reflows to this). */
  widthPx?: number;
  /** background fill (avoids transparent → black when flattening). */
  background?: string;
  /** ms to wait for fonts/images before giving up. */
  timeout?: number;
}

export interface RasterizeResult {
  canvas: HTMLCanvasElement;
  widthPx: number;
  heightPx: number;
}

export interface DomImage {
  /** A rasterizable image of the laid-out DOM. Intrinsic size = CSS px. */
  image: HTMLImageElement;
  /** layout width in CSS px */
  widthPx: number;
  /** full content height in CSS px */
  heightPx: number;
}

const COPY_PSEUDO = ["::before", "::after"];

/**
 * Render the node to a single rasterizable image at CSS resolution. The caller
 * can then draw arbitrary vertical bands of it onto per-page canvases — which
 * is how we paginate without ever allocating one over-tall canvas (the html2pdf
 * "blank PDF on large documents" bug).
 */
export async function renderDomToImage(
  node: HTMLElement,
  opts: RasterizeOptions
): Promise<DomImage> {
  const widthPx = Math.ceil(opts.widthPx ?? (node.offsetWidth || 800));

  // Lay the source out at the target width so heights are correct.
  const prevWidth = node.style.width;
  if (opts.widthPx != null) node.style.width = `${widthPx}px`;

  await waitForAssets(node, opts.timeout ?? 15000);

  const clone = node.cloneNode(true) as HTMLElement;
  inlineStylesTree(node, clone);
  await inlineImages(clone);

  const heightPx = Math.ceil(Math.max(node.scrollHeight, node.offsetHeight, 1));
  if (opts.widthPx != null) node.style.width = prevWidth;

  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg = buildSvg(xhtml, widthPx, heightPx, opts.background);
  const image = await loadImage(svgDataUrl(svg), opts.timeout ?? 15000);

  return { image, widthPx, heightPx };
}

/** Convenience: render the whole node to one canvas (small documents). */
export async function rasterizeElement(
  node: HTMLElement,
  opts: RasterizeOptions
): Promise<RasterizeResult> {
  const { image, widthPx, heightPx } = await renderDomToImage(node, opts);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(widthPx * opts.scale));
  canvas.height = Math.max(1, Math.round(heightPx * opts.scale));
  const ctx = canvas.getContext("2d")!;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.setTransform(opts.scale, 0, 0, opts.scale, 0, 0);
  ctx.drawImage(image, 0, 0, widthPx, heightPx);

  return { canvas, widthPx, heightPx };
}

/** Copy computed styles from every source element onto its clone. */
function inlineStylesTree(source: Element, clone: Element): void {
  const srcEls = [source, ...source.querySelectorAll("*")];
  const cloneEls = [clone, ...clone.querySelectorAll("*")];
  for (let i = 0; i < srcEls.length; i++) {
    const s = srcEls[i];
    const c = cloneEls[i] as HTMLElement | undefined;
    if (!s || !c) continue;
    copyComputedStyle(s, c);
    copyPseudo(s, c);
  }
}

function copyComputedStyle(source: Element, clone: HTMLElement): void {
  const computed = getComputedStyle(source);
  let cssText = "";
  for (let i = 0; i < computed.length; i++) {
    const prop = computed.item(i);
    cssText += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  clone.setAttribute("style", cssText);
}

function copyPseudo(source: Element, clone: HTMLElement): void {
  for (const pseudo of COPY_PSEUDO) {
    const cs = getComputedStyle(source, pseudo);
    const content = cs.getPropertyValue("content");
    if (!content || content === "none" || content === "normal") continue;
    let cssText = "";
    for (let i = 0; i < cs.length; i++) {
      const prop = cs.item(i);
      cssText += `${prop}:${cs.getPropertyValue(prop)};`;
    }
    const cls = `hpx-pseudo-${pseudo === "::before" ? "b" : "a"}-${Math.abs(
      hashString(cssText)
    )}`;
    clone.classList.add(cls);
    const style = document.createElement("style");
    style.textContent = `.${cls}${pseudo}{${cssText}}`;
    clone.appendChild(style);
  }
}

/** Inline <img> and CSS background-image URLs as data URLs (CORS fix). */
async function inlineImages(root: Element): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const dataUrl = await fetchAsDataUrl(src);
      if (dataUrl) img.setAttribute("src", dataUrl);
    })
  );
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function waitForAssets(root: HTMLElement, timeout: number): Promise<void> {
  const fontsReady = (document as any).fonts?.ready
    ? (document as any).fonts.ready
    : Promise.resolve();

  const imgs = Array.from(root.querySelectorAll("img"));
  const imgsReady = Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          })
    )
  );

  await Promise.race([
    Promise.all([fontsReady, imgsReady]),
    new Promise((res) => setTimeout(res, timeout)),
  ]);
}

function loadImage(src: string, timeout: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () => reject(new Error("htmlpdfx: SVG rasterization timed out")),
      timeout
    );
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("htmlpdfx: failed to rasterize DOM via SVG"));
    };
    img.src = src;
  });
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
