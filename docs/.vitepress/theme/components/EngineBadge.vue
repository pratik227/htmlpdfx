<script setup lang="ts">
/**
 * An inline "this belongs to the chromium tier" marker. Used in prose and
 * headings so a reader never has to scroll back up to work out which engine a
 * paragraph is talking about — the single most common way to misread these docs.
 */
import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    engine: "chromium" | "canvas";
    /** Append the tier ("high fidelity" / "best effort"). */
    tier?: boolean;
    /** Set false where the surrounding heading already names the engine. */
    name?: boolean;
  }>(),
  { tier: false, name: true },
);

const SPEC = {
  chromium: { label: "Chromium", tier: "high fidelity", icon: "chromium" },
  canvas: { label: "Canvas", tier: "best effort", icon: "canvas" },
} as const;
</script>

<template>
  <span class="badge" :class="`badge--${props.engine}`">
    <Icon :name="SPEC[props.engine].icon" size="14px" />
    <span v-if="name" class="name">{{ SPEC[props.engine].label }}</span>
    <span v-if="tier" class="tier" :class="{ bare: !name }">
      {{ SPEC[props.engine].tier }}
    </span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px 2px 7px;
  border: 1px solid var(--hpx-rule);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
  vertical-align: 1px;
}
.badge--chromium {
  color: var(--hpx-full);
  background: var(--hpx-full-bg);
  border-color: color-mix(in srgb, var(--hpx-full) 24%, transparent);
}
.badge--canvas {
  color: var(--hpx-partial);
  background: var(--hpx-partial-bg);
  border-color: color-mix(in srgb, var(--hpx-partial) 24%, transparent);
}
.tier {
  padding-left: 6px;
  margin-left: 1px;
  border-left: 1px solid currentColor;
  opacity: 0.7;
  font-weight: 400;
}
/* Without the engine name there's nothing to divide from. */
.tier.bare {
  padding-left: 0;
  margin-left: 0;
  border-left: none;
  opacity: 1;
  font-weight: 500;
}
</style>
