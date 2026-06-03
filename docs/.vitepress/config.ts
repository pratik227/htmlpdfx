import { defineConfig } from "vitepress";

export default defineConfig({
  title: "htmlpdfx",
  description:
    "Modern, zero-dependency HTML → PDF for JavaScript & TypeScript. Node, Bun, and the browser from one API.",
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/" },
      { text: "Capabilities", link: "/capabilities" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Engines", link: "/guide/engines" },
            { text: "Page breaks", link: "/guide/page-breaks" },
            { text: "Headers & footers", link: "/guide/headers-footers" },
            { text: "Frameworks", link: "/guide/frameworks" },
            { text: "Compatibility", link: "/guide/compatibility" },
            { text: "Architecture", link: "/guide/architecture" },
            { text: "Migrating from html2pdf.js", link: "/guide/migration" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "Options", link: "/api/options" },
            { text: "Result", link: "/api/result" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/pratik227/htmlpdfx" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Pratik Patel",
    },
    search: { provider: "local" },
  },
});
