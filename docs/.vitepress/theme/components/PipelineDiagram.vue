<script setup lang="ts">
/**
 * The render pipeline, as a diagram rather than ASCII art.
 *
 * Deliberately built from HTML and CSS with two tiny SVG connectors, not from a
 * diagramming library: the labels stay selectable and searchable, it reflows on
 * a phone, it inherits the site's own hairlines and tier colours, and it adds
 * nothing to the page weight. Importing Mermaid to draw five boxes would cost
 * more than the rest of the site put together.
 */
import Icon from "./Icon.vue";

const STAGES = [
  {
    fn: "normalizeOptions",
    desc: "One canonical, unit-free config — everything resolved to mm internally.",
  },
  {
    fn: "resolveInput",
    desc: "Works out what you passed: an HTML string, a URL, a file, or a live DOM node.",
  },
  {
    fn: "selectEngine",
    desc: "`auto` resolves to chromium on the server and canvas in the browser.",
  },
];

const ENGINES = [
  {
    id: "chromium" as const,
    label: "chromium engine",
    where: "Node · Bun · Deno",
    steps: [
      "Launch or reuse a browser via puppeteer / playwright",
      "`page.pdf()` — vector text, real CSS",
      "Native CSS page breaks and `@page`",
    ],
  },
  {
    id: "canvas" as const,
    label: "canvas engine",
    where: "Browser",
    steps: [
      "`renderDomToImage` — SVG `foreignObject`",
      "`computePageSlices` — break-aware slicing",
      "`PdfWriter` — our own PDF writer",
    ],
  },
];

/** Only backticks are meaningful in these strings. */
function code(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
</script>

<template>
  <figure class="pipeline">
    <p class="entry"><code>toPdf(input, options)</code></p>

    <template v-for="stage in STAGES" :key="stage.fn">
      <svg class="conn" viewBox="0 0 100 22" preserveAspectRatio="none">
        <path
          d="M50 0 V22"
          stroke="currentColor"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div class="stage">
        <p class="stage-fn"><code>{{ stage.fn }}</code></p>
        <p class="stage-desc" v-html="code(stage.desc)" />
      </div>
    </template>

    <!-- One path splits into two engines -->
    <svg class="conn conn--split" viewBox="0 0 100 34" preserveAspectRatio="none">
      <path
        class="wide"
        d="M50 0 V14 M25 14 H75 M25 14 V34 M75 14 V34"
        stroke="currentColor"
        vector-effect="non-scaling-stroke"
      />
      <path
        class="narrow"
        d="M50 0 V34"
        stroke="currentColor"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="engines">
      <article
        v-for="engine in ENGINES"
        :key="engine.id"
        class="engine"
        :class="`engine--${engine.id}`"
      >
        <header>
          <Icon :name="engine.id" size="16px" />
          <p class="engine-label"><code>{{ engine.label }}</code></p>
          <p class="engine-where">{{ engine.where }}</p>
        </header>
        <ul>
          <li v-for="step in engine.steps" :key="step" v-html="code(step)" />
        </ul>
      </article>
    </div>

    <!-- …and back into one result -->
    <svg class="conn conn--merge" viewBox="0 0 100 34" preserveAspectRatio="none">
      <path
        class="wide"
        d="M25 0 V20 M75 0 V20 M25 20 H75 M50 20 V34"
        stroke="currentColor"
        vector-effect="non-scaling-stroke"
      />
      <path
        class="narrow"
        d="M50 0 V34"
        stroke="currentColor"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="stage stage--result">
      <p class="stage-fn"><code>PdfResult</code></p>
      <p class="stage-desc">
        <code>bytes</code> · <code>pageCount</code> · <code>engine</code> ·
        <code>save()</code> · <code>download()</code> · <code>toBlob()</code> ·
        <code>toDataUrl()</code>
      </p>
    </div>
  </figure>
</template>

<style scoped>
.pipeline {
  margin: 28px 0;
  display: flex;
  flex-direction: column;
  color: var(--hpx-rule-strong); /* inherited by the connector strokes */
}

.entry {
  margin: 0;
  align-self: center;
}
.entry code {
  font-size: 13px;
  padding: 7px 14px;
  border: 1px solid var(--hpx-rule-strong);
  border-radius: 999px;
  background: var(--hpx-wash);
  color: var(--hpx-ink);
}

.conn {
  display: block;
  width: 100%;
  height: 22px;
  flex: none;
  fill: none;
}
.conn--split,
.conn--merge {
  height: 34px;
}

.stage {
  padding: 12px 16px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius-lg);
  background: var(--hpx-paper);
}
.stage--result {
  background: var(--hpx-wash);
}
.stage-fn {
  margin: 0;
}
.stage-fn code {
  font-size: 13px;
  font-weight: 600;
  color: var(--hpx-ink);
  background: none;
  padding: 0;
  border: none;
}
.stage-desc {
  margin: 3px 0 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--hpx-ink-2);
}

/* --- The two engines --- */
.engines {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.engine {
  padding: 12px 14px;
  border: 1px solid var(--hpx-rule);
  border-top-width: 2px;
  border-radius: var(--hpx-radius-lg);
  background: var(--hpx-paper);
}
.engine--chromium {
  border-top-color: var(--hpx-full);
}
.engine--canvas {
  border-top-color: var(--hpx-partial);
}
.engine header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0 8px;
  align-items: center;
  margin-bottom: 8px;
}
.engine--chromium header :deep(.hpx-ico) {
  color: var(--hpx-full);
}
.engine--canvas header :deep(.hpx-ico) {
  color: var(--hpx-partial);
}
.engine-label {
  margin: 0;
}
.engine-label code {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--hpx-ink);
  background: none;
  padding: 0;
  border: none;
}
.engine-where {
  grid-column: 2;
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--hpx-ink-3);
}
.engine ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.engine li {
  position: relative;
  padding-left: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--hpx-ink-2);
}
.engine li + li {
  margin-top: 5px;
}
.engine li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--hpx-rule-strong);
}

/* Shared code styling inside the diagram */
.stage-desc :deep(code),
.engine li :deep(code) {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--hpx-wash);
  border: 1px solid var(--hpx-rule);
  color: var(--hpx-ink);
}

/* Two drawn paths per connector, swapped by width — the CSS `d` property that
   would let one path morph isn't supported in Firefox. */
.conn .narrow {
  display: none;
}

/* --- Narrow screens: the branch becomes a stack --- */
@media (max-width: 640px) {
  .engines {
    grid-template-columns: minmax(0, 1fr);
  }
  /* A split into stacked cards would point at nothing — go straight down. */
  .conn .wide {
    display: none;
  }
  .conn .narrow {
    display: inline;
  }
}
</style>
