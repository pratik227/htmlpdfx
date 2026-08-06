<script setup lang="ts">
const props = withDefaults(defineProps<{ cols?: number | string }>(), {
  cols: 2,
});
</script>

<template>
  <div class="cards" :style="{ '--cols': String(props.cols) }">
    <slot />
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0;
}
@media (max-width: 720px) {
  .cards {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
