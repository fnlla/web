/*
  FNLLA UI maintainer manifest.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - define the authoritative repository contract for publish and validation
  - centralize runtime outputs, docs pages, guide sources and source-module order
*/

export function getFnllaUiManifest() {
  const cssRuntimeBanner = `/*
  FNLLA UI runtime stylesheet.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  Produced, maintained and distributed by TechAyo LTD (techayo.co.uk).
  Published from readable source modules in src/css/ via scripts/publish-fnlla-ui.mjs.
*/`;

  return {
    project: {
      name: "FNLLA UI",
      owner: "TechAyo LTD (techayo.co.uk)",
      origin: "Finella Gardens in Dundee, UK"
    },
    runtime: {
      cssBanner: cssRuntimeBanner,
      cssOutput: "assets/css/fnlla-ui.css",
      jsOutput: "assets/js/fnlla-ui.js",
      distRoot: "dist/fnlla-ui",
      distStaticFiles: [
        "LICENSE.md",
        "VERSION"
      ],
      requiredIconPaths: [
        "assets/icons/README.md",
        "assets/icons/NOTICE.md",
        "assets/icons/LICENSE",
        "assets/icons/sprite.svg",
        "assets/icons/search.svg"
      ]
    },
    docs: {
      assets: {
        jsOutput: "docs/assets/docs.js",
        js: [
          "src/docs/js/00-preamble.js",
          "src/docs/js/nav.js",
          "src/docs/js/theme.js",
          "src/docs/js/highlight.js",
          "src/docs/js/guides.js",
          "src/docs/js/icons-data.js",
          "src/docs/js/icons-render.js",
          "src/docs/js/runtime.js"
        ]
      },
      rootShell: {
        themeColor: "#1A4137",
        kicker: "Blueprint documentation",
        overline: "Framework blueprint",
        displayTitle: "FNLLA UI - Documentation",
        lead: "Runtime contract, component system and delivery guidance for TechAyo projects that need a no-build, production-ready UI layer."
      },
      rootPages: [
        { href: "./index.html", label: "Overview", title: "FNLLA UI Docs" },
        { href: "./distribution.html", label: "Distribution", title: "FNLLA UI Distribution" },
        { href: "./layout.html", label: "Layout", title: "FNLLA UI Layout" },
        { href: "./components.html", label: "Components", title: "FNLLA UI Components" },
        { href: "./sections.html", label: "Sections", title: "FNLLA UI Sections" },
        { href: "./forms.html", label: "Forms", title: "FNLLA UI Forms" },
        { href: "./utilities.html", label: "Utilities", title: "FNLLA UI Utilities" },
        {
          href: "./icons.html",
          label: "Icons",
          title: "FNLLA UI Icons",
          extraScripts: ["./assets/icons-data.js"]
        },
        { href: "./api.html", label: "API", title: "FNLLA UI API" },
        {
          href: "./guides.html",
          label: "Guides",
          title: "FNLLA UI Guides",
          overline: "Guide library",
          displayTitle: "FNLLA UI - Guides",
          lead: "Published browser-facing guides for component selection, downstream website work and framework maintenance workflows."
        }
      ],
      guidePages: [
        {
          source: "docs/guides/component-classification.md",
          output: "docs/component-classification.html",
          title: "FNLLA UI Guide: Component Classification",
          navLabel: "Classification",
          heroLabel: "Component selection",
          bodyClass: "doc-guide-classification",
          description: "A structured reference for choosing the right FNLLA UI component family and avoiding misuse patterns."
        },
        {
          source: "docs/guides/team-usage-and-maintenance-en.md",
          output: "docs/team-usage-and-maintenance.html",
          title: "FNLLA UI Guide: Team Usage and Maintenance",
          navLabel: "Usage",
          heroLabel: "Team workflow",
          bodyClass: "doc-guide-usage",
          description: "Playbook for building websites on FNLLA UI and maintaining the framework."
        }
      ]
    },
    source: {
      css: [
        "src/css/tokens.css",
        "src/css/base.css",
        "src/css/layout.css",
        "src/css/components/core.css",
        "src/css/components/forms.css",
        "src/css/components/navigation.css",
        "src/css/components/tabs.css",
        "src/css/components/trails.css",
        "src/css/components/overlays.css",
        "src/css/components/advanced.css",
        "src/css/sections/hero.css",
        "src/css/sections/composable.css",
        "src/css/sections/supporting.css",
        "src/css/utilities.css",
        "src/css/responsive.css",
        "src/css/a11y.css"
      ],
      js: [
        "src/js/core/00-preamble.js",
        "src/js/core/dom.js",
        "src/js/core/dropdown-core.js",
        "src/js/core/navigation-core.js",
        "src/js/core/modal-core.js",
        "src/js/core/accordion-core.js",
        "src/js/core/tabs-core.js",
        "src/js/core/focus-trap.js",
        "src/js/core/toast-core.js",
        "src/js/core/offcanvas-core.js",
        "src/js/core/popover-core.js",
        "src/js/core/tooltip-core.js",
        "src/js/core/scrollspy-core.js",
        "src/js/core/select-core.js",
        "src/js/modules/dropdown.js",
        "src/js/modules/navigation.js",
        "src/js/modules/tabs.js",
        "src/js/modules/accordion.js",
        "src/js/modules/modal.js",
        "src/js/modules/toast.js",
        "src/js/modules/offcanvas.js",
        "src/js/modules/popover.js",
        "src/js/modules/tooltip.js",
        "src/js/modules/select-utils.js",
        "src/js/modules/select-menu.js",
        "src/js/modules/select.js",
        "src/js/modules/range.js",
        "src/js/modules/scrollspy.js",
        "src/js/core/runtime.js"
      ]
    },
    release: {
      stateFiles: [
        "README.md",
        "VERSION",
        "LICENSE.md"
      ]
    }
  };
}
