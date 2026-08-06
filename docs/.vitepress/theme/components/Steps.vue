<script setup lang="ts">
/**
 * A numbered sequence. Only use this where order genuinely matters — install
 * before configure, configure before render. For a set of options that can be
 * read in any order, use CardGroup instead; numbering them would imply a
 * sequence that isn't there.
 */
</script>

<template>
  <div class="steps"><slot /></div>
</template>

<style scoped>
.steps {
  counter-reset: hpx-step;
  margin: 24px 0;
}
</style>
