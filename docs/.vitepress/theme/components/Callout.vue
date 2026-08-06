<script setup lang="ts">
import Icon from "./Icon.vue";

type Kind = "note" | "tip" | "warning" | "danger";

const props = withDefaults(
  defineProps<{ type?: Kind; title?: string }>(),
  { type: "note" },
);

const SPEC: Record<Kind, { icon: string; title: string }> = {
  note: { icon: "note", title: "Note" },
  tip: { icon: "tip", title: "Tip" },
  warning: { icon: "warning", title: "Worth knowing" },
  danger: { icon: "danger", title: "Careful" },
};
</script>

<template>
  <aside class="callout" :class="`callout--${props.type}`">
    <Icon :name="SPEC[props.type].icon" class="glyph" size="18px" />
    <div class="body">
      <p class="title">{{ props.title ?? SPEC[props.type].title }}</p>
      <div class="prose"><slot /></div>
    </div>
  </aside>
</template>

<style scoped>
.callout {
  display: flex;
  gap: 12px;
  margin: 24px 0;
  padding: 14px 16px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius-lg);
  background: var(--hpx-wash);
}
.glyph {
  margin-top: 3px;
  color: var(--hpx-ink-3);
}
.body {
  min-width: 0;
}
.title {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--hpx-ink-3);
}
.prose {
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--hpx-ink);
}
.prose :deep(> :first-child) {
  margin-top: 0;
}
.prose :deep(> :last-child) {
  margin-bottom: 0;
}
.prose :deep(p) {
  margin: 8px 0;
}

/* Warning and danger earn colour: they change what a reader should do. */
.callout--warning {
  background: var(--hpx-partial-bg);
  border-color: color-mix(in srgb, var(--hpx-partial) 26%, transparent);
}
.callout--warning .glyph,
.callout--warning .title {
  color: var(--hpx-partial);
}
.callout--danger {
  background: var(--hpx-alert-bg);
  border-color: color-mix(in srgb, var(--hpx-alert) 26%, transparent);
}
.callout--danger .glyph,
.callout--danger .title {
  color: var(--hpx-alert);
}
</style>
