import { describe, it, expect } from "vitest";
import { createRenderer } from "../src/server/renderer.js";
import { HtmlPdfxError } from "../src/utils/errors.js";

describe("createRenderer", () => {
  it("exposes the renderer API and starts closed", async () => {
    const r = await createRenderer({ format: "a4" });
    expect(typeof r.toPdf).toBe("function");
    expect(typeof r.warmup).toBe("function");
    expect(typeof r.close).toBe("function");
    expect(r.isOpen).toBe(false);
  });

  it("close() before launch is a safe no-op", async () => {
    const r = await createRenderer();
    await expect(r.close()).resolves.toBeUndefined();
    expect(r.isOpen).toBe(false);
  });

  it("surfaces a clean HtmlPdfxError when no usable browser exists", async () => {
    const r = await createRenderer();
    try {
      await r.warmup();
      // A browser was available — clean up and pass.
      await r.close();
    } catch (err) {
      expect(err).toBeInstanceOf(HtmlPdfxError);
      expect(["NO_ENGINE", "ENGINE_LAUNCH_FAILED"]).toContain(
        (err as HtmlPdfxError).code
      );
    }
  });
});
