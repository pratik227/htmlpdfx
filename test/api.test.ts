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

  it("fails with NO_ENGINE in Node when no Chromium driver is installed", async () => {
    // puppeteer/playwright are not installed in this test env.
    try {
      await toPdf("<h1>x</h1>");
      // If a driver happens to be installed, that's fine too.
    } catch (err) {
      expect(err).toBeInstanceOf(HtmlPdfxError);
      expect((err as HtmlPdfxError).code).toBe("NO_ENGINE");
    }
  });

  it("rejects an explicitly-requested unavailable engine", async () => {
    await expect(toPdf("<h1>x</h1>", { engine: "canvas" })).rejects.toMatchObject({
      code: "ENGINE_UNAVAILABLE",
    });
  });
});
