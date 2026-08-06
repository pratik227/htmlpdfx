---
title: Modern HTML → PDF for JavaScript & TypeScript
description: A real Chromium engine for selectable, vector text and true CSS pagination, with a self-contained browser fallback. One API across Node, Bun, and the browser — no required runtime dependencies.
pageClass: hpx-home-page
sidebar: false
aside: false
prev: false
next: false
---

<HomeHero />

## Start here

<CardGroup :cols="3">

<Card title="Getting started" icon="start" href="/guide/getting-started">

Install it and render your first PDF in about a minute.

</Card>

<Card title="Choose an engine" icon="engines" href="/guide/engines">

There are two, they are not equal, and picking the right one is most of the job.

</Card>

<Card title="Page breaks" icon="breaks" href="/guide/page-breaks">

Forced breaks, and blocks that must never be split across a page.

</Card>

</CardGroup>

## Two engines, one API

`toPdf()` behaves the same everywhere. What changes is what's rendering underneath — and that difference is worth understanding before you ship, because it decides whether your text is selectable.

<CardGroup :cols="2">

<Card title="Chromium" icon="chromium">

<EngineBadge engine="chromium" tier :name="false" />

The browser's own print-to-PDF, driven by Puppeteer or Playwright. The PDF **is** the webpage: page breaks, fonts, and layout are correct by construction, and text stays selectable and searchable. The default on Node, Bun, and Deno, and the one to reach for when a person will read the result.

</Card>

<Card title="Canvas" icon="canvas">

<EngineBadge engine="canvas" tier :name="false" />

A from-scratch DOM rasterizer for the browser, with no Chromium and nothing to install. It produces a faithful _screenshot_ of your DOM, sliced cleanly across pages — a raster, not a reflow. Use it as graceful degradation, not as a substitute.

</Card>

</CardGroup>

`auto` picks per runtime, so you rarely choose by hand. See [what each engine supports](/capabilities) for the full matrix, row by row.

## What it does differently

<CardGroup :cols="2">

<Card title="No split rows or cards" icon="breaks">

The slicer backs up to the top of a table row, card, or figure rather than cutting through it — and `<thead>` repeats on every page a table spans.

</Card>

<Card title="Selectable, not screenshotted" icon="text">

Real vector text in the Chromium tier, so readers can search and copy from the PDF, and the file stays small.

</Card>

<Card title="No jsPDF, no html2canvas" icon="layers">

The PDF writer and the DOM rasterizer are written from scratch. The core has no required runtime dependencies at all.

</Card>

<Card title="Modern CSS as-is" icon="print">

Flexbox, grid, custom properties, `oklch()` and `lab()` colours, and web fonts — awaited before render, then embedded.

</Card>

<Card title="Honest about its limits" icon="capabilities">

Every capability is marked per engine, and the gaps are published rather than glossed over. Knowing a feature is best-effort beats discovering it in a broken PDF.

</Card>

<Card title="Familiar on day one" icon="migration">

A functional `toPdf()` plus an html2pdf.js-compatible fluent builder, so migrating is mostly deleting code.

</Card>

</CardGroup>

## Install

```bash
npm i htmlpdfx
```

On Node and Bun that also brings Puppeteer as an optional dependency, so the high-fidelity engine works without a second step. In the browser there's nothing else to install.

<CardGroup :cols="2">

<Card title="Migrating from html2pdf.js" icon="migration" href="/guide/migration">

The fluent API is deliberately compatible. Most projects change an import and stop there.

</Card>

<Card title="API reference" icon="api" href="/api/">

Every option, every field on the result, and what each engine does with them.

</Card>

</CardGroup>
