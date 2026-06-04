import { describe, it, expect } from "vitest";
import htmlpdfx, {
  toPdf,
  html2pdf,
  presets,
  HtmlPdfxBuilder,
  HtmlPdfxError,
} from "../src/index.js";

describe("public API", () => {
  it("exports the builder factory and aliases", () => {
    expect(htmlpdfx()).toBeInstanceOf(HtmlPdfxBuilder);
    expect(html2pdf).toBe(htmlpdfx);
    expect(typeof toPdf).toBe("function");
  });

  it("chains fluently and returns the same builder", () => {
    const b = htmlpdfx().from("<p>hi</p>").set({ margin: 5 }).to("a5").using("auto");
    expect(b).toBeInstanceOf(HtmlPdfxBuilder);
  });

  it("rejects when render is called without input", async () => {
    await expect(htmlpdfx().render()).rejects.toThrow(/from\(input\)/);
  });

  it("ships ready-made presets", () => {
    expect(presets.document.format).toBe("a4");
    expect(presets.report.footer?.template).toContain("{{page}}");
    expect(presets.fullBleed.margin).toBe(0);
  });

  it("surfaces a clean HtmlPdfxError in Node when no usable Chromium engine exists", async () => {
    // Depending on the environment, either no driver module is installed
    // (NO_ENGINE), or a driver module is present but its browser binary is not
    // (ENGINE_LAUNCH_FAILED). If a real browser happens to be installed,
    // rendering simply succeeds. In no case should a raw driver error leak out.
    try {
      await toPdf("<h1>x</h1>");
      // A usable engine was present — fine.
    } catch (err) {
      expect(err).toBeInstanceOf(HtmlPdfxError);
      expect(["NO_ENGINE", "ENGINE_LAUNCH_FAILED"]).toContain(
        (err as HtmlPdfxError).code
      );
    }
  });

  it("rejects an explicitly-requested unavailable engine", async () => {
    await expect(toPdf("<h1>x</h1>", { engine: "canvas" })).rejects.toMatchObject({
      code: "ENGINE_UNAVAILABLE",
    });
  });
});
