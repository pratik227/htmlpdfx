// Server-side (Node/Bun) — render a Tailwind/shadcn page with real Chromium.
// Highest fidelity: selectable text, web fonts, oklch colors, native page breaks.
// Requires: npm i puppeteer
import { toPdf } from "htmlpdfx";

const html = `<!doctype html><html><head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; }
    :root { --primary: oklch(0.55 0.2 264); }
    .card { break-inside: avoid; }
  </style>
</head><body class="p-8 font-sans">
  <h1 class="text-3xl font-bold" style="color: var(--primary)">Tailwind + shadcn → PDF</h1>
  <div class="grid grid-cols-3 gap-4 mt-6">
    ${Array.from({ length: 9 }, (_, i) => `
      <div class="card rounded-xl border p-4 shadow-sm">
        <div class="text-sm text-gray-500">Card ${i + 1}</div>
        <div class="text-xl font-semibold">$${(i + 1) * 100}</div>
      </div>`).join("")}
  </div>
</body></html>`;

const pdf = await toPdf(html, {
  format: "a4",
  margin: 0,
  chromium: { printBackground: true, waitUntil: "networkidle" },
});
await pdf.save("tailwind.pdf");
console.log(`tailwind.pdf — ${pdf.pageCount} page(s), engine=${pdf.engine}`);
