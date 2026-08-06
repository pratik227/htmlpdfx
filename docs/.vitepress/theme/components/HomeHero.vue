<script setup lang="ts">
/**
 * The home page opening.
 *
 * The illustration is the thesis: a tall document being split across two pages,
 * where the break steps *around* a block rather than through it. That single
 * behaviour is the reason this library exists, so it earns the space — and it's
 * drawn with the same hairlines and greys as the rest of the site rather than
 * being a decorative graphic bolted on.
 */
import Icon from "./Icon.vue";
</script>

<template>
  <header class="hero">
    <div class="copy">
      <p class="eyebrow">HTML <span aria-hidden="true">→</span> PDF</p>
      <h1>Page breaks that<br />don't cut your table in half.</h1>
      <p class="lead">
        A real browser engine on the server for selectable, vector text and true
        CSS pagination — and a self-contained renderer in the browser when
        Chromium isn't there. One API across Node, Bun, and the browser, with no
        required runtime dependencies.
      </p>
      <div class="actions">
        <a class="btn btn--primary" href="/guide/getting-started">
          Get started
          <Icon name="arrow" size="15px" />
        </a>
        <a class="btn" href="/capabilities">What each engine supports</a>
      </div>
      <p class="install"><code>npm i htmlpdfx</code></p>
    </div>

    <div class="art" aria-hidden="true">
      <svg viewBox="0 0 372 268" fill="none" role="img">
        <!-- Page 1 -->
        <rect
          x="0.5"
          y="0.5"
          width="168"
          height="235"
          rx="7"
          class="sheet"
        />
        <!-- printable-area guide -->
        <rect
          x="18.5"
          y="18.5"
          width="132"
          height="199"
          rx="2"
          class="guide"
        />
        <g class="line">
          <rect x="26" y="34" width="88" height="7" rx="3.5" class="strong" />
          <rect x="26" y="52" width="116" height="5" rx="2.5" />
          <rect x="26" y="64" width="104" height="5" rx="2.5" />
          <rect x="26" y="76" width="112" height="5" rx="2.5" />
        </g>
        <!-- a block that will not be split -->
        <rect x="26.5" y="96.5" width="115" height="52" rx="5" class="block" />
        <g class="line">
          <rect x="36" y="108" width="60" height="5" rx="2.5" />
          <rect x="36" y="120" width="88" height="4" rx="2" />
          <rect x="36" y="130" width="72" height="4" rx="2" />
        </g>
        <g class="line">
          <rect x="26" y="164" width="110" height="5" rx="2.5" />
          <rect x="26" y="176" width="96" height="5" rx="2.5" />
        </g>
        <!-- the break: content stops here rather than mid-block -->
        <line x1="18" y1="196" x2="151" y2="196" class="break" />
        <text x="18" y="209" class="tag">break</text>
        <text x="151" y="209" class="folio" text-anchor="end">1</text>

        <!-- Page 2 -->
        <rect
          x="203.5"
          y="32.5"
          width="168"
          height="235"
          rx="7"
          class="sheet"
        />
        <rect
          x="221.5"
          y="50.5"
          width="132"
          height="199"
          rx="2"
          class="guide"
        />
        <!-- the block arrives whole, at the top of the new page -->
        <rect
          x="229.5"
          y="66.5"
          width="115"
          height="52"
          rx="5"
          class="block block--moved"
        />
        <g class="line">
          <rect x="239" y="78" width="60" height="5" rx="2.5" />
          <rect x="239" y="90" width="88" height="4" rx="2" />
          <rect x="239" y="100" width="72" height="4" rx="2" />
        </g>
        <g class="line">
          <rect x="229" y="134" width="112" height="5" rx="2.5" />
          <rect x="229" y="146" width="100" height="5" rx="2.5" />
          <rect x="229" y="158" width="108" height="5" rx="2.5" />
          <rect x="229" y="170" width="76" height="5" rx="2.5" />
        </g>
        <text x="354" y="241" class="folio" text-anchor="end">2</text>
      </svg>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 372px;
  gap: 48px;
  align-items: center;
  padding: 56px 0 64px;
  border-bottom: 1px solid var(--hpx-rule);
}

.eyebrow {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hpx-ink-3);
}
h1 {
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.035em;
  color: var(--hpx-ink);
}
.lead {
  margin: 18px 0 0;
  max-width: 48ch;
  font-size: 17px;
  line-height: 1.65;
  color: var(--hpx-ink-2);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--hpx-ink);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease,
    opacity 0.15s ease;
}
.btn:hover {
  border-color: var(--hpx-rule-strong);
  background: var(--hpx-wash);
}
.btn--primary {
  background: var(--hpx-ink);
  border-color: var(--hpx-ink);
  color: var(--hpx-paper);
}
.btn--primary:hover {
  background: var(--hpx-ink);
  opacity: 0.86;
}

.install {
  margin: 20px 0 0;
}
.install code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  padding: 5px 10px;
  border: 1px solid var(--hpx-rule);
  border-radius: var(--hpx-radius-sm);
  background: var(--hpx-wash);
  color: var(--hpx-ink-2);
}

/* --- The illustration --- */
.art svg {
  width: 100%;
  height: auto;
}
.sheet {
  fill: var(--hpx-paper);
  stroke: var(--hpx-rule-strong);
}
.guide {
  fill: none;
  stroke: var(--hpx-rule);
  stroke-dasharray: 3 4;
}
.line rect {
  fill: var(--hpx-ink);
  opacity: 0.16;
}
.line rect.strong {
  opacity: 0.42;
}
.block {
  fill: var(--hpx-wash);
  stroke: var(--hpx-rule-strong);
}
.block--moved {
  stroke: var(--hpx-ink-3);
}
.break {
  stroke: var(--hpx-ink-3);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.tag {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--hpx-ink-3);
}
.folio {
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  fill: var(--hpx-ink-3);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
    padding-top: 32px;
  }
  h1 {
    font-size: 34px;
  }
  .art {
    max-width: 372px;
  }
}
</style>
