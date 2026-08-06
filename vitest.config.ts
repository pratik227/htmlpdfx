import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Several tests assert on the *failure* path of a real browser launch
    // (NO_ENGINE / ENGINE_LAUNCH_FAILED). Puppeteer and Playwright both spend
    // seconds probing for an executable before giving up, which lands right on
    // vitest's 5s default — and slower on Windows CI runners. Give them room.
    testTimeout: 30_000,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
