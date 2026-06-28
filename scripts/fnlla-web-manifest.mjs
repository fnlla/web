/*
  FNLLA Web maintainer manifest.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Purpose:
  - define the authoritative repository contract for publish and validation
  - centralize runtime outputs, docs pages, guide sources and source-module order
*/

export function getFnllaWebManifest() {
  const cssRuntimeBanner = `/*
  FNLLA Web runtime stylesheet.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  Produced, maintained and distributed by TechAyo LTD (techayo.co.uk).
  Published from readable source modules in src/css/ via scripts/publish-fnlla-web.mjs.
*/`;

  return {
    /* Repository identity used by validation, docs copy and legal metadata. */
    project: {
      name: "FNLLA Web",
      slug: "fnlla-web",
      owner: "TechAyo LTD (techayo.co.uk)",
      origin: "Finella Gardens in Dundee, UK",
      repository: "https://github.com/fnlla/web.git",
      sourceOfTruth: "github"
    },
    /*
      Stable published runtime contract.

      This block defines what counts as the downstream-consumable framework
      surface, including the dist export and the minimum icon bundle files that
      validation expects to ship with every release line.
    */
    runtime: {
      cssBanner: cssRuntimeBanner,
      cssOutput: "assets/css/fnlla-web.css",
      jsOutput: "assets/js/fnlla-web.js",
      distRoot: "dist/fnlla-web",
      distStaticFiles: [
        "MANIFEST.json",
        "LICENSE.md",
        "SUPPORT.md",
        "TRADEMARKS.md",
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
    /*
      Browser-facing docs contract.

      Root pages are maintained as hand-authored HTML bodies wrapped in a shared
      shell, while guide pages are generated from markdown sources. Keeping both
      declarations here allows publish and validation to reason about one docs map.
    */
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
        displayTitle: "Documentation",
        lead: "Runtime contract, component system and delivery guidance for teams that need a no-build, production-ready UI layer."
      },
      rootPages: [
        { href: "./index.html", label: "Overview", title: "Overview - FNLLA Web Documentation" },
        { href: "./contract.html", label: "Contract", title: "Contract - FNLLA Web Documentation" },
        { href: "./layout.html", label: "Layout", title: "Layout - FNLLA Web Documentation" },
        { href: "./components.html", label: "Components", title: "Components - FNLLA Web Documentation" },
        { href: "./sections.html", label: "Sections", title: "Sections - FNLLA Web Documentation" },
        {
          href: "./utilities.html",
          label: "Utilities",
          title: "Utilities - FNLLA Web Documentation",
          extraScripts: ["./assets/icons-data.js"]
        },
        {
          href: "./guides.html",
          label: "Guides",
          title: "Guides - FNLLA Web Documentation",
          overline: "Guide library",
          displayTitle: "Guides",
          lead: "Published browser-facing guides for component selection, downstream website work and framework maintenance workflows."
        }
      ],
      guidePages: [
        {
          source: "docs/guides/component-classification.md",
          output: "docs/component-classification.html",
          title: "Component Classification Guide - FNLLA Web Documentation",
          navLabel: "Classification",
          heroLabel: "Component selection",
          bodyClass: "doc-guide-classification",
          description: "A structured reference for choosing the right FNLLA Web component family and avoiding misuse patterns."
        },
        {
          source: "docs/guides/team-usage-and-maintenance-en.md",
          output: "docs/team-usage-and-maintenance.html",
          title: "Team Usage and Maintenance Guide - FNLLA Web Documentation",
          navLabel: "Usage",
          heroLabel: "Team workflow",
          bodyClass: "doc-guide-usage",
          description: "Playbook for building websites on FNLLA Web and maintaining the framework."
        }
      ]
    },
    /*
      Ordered readable source inputs for the published runtime.

      These arrays are intentionally explicit. They double as build order,
      review surface and maintenance documentation for how the framework is
      assembled without a separate bundler pipeline.
    */
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
        "src/js/core/title-core.js",
        "src/js/core/consent-core.js",
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
        "src/js/modules/consent.js",
        "src/js/core/runtime.js"
      ]
    },
    /* Release-state files that must stay aligned before publication. */
    release: {
      stateFiles: [
        "MANIFEST.json",
        "README.md",
        "VERSION",
        "LICENSE.md",
        "SUPPORT.md",
        "TRADEMARKS.md"
      ]
    }
  };
}
