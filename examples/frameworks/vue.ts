// Vue 3 — export a rendered component to PDF (browser).
// htmlpdfx renders whatever the framework already painted, so Vuetify/Quasar
// component styles come along for free.
import { ref } from "vue";
import { toPdf } from "htmlpdfx";

export function useExportPdf() {
  const target = ref<HTMLElement | null>(null);

  async function exportPdf() {
    if (!target.value) return;
    const pdf = await toPdf(
      { element: target.value },
      {
        format: "a4",
        margin: 12,
        pageBreak: { avoid: [".v-card", ".q-card", ".no-break"] },
        canvas: { scale: 2 },
      },
    );
    await pdf.download("export.pdf");
  }

  return { target, exportPdf };
}

/*
<template>
  <div ref="target">
    <v-card class="v-card">…Vuetify content…</v-card>
  </div>
  <v-btn @click="exportPdf">Download PDF</v-btn>
</template>

<script setup lang="ts">
const { target, exportPdf } = useExportPdf();
</script>
*/
