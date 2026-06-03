/**
 * A small, dependency-free PDF writer.
 *
 * Replaces the `jspdf` dependency for the browser engine. It can:
 *  - create pages of arbitrary size,
 *  - embed JPEG images (DCTDecode — JPEG bytes embed verbatim),
 *  - embed pre-deflated RGB images (FlateDecode),
 *  - draw selectable text using the standard Helvetica font (no embedding),
 *  - write document metadata (Info dictionary).
 *
 * Coordinates are PDF points (1/72in). The PDF origin is the bottom-left
 * corner; helper methods accept top-left coordinates and flip internally.
 */
import { ByteWriter, pdfDate, pdfString } from "./bytes.js";

export interface PdfMeta {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  /** Pass a fixed Date for deterministic output (tests). */
  date?: Date;
}

export interface JpegImage {
  format: "jpeg";
  bytes: Uint8Array;
  /** intrinsic pixel size (used for the XObject /Width /Height) */
  pxWidth: number;
  pxHeight: number;
}

export interface FlateRgbImage {
  format: "flate-rgb";
  /** zlib/deflate-compressed RGB (3 bytes/pixel, no alpha) */
  bytes: Uint8Array;
  pxWidth: number;
  pxHeight: number;
}

export interface RawRgbImage {
  format: "raw-rgb";
  /** uncompressed RGB (3 bytes/pixel, no alpha). Large but universally valid. */
  bytes: Uint8Array;
  pxWidth: number;
  pxHeight: number;
}

export type EmbeddableImage = JpegImage | FlateRgbImage | RawRgbImage;

interface DrawImageOp {
  kind: "image";
  ref: number; // object number of the image XObject
  resourceName: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawTextOp {
  kind: "text";
  x: number;
  y: number;
  size: number;
  text: string;
  color: [number, number, number];
}

interface PageData {
  widthPt: number;
  heightPt: number;
  ops: (DrawImageOp | DrawTextOp)[];
}

export class PdfPage {
  /** @internal */
  readonly data: PageData;
  private readonly doc: PdfWriter;

  constructor(doc: PdfWriter, widthPt: number, heightPt: number) {
    this.doc = doc;
    this.data = { widthPt, heightPt, ops: [] };
  }

  /** Draw an image. (x, y) is the TOP-LEFT corner, w/h the display size in pt. */
  drawImage(
    image: EmbeddableImage,
    x: number,
    y: number,
    w: number,
    h: number
  ): this {
    const { ref, resourceName } = this.doc._registerImage(image);
    this.data.ops.push({
      kind: "image",
      ref,
      resourceName,
      x,
      y: this.data.heightPt - y - h, // flip to bottom-left origin
      w,
      h,
    });
    return this;
  }

  /** Draw a line of Helvetica text. (x, y) is the text baseline from the top. */
  drawText(
    text: string,
    x: number,
    y: number,
    opts: { size?: number; color?: [number, number, number] } = {}
  ): this {
    this.doc._useHelvetica();
    this.data.ops.push({
      kind: "text",
      x,
      y: this.data.heightPt - y, // flip
      size: opts.size ?? 10,
      text,
      color: opts.color ?? [0, 0, 0],
    });
    return this;
  }
}

interface RegisteredImage {
  ref: number;
  resourceName: string;
  image: EmbeddableImage;
}

export class PdfWriter {
  private pages: PdfPage[] = [];
  private images: RegisteredImage[] = [];
  private imageCache = new Map<EmbeddableImage, RegisteredImage>();
  private needsHelvetica = false;
  private meta: PdfMeta;
  private nextImageId = 1;

  constructor(meta: PdfMeta = {}) {
    this.meta = meta;
  }

