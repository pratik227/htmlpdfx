import type { Engine, EngineRenderResult } from "./types.js";
import type { NormalizedOptions } from "../core/options.js";
import type { ResolvedInput } from "../core/input.js";
import { buildInjectedCss, styleTag } from "../core/css.js";
import { fail } from "../utils/errors.js";
import { mmToIn } from "../utils/units.js";
import { isServerRuntime, optionalImport } from "../runtime.js";
import { countPdfPages } from "../utils/pdfmeta.js";

type Driver = "puppeteer" | "puppeteer-core" | "playwright" | "playwright-core";

const DRIVER_ORDER: Driver[] = [
  "puppeteer",
  "playwright",
  "puppeteer-core",
  "playwright-core",
];

interface LoadedDriver {
  name: Driver;
  family: "puppeteer" | "playwright";
  mod: any;
}

async function loadDriver(forced?: Driver): Promise<LoadedDriver | null> {
  const order = forced ? [forced] : DRIVER_ORDER;
  for (const name of order) {
    const mod = await optionalImport<any>(name);
    if (mod) {
      return {
        name,
        family: name.startsWith("puppeteer") ? "puppeteer" : "playwright",
        mod,
      };
    }
  }
  return null;
}

function inches(mm: number): string {
  return `${mmToIn(mm).toFixed(4)}in`;
}

/** Translate {{page}} / {{pages}} / {{date}} / {{title}} into Chromium spans. */
function expandTemplate(tpl: string): string {
  const body = tpl
    .replace(/\{\{\s*page\s*\}\}/g, '<span class="pageNumber"></span>')
    .replace(/\{\{\s*pages\s*\}\}/g, '<span class="totalPages"></span>')
    .replace(/\{\{\s*date\s*\}\}/g, '<span class="date"></span>')
    .replace(/\{\{\s*title\s*\}\}/g, '<span class="title"></span>');
  // Chromium defaults header/footer font-size to 0 — force something visible.
  return `<div style="font-size:9px; width:100%; padding:0 10mm; box-sizing:border-box;">${body}</div>`;
}

export const chromiumEngine: Engine = {
  name: "chromium",

  async isAvailable(opts: NormalizedOptions): Promise<boolean> {
    if (!isServerRuntime()) return false;
    if (opts.chromium.browser) return true;
    return (await loadDriver(opts.chromium.driver)) !== null;
  },

  async render(
    input: ResolvedInput,
    opts: NormalizedOptions
  ): Promise<EngineRenderResult> {
    if (input.kind === "element") {
      fail(
        "INVALID_INPUT",
        "The chromium engine cannot accept a live DOM Element.",
        "Pass HTML/URL/file, or use the canvas engine in the browser."
      );
    }

    const driver = opts.chromium.browser
      ? null
      : await loadDriver(opts.chromium.driver);

    if (!opts.chromium.browser && !driver) {
      fail(
        "ENGINE_UNAVAILABLE",
        "No Chromium driver found.",
        "Install one of: `npm i puppeteer` (bundles Chromium) or `npm i playwright`."
      );
    }

    const family: "puppeteer" | "playwright" =
      driver?.family ??
      (detectFamily(opts.chromium.browser) ?? "puppeteer");

    let browser: any = opts.chromium.browser ?? null;
    let ownsBrowser = false;
    let context: any = null;
    let page: any;

    try {
      if (!browser) {
        const launchOpts: Record<string, unknown> = {
          args: ["--no-sandbox", "--font-render-hinting=none", ...opts.chromium.launchArgs],
        };
        if (opts.chromium.executablePath) {
          launchOpts.executablePath = opts.chromium.executablePath;
        }
        browser =
          family === "playwright"
            ? await driver!.mod.chromium.launch(launchOpts)
            : await driver!.mod.launch(launchOpts);
        ownsBrowser = true;
      }

      if (family === "playwright") {
        context = await browser.newContext();
        page = await context.newPage();
      } else {
        page = await browser.newPage();
      }

      page.setDefaultTimeout?.(opts.chromium.timeout);
      page.setDefaultNavigationTimeout?.(opts.chromium.timeout);

      await loadContent(page, input, opts, family);
      await injectAssets(page, opts);
      await emulateMedia(page, opts, family);
      await waitForReady(page, opts, family);

      const bytes = await printPdf(page, opts, family);
      return { bytes, pageCount: countPdfPages(bytes) };
    } finally {
      try {
        if (context) await context.close();
        else if (page) await page.close();
      } catch {
        /* ignore */
      }
      if (ownsBrowser && browser) {
        try {
          await browser.close();
        } catch {
          /* ignore */
        }
      }
    }
  },
};

