import { describe, it, expect } from "vitest";
import { resolveInput } from "../src/core/input.js";

describe("resolveInput", () => {
  it("detects HTML markup strings", () => {
    expect(resolveInput("<h1>Hi</h1>")).toEqual({
      kind: "html",
      html: "<h1>Hi</h1>",
      baseUrl: undefined,
    });
  });

  it("wraps bare text in a div", () => {
    const r = resolveInput("just text");
    expect(r.kind).toBe("html");
    if (r.kind === "html") expect(r.html).toBe("<div>just text</div>");
  });

  it("escapes bare text", () => {
    const r = resolveInput("a < b & c");
    if (r.kind === "html") expect(r.html).toContain("a &lt; b &amp; c");
  });

  it("detects http/https/file URLs", () => {
    expect(resolveInput("https://example.com")).toEqual({
      kind: "url",
      url: "https://example.com",
    });
    expect(resolveInput("file:///tmp/x.html").kind).toBe("url");
  });

  it("accepts descriptor objects", () => {
    expect(resolveInput({ html: "<p>x</p>", baseUrl: "https://a.com" })).toEqual(
      { kind: "html", html: "<p>x</p>", baseUrl: "https://a.com" }
    );
    expect(resolveInput({ url: "https://a.com" }).kind).toBe("url");
    expect(resolveInput({ file: "/x.html" }).kind).toBe("file");
  });

  it("uses fallback baseUrl for html strings", () => {
    const r = resolveInput("<p>x</p>", "https://base.test");
    if (r.kind === "html") expect(r.baseUrl).toBe("https://base.test");
  });

  it("throws on unsupported input", () => {
    expect(() => resolveInput(42 as never)).toThrow();
    expect(() => resolveInput({} as never)).toThrow();
  });
});