  addPage(widthPt: number, heightPt: number): PdfPage {
    const page = new PdfPage(this, widthPt, heightPt);
    this.pages.push(page);
    return page;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  /** @internal */
  _registerImage(image: EmbeddableImage): RegisteredImage {
    const existing = this.imageCache.get(image);
    if (existing) return existing;
    const reg: RegisteredImage = {
      ref: -1, // assigned at serialization time
      resourceName: `Im${this.nextImageId++}`,
      image,
    };
    this.images.push(reg);
    this.imageCache.set(image, reg);
    return reg;
  }

  /** @internal */
  _useHelvetica(): void {
    this.needsHelvetica = true;
  }

  /** Serialize to PDF bytes. */
  toBytes(): Uint8Array {
    if (this.pages.length === 0) this.addPage(595.28, 841.89); // blank A4

    // ---- Object number allocation ----
    // 1: Catalog, 2: Pages tree, 3: Info
    // then: Font (optional), images, and per page (Page + Content).
    const objects: string[] = []; // body for object number = index+1
    const offsets: number[] = [];
    let objCount = 0;
    const alloc = () => ++objCount;

    const catalogRef = alloc();
    const pagesRef = alloc();
    const infoRef = alloc();

    let fontRef = 0;
    if (this.needsHelvetica) fontRef = alloc();

    // images get object numbers next
    const imageStreams: { ref: number; image: EmbeddableImage }[] = [];
    for (const img of this.images) {
      img.ref = alloc();
      imageStreams.push({ ref: img.ref, image: img.image });
    }

    // page + content object numbers
    const pageRefs: { pageRef: number; contentRef: number }[] = [];
    for (let i = 0; i < this.pages.length; i++) {
      pageRefs.push({ pageRef: alloc(), contentRef: alloc() });
    }

    // ---- Build the file ----
    const w = new ByteWriter();
    w.str("%PDF-1.7\n");
    // binary marker so tools treat the file as binary
    w.str("%\xE2\xE3\xCF\xD3\n");

    const writeObj = (ref: number, body: () => void) => {
      offsets[ref] = w.length;
      w.str(`${ref} 0 obj\n`);
      body();
      w.str("\nendobj\n");
    };

    // Catalog
    writeObj(catalogRef, () => {
      w.str(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
    });

    // Pages tree
    writeObj(pagesRef, () => {
      const kids = pageRefs.map((p) => `${p.pageRef} 0 R`).join(" ");
      w.str(
        `<< /Type /Pages /Count ${this.pages.length} /Kids [ ${kids} ] >>`
      );
    });

    // Info
    writeObj(infoRef, () => {
      const m = this.meta;
      const parts = [
        m.title ? `/Title (${pdfString(m.title)})` : "",
        m.author ? `/Author (${pdfString(m.author)})` : "",
        m.subject ? `/Subject (${pdfString(m.subject)})` : "",
        m.keywords ? `/Keywords (${pdfString(m.keywords)})` : "",
        `/Creator (${pdfString(m.creator ?? "htmlpdfx")})`,
        `/Producer (htmlpdfx)`,
        m.date ? `/CreationDate (${pdfDate(m.date)})` : "",
      ].filter(Boolean);
      w.str(`<< ${parts.join(" ")} >>`);
    });

    // Font
    if (fontRef) {
      writeObj(fontRef, () => {
        w.str(
          `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
        );
      });
    }

    // Image XObjects
    for (const { ref, image } of imageStreams) {
      writeObj(ref, () => {
        const filter =
          image.format === "jpeg"
            ? " /Filter /DCTDecode"
            : image.format === "flate-rgb"
              ? " /Filter /FlateDecode"
              : ""; // raw-rgb: no filter
        w.str(
          `<< /Type /XObject /Subtype /Image /Width ${image.pxWidth} ` +
            `/Height ${image.pxHeight} /ColorSpace /DeviceRGB ` +
            `/BitsPerComponent 8${filter} /Length ${image.bytes.length} >>\n`
        );
        w.str("stream\n");
        w.bytes(image.bytes);
        w.str("\nendstream");
      });
    }

    // Pages + content streams
    this.pages.forEach((page, i) => {
      const { pageRef, contentRef } = pageRefs[i]!;

      // content stream text
      const content = buildContentStream(page.data);
      const contentBytes = content;

      writeObj(pageRef, () => {
        const xobjs = page.data.ops
          .filter((o): o is DrawImageOp => o.kind === "image")
          .map((o) => `/${o.resourceName} ${o.ref} 0 R`)
          .join(" ");
        const fontRes = fontRef ? `/Font << /F1 ${fontRef} 0 R >>` : "";
        const xobjRes = xobjs ? `/XObject << ${xobjs} >>` : "";
        w.str(
          `<< /Type /Page /Parent ${pagesRef} 0 R ` +
            `/MediaBox [0 0 ${fmt(page.data.widthPt)} ${fmt(page.data.heightPt)}] ` +
            `/Resources << ${fontRes} ${xobjRes} /ProcSet [/PDF /Text /ImageC] >> ` +
            `/Contents ${contentRef} 0 R >>`
        );
      });

      writeObj(contentRef, () => {
        w.str(`<< /Length ${contentBytes.length} >>\n`);
        w.str("stream\n");
        w.str(contentBytes);
        w.str("\nendstream");
      });
    });

    // ---- xref ----
    const xrefOffset = w.length;
    const total = objCount + 1; // include free object 0
    w.str("xref\n");
    w.str(`0 ${total}\n`);
    w.str("0000000000 65535 f \n");
    for (let ref = 1; ref <= objCount; ref++) {
      const off = offsets[ref] ?? 0;
      w.str(`${String(off).padStart(10, "0")} 00000 n \n`);
    }

    // ---- trailer ----
    w.str("trailer\n");
    w.str(
      `<< /Size ${total} /Root ${catalogRef} 0 R /Info ${infoRef} 0 R >>\n`
    );
    w.str("startxref\n");
    w.str(`${xrefOffset}\n`);
    w.str("%%EOF\n");

    return w.toUint8Array();
  }
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
}

function buildContentStream(page: PageData): string {
  const lines: string[] = [];
  for (const op of page.ops) {
    if (op.kind === "image") {
      // q  w 0 0 h x y cm  /Im Do  Q
      lines.push(
        `q ${fmt(op.w)} 0 0 ${fmt(op.h)} ${fmt(op.x)} ${fmt(op.y)} cm /${op.resourceName} Do Q`
      );
    } else {
      const [r, g, b] = op.color;
      lines.push(
        `BT /F1 ${fmt(op.size)} Tf ${fmt(r)} ${fmt(g)} ${fmt(b)} rg ` +
          `${fmt(op.x)} ${fmt(op.y)} Td (${pdfString(op.text)}) Tj ET`
      );
    }
  }
  return lines.join("\n");
}
