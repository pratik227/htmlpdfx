<script setup lang="ts">
import Icon from "./Icon.vue";

const props = defineProps<{
  title: string;
  icon?: string;
  href?: string;
}>();
</script>

<template>
  <component
    :is="props.href ? 'a' : 'div'"
    :href="props.href"
    class="card"
    :class="{ 'is-link': !!props.href }"
  >
    <Icon v-if="props.icon" :name="props.icon" class="glyph" size="20px" />
    <p class="title">
      {{ props.title }}
      <Icon v-if="props.href" name="arrow" class="chev" size="14px" />
    </p>
    <div class="prose"><slot /></div>
  </component>
</template>

<style scoped>
.card {
  display: block;
  padding: 16px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius-lg);
  background: var(--hpx-paper);
  color: var(--hpx-ink);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.card.is-link:hover {
  border-color: var(--hpx-rule-strong);
  background: var(--hpx-wash);
}
.glyph {
  color: var(--hpx-ink-3);
  margin-bottom: 10px;
}
.title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.chev {
  color: var(--hpx-ink-3);
  transition: transform 0.15s ease;
}
.card.is-link:hover .chev {
  transform: translateX(2px);
  color: var(--hpx-ink);
}
.prose {
  font-size: 14px;
  line-height: 1.65;
  color: var(--hpx-ink-2);
}
.prose :deep(> :first-child) {
  margin-top: 0;
}
.prose :deep(> :last-child) {
  margin-bottom: 0;
}
.prose :deep(p) {
  margin: 6px 0;
}
.prose :deep(code) {
  font-size: 12.5px;
}
</style>
