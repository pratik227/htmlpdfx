# Frameworks

htmlpdfx renders whatever the browser paints, so CSS frameworks and component
libraries work without special handling. The **chromium** engine gives the best
fidelity (it *is* a browser); the **canvas** engine inlines computed styles, so
utility classes and CSS variables are captured.

## Tailwind CSS (incl. v4 / `oklch`)

Tailwind v4 emits `oklch()` colors by default. htmlpdfx never parses colors
itself, so they pass straight through to the engine and render correctly.

```ts
// Server — best fidelity, selectable text
await toPdf(tailwindHtml, { format: "a4", chromium: { printBackground: true } });
```

## shadcn/ui

shadcn themes are Tailwind + CSS custom properties (`--background`, `--primary`,
`--radius`, …). The canvas engine resolves these to computed values when it
inlines styles, so cards, borders, and theme colors reproduce faithfully.

## Vue, Vuetify & Quasar

Render the already-mounted DOM node:

```vue
<template>
  <div ref="doc">
    <v-card>…Vuetify / Quasar components…</v-card>
  </div>
  <button @click="save">Download</button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { toPdf } from "htmlpdfx";

const doc = ref<HTMLElement | null>(null);
async function save() {
  const pdf = await toPdf({ element: doc.value! }, {
    margin: 12,
    pageBreak: { avoid: [".v-card", ".q-card"] },
  });
  await pdf.download("export.pdf");
}
</script>
```

For Vuetify/Quasar data tables, add the row selector to `pageBreak.avoid`
(e.g. `["tr", ".v-data-table__tr"]`) so rows never split across pages.

## Server-side component → PDF (React & Vue)

For server-generated documents (invoices, reports, statements) you usually
don't have a DOM — you have a component. The dedicated adapters server-render
it for you and hand the markup to the Chromium engine, so you get selectable
text, real page breaks, and repeating table headers with one call.

`react`/`react-dom` and `vue`/`@vue/server-renderer` are **optional peer
dependencies** — installed only if you import these entry points.

```ts
// htmlpdfx/react
import { toPdfFromReact } from "htmlpdfx/react";
import Invoice from "./Invoice";

const pdf = await toPdfFromReact(<Invoice order={order} />, {
  format: "a4",
  footer: { template: "Page {{page}} / {{pages}}" },
  head: '<link rel="stylesheet" href="https://cdn.example.com/print.css">',
});
await pdf.save("invoice.pdf");
```

```ts
// htmlpdfx/vue
import { toPdfFromVue } from "htmlpdfx/vue";
import Invoice from "./Invoice.vue";

const pdf = await toPdfFromVue(Invoice, {
  props: { order },
  format: "a4",
  footer: { template: "Page {{page}} / {{pages}}" },
});
await pdf.save("invoice.pdf");
```

Both accept all the usual options, plus `head` (markup injected into `<head>`)
and `lang`. The Vue adapter also takes `props` for the root component.

## React / Angular / Svelte (client-side)

In the browser, pass the rendered element (`{ element: ref.current }`); on the
server, use the adapters above or render the component to an HTML string and
hand it to `toPdf` with the chromium engine.

::: tip Verified
Tailwind utilities, `oklch` colors, CSS grid, flexbox, and shadcn-style CSS
variables are all exercised by `test/frameworks-harness.html`, run through real
Chromium in CI.
:::
