// Node example. Requires a Chromium driver: `npm i puppeteer`
// Run: node examples/node-basic.mjs
import { toPdf } from "htmlpdfx";

const html = `
  <h1 style="color:#1d4ed8">Invoice #1024</h1>
  <p>Thanks for your business.</p>
  <table border="1" cellpadding="6" style="border-collapse:collapse">
    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
    <tr><td>Widget</td><td>3</td><td>$30</td></tr>
  </table>
`;

const pdf = await toPdf(html, {
  format: "a4",
  margin: 15,
  metadata: { title: "Invoice 1024", author: "Acme Inc." },
  footer: { template: "Page {{page}} / {{pages}}", height: 10 },
});

await pdf.save("invoice.pdf");
console.log(`Wrote invoice.pdf — ${pdf.pageCount} page(s) via ${pdf.engine}`);
