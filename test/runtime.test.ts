import { describe, it, expect } from "vitest";
import {
  detectRuntime,
  isServerRuntime,
  isBrowserRuntime,
  optionalImport,
} from "../src/runtime.js";

describe("runtime", () => {
  it("detects a server runtime under vitest", () => {
    const rt = detectRuntime();
    expect(["node", "bun", "deno"]).toContain(rt);
    expect(isServerRuntime(rt)).toBe(true);
    expect(isBrowserRuntime(rt)).toBe(false);
  });

  it("returns null for a missing optional dependency", async () => {
    expect(await optionalImport("totally-not-a-real-pkg-xyz")).toBeNull();
  });

  it("imports a real builtin", async () => {
    const fs = await optionalImport<any>("node:path");
    expect(fs).toBeTruthy();
  });
});
