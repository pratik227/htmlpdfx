<script setup lang="ts">
/**
 * Whether an engine supports something. This is the one place colour is used
 * to mean something, so it is deliberately never decorative — and it always
 * carries a text label as well as a hue, because colour alone isn't an
 * accessible signal.
 */
import Icon from "./Icon.vue";
import type { Support } from "../../data/capabilities";

const props = withDefaults(
  defineProps<{ level: Support; label?: boolean }>(),
  { label: true },
);

const SPEC: Record<Support, { icon: string; text: string }> = {
  full: { icon: "yes", text: "Yes" },
  partial: { icon: "partial", text: "Partial" },
  none: { icon: "no", text: "No" },
};
</script>

<template>
  <span class="hpx-mark" :class="`hpx-mark--${props.level}`">
    <Icon :name="SPEC[props.level].icon" size="16px" />
    <span v-if="label">{{ SPEC[props.level].text }}</span>
    <span v-else class="sr-only">{{ SPEC[props.level].text }}</span>
  </span>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
