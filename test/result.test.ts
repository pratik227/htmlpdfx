import { describe, it, expect } from "vitest";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createResult } from "../src/core/result.js";

const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"

describe("createResult", () => {
  it("exposes metadata", () => {
    const r = createResult(bytes, 3, "chromium", 42);
    expect(r.pageCount).toBe(3);
    expect(r.engine).toBe("chromium");
    expect(r.durationMs).toBe(42);
  });

  it("returns the raw bytes and an arraybuffer view", () => {
    const r = createResult(bytes, 1, "canvas", 1);
    expect(r.toBuffer()).toBe(bytes);
    expect(new Uint8Array(r.toArrayBuffer())).toEqual(bytes);
  });

  it("builds a base64 data url", () => {
    const r = createResult(bytes, 1, "canvas", 1);
    expect(r.toDataUrl()).toBe("data:application/pdf;base64,JVBERg==");
  });

  it("writes to disk in node", async () => {
    const r = createResult(bytes, 1, "chromium", 1);
    const path = join(tmpdir(), `htmlpdfx-test-${process.pid}.pdf`);
    await r.save(path);
    const written = await readFile(path);
    expect(new Uint8Array(written)).toEqual(bytes);
    await unlink(path);
  });
});
