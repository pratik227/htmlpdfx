import { describe, it, expect } from "vitest";
import { wrapHtmlDocument } from "../src/core/template.js";
import { toPdfFromReact } from "../src/react.js";
import { toPdfFromVue } from "../src/vue.js";
import { HtmlPdfxError } from "../src/utils/errors.js";

async function isInstalled(name: string): Promise<boolean> {
  try {
    await import(name);
    return true;
  } catch {
    return false;
  }
}

// Errors that prove the adapter rendered the component and reached the engine
// (i.e. it got *past* the framework SSR step).
const ENGINE_ERRORS = ["NO_ENGINE", "ENGINE_LAUNCH_FAILED"];

describe("wrapHtmlDocument", () => {
  it("wraps a fragment in a full HTML document", () => {
    const html = wrapHtmlDocument("<h1>Hi</h1>");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<h1>Hi</h1>");
  });

  it("injects head content and a custom lang", () => {
    const html = wrapHtmlDocument("<p>x</p>", {
      head: "<style>p{color:red}</style>",
      lang: "fr",
    });
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain("<style>p{color:red}</style>");
  });

  it("leaves an already-complete document untouched", () => {
    const doc = "<html><body>done</body></html>";
    expect(wrapHtmlDocument(doc)).toBe(doc);
  });
});

describe("React adapter", () => {
  it("surfaces a clean typed error (MISSING_PEER if react-dom absent)", async () => {
    const present = await isInstalled("react-dom/server");
    try {
      await toPdfFromReact("<unused/>");
    } catch (err) {
      expect(err).toBeInstanceOf(HtmlPdfxError);
      const code = (err as HtmlPdfxError).code;
      expect(present ? ENGINE_ERRORS : ["MISSING_PEER"]).toContain(code);
    }
  });
});

describe("Vue adapter", () => {
  it("renders a component via Vue SSR, then reaches the engine", async () => {
    const present = await isInstalled("vue");
    if (!present) {
      await expect(toPdfFromVue({})).rejects.toMatchObject({
        code: "MISSING_PEER",
      });
      return;
    }
    // vue is available: build a render-function component (no template
    // compiler needed) and confirm the adapter gets past SSR to the engine.
    const { h } = await import("vue");
    const Comp = { render: () => h("main", { id: "report" }, "Vue PDF") };
    try {
      await toPdfFromVue(Comp);
    } catch (err) {
      expect(err).toBeInstanceOf(HtmlPdfxError);
      // Not MISSING_PEER — SSR succeeded; only the engine is unavailable here.
      expect(ENGINE_ERRORS).toContain((err as HtmlPdfxError).code);
    }
  });
});
