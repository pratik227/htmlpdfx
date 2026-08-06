import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import "./style.css";

import Icon from "./components/Icon.vue";
import Callout from "./components/Callout.vue";
import Card from "./components/Card.vue";
import CardGroup from "./components/CardGroup.vue";
import Steps from "./components/Steps.vue";
import Step from "./components/Step.vue";
import EngineBadge from "./components/EngineBadge.vue";
import TierMark from "./components/TierMark.vue";
import CapabilityMatrix from "./components/CapabilityMatrix.vue";
import PipelineDiagram from "./components/PipelineDiagram.vue";
import HomeHero from "./components/HomeHero.vue";
import DocTop from "./components/DocTop.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Breadcrumb + "Copy page", above the title on every doc page.
      "doc-before": () => h(DocTop),
    });
  },
  enhanceApp({ app }) {
    // Available in every markdown page without an import.
    app.component("Icon", Icon);
    app.component("Callout", Callout);
    app.component("Card", Card);
    app.component("CardGroup", CardGroup);
    app.component("Steps", Steps);
    app.component("Step", Step);
    app.component("EngineBadge", EngineBadge);
    app.component("TierMark", TierMark);
    app.component("CapabilityMatrix", CapabilityMatrix);
    app.component("PipelineDiagram", PipelineDiagram);
    app.component("HomeHero", HomeHero);
  },
} satisfies Theme;
