<script setup lang="ts">
/**
 * The eyebrow row above every page title: where you are, and a way to take the
 * page with you. Rendered into VitePress's `doc-before` slot.
 */
import { computed } from "vue";
import { useRoute } from "vitepress";
import CopyPage from "./CopyPage.vue";

const route = useRoute();

const SECTIONS: Record<string, string> = {
  guide: "Guide",
  api: "API reference",
  capabilities: "Capabilities",
};

const section = computed(() => {
  const first = route.path.replace(/^\//, "").split("/")[0] ?? "";
  return SECTIONS[first] ?? "";
});
</script>

<template>
  <div v-if="section" class="doc-top">
    <span class="crumb">{{ section }}</span>
    <CopyPage />
  </div>
</template>

<style scoped>
.doc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.crumb {
  font-size: 13px;
  font-weight: 500;
  color: var(--hpx-ink-3);
}
</style>
