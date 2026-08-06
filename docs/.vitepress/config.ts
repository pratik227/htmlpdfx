import { defineConfig } from "vitepress";
import { hpxIcons, navItem } from "./icons";

export default defineConfig({
  title: "htmlpdfx",
  titleTemplate: ":title · htmlpdfx",
  description:
    "Modern, zero-dependency HTML → PDF for JavaScript & TypeScript. Node, Bun, and the browser from one API.",
  lastUpdated: true,
  cleanUrls: true,

  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]],

  // Resolves Solar icons into the bundle at build time. Nothing is fetched at
  // runtime, so the docs work offline and under a strict CSP.
  vite: { plugins: [hpxIcons()] },

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/", activeMatch: "/api/" },
      { text: "Capabilities", link: "/capabilities" },
    ],

    // Sidebar labels carry an icon: VitePress renders `text` with v-html.
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: navItem("start", "Getting started"), link: "/guide/getting-started" },
          { text: navItem("engines", "Engines"), link: "/guide/engines" },
          { text: navItem("breaks", "Page breaks"), link: "/guide/page-breaks" },
          { text: navItem("headers", "Headers & footers"), link: "/guide/headers-footers" },
          { text: navItem("frameworks", "Frameworks"), link: "/guide/frameworks" },
          { text: navItem("compatibility", "Compatibility"), link: "/guide/compatibility" },
          { text: navItem("architecture", "Architecture"), link: "/guide/architecture" },
          { text: navItem("migration", "From html2pdf.js"), link: "/guide/migration" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: navItem("capabilities", "Capabilities"), link: "/capabilities" },
          { text: navItem("api", "API overview"), link: "/api/" },
          { text: navItem("options", "Options"), link: "/api/options" },
          { text: navItem("result", "Result"), link: "/api/result" },
        ],
      },
    ],

    outline: { level: [2, 3], label: "On this page" },

    socialLinks: [
      { icon: "github", link: "https://github.com/pratik227/htmlpdfx" },
    ],

    editLink: {
      pattern:
        "https://github.com/pratik227/htmlpdfx/edit/main/docs/:path",
      text: "Edit this page",
    },

    search: { provider: "local" },

    footer: {
      message:
        'Released under the MIT License. <a href="https://github.com/sponsors/pratik227">Sponsor</a>.',
      copyright: "© 2026 Pratik Patel",
    },
  },
});
