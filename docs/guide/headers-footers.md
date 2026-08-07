# Headers & footers

Stamp a repeating header and/or footer — with page numbers — on every page.
Both engines support it.

```ts
await toPdf(html, {
  format: "a4",
  margin: { top: 25, bottom: 20, left: 15, right: 15 },
  header: { template: "{{title}}", height: 12 },
  footer: { template: "Page {{page}} of {{pages}}", height: 12 },
  metadata: { title: "Quarterly report" },
});
```

## Tokens

| Token        | Replaced with        |
| ------------ | -------------------- |
| `{{page}}`{v-pre}   | current page number  |
| `{{pages}}`{v-pre}  | total page count     |
| `{{title}}`{v-pre}  | `metadata.title`     |
| `{{date}}`{v-pre}   | generation date (chromium) |

## Notes

- Reserve room with `margin.top` / `margin.bottom` so the band doesn't overlap
  body content. Margins are applied uniformly to every page, including
  continuation pages.
- In the **chromium** engine the header/footer template is full HTML.
- In the **canvas** engine the footer/header is drawn as real Helvetica text
  (selectable), so page numbers are searchable even in the rasterized output.
