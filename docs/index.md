---
layout: home

hero:
  name: htmlpdfx
  text: HTML → PDF, done right
  tagline: One unified, zero-dependency API across Node, Bun, and the browser. A real browser engine when you have one; a self-contained renderer when you don't.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Issues we fix
      link: /issues
    - theme: alt
      text: API
      link: /api/

features:
  - icon: 🧠
    title: Best engine, automatically
    details: Uses real Chromium (Puppeteer/Playwright) in Node/Bun for selectable vector text and perfect CSS. Falls back to a built-in renderer in the browser.
  - icon: 📦
    title: Truly zero-dependency core
    details: No jsPDF. No html2canvas. The PDF writer and DOM rasterizer are written from scratch and ship inside the package.
  - icon: ✂️
    title: Page breaks that actually work
    details: A measured slicer that ends pages on forced breaks and never cuts a table row, card, or figure in half.
  - icon: 🎨
    title: Modern CSS & frameworks
    details: Tailwind (incl. v4 oklch), shadcn/ui, Vue, Vuetify, and Quasar all render — including flexbox, grid, and CSS variables.
  - icon: 🟦
    title: TypeScript-first
    details: Complete, accurate type definitions for every option. ESM + CJS builds.
  - icon: 🔌
    title: Familiar API
    details: A functional toPdf() plus an html2pdf.js-compatible fluent builder for painless migration.
---
