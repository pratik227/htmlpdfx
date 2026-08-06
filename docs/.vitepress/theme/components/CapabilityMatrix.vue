<script setup lang="ts">
/**
 * The two-tier matrix. This is the centrepiece of the docs: htmlpdfx has two
 * engines and they are deliberately not equal, and almost every support
 * question a reader has is really "which tier am I on?".
 *
 * Every row states *why* the tiers differ rather than just marking a cell, and
 * the tally in each header is computed from the data — so the page can't drift
 * into claiming more than the matrix actually says.
 */
import { computed } from "vue";
import Icon from "./Icon.vue";
import TierMark from "./TierMark.vue";
import { CAPABILITIES, TIERS, type Support } from "../../data/capabilities";

type EngineId = "chromium" | "canvas";

const total = computed(() =>
  CAPABILITIES.reduce((n, g) => n + g.items.length, 0),
);

const tallies = computed(() => {
  const blank = (): Record<Support, number> => ({
    full: 0,
    partial: 0,
    none: 0,
  });
  const out: Record<EngineId, Record<Support, number>> = {
    chromium: blank(),
    canvas: blank(),
  };
  for (const group of CAPABILITIES) {
    for (const cap of group.items) {
      out.chromium[cap.chromium]++;
      out.canvas[cap.canvas]++;
    }
  }
  return out;
});

/** Notes are authored with `backticks` for code — honour just that, safely. */
function renderNote(note: string): string {
  return note
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
</script>

<template>
  <div class="matrix">
    <div class="head">
      <div class="head-spacer">
        <span class="count">{{ total }} capabilities</span>
      </div>
      <div
        v-for="(engine, id) in TIERS"
        :key="id"
        class="tier"
        :class="`tier--${id}`"
      >
        <Icon :name="engine.icon" size="18px" class="tier-glyph" />
        <p class="tier-name">{{ engine.label }}</p>
        <p class="tier-kind">{{ engine.tier }}</p>
        <!-- The proportions say more at a glance than three numbers do. -->
        <div
          class="bar"
          role="img"
          :aria-label="`${tallies[id].full} of ${total} fully supported, ${tallies[id].partial} partial, ${tallies[id].none} unsupported`"
        >
          <span
            v-for="level in (['full', 'partial', 'none'] as Support[])"
            v-show="tallies[id][level] > 0"
            :key="level"
            class="seg"
            :class="`seg--${level}`"
            :style="{ flexGrow: tallies[id][level] }"
          />
        </div>
        <p class="tier-tally">
          <strong>{{ tallies[id].full }}</strong> of {{ total }} full
        </p>
      </div>
    </div>

    <section v-for="group in CAPABILITIES" :key="group.group" class="group">
      <h3 class="group-name">{{ group.group }}</h3>
      <div v-for="cap in group.items" :key="cap.title" class="row">
        <div class="cap">
          <p class="cap-title">{{ cap.title }}</p>
          <p class="cap-note" v-html="renderNote(cap.note)" />
        </div>
        <div class="cell" :data-label="TIERS.chromium.label">
          <TierMark :level="cap.chromium" />
        </div>
        <div class="cell" :data-label="TIERS.canvas.label">
          <TierMark :level="cap.canvas" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.matrix {
  margin: 28px 0;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius-lg);
  overflow: hidden;
}

/* --- Headers --- */
.head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px 132px;
  border-bottom: 1px solid var(--hpx-rule-strong);
  background: var(--hpx-wash);
}
.head-spacer {
  display: flex;
  align-items: flex-end;
  padding: 14px 16px;
}
.count {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--hpx-ink-3);
}
.tier {
  padding: 12px 14px;
  border-left: 1px solid var(--hpx-rule);
  text-align: center;
}
.tier-glyph {
  color: var(--hpx-ink-3);
}
.tier--chromium .tier-glyph {
  color: var(--hpx-full);
}
.tier--canvas .tier-glyph {
  color: var(--hpx-partial);
}
.tier-name {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--hpx-ink);
}
.tier-kind {
  margin: 0;
  font-size: 11.5px;
  color: var(--hpx-ink-3);
}
.bar {
  display: flex;
  gap: 2px;
  height: 4px;
  margin: 9px 0 5px;
}
.seg {
  border-radius: 2px;
  min-width: 3px;
}
.seg--full {
  background: var(--hpx-full);
}
.seg--partial {
  background: var(--hpx-partial);
}
.seg--none {
  background: var(--hpx-none);
}
.tier-tally {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--hpx-ink-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.tier-tally strong {
  color: var(--hpx-ink-2);
  font-weight: 600;
}

/* --- Groups and rows --- */
.group-name {
  margin: 0;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--hpx-ink-3);
  background: var(--hpx-wash);
  border-bottom: 1px solid var(--hpx-rule);
}
.group:not(:first-of-type) .group-name {
  border-top: 1px solid var(--hpx-rule);
}
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px 132px;
  align-items: stretch;
}
.row + .row {
  border-top: 1px solid var(--hpx-rule);
}
.cap {
  padding: 12px 16px;
  min-width: 0;
}
.cap-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--hpx-ink);
}
.cap-note {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--hpx-ink-2);
}
.cap-note :deep(code) {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--hpx-wash);
}
.cell {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 8px;
  border-left: 1px solid var(--hpx-rule);
}

/* --- Narrow screens: stacked rows with inline labels --- */
@media (max-width: 720px) {
  .head {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .head-spacer {
    display: none;
  }
  .row {
    grid-template-columns: minmax(0, 1fr);
  }
  .cell {
    justify-content: flex-start;
    border-left: none;
    padding: 0 16px 10px;
  }
  .cell::before {
    content: attr(data-label);
    margin-right: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--hpx-ink-3);
    min-width: 74px;
  }
  .cap {
    padding-bottom: 8px;
  }
}
</style>
