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

## React / Angular / Svelte

Same pattern — pass the rendered element (`{ element: ref.current }`) in the
browser, or render the component to an HTML string and use the chromium engine
on the server.

::: tip Verified
Tailwind utilities, `oklch` colors, CSS grid, flexbox, and shadcn-style CSS
variables are all exercised by `test/frameworks-harness.html`, run through real
Chromium in CI.
:::
