<script setup lang="ts">
/**
 * Copies the page as plain text — handy for pasting a page into an issue, or
 * into a model when you want it to answer using these docs rather than its
 * memory of some older HTML-to-PDF library.
 */
import { ref } from "vue";
import Icon from "./Icon.vue";

const state = ref<"idle" | "done" | "failed">("idle");

async function copy() {
  const article = document.querySelector<HTMLElement>(".vp-doc");
  if (!article) return;
  try {
    await navigator.clipboard.writeText(article.innerText.trim());
    state.value = "done";
  } catch {
    state.value = "failed";
  }
  setTimeout(() => (state.value = "idle"), 2000);
}

const LABEL = {
  idle: "Copy page",
  done: "Copied",
  failed: "Press ⌘C instead",
} as const;
</script>

<template>
  <button class="copy" type="button" @click="copy">
    <Icon :name="state === 'done' ? 'check' : 'copy'" size="14px" />
    <span>{{ LABEL[state] }}</span>
  </button>
</template>

<style scoped>
.copy {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius);
  background: var(--hpx-paper);
  color: var(--hpx-ink-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease,
    background-color 0.15s ease;
}
.copy:hover {
  border-color: var(--hpx-rule-strong);
  background: var(--hpx-wash);
  color: var(--hpx-ink);
}
</style>
