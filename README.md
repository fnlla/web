# FNLLA UI

[![Release](https://img.shields.io/badge/release-v1.0.3-2f65eb?style=flat-square)](https://github.com/fnlla/ui/releases/tag/v1.0.3)
[![Hardening](https://github.com/fnlla/ui/actions/workflows/fnlla-ui-hardening.yml/badge.svg?branch=main)](https://github.com/fnlla/ui/actions/workflows/fnlla-ui-hardening.yml)
[![License](https://img.shields.io/badge/license-proprietary-111827?style=flat-square)](./LICENSE.md)
[![Runtime](https://img.shields.io/badge/runtime-css%20%2B%20js%20%2B%20icons-0f766e?style=flat-square)](./docs/index.html)
[![Docs](https://img.shields.io/badge/docs-12%20pages-c26d00?style=flat-square)](./docs/guides.html)

## What FNLLA UI is

FNLLA UI is a standalone internal UI kit for static and server-rendered websites. It packages reusable layout, component and interaction patterns without coupling them to any specific client, brand or CMS.

The supported browser runtime contract is intentionally small:

- `assets/css/fnlla-ui.css`
- `assets/js/fnlla-ui.js`
- `assets/icons/`

That runtime can be consumed directly from the repository or copied as the generated runtime-only handoff under `dist/fnlla-ui/`.

FNLLA UI is produced, maintained and distributed by TechAyo LTD (techayo.co.uk).

Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

## Name origin

The name `FNLLA` comes from Finella, and more specifically from Finella Gardens in Dundee, UK. That location is the origin point of the FNLLA UI name.

## Ownership and license

FNLLA UI is proprietary software owned by TechAyo LTD (techayo.co.uk).

Its use is governed by `LICENSE.md`, which permits commercial use in productions executed by TechAyo LTD while prohibiting standalone redistribution, resale and unauthorized relicensing.

The current repository identity is defined by four state files that should stay aligned:

- `MANIFEST.json`
- `README.md`
- `VERSION`
- `LICENSE.md`

Repository participation and disclosure rules also rely on:

- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.github/CONTRIBUTING.md`
- `.github/RELEASE_TEMPLATE.md`
- `.github/SUPPORT.md`

Repository identity assets also rely on:

- `docs/assets/brand/fnlla-ui.svg`
- `docs/assets/brand/fnlla-ui-dark.svg`
- `docs/assets/brand/fnlla-github.svg`
- `docs/assets/brand/fnlla-github.png`

## Who it is for

Use FNLLA UI when a project needs:

- a lightweight front-end starter without a build step
- reusable marketing and service-oriented components
- a token-based design system that can be re-themed quickly
- simple JavaScript for common UI interactions

## Documentation routes

Use the browser docs based on the question you are answering:

- `docs/index.html` for the overview and reading order
- `docs/distribution.html` for packaging, handoff and runtime-boundary rules
- `docs/layout.html` for page shells, containers, grids and anti-patterns
- `docs/components.html` for reference markup and component demos
- `docs/sections.html` for composable page sections
- `docs/forms.html` for field, validation and section-level form patterns
- `docs/utilities.html` for utilities and helper classes
- `docs/icons.html` for the shipped local FNLLA Icons catalogue
- `docs/api.html` for the stable hook, helper and CSS-family contract
- `docs/guides.html` for the guide index and reading order
- `docs/component-classification.html` for component-selection rules
- `docs/team-usage-and-maintenance.html` for workflow and maintenance guidance

Use the docs for detailed examples. README stays intentionally slimmer and focuses on the repository boundary, runtime contract and maintainer workflow.

## How to install it in another project

1. Copy the entire `fnlla-ui` folder into the new project, or use the generated runtime-only export under `dist/fnlla-ui/` when you want a lean handoff.
2. Keep the published `assets/` runtime tree together so relative paths stay simple.
3. Link the runtime files from the page.
4. Use the component patterns from `docs/components.html`, `docs/sections.html` and `docs/forms.html` rather than rebuilding examples from scratch.
5. If you maintain the framework itself, edit source files under `src/` and republish before shipping changes.

The framework runs as plain static HTML, CSS and JavaScript. No npm, Composer, bundler or build step is required.

Basic runtime includes:

```html
<link rel="stylesheet" href="fnlla-ui/assets/css/fnlla-ui.css">
<script src="fnlla-ui/assets/js/fnlla-ui.js"></script>
```

If the framework files sit at the site root instead, use `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js`.

## Public runtime helpers

The stable browser API lives under `window.FNLLAUI`.

- `window.FNLLAUI.init(root)` performs idempotent initialization for HTML injected after first page load.
- `window.FNLLAUI.setTheme(theme, target)` applies the documented `default` or `dark` theme to `body` by default, or to a specific wrapper when a selector or element is provided.
- `window.FNLLAUI.showToast(target)` and the matching hide helper support non-blocking notification flows.
- `window.FNLLAUI.showOffcanvas(target)` and the matching hide helper support side-panel workflows.
- Modal, dropdown, popover, tooltip and scrollspy helpers are documented in `docs/api.html`.

The helper contract is intentionally small. For the full supported surface, use `docs/api.html` as the stable reference.

## FNLLA Icons

FNLLA UI ships a branded internal icon layer called `FNLLA Icons` under `assets/icons/`.

Important local paths:

- `assets/icons/sprite.svg`
- `assets/icons/search.svg`
- `assets/icons/NOTICE.md`
- `assets/icons/LICENSE`

Operational rules:

- do not load icons from external hosts such as `lucide.dev`, `jsdelivr`, `unpkg` or other CDNs
- keep icon usage local and offline
- use `docs/icons.html` when you need to browse the shipped set

## Issue and release workflow

Use the repository-level GitHub templates when work moves from implementation into maintenance:

- bug reports for runtime, docs or browser regressions
- docs/runtime parity reports when the shipped contract and demo surface drift apart
- feature proposals when additive capability needs explicit scope and runtime impact
- the pull request template for runtime, docs, dist and accessibility confirmation
- the contributing and security guidance for repository workflow, disclosure and business-boundary questions

For releases, keep the flow lightweight and repeatable:

1. Align `README.md`, `VERSION` and `LICENSE.md`.
2. Publish runtime files and generated docs.
3. Validate runtime assets, docs parity and browser behavior.
4. Publish the release commit to `main`.
5. Create the version tag and GitHub release notes using `.github/RELEASE_TEMPLATE.md`.
6. Open follow-up work in the next milestone when cleanup or regression hardening remains.

## Maintainer workflow

The repository root is the maintainer workspace. Generated outputs should not be treated as hand-authored sources.

The docs browser behavior bundle under `docs/assets/docs.js` is generated during publish from readable source modules under `src/docs/js/`.

Authoritative maintainer scripts:

- `scripts/fnlla-ui-manifest.mjs` defines source ordering, docs pages and the runtime export contract.
- `scripts/publish-fnlla-ui.mjs` republishes runtime files, rebuilds generated guide HTML and refreshes `dist/fnlla-ui/`.
- `scripts/build-guides.mjs` turns maintainer-authored Markdown guides into published HTML pages.
- `scripts/validate-fnlla-ui.mjs` checks repository structure, docs sync, runtime export generation and release metadata.
- `scripts/test-fnlla-ui-browser.mjs` runs the real browser smoke test against the published runtime.
- `scripts/test-fnlla-ui-browser-matrix.mjs` replays the smoke flow across every detected supported local browser, including Firefox when available.
- `.github/CONTRIBUTING.md` defines contribution expectations for this proprietary repository.
- `CODE_OF_CONDUCT.md` defines the professional behavior standard for repository collaboration.
- `SECURITY.md` defines the private vulnerability reporting route and response expectations.
- `.github/SUPPORT.md` routes support, licensing and repository-governance questions.

Recommended maintainer sequence:

```bash
node .\scripts\publish-fnlla-ui.mjs
node .\scripts\test-fnlla-ui-browser.mjs
node .\scripts\validate-fnlla-ui.mjs
```

Use the browser matrix when you want a broader local sweep:

```bash
node .\scripts\test-fnlla-ui-browser-matrix.mjs
```

## Runtime and docs boundary

Treat these as public, supported outputs:

- `assets/css/fnlla-ui.css`
- `assets/js/fnlla-ui.js`
- `assets/icons/`
- `dist/fnlla-ui/`

Treat these as maintainer-only internals:

- `src/`
- `src/docs/js/`
- `scripts/`
- `docs/guides/*.md`
- `docs/assets/docs.css`
- `docs/assets/docs.js`
- the docs shell around the runtime demos

The docs shell is documentation-specific, but component demos should still render from the same shared runtime shipped in `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js`.

## Included documentation

- Docs: `docs/index.html`, `docs/distribution.html`, `docs/layout.html`, `docs/components.html`, `docs/sections.html`, `docs/forms.html`, `docs/utilities.html`, `docs/icons.html`, `docs/api.html`, `docs/guides.html`
- Component classification guide: `docs/component-classification.html`
- Team usage and maintenance guide: `docs/team-usage-and-maintenance.html`
- Docs stylesheet: `docs/assets/docs.css` for documentation-only shell and presentation helpers around the shared runtime
- Docs behavior bundle: `docs/assets/docs.js` for documentation-only navigation, theme-toggle, code-highlighting and icon-catalogue behavior
- Brand assets: `docs/assets/brand/` for the committed FNLLA UI logo source and GitHub-ready preview exports
- Guide sources: `docs/guides/*.md` for maintainer-authored content that publishes into the HTML guide set
- Docs behavior sources: `src/docs/js/*.js` for maintainer-authored documentation-only JavaScript that publishes into `docs/assets/docs.js`
- Runtime manifest: `scripts/fnlla-ui-manifest.mjs` for the shared source-ordering and export contract
- Validator: `scripts/validate-fnlla-ui.mjs` for release-stage structural checks
- Browser smoke test: `scripts/test-fnlla-ui-browser.mjs` for published runtime behavior checks
- Code of Conduct: `CODE_OF_CONDUCT.md` for collaboration and moderation standards
- Contributing guide: `.github/CONTRIBUTING.md` for repository workflow and scope expectations
- License: `LICENSE.md` for proprietary commercial usage terms
- Release template: `.github/RELEASE_TEMPLATE.md` for ASCII-safe GitHub release notes
- Security policy: `SECURITY.md` for vulnerability reporting and disclosure handling
- Support routing: `.github/SUPPORT.md` for issue, licensing and contact guidance

Use the docs to review component behavior and copy the patterns you need into real project templates.
