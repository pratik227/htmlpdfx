/** A growable byte buffer that mixes latin1 text and raw binary safely. */
export class ByteWriter {
  private parts: Uint8Array[] = [];
  private _length = 0;

  get length(): number {
    return this._length;
  }

  /** Append an ASCII/latin1 string. */
  str(s: string): this {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
    return this.bytes(out);
  }

  /** Append raw bytes. */
  bytes(b: Uint8Array): this {
    this.parts.push(b);
    this._length += b.length;
    return this;
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this._length);
    let offset = 0;
    for (const part of this.parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
}

/** Escape a string for use inside a PDF literal `( … )` string. */
export function pdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** A PDF date string: D:YYYYMMDDHHmmSS. */
export function pdfDate(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}
