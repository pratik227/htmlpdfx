<script setup lang="ts">
/**
 * A Solar icon, resolved at build time. See docs/.vitepress/icons.ts for the
 * role -> icon registry; pass a role ("engines"), not a Solar name.
 */
import icons from "virtual:hpx-icons";

const props = withDefaults(
  defineProps<{ name: string; size?: string }>(),
  { size: "1em" },
);

const svg = icons[props.name];

if (!svg && typeof console !== "undefined") {
  console.warn(
    `[htmlpdfx docs] No icon registered for "${props.name}". ` +
      `Add it to ICONS in docs/.vitepress/icons.ts.`,
  );
}
</script>

<template>
  <span class="hpx-ico" :style="{ '--sz': size }" v-html="svg || ''" />
</template>

<style scoped>
.hpx-ico {
  display: inline-flex;
  flex: none;
  line-height: 0;
}
/* v-html content carries no scope attribute, so it needs :deep(). */
.hpx-ico :deep(svg) {
  width: var(--sz);
  height: var(--sz);
}
</style>
