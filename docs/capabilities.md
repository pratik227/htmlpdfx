# Capabilities

htmlpdfx has two rendering tiers, and they are deliberately not equal. Knowing which one you're on is the difference between "my PDF matches my webpage" and "close enough".

<CardGroup :cols="2">

<Card title="Chromium" icon="chromium">

<EngineBadge engine="chromium" tier :name="false" />

The browser's own print-to-PDF, via Puppeteer (bundled) or Playwright. The PDF **is** the webpage, rendered by the same engine — so page breaks, fonts, CSS, and layout are correct by construction. Runs on Node, Bun, and Deno, and is the default whenever a Chromium driver is available.

Use this for anything user-facing.

</Card>

<Card title="Canvas" icon="canvas">

<EngineBadge engine="canvas" tier :name="false" />

A zero-dependency DOM rasterizer for the browser when Chromium isn't available. It produces a faithful _screenshot_ of your DOM, sliced cleanly across pages — but it is a raster, not a reflow.

Use it as graceful degradation, not as a replacement for the real engine.

</Card>

</CardGroup>

## What each tier supports

Every row says _why_ the two differ, because "partial" on its own isn't useful information.

<CapabilityMatrix />

<Callout type="tip" title="Rule of thumb">

If the output is for a human — invoices, reports, tickets — use the Chromium tier. The canvas tier exists so a browser-only build still produces _something_ when Chromium can't run.

</Callout>

## Check the tier at runtime

The same matrix is available programmatically, so you can branch, warn, or degrade a feature instead of shipping a surprise:

```ts
import { engineCapabilities, describeEngines } from "htmlpdfx";

engineCapabilities.chromium.selectableText; // true
engineCapabilities.canvas.tier; // "best-effort"
describeEngines(); // one-line summary for a log or CLI
```

Or read it off a finished render:

```ts
const pdf = await toPdf(html);

if (pdf.engine === "canvas") {
  console.warn("Rasterized fallback — text in this PDF is not selectable.");
}
```

## Not implemented yet

These are real gaps rather than partial support. They're additive, so they can land in a 1.x release:

<CardGroup :cols="3">

<Card title="Form fields" icon="pen">

Interactive AcroForm widgets.

</Card>

<Card title="Encryption" icon="danger">

User and owner passwords, and permission flags.

</Card>

<Card title="&lt;PdfExport&gt;" icon="frameworks">

A browser component for client-side React and Vue export.

</Card>

</CardGroup>

## How this is verified

Every claim above is checked against a real produced PDF rather than asserted in prose. `test/e2e.mjs` renders through real Chromium in CI and asserts on the output bytes — page count, extractable text, repeating `<thead>`, link annotations, a navigable outline, and renderer pooling — while `test/cross-browser.mjs` drives the canvas tier through Chromium, Firefox, and WebKit.

```bash
npm test             # unit + behaviour suite
npm run test:browser # Chromium + Firefox + WebKit rendering
npm run test:e2e     # assert on a real Chromium-produced PDF
```
