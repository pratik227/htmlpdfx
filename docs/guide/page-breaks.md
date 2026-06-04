# Page breaks

htmlpdfx gives you reliable page breaks in two ways:

- **chromium engine** → translates your rules into real CSS `break-*` and lets
  the layout engine paginate.
- **canvas engine** → a measured slicer ends pages at forced breaks and backs
  up so an atomic block (a table row, a card, a figure) is **never split**.

## Smart pagination (on by default)

Most "my PDF paginates badly" problems are solved by a handful of print-CSS
rules that almost nobody remembers to write. htmlpdfx injects them for you —
no configuration required:

- **Repeating table headers** — `<thead>` (and `<tfoot>`) re-print on every
  page a long table spans.
- **No split rows/media** — table rows, images, SVG, figures, blockquotes,
  `<pre>`, and list items never break across a page boundary.
- **Headings stay with their content** — a heading is never stranded alone at
  the bottom of a page.
- **Orphan/widow control** — at least 3 lines of a paragraph stay together
  across a page break.

```ts
// Default — nothing to configure.
await toPdf(html);

// Tune individual behaviors.
await toPdf(html, {
  smartPagination: {
    repeatTableHeaders: true,
    avoidSplit: true,
    keepHeadingsWithContent: true,
    orphans: 2,
    widows: 2,
  },
});

// Opt out entirely.
await toPdf(html, { smartPagination: false });
```

Smart pagination is additive — your own CSS `break-*` rules and the
`pageBreak` options below always win.

## Options

```ts
await toPdf(html, {
  pageBreak: {
    before: [".chapter", "h1"],   // start these on a new page
    after:  [".section-end"],     // force a break after these
    avoid:  [".card", "tr", "figure"], // never split these across pages
    mode:   ["css", "legacy"],    // see below
  },
});
```

### Modes

| Mode        | Effect                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `css`       | Honour existing CSS `break-*` / legacy `page-break-*` declarations.    |
| `legacy`    | Honour `<div class="html2pdf__page-break"></div>` markers.            |
| `avoid-all` | Keep common atomic blocks (`tr`, `table`, `figure`, `li`, headings…) whole. |

Default is `["css", "legacy"]`.

## In CSS

Anything you already write in CSS works:

```css
.chapter   { break-before: page; }
.invoice   { break-inside: avoid; }
.page-end  { break-after: page; }
```

## How the slicer works (canvas engine)

For each page the slicer:

1. takes a natural cut at the page height;
2. if a **forced break** falls within the page, ends the page there;
3. otherwise, if the cut lands inside an **avoid** range, backs up to that
   block's top;
4. guarantees forward progress (a block taller than a page still advances) so
   you never get an infinite loop or a blank page.

This is the logic that guarantees no leading or trailing blank pages and no
split rows. It's verified in `test/paginate.test.ts` and `test/behavior.test.ts`.