function detectFamily(browser: unknown): "puppeteer" | "playwright" | null {
  if (!browser || typeof browser !== "object") return null;
  // Playwright Browser has `.contexts()`, puppeteer has `.pages()`.
  if (typeof (browser as any).contexts === "function") return "playwright";
  if (typeof (browser as any).newPage === "function") return "puppeteer";
  return null;
}

async function loadContent(
  page: any,
  input: ResolvedInput,
  opts: NormalizedOptions,
  family: "puppeteer" | "playwright"
): Promise<void> {
  const waitUntil = mapWaitUntil(opts.chromium.waitUntil, family, true);

  if (input.kind === "url") {
    await page.goto(input.url, { waitUntil, timeout: opts.chromium.timeout });
    return;
  }
  if (input.kind === "file") {
    // Cross-platform: pathToFileURL handles Windows drive letters & spaces.
    let url = input.file;
    if (!url.startsWith("file:")) {
      try {
        const { pathToFileURL } = await import("node:url");
        url = pathToFileURL(input.file).href;
      } catch {
        url = `file://${input.file}`;
      }
    }
    await page.goto(url, { waitUntil, timeout: opts.chromium.timeout });
    return;
  }

  // HTML string.
  if (input.kind !== "html") {
    fail("INVALID_INPUT", "Unexpected input kind for the chromium engine.");
  }
  let html = input.html;
  if (input.baseUrl && !/<base\s/i.test(html)) {
    const baseTag = `<base href="${input.baseUrl}">`;
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
      : `${baseTag}${html}`;
  }
  await page.setContent(html, {
    waitUntil: mapWaitUntil(opts.chromium.waitUntil, family, false),
    timeout: opts.chromium.timeout,
  });
}

function mapWaitUntil(
  w: NormalizedOptions["chromium"]["waitUntil"],
  family: "puppeteer" | "playwright",
  isNavigation: boolean
): string {
  if (w === "fonts") return isNavigation ? "load" : "load";
  if (w === "networkidle") return family === "playwright" ? "networkidle" : "networkidle0";
  return w; // load | domcontentloaded
}

async function injectAssets(page: any, opts: NormalizedOptions): Promise<void> {
  const css = buildInjectedCss(opts);
  // Append a style tag rather than addStyleTag so it lands last (wins cascade).
  await page.evaluate((tag: string) => {
    const tpl = document.createElement("template");
    tpl.innerHTML = tag;
    document.head.appendChild(tpl.content.firstElementChild as Node);
  }, styleTag(css));
}

async function emulateMedia(
  page: any,
  opts: NormalizedOptions,
  family: "puppeteer" | "playwright"
): Promise<void> {
  const media = opts.chromium.mediaScreen ? "screen" : "print";
  if (family === "playwright") {
    await page.emulateMedia({ media });
  } else {
    await page.emulateMediaType(media);
  }
}

async function waitForReady(
  page: any,
  opts: NormalizedOptions,
  _family: "puppeteer" | "playwright"
): Promise<void> {
  // Always wait for web fonts so text isn't measured/printed pre-swap.
  try {
    await page.evaluate(() =>
      (document as any).fonts ? (document as any).fonts.ready : Promise.resolve()
    );
  } catch {
    /* ignore */
  }
  // Wait for every <img> to settle so images never render blank.
  try {
    await page.evaluate(
      () =>
        Promise.all(
          Array.from(document.images).map((img) =>
            (img as HTMLImageElement).complete
              ? Promise.resolve()
              : new Promise<void>((res) => {
                  img.addEventListener("load", () => res(), { once: true });
                  img.addEventListener("error", () => res(), { once: true });
                })
          )
        ).then(() => undefined)
    );
  } catch {
    /* ignore */
  }
}

async function printPdf(
  page: any,
  opts: NormalizedOptions,
  _family: "puppeteer" | "playwright"
): Promise<Uint8Array> {
  const pdfOptions: Record<string, unknown> = {
    width: inches(opts.page.widthMm),
    height: inches(opts.page.heightMm),
    margin: {
      top: inches(opts.margin.topMm),
      right: inches(opts.margin.rightMm),
      bottom: inches(opts.margin.bottomMm),
      left: inches(opts.margin.leftMm),
    },
    printBackground: opts.chromium.printBackground,
    scale: opts.chromium.scale,
    preferCSSPageSize: false,
  };

  if (opts.header || opts.footer) {
    pdfOptions.displayHeaderFooter = true;
    pdfOptions.headerTemplate = opts.header
      ? expandTemplate(opts.header.template)
      : "<span></span>";
    pdfOptions.footerTemplate = opts.footer
      ? expandTemplate(opts.footer.template)
      : "<span></span>";
  }

  const out = await page.pdf(pdfOptions);
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}
