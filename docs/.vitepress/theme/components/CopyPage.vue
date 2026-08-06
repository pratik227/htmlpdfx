<script setup lang="ts">
/**
 * Copies the page for pasting into an issue — or into a coding agent, so it
 * answers from these docs rather than from its memory of some older
 * HTML-to-PDF library.
 *
 * Prefers the markdown source (served beside every page by
 * scripts/gen-llms.mjs), because rendered text loses code fences and tables,
 * which is most of what a model needs. Falls back to the visible text.
 */
import { ref } from "vue";
import { useRoute } from "vitepress";
import Icon from "./Icon.vue";

const route = useRoute();
const state = ref<"idle" | "done" | "failed">("idle");

/** `/guide/engines` -> `/guide/engines.md`, `/api/` -> `/api/index.md` */
function markdownUrl(path: string): string {
  const clean = path.replace(/\.html$/, "");
  if (clean.endsWith("/")) return `${clean}index.md`;
  return `${clean}.md`;
}

async function pageText(): Promise<string> {
  try {
    const res = await fetch(markdownUrl(route.path));
    if (res.ok) {
      const md = await res.text();
      // A dev server with a history fallback answers 200 with the HTML shell.
      if (!/^\s*<(?:!doctype|html)/i.test(md)) return md.trim();
    }
  } catch {
    /* fall through to the rendered text */
  }
  return document.querySelector<HTMLElement>(".vp-doc")?.innerText.trim() ?? "";
}

async function copy() {
  const text = await pageText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    state.value = "done";
  } catch {
    state.value = "failed";
  }
  setTimeout(() => (state.value = "idle"), 2000);
}

const LABEL = {
  idle: "Copy page",
  done: "Copied as markdown",
  failed: "Copy failed",
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
  white-space: nowrap;
  transition: border-color 0.15s ease, color 0.15s ease,
    background-color 0.15s ease;
}
.copy:hover {
  border-color: var(--hpx-rule-strong);
  background: var(--hpx-wash);
  color: var(--hpx-ink);
}
</style>
