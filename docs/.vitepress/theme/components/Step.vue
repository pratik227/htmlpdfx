<script setup lang="ts">
const props = defineProps<{ title: string }>();
</script>

<template>
  <div class="step">
    <div class="rail" aria-hidden="true"><span class="num" /></div>
    <div class="content">
      <p class="title">{{ props.title }}</p>
      <div class="prose"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
  counter-increment: hpx-step;
}
.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.num {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border: 1px solid var(--hpx-rule-strong);
  border-radius: 999px;
  background: var(--hpx-paper);
  font-size: 12.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--hpx-ink-2);
}
.num::before {
  content: counter(hpx-step);
}
/* The rail continues past the marker, so the sequence reads as connected. */
.rail::after {
  content: "";
  flex: 1;
  width: 1px;
  margin: 6px 0 0;
  background: var(--hpx-rule);
}
.step:last-child .rail::after {
  display: none;
}
.content {
  padding-bottom: 24px;
  min-width: 0;
}
.step:last-child .content {
  padding-bottom: 0;
}
.title {
  margin: 2px 0 6px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--hpx-ink);
}
.prose {
  font-size: 15px;
  line-height: 1.7;
  color: var(--hpx-ink-2);
}
.prose :deep(> :first-child) {
  margin-top: 0;
}
.prose :deep(> :last-child) {
  margin-bottom: 0;
}
.prose :deep(div[class*="language-"]) {
  margin: 12px 0;
}
</style>
