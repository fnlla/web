# FNLLA UI

## What FNLLA UI is

FNLLA UI is a standalone internal UI kit for static and server-rendered websites. It packages reusable layout, component and interaction patterns without coupling them to any specific client, brand or CMS.

The public runtime contract is intentionally small:

- `assets/css/fnlla-ui.css`
- `assets/js/fnlla-ui.js`
- `assets/icons/`

That runtime can be consumed directly from the repository or copied as the generated runtime-only handoff under `dist/fnlla-ui/`.

FNLLA UI is produced, maintained and distributed by TechAyo LTD (techayo.co.uk).

Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

## Name origin

The name `FNLLA` comes from Finella, and more specifically from Finella Gardens in Dundee, UK. That location is the origin point of the FNLLA framework line, including both `FNLLA UI` and `FNLLA PHP`.

## Ownership and license

FNLLA UI is proprietary software owned by TechAyo LTD (techayo.co.uk).

Its use is governed by `LICENSE.md`, which permits commercial use in productions executed by TechAyo LTD while prohibiting standalone redistribution, resale and unauthorized relicensing.

The current repository identity is defined by three state files that should stay aligned:

- `README.md`
- `VERSION`
- `LICENSE.md`

## Who it is for

Use FNLLA UI when a new project needs:

- a lightweight front-end starter without a build step
- reusable marketing and service-oriented components
- a token-based design system that can be re-themed quickly
- simple JavaScript for common UI interactions

## Documentation routes

Use the browser docs based on the question you are answering:

- `docs/distribution.html` for packaging, handoff and runtime-boundary rules
- `docs/layout.html` for page shells, containers, grids and anti-patterns
- `docs/components.html`, `docs/sections.html` and `docs/forms.html` for reference markup
- `docs/icons.html` for the shipped local FNLLA Icons catalogue
- `docs/api.html` for the stable hook, helper and CSS-family contract
- `docs/component-classification.html` for component-selection rules
- `docs/team-usage-and-maintenance.html` for workflow and maintenance guidance
- `docs/guides.html` for the guide index and reading order

## Issue and release workflow

Use the repository-level GitHub templates when work moves from implementation into maintenance:

- bug reports should go through the bug template when runtime, docs or browser behavior regresses
- docs-to-runtime mismatches should go through the parity template when the demo surface and shipped contract drift apart
- additive capability proposals should go through the feature template so scope and runtime impact are explicit early
- pull requests should use the repository PR template to confirm runtime, docs, dist and accessibility checks

For releases, keep the flow lightweight but repeatable:

1. Align `README.md`, `VERSION` and `LICENSE.md`.
2. Validate runtime assets, docs parity and browser behavior.
3. Publish the release commit to `main`.
4. Create the version tag and GitHub release notes.
5. Open post-release follow-up work in the next milestone when cleanup or regression hardening remains.

## Folder structure

```text
fnlla-ui/
  assets/
    css/
      fnlla-ui.css
    js/
      fnlla-ui.js
    icons/
      *.svg
      sprite.svg
      LICENSE
      NOTICE.md
      README.md
  src/
    css/
      tokens.css
      base.css
      layout.css
      components/
      sections/
      utilities.css
      responsive.css
      a11y.css
    js/
      core/
      modules/
  docs/
    index.html
    distribution.html
    layout.html
    components.html
    sections.html
    forms.html
    utilities.html
    icons.html
    api.html
    assets/
      docs.css
      docs.js
      icons-data.js
    component-classification.html
    team-usage-and-maintenance.html
    guides/
      component-classification.md
      team-usage-and-maintenance-en.md
    guides.html
  .github/
    CODEOWNERS
    pull_request_template.md
    ISSUE_TEMPLATE/
      bug-report.yml
      config.yml
      docs-runtime-parity.yml
      feature-request.yml
  scripts/
    browser-smoke-runner.mjs
    build-guides.mjs
    sync-doc-shells.mjs
    fnlla-ui-manifest.mjs
    publish-fnlla-ui.mjs
    test-fnlla-ui-browser.mjs
    test-fnlla-ui-browser-matrix.mjs
    test-fixtures/
      browser-smoke.html
    tooling-support.mjs
    validate-fnlla-ui.mjs
  dist/
    fnlla-ui/
      assets/
        css/
          fnlla-ui.css
        js/
          fnlla-ui.js
        icons/
      LICENSE.md
      README.md
      VERSION
  LICENSE.md
  README.md
  VERSION
```

## How to install it in another project

1. Copy the entire `fnlla-ui` folder into the new project, or use the generated runtime-only export under `dist/fnlla-ui/` when you want a lean handoff.
2. Keep the published `assets/` runtime tree together so relative paths stay simple.
3. Start from the starter markup in this README or from the component patterns in `docs/`.
4. Replace placeholder content with the new project's real branding and copy.
5. If you maintain the framework itself, edit token source values in `src/css/tokens.css` and republish the runtime files plus `dist/fnlla-ui/` before shipping changes.

The framework runs as plain static HTML, CSS and JavaScript. No npm, Composer, bundler or build step is required.

## How to include CSS

```html
<link rel="stylesheet" href="fnlla-ui/assets/css/fnlla-ui.css">
```

If the framework files sit at the site root instead, use:

```html
<link rel="stylesheet" href="assets/css/fnlla-ui.css">
```

## How to include JS

```html
<script src="fnlla-ui/assets/js/fnlla-ui.js"></script>
```

Place the script near the end of `body` so the page markup is available when the script initializes.

Public helper surface:

- `window.FNLLAUI.init(root)` for idempotent initialization of HTML injected after first page load
- `window.FNLLAUI.showToast(target)` and `window.FNLLAUI.hideToast(target)` for non-blocking notification flows
- `window.FNLLAUI.showOffcanvas(target)` and `window.FNLLAUI.hideOffcanvas(target)` for side-panel workflows
- modal aliases `showModal`, `openModal`, `hideModal` and `closeModal`
- offcanvas aliases `showOffcanvas`, `openOffcanvas`, `hideOffcanvas` and `closeOffcanvas`
- dropdown, popover, tooltip and scrollspy helpers including `refreshScrollspy(target)`
- `window.FNLLAUI.init(root)` also binds declarative range outputs for documented `.range-input[id]` controls when matching `[data-fnlla-range-output="<id>"]` elements are present

Runtime hardening notes:

- modal and offcanvas layers share one ordered overlay stack so focus trap, Escape handling, isolation and scroll locking stay correct during mixed or programmatic close sequences
- preferred initial-focus targets skip CSS-hidden controls and controls disabled by a parent `fieldset[disabled]` in favor of the first actually usable control

## FNLLA Icons

FNLLA UI ships a branded internal icon layer called `FNLLA Icons` under `assets/icons/`.

`FNLLA Icons` is a local FNLLA UI distribution based on the official Lucide static asset bundle.

This means:

- no icon should be loaded from `lucide.dev`, `jsdelivr`, `unpkg` or any other external host
- the supported offline paths are local individual SVG files and the local FNLLA Icons sprite
- the original Lucide license is preserved in `assets/icons/LICENSE`
- the internal rebrand and source attribution rules are documented in `assets/icons/NOTICE.md`

Safest fully offline usage:

```html
<span class="icon" aria-hidden="true">
  <img src="fnlla-ui/assets/icons/search.svg" alt="">
</span>
```

Reusable local sprite usage:

```html
<span class="icon" aria-hidden="true">
  <svg><use href="fnlla-ui/assets/icons/sprite.svg#settings-2"></use></svg>
</span>
```

For projects that copy the whole `fnlla-ui/` directory unchanged, both paths stay local and do not require any external request.

## Source architecture

FNLLA UI uses readable source modules while keeping one published public runtime CSS file and one published public runtime JS file.

- `assets/css/fnlla-ui.css` is the published runtime stylesheet consumed by projects.
- `assets/js/fnlla-ui.js` is the published runtime script consumed by projects.
- `dist/fnlla-ui/` is the generated runtime-only handoff for downstream projects that should not receive maintainer source or docs files.
- `src/css/` holds the maintainable CSS source modules that are published into `assets/css/fnlla-ui.css`.
- `src/js/core/` and `src/js/modules/` hold the maintained JS source files.
- `scripts/fnlla-ui-manifest.mjs` is the single source of truth for source-module ordering, runtime outputs and the runtime-export boundary.
- `scripts/sync-doc-shells.mjs` keeps the shared shell of the top-level `docs/*.html` pages aligned with `VERSION`, shared navigation and docs hero metadata.
- `scripts/build-guides.mjs` turns maintainer-authored guide Markdown into browsable HTML pages.
- `scripts/publish-fnlla-ui.mjs` republishes both runtime entrypoints, rebuilds guide HTML and refreshes `dist/fnlla-ui/` after source-module changes.
- `scripts/test-fnlla-ui-browser.mjs` runs a real browser smoke test against the published runtime files.
- `scripts/test-fnlla-ui-browser-matrix.mjs` replays the same smoke flow across every detected supported Chromium browser.
- `.github/workflows/fnlla-ui-hardening.yml` is the repository automation gate for publish, validation and browser hardening on GitHub.
- `docs/component-classification.html` documents when each component should be selected and what category it belongs to.

This keeps the public contract stable without introducing minification or unreadable generated assets. Consumer projects only need the published runtime surface under `assets/css/`, `assets/js/` and `assets/icons/`; `src/` remains the maintainer source tree.

## Distribution model

FNLLA UI intentionally separates maintainer source files from the runtime contract that consumer projects should ship.

- `src/css/` and `src/js/` are the editable maintainer source trees.
- `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js` are the published readable runtime entrypoints.
- `dist/fnlla-ui/` is the runtime-only export that downstream projects can copy without bringing along maintainer source or docs chrome.
- `assets/` contains the runtime tree that consumer projects can ship with the framework, including `assets/icons/` for `FNLLA Icons`.
- `docs/assets/` is documentation-only and should stay outside the runtime contract.
- `README.md`, `VERSION` and `LICENSE.md` define the current repository state and shipping identity.

The repository is still the maintainer workspace, but the supported shipping surface is the same whether a project copies it from `assets/` directly or from the generated `dist/fnlla-ui/` export:

```text
assets/
  css/
    fnlla-ui.css
  js/
    fnlla-ui.js
  icons/
```

That means:

- consumer projects should not depend on `src/`
- maintainers should not hand-edit `assets/css/fnlla-ui.css` or `assets/js/fnlla-ui.js` without also updating the matching source files
- maintainers should not edit `dist/fnlla-ui/` by hand because it is regenerated from the same publish flow
- docs-specific assets should not be copied into product runtime bundles unless a project intentionally wants the docs UI itself
- repository metadata should stay aligned across `README.md`, `VERSION`, `LICENSE.md` and the docs set

`dist/fnlla-ui/` is a packaging convenience, not a second API. It exists to make handoff cleaner while preserving the same runtime contract.

Maintainer workflow:

1. Edit the source modules under `src/`.
2. Republish runtime files, rebuild guide pages and refresh `dist/fnlla-ui/` with `node .\scripts\publish-fnlla-ui.mjs`.
3. Run the browser smoke test with `node .\scripts\test-fnlla-ui-browser.mjs`.
4. Run the repository validator with `node .\scripts\validate-fnlla-ui.mjs`.

Browser docs for this model are available on `docs/distribution.html`.

## Maintainer commands

Core commands for the framework repository:

```bash
node .\scripts\publish-fnlla-ui.mjs
node .\scripts\test-fnlla-ui-browser.mjs
node .\scripts\test-fnlla-ui-browser-matrix.mjs
node .\scripts\validate-fnlla-ui.mjs
```

Use them in that order when runtime behavior, packaging, generated docs or release metadata changed.

## CSS unit policy

FNLLA UI now follows one default authored unit model across the repo:

- `rem` for typography, spacing, radii, component sizing, container widths and breakpoints
- unitless values for `line-height`
- `px` only for optical hairlines such as `1px` borders, outlines or dividers
- `%` only where layout should scale relative to the parent or viewport

Shared tokens in `src/css/tokens.css` are the main reference table for maintainers. Avoid mixing direct `px`, `rem`, `%` and ad-hoc `calc(...)` expressions for the same kind of value unless there is a specific rendering reason to do so.

## Container width policy

FNLLA UI now follows a wider shell model that is closer to mainstream framework ergonomics:

- containers use roughly `90%` of the available page width across breakpoints
- mobile, tablet and desktop all keep a consistent outer margin around the content shell
- `container-sm`, `container` and `container-lg` still cap at different maximum widths so narrower and wider compositions remain possible

This keeps a visible left and right margin at every size without making desktop layouts feel unnecessarily narrow.

## Wrapper policy

Use `.wrapper` as the outer shell for a full page when you want one framework-level parent around the whole layout.

- `.wrapper` is intended for page-level structure
- `.section` is intended for the full-width page band, spacing and section-level background
- `.container`, `.container-sm` and `.container-lg` are intended for content width
- a typical page uses one `.wrapper` with many inner `.container` blocks

The wrapper keeps the page in one vertical flow, gives `main` room to expand, and avoids horizontal spill from decorative or interactive children. The recommended shell is `wrapper > header > main > footer`, with `section` owning the full-width band and `container` keeping the inner grid line. Cards stay optional content components inside sections rather than the base page layout.

## Basic HTML starter template

Use this as the smallest sensible FNLLA UI page shell. It is intentionally conservative: one wrapper, one header, one main content section and one footer.

- Use it when you want to start a brochure page, service page or internal content page without pulling in extra section patterns too early.
- Treat it as the structural baseline, not as a full design example.
- Keep the outer page rhythm on `section` and keep the shared reading width on `container`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starter Page</title>
  <link rel="stylesheet" href="fnlla-ui/assets/css/fnlla-ui.css">
</head>
<body data-fnlla-theme="default">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="wrapper">
    <header>
      <div class="container">
        <nav class="navbar" aria-label="Primary navigation">
          <a class="navbar-brand" href="/">Your Company</a>
          <ul class="navbar-menu">
            <li><a href="#">Home</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <section class="section">
        <div class="container">
          <h1>Page title</h1>
          <p>Replace starter content with your own content.</p>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">
        <p class="footer-note">&copy; 2026 Your Company</p>
      </div>
    </footer>
  </div>

  <script src="fnlla-ui/assets/js/fnlla-ui.js"></script>
</body>
</html>
```

This starter is deliberately simple. It does not try to demonstrate hero variants, cards, section wrappers or the full responsive navigation contract in one snippet. The goal is to keep the first copy-paste example easy to understand, easy to extend and clearly separated from the richer patterns shown elsewhere in the docs.

## Recommended responsive header

Use the simple starter above when you want the lightest possible page shell. If the page needs the official FNLLA UI mobile navigation behavior, replace only the header with this pattern instead.

- Use this version when the navigation should collapse behind a toggle on smaller screens.
- Use this version when the menu is likely to grow beyond a few simple links.
- Keep the toggle button and the `.navbar-panel` together as one shared contract.
- Put the primary link list inside `.navbar-menu` and keep other header actions in the same panel when they should collapse together on mobile.

```html
<header>
  <div class="container">
    <nav class="navbar" aria-label="Primary navigation">
      <a class="navbar-brand" href="/">Your Company</a>
      <button
        class="btn btn-outline btn-sm navbar-toggle"
        type="button"
        data-fnlla-nav-toggle
        aria-controls="primary-navigation-panel"
        aria-expanded="false"
        aria-label="Toggle navigation menu"
      >
        Menu
      </button>
      <div class="navbar-panel" id="primary-navigation-panel">
        <ul class="navbar-menu">
          <li><a href="#">Home</a></li>
          <li><a href="#">Services</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
    </nav>
  </div>
</header>
```

In practice, the simple header is the easiest way to start a small page, while this responsive header is the better choice for production pages with a real mobile navigation requirement and a navigation shell that must stay predictable across breakpoints.

## Canonical page shells

These are the three default page-building patterns for FNLLA UI. In each case:

- `wrapper` owns the whole page shell
- `section` owns the full-width band, spacing and optional background
- `container` keeps the shared inner page width

### 1. Basic page

```html
<body data-fnlla-theme="default">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="wrapper">
    <header>...</header>

    <main id="main-content">
      <section class="section">
        <div class="container">...</div>
      </section>
    </main>

    <footer class="footer">...</footer>
  </div>
</body>
```

### 2. Landing page with hero and repeated sections

```html
<main id="main-content">
  <section class="section section-primary-soft">
    <div class="container">
      <div class="hero hero-compact">...</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="service-section">...</div>
    </div>
  </section>

  <section class="section section-surface">
    <div class="container">
      <section class="cta-section">...</section>
    </div>
  </section>
</main>
```

### 3. Content page with intro and two-column body

```html
<main id="main-content">
  <section class="section section-alt">
    <div class="container">
      <div class="section-header">...</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid grid-2 gap-md">
        <article>...</article>
        <aside>...</aside>
      </div>
    </div>
  </section>
</main>
```

## Naming convention

Framework classes use a prefix-free, framework-style naming scheme inspired by larger public CSS frameworks. Generic JavaScript hooks use the `data-fnlla-*` attribute pattern.

Examples:

- `container`
- `grid`
- `btn`
- `card`
- `data-fnlla-dropdown`
- `data-fnlla-modal-open`

## Design tokens

The token layer uses the `--fnlla-` prefix and is organized into these groups:

- colors
- typography
- spacing
- sizing
- border radius
- shadows
- containers
- breakpoints
- transitions
- z-index

Breakpoint values are kept as static reference tokens because the framework intentionally avoids a build pipeline.

## How to customize design tokens

If you maintain FNLLA UI itself, start with the theme variables in `src/css/tokens.css` and then republish with `scripts/publish-fnlla-ui.mjs`.

If you are consuming the published runtime without editing source modules, override the same `--fnlla-*` tokens in a project stylesheet loaded after `assets/css/fnlla-ui.css`.

Typical customization flow:

1. Update color tokens such as `--fnlla-color-primary`, `--fnlla-color-text` and `--fnlla-color-surface`.
2. Replace the font-family tokens with project-appropriate typefaces.
3. Adjust spacing, radius and shadow tokens if the visual direction needs to feel tighter or softer.
4. Leave component selectors in place unless the new project truly needs new component behavior.

You can also override tokens per theme:

```html
<body data-fnlla-theme="blue">
```

## Theme usage

Apply a theme with a `data-fnlla-theme` attribute on `body`.

```html
<body data-fnlla-theme="default">
<body data-fnlla-theme="dark">
<body data-fnlla-theme="blue">
<body data-fnlla-theme="green">
```

Dark mode is supported through `data-fnlla-theme="dark"`. Theme switching works by overriding variables only, so component CSS stays shared.

## Grid usage

Core layout classes:

- `wrapper`
- `container`
- `container-sm`
- `container-lg`
- `section`
- `section-alt`
- `section-surface`
- `section-primary-soft`
- `grid`
- `grid-2`
- `grid-3`
- `grid-4`
- `gap-sm`
- `gap-md`
- `gap-lg`

Example:

```html
<div class="wrapper">
  <section class="section section-alt">
    <div class="container">
      <div class="grid grid-3 gap-md">
        <article class="card">Column One</article>
        <article class="card">Column Two</article>
        <article class="card">Column Three</article>
      </div>
    </div>
  </section>
</div>
```

## Button usage

Available button styles:

- `btn`
- `btn-primary`
- `btn-secondary`
- `btn-outline`
- `btn-ghost`
- `btn-sm`
- `btn-lg`
- `btn-block`

Example:

```html
<a class="btn btn-primary" href="#">Request a Quote</a>
<button class="btn btn-outline" type="button">Learn More</button>
```

## Card usage

Available card patterns:

- `card`
- `feature-card`
- `service-card`
- `testimonial-card`
- `cta-card`
- `card-title`
- `card-text`
- `content-title`
- `content-text`

Example:

```html
<article class="service-card">
  <h2 class="card-title">Professional Services</h2>
  <p class="card-text">Use this card for repeatable offer summaries.</p>
</article>
```

Use `content-title` and `content-text` when the same heading and body styles are needed outside card components. `card`, `card-title` and `card-text` remain the supported card-family contract for existing and new markup.

## Data display and empty-state usage

Available patterns:

- `list-group`
- `list-group-item`
- `list-group-item-action`
- `list-group-item-title`
- `list-group-item-text`
- `list-group-item-meta`
- `list-group-nav`
- `list-group-link`
- `empty-state`
- `empty-state-title`
- `empty-state-text`
- `empty-state-actions`
- `table-responsive`
- `table`
- `table-striped`
- `table-hover`
- `table-compact`
- `table-sticky`
- `table-borderless`
- `table-align-middle`
- `table-row-title`
- `table-row-meta`
- `table-status`
- `table-status-success`
- `table-status-warning`
- `table-status-danger`
- `table-status-info`

Guidance:

- Use list groups when multiple related rows should read as one grouped surface instead of repeated isolated cards.
- Use `list-group-nav` when the grouped surface is also acting as a destination picker or sub-navigation block.
- Use empty states whenever a panel or data region would otherwise feel blank and should suggest a next action.
- Use responsive tables for dense comparison data, operational summaries and admin-style review flows.
- Use the advanced table helpers when sticky headers, compact state chips or title-plus-meta rows improve scanability.

## Offcanvas usage

Example:

```html
<button class="btn btn-primary" type="button" data-fnlla-offcanvas-open="#workspace-panel">
  Open panel
</button>

<div
  class="offcanvas offcanvas-end"
  id="workspace-panel"
  data-fnlla-offcanvas
  role="dialog"
  aria-modal="true"
  aria-labelledby="workspace-panel-title"
  aria-describedby="workspace-panel-description"
  hidden
>
  <div class="offcanvas-panel">
    <div class="offcanvas-header">
      <h2 id="workspace-panel-title">Workspace panel</h2>
      <button class="btn btn-ghost" type="button" data-fnlla-offcanvas-close data-fnlla-offcanvas-initial-focus>Close</button>
    </div>
    <div class="offcanvas-body">
      <p id="workspace-panel-description">Use side panels for supporting actions that should keep page context visible.</p>
    </div>
  </div>
</div>
```

Contract:

- Use `[data-fnlla-offcanvas-open]` on the trigger and point it at a real offcanvas selector such as `#workspace-panel`.
- Mark the overlay container with `[data-fnlla-offcanvas]` and keep one `.offcanvas-panel` element inside it.
- Add `[data-fnlla-offcanvas-close]` to explicit dismiss controls.
- Use offcanvas for side workspaces, secondary filters and supporting actions rather than blocking confirmation flows.

## Popover and tooltip usage

Tooltip example:

```html
<button
  class="btn btn-outline"
  type="button"
  data-fnlla-tooltip="Use tooltips for short clarification."
  data-fnlla-tooltip-position="right"
>
  Help
</button>
```

Popover example:

```html
<div class="popover" data-fnlla-popover>
  <button
    class="btn btn-primary"
    id="review-toggle"
    type="button"
    data-fnlla-popover-toggle
    aria-controls="review-panel"
    aria-expanded="false"
  >
    Open popover
  </button>
  <div class="popover-panel" id="review-panel" aria-labelledby="review-toggle" hidden>
    <h2 class="popover-title">Compact review panel</h2>
    <p class="popover-text">Use popovers for richer helper content or small next-step actions.</p>
    <div class="popover-actions">
      <button class="btn btn-ghost btn-sm" type="button" data-fnlla-popover-close>Close</button>
    </div>
  </div>
</div>
```

Contract:

- Use `data-fnlla-tooltip` only for short supporting text attached to one trigger.
- Use `[data-fnlla-popover]` with `[data-fnlla-popover-toggle]` when the panel needs richer content or compact actions.
- Keep popovers smaller and lighter than modals or offcanvas panels.

## Scrollspy usage

Example:

```html
<div class="scrollspy-layout" data-fnlla-scrollspy>
  <nav class="scrollspy-nav" data-fnlla-scrollspy-nav aria-label="Page sections">
    <ol class="scrollspy-nav-list">
      <li><a class="scrollspy-link" href="#overview">Overview</a></li>
      <li><a class="scrollspy-link" href="#delivery">Delivery</a></li>
    </ol>
  </nav>
  <div class="scrollspy-panel">
    <section class="scrollspy-section" id="overview">...</section>
    <section class="scrollspy-section" id="delivery">...</section>
  </div>
</div>
```

Contract:

- Use `[data-fnlla-scrollspy]` on the wrapper and `[data-fnlla-scrollspy-nav]` on the navigation block.
- Keep every scrollspy link pointing to one real same-page section `id`.
- The framework applies `aria-current="location"` to the active in-page destination.

## Composable section patterns

Start with a normal page band such as `<section class="section"><div class="container">...</div></section>` and place these wrappers inside when a section needs a more opinionated visual shell.

Available section wrappers:

- `hero`
- `hero-split`
- `hero-compact`
- `feature-section`
- `service-section`
- `faq-section`
- `contact-section`
- `stats-section`
- `process-section`
- `pricing-section`
- `testimonial-section`
- `cta-section`

Supporting layout helpers:

- `hero-copy`
- `hero-actions`
- `hero-panel`
- `hero-panel-intro`
- `hero-metric-list`
- `hero-visual`
- `hero-visual-pane`
- `hero-art-*`
- `hero-background*`
- `hero-inline-facts`
- `hero-inline-fact`
- `cta-copy`
- `cta-inline-notes`
- `cta-proof-grid`
- `cta-support`
- `feature-grid`
- `service-grid`
- `contact-grid`
- `contact-card`
- `contact-summary-card`
- `contact-form`
- `contact-field-grid`
- `contact-field`
- `contact-field-meta`
- `stats-grid`
- `process-grid`
- `pricing-grid`
- `pricing-card-head`
- `testimonial-card-grid`
- `footer-top`
- `footer-lead`
- `footer-pillars`
- `footer-pillar`
- `footer-body`
- `footer-status`
- `footer-contact`
- `footer-meta-copy`
- `footer-legal`

Example:

```html
<section class="section section-surface">
  <div class="container">
    <div class="pricing-section">
      <div class="section-header">
        <p class="pricing-kicker">Pricing block</p>
        <h2 class="section-title">Choose the right delivery tier</h2>
        <p class="section-text">Use one documented pricing wrapper instead of inventing a new comparison layout for each project.</p>
      </div>

      <div class="pricing-grid">
        <article class="pricing-card">
          <div class="pricing-card-head">
            <h3 class="pricing-title">Starter</h3>
          </div>
          <div class="pricing-price">
            <p class="pricing-price-value">&pound;900</p>
            <p class="pricing-price-period">per sprint</p>
          </div>
          <ul class="pricing-feature-list">
            <li>one primary workstream</li>
            <li>weekly delivery review</li>
          </ul>
          <a class="btn btn-outline" href="#">Compare starter</a>
        </article>
      </div>
    </div>
  </div>
</section>
```

Guidance:

- Use the section wrappers when a repeated page structure needs a stable visual shell, not just one isolated card.
- Prefer the section-level classes for reusable marketing, service, pricing, FAQ and proof-content layouts before creating project-specific variants.
- Keep the internal content semantic: headings should stay real heading elements, pricing features should stay lists, and FAQ answers should remain real accordion panels.
- Copy the fuller reference markup from `docs/sections.html` and `docs/forms.html` when a project needs complete hero, FAQ, contact, pricing, process or testimonial sections.

## Alert usage

Available alert patterns:

- `alert`
- `alert-info`
- `alert-success`
- `alert-warning`
- `alert-danger`
- `alert-title`
- `alert-text`

Example:

```html
<div class="alert alert-success" role="status">
  <h2 class="alert-title">Profile updated</h2>
  <p class="alert-text">Your changes were saved successfully.</p>
</div>
```

Guidance:

- Use exactly one semantic variant on each alert.
- Use `role="status"` for passive confirmations and neutral updates.
- Use `role="alert"` only for urgent warnings or blocking failures.
- Keep alert text concise and actionable, especially when it will be announced by assistive technology.

## Form usage

Available form classes:

- `form`
- `form-group`
- `label`
- `input`
- `textarea`
- `select`
- `help-text`
- `error-text`
- `success-text`
- `form-message`
- `form-message-success`
- `form-message-error`
- `form-message-title`
- `form-message-text`
- `input-group`
- `input-group-text`
- `input-group-field`
- `input-group-action`
- `range-field`
- `range-input`
- `range-meta`
- `range-output`
- `range-labels`
- `file-field`
- `file-label`
- `file-input`
- `file-button`
- `file-name`
- `form-layout-card`
- `lead-capture-form`
- `lead-capture-intro`
- `lead-capture-points`
- `lead-capture-actions`
- `lead-capture-action-bar`
- `contact-summary-card`
- `contact-form`
- `contact-field-grid`
- `contact-field`
- `contact-field-meta`

Example:

```html
<form class="form">
  <div class="form-group">
    <label class="label" for="name">Full name</label>
    <input
      class="input"
      id="name"
      name="name"
      type="text"
      aria-describedby="name-help name-error"
      aria-invalid="true"
    >
    <p class="help-text" id="name-help">Tell us how to address you.</p>
    <p class="error-text" id="name-error">Enter your full name before continuing.</p>
  </div>

  <div class="form-message form-message-error" role="alert">
    <h2 class="form-message-title">Please review the form</h2>
    <p class="form-message-text">One or more required fields still need attention.</p>
  </div>
</form>
```

Guidance:

- Use `aria-describedby` to connect a field with every help, success or error message it depends on.
- Use `aria-invalid="true"` only on controls that are actually invalid, and keep the message visible near the field.
- Use `success-text` for accepted field-level feedback and `form-message-*` for form-level success or failure summaries.
- Use `role="status"` for passive confirmations and `role="alert"` only for urgent failed-submit feedback.

Layout recipes:

- Use one-column stacking for long-text answers, review-heavy flows and most mobile-first forms.
- Use two-column rows only for short related fields that can still scan well when they collapse on smaller screens.
- Use a compact lead-capture form when the page only needs one lightweight next step such as an email follow-up request.
- Use `input-group` when the field needs a fixed prefix, suffix or attached button without introducing one-off layout rules.
- Use `[data-fnlla-range-output="<input-id>"]` when a slider should keep a visible live value in sync without writing page-specific JavaScript.

Submission flow checklist:

- Keep one visible summary near the top after a failed submit and repeat the exact issue at each invalid field.
- In a real application flow, move focus to the summary or the first invalid field after validation fails.
- Keep success confirmation visible long enough to explain the next step instead of only changing button text.

## Loading and progress usage

Available loading and progress classes:

- `progress`
- `progress-bar`
- `progress-field`
- `progress-meta`
- `progress-label`
- `progress-value`
- `progress-indeterminate`
- `spinner`
- `spinner-sm`
- `spinner-lg`
- `spinner-current`
- `loader-inline`
- `loading-showcase`
- `loading-panel`
- `loading-panel-header`
- `loading-stack`
- `loading-spinner-grid`
- `loading-skeleton-grid`
- `loading-surface`
- `loading-caption`
- `loading-spinner-row`
- `loading-footer`
- `loading-controls`
- `skeleton`
- `skeleton-line`
- `skeleton-block`
- `skeleton-card`
- `skeleton-media`
- `skeleton-avatar`
- `skeleton-copy`
- `skeleton-actions`
- `skeleton-table`
- `skeleton-table-row`

Example:

```html
<div class="progress-field">
  <div class="progress-meta">
    <p class="progress-label">Asset sync</p>
    <p class="progress-value">72%</p>
  </div>
  <div class="progress" role="progressbar" aria-label="Asset sync" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72">
    <span class="progress-bar" style="width: 72%;"></span>
  </div>
  <p class="help-text">18 of 25 files complete, about 2 minutes left.</p>
</div>

<div class="progress-field">
  <div class="progress-meta">
    <p class="progress-label">Background indexing</p>
    <p class="progress-value">18/25 files</p>
  </div>
  <div class="progress progress-indeterminate" role="progressbar" aria-label="Background indexing" aria-valuetext="In progress">
    <span class="progress-bar"></span>
  </div>
</div>

<button class="btn btn-primary btn-sm is-loading" type="button" aria-busy="true" disabled>
  <span class="spinner spinner-sm spinner-current" aria-hidden="true"></span>
  Saving...
</button>
```

Guidance:

- Use determinate progress only when the current value is actually known.
- Use `progress-indeterminate` for active work without a trustworthy percentage.
- Pair spinners with visible copy for short live activity rather than leaving the state silent.
- Use `spinner-current` when a spinner sits on a dark or filled action surface and should inherit the button text color.
- Prefer skeleton variants that resemble the final layout, such as a card shell, media row or table row, instead of repeating generic lines everywhere.
- Reduced motion users should still get visible state copy because spinner rotation, indeterminate progress motion and skeleton shimmer are softened or removed when `prefers-reduced-motion` is active.

## Navigation usage

Use a shared collapsible panel so the primary menu and call-to-action area behave as one navigation block on mobile screens.

Example:

```html
<nav class="navbar" aria-label="Primary navigation">
  <a class="navbar-brand" href="#">Your Company</a>
  <button
    class="btn btn-outline btn-sm navbar-toggle"
    type="button"
    data-fnlla-nav-toggle
    aria-controls="primary-navigation-panel"
    aria-expanded="false"
    aria-label="Toggle navigation menu"
  >
    Menu
  </button>
  <div class="navbar-panel" id="primary-navigation-panel">
    <ul class="navbar-menu">
      <li><a href="#" aria-current="page">Home</a></li>
      <li><a href="#">Services</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
    <div class="navbar-actions">
      <a class="btn btn-ghost btn-sm" href="#">Learn More</a>
      <a class="btn btn-primary btn-sm" href="#">Request a Quote</a>
    </div>
  </div>
</nav>
```

Contract:

- Use `.navbar` as the outer wrapper and a visible `.navbar-brand` link or logo.
- Use a real `button` with `data-fnlla-nav-toggle`; its `aria-controls` must point to the collapsible `.navbar-panel`.
- Put the primary link list inside `.navbar-menu` within the shared `.navbar-panel`.
- Put secondary actions such as sign-in or quote buttons inside `.navbar-actions` within the same `.navbar-panel`.
- The official pattern collapses the whole panel on mobile; outside click and Escape close an open mobile panel.
- When Escape closes the mobile panel, focus returns to the toggle so keyboard users do not remain inside hidden navigation content.

## Dropdown usage

Dropdowns use shared classes plus data attributes for behavior.

Example:

```html
<div class="dropdown" data-fnlla-dropdown>
  <button
    class="btn btn-outline"
    type="button"
    data-fnlla-dropdown-toggle
    aria-expanded="false"
    aria-controls="example-dropdown"
  >
    Menu
  </button>
  <div class="dropdown-menu" id="example-dropdown" aria-hidden="true">
    <a class="dropdown-item" href="#">Item One</a>
    <a class="dropdown-item" href="#">Item Two</a>
  </div>
</div>
```

Contract:

- Use `[data-fnlla-dropdown]` on the wrapper and `[data-fnlla-dropdown-toggle]` on a real button.
- Pair the toggle with `aria-controls`; the controlled element should be the `.dropdown-menu`.
- Keep the menu labeled by its toggle; the framework will normalize `aria-labelledby` when the toggle has or receives an `id`.
- Keep only focusable menu actions inside the menu so arrow-key movement behaves predictably.
- Arrow Down, Arrow Up, Home and End are supported for keyboard movement inside the open list.

## Tabs usage

Example:

```html
<div class="tabs" data-fnlla-tabs>
  <div class="tab-list" data-fnlla-tab-list aria-label="Example tabs">
    <button
      class="tab-button"
      id="overview-tab"
      type="button"
      data-fnlla-tab
      aria-selected="true"
      aria-controls="overview-panel"
    >
      Overview
    </button>
    <button
      class="tab-button"
      id="details-tab"
      type="button"
      data-fnlla-tab
      aria-selected="false"
      aria-controls="details-panel"
    >
      Details
    </button>
  </div>

  <section class="tab-panel" id="overview-panel" aria-labelledby="overview-tab">
    <h2 class="content-title">Overview panel</h2>
    <p class="content-text">Primary tab content.</p>
  </section>

  <section class="tab-panel" id="details-panel" aria-labelledby="details-tab">
    <h2 class="content-title">Details panel</h2>
    <p class="content-text">Secondary tab content.</p>
  </section>
</div>
```

Contract:

- Use `[data-fnlla-tabs]` on the wrapper, `[data-fnlla-tab-list]` on the tab row and `[data-fnlla-tab]` on each tab trigger button.
- Pair each tab with one `.tab-panel` through `aria-controls`, and pair each panel back to the button with `aria-labelledby`.
- Mark one initial tab with `aria-selected="true"`; the script will normalize `tabindex`, `aria-selected` and panel visibility on load.
- The framework sets a horizontal `aria-orientation` by default unless the project explicitly provides a different value.
- Horizontal tablists use Arrow Left and Arrow Right; vertical tablists should declare `aria-orientation="vertical"` and use Arrow Up and Arrow Down instead.
- Home and End move to the first and last tab and activate the newly focused panel.
- Without JavaScript, all panels remain visible by default, so content still stays available.

## Breadcrumb usage

Example:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item"><a class="breadcrumb-link" href="#">Home</a></li>
    <li class="breadcrumb-item"><a class="breadcrumb-link" href="#">Services</a></li>
    <li class="breadcrumb-item"><span class="breadcrumb-current" aria-current="page">Implementation plan</span></li>
  </ol>
</nav>
```

Guidance:

- Use a labeled `nav` plus an ordered list so the trail reads as a meaningful sequence.
- Keep only earlier levels interactive; the current page should expose `aria-current="page"`.
- Use breadcrumbs only when they reflect a real parent-child hierarchy.

## Pagination usage

Example:

```html
<nav class="pagination" aria-label="Results pages">
  <ol class="pagination-list">
    <li class="pagination-item"><a class="pagination-link" href="#">Previous</a></li>
    <li class="pagination-item"><a class="pagination-link" href="#">1</a></li>
    <li class="pagination-item"><a class="pagination-link" href="#" aria-current="page">2</a></li>
    <li class="pagination-item"><a class="pagination-link" href="#">3</a></li>
    <li class="pagination-item"><span class="pagination-ellipsis" aria-hidden="true">...</span></li>
    <li class="pagination-item"><a class="pagination-link" href="#">8</a></li>
    <li class="pagination-item"><a class="pagination-link" href="#">Next</a></li>
  </ol>
</nav>
```

Guidance:

- Use a labeled `nav` and keep every page action inside one sequence list.
- Mark the active page with `aria-current="page"`.
- Prefer explicit Previous and Next labels when they improve clarity on touch devices and narrow layouts.

## Modal usage

Example:

```html
<button class="btn btn-primary" type="button" data-fnlla-modal-open="#example-modal">
  Open modal
</button>

<div
  class="modal"
  id="example-modal"
  data-fnlla-modal
  role="dialog"
  aria-modal="true"
  aria-hidden="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div class="modal-content">
    <button class="btn btn-ghost" type="button" data-fnlla-modal-close data-fnlla-modal-initial-focus>Close</button>
    <h2 id="modal-title">Modal title</h2>
    <p id="modal-description">Reusable modal content.</p>
  </div>
</div>
```

Contract:

- Use `[data-fnlla-modal-open]` on the trigger and point it at a real modal selector such as `#example-modal`.
- Mark the overlay container with `[data-fnlla-modal]` and keep one `.modal-content` element inside it.
- Put dialog semantics and labeling on the modal container through `role="dialog"`, `aria-modal`, `aria-labelledby` and, when useful, `aria-describedby`.
- Provide a visible close button with `[data-fnlla-modal-close]`.
- Add `data-fnlla-modal-initial-focus` or native `autofocus` when a specific control should receive focus first.
- While open, the modal isolates sibling page branches with `aria-hidden` and `inert` so background content stays out of the active focus order.
- If a modal contains no naturally focusable element, the dialog container itself becomes the focus target when opened.

## Toast usage

Example:

```html
<button class="btn btn-primary" type="button" data-fnlla-toast-open="#save-toast">
  Show toast
</button>

<div class="toast-stack" aria-live="polite">
  <article
    class="toast toast-success"
    id="save-toast"
    data-fnlla-toast
    data-fnlla-toast-autohide="5000"
    role="status"
    hidden
  >
    <h2 class="toast-title">Changes saved</h2>
    <p class="toast-text">Use a toast for short confirmation that should not interrupt the workflow.</p>
    <div class="toast-actions">
      <button class="btn btn-ghost btn-sm" type="button" data-fnlla-toast-close>Dismiss</button>
    </div>
  </article>
</div>
```

Contract:

- Use `[data-fnlla-toast]` on the toast surface and `[data-fnlla-toast-open]` on triggers that should reveal it.
- Use `[data-fnlla-toast-close]` on dismiss controls inside the toast.
- Optional `data-fnlla-toast-autohide` uses milliseconds.
- Use toasts only for short, non-blocking feedback. If the user must stop, review or confirm something important, prefer an alert or modal.

## Accordion usage

Example:

```html
<div class="accordion" data-fnlla-accordion>
  <div class="accordion-item">
    <button
      class="accordion-button"
      id="faq-trigger-1"
      type="button"
      data-fnlla-accordion-button
      aria-expanded="false"
      aria-controls="faq-panel-1"
    >
      Question one
    </button>
    <div class="accordion-panel" id="faq-panel-1" role="region" aria-labelledby="faq-trigger-1">
      <p>Accordion answer content.</p>
    </div>
  </div>
</div>
```

Contract:

- Use `[data-fnlla-accordion]` on the wrapper and `[data-fnlla-accordion-button]` on each trigger button.
- Each trigger should control one panel through `aria-controls`, and each panel should reference the trigger with `aria-labelledby`.
- Add `data-fnlla-accordion-single` only when opening one panel at a time is the intended content model.
- Arrow Up, Arrow Down, Home and End move focus between accordion triggers.

## JavaScript behavior hooks

The framework script looks for these generic selectors:

- Dropdowns: `data-fnlla-dropdown`, `data-fnlla-dropdown-toggle`
- Mobile navigation: `data-fnlla-nav-toggle`, `aria-controls`
- Tabs: `data-fnlla-tabs`, `data-fnlla-tab-list`, `data-fnlla-tab`
- Accordions: `data-fnlla-accordion`, `data-fnlla-accordion-button`
- Modals: `data-fnlla-modal`, `data-fnlla-modal-open`, `data-fnlla-modal-close`
- Toasts: `data-fnlla-toast`, `data-fnlla-toast-open`, `data-fnlla-toast-close`
- Offcanvas: `data-fnlla-offcanvas`, `data-fnlla-offcanvas-open`, `data-fnlla-offcanvas-close`
- Popovers: `data-fnlla-popover`, `data-fnlla-popover-toggle`, `data-fnlla-popover-close`
- Tooltips: `data-fnlla-tooltip`
- Scrollspy: `data-fnlla-scrollspy`, `data-fnlla-scrollspy-nav`
- Runtime re-init: `window.FNLLAUI.init(rootElement)`
- Runtime helpers: `window.FNLLAUI.showModal(target)`, `window.FNLLAUI.openModal(target)`, `window.FNLLAUI.hideModal(target)`, `window.FNLLAUI.closeModal(target)`, `window.FNLLAUI.showToast(target)`, `window.FNLLAUI.hideToast(target)`, `window.FNLLAUI.showOffcanvas(target)`, `window.FNLLAUI.openOffcanvas(target)`, `window.FNLLAUI.hideOffcanvas(target)`, `window.FNLLAUI.closeOffcanvas(target)`, `window.FNLLAUI.openDropdown(target)`, `window.FNLLAUI.closeDropdown(target)`, `window.FNLLAUI.openPopover(target)`, `window.FNLLAUI.closePopover(target)`, `window.FNLLAUI.showTooltip(target)`, `window.FNLLAUI.hideTooltip(target)`, `window.FNLLAUI.refreshScrollspy(target)`

The script is defensive and should not throw errors when a given component is missing from a page.

## Stable API reference

- Use `docs/api.html` as the stable release contract for supported runtime files, documented CSS families and JavaScript hooks.
- Treat `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js` as the supported runtime surface.
- Treat `docs/assets/docs.css` as documentation-only and do not pull it into production pages or use it as a substitute for missing runtime component styles.
- The stable class API is intentionally prefix-free and uses names such as `btn`, `card`, `navbar`, `grid` and `mt-3`.
- Runtime behavior hooks use the `data-fnlla-*` namespace, and shared design tokens use the `--fnlla-*` namespace.
- Hooks such as `data-ui-target` and `data-ui-nav-menu` are not part of the supported API.

## Validation command

Run the built-in validator before a release or after significant docs changes:

```bash
node .\scripts\validate-fnlla-ui.mjs
```

Republish the readable public runtime assets and the runtime-only export after source-module changes:

```bash
node .\scripts\publish-fnlla-ui.mjs
```

The validator checks docs page wiring, required asset references, skip-link targets, duplicate IDs, ARIA target relationships, the generated runtime export and whether README stays aligned with the current docs set.

Run the detected Chromium browser matrix when you want a broader pre-release sweep across locally available browsers:

```bash
node .\scripts\test-fnlla-ui-browser-matrix.mjs
```

## Maintenance architecture

The runtime files remain single-entry assets for consuming projects, but their maintenance boundaries are now treated as explicit modules.

CSS source architecture in `src/css/`:

- `tokens.css`
- `base.css`
- `layout.css`
- `components/*.css`
- `sections/*.css`
- `utilities.css`
- `responsive.css`
- `a11y.css`

JavaScript source architecture in `src/js/`:

- `core/*.js` for shared state, DOM helpers and runtime API
- `modules/*.js` for component initializers such as dropdowns, tabs, modals, toasts, offcanvas, popovers, tooltips and scrollspy
- `scripts/fnlla-ui-manifest.mjs` to define the one true module-ordering and runtime-export contract used by publish and validation
- `scripts/build-guides.mjs` to publish guide-source Markdown into HTML docs under `docs/guides/`
- `scripts/publish-fnlla-ui.mjs` to republish the readable public `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js`, rebuild guide pages and refresh `dist/fnlla-ui/`
- `scripts/test-fnlla-ui-browser.mjs` to run the browser smoke test against the published runtime files
- `scripts/test-fnlla-ui-browser-matrix.mjs` to re-run the same smoke flow across every supported local Chromium browser that is detected

This structure keeps the public asset shape stable while reducing the maintenance cost of future hardening work.

## Accessibility notes

- Use semantic HTML first, then enhance with framework classes.
- Keep visible labels on form controls.
- Pair dropdown, navigation and accordion triggers with `aria-controls` and `aria-expanded`.
- Pair tabs with `aria-controls`, `aria-labelledby` and one clearly selected state.
- Dropdown menus should stay labeled by their trigger, whether that linkage is authored directly or normalized by the framework.
- Pair breadcrumbs and pagination with labeled `nav` landmarks and `aria-current="page"` where relevant.
- For mobile navigation, prefer a single `.navbar-panel` so links and CTAs collapse together.
- When mobile navigation closes with Escape, return focus to the toggle rather than leaving focus inside hidden content.
- Provide dialog labels and descriptions for modals with `aria-labelledby` and `aria-describedby`.
- The modal script returns focus to the trigger after close where possible.
- Use `data-fnlla-modal-initial-focus` or native `autofocus` when the first focus target should be explicit.
- Hidden panels and collapsed regions should keep hidden descendants out of the active focus order; the framework now filters focus targets through hidden and `aria-hidden` ancestors and also marks collapsed interactive regions as `inert` when JavaScript is active.
- While a modal is open, sibling page branches are isolated with `aria-hidden` and `inert` so keyboard and assistive-technology users stay inside the active dialog context.
- Tabs support orientation-aware keyboard navigation: horizontal lists use Arrow Left and Arrow Right, vertical lists use Arrow Up and Arrow Down, and Home and End work in both modes.
- Accordion triggers support Arrow Up, Arrow Down, Home and End keyboard navigation.
- The framework now includes a `forced-colors` fallback layer so core controls remain legible in high-contrast system modes.
- Include a `Skip to main content` link on real pages.
- Reduced motion preferences are respected with `prefers-reduced-motion`.
- Test projects with keyboard-only navigation, zoom and narrow mobile screens before launch.

## Browser support assumptions

- modern evergreen browsers
- CSS Grid support
- CSS custom properties
- `classList`, `closest`, `querySelector`, `addEventListener`

## Compatibility notes

- `data-fnlla-modal-open` expects a selector such as `#example-modal`, not a bare `id` value.
- Mobile navigation uses progressive enhancement: without JavaScript the navigation panel stays visible, and the collapsed behavior only activates after the script adds `fnlla-ui-js`.
- The `fnlla-ui-js` root class marks JavaScript-enhanced behavior at runtime.
- Accordion triggers are expected to use `aria-controls`.
- Dropdowns use disclosure-style behavior with focusable links and buttons inside the panel; they are not modeled as ARIA application menus.
- The framework assumes modern evergreen browsers and does not ship polyfills.

## Responsive and Interaction QA Checklist

- Check layouts at narrow mobile widths, common tablet widths and wide desktop widths.
- Verify that navigation opens, closes, and restores a sensible reading order on mobile.
- Verify that Escape returns focus to the mobile navigation toggle after the panel closes.
- Test dropdowns with mouse, touch, Escape, Arrow keys, Home and End.
- Test tabs with click, Arrow keys and Home or End, and verify vertical tablists use Up or Down instead of Left or Right when `aria-orientation="vertical"` is declared.
- Test breadcrumbs and pagination after labels wrap so the reading order still makes sense on narrow screens.
- Test accordions with Enter or Space, Arrow keys, Home and End.
- Test modals for focus trap behavior, Escape closing, backdrop closing and focus return to the trigger.
- Confirm any explicit modal initial-focus target still receives focus when the dialog opens.
- Confirm background content cannot be tabbed to or reached by assistive technology while a modal is open.
- Review core components in a high-contrast or forced-colors mode and confirm selected, active and focused states remain obvious.
- Review pages with 200% zoom and keyboard-only navigation.
- Confirm focus indicators remain visible across all supported themes.

## Maintenance QA Checklist

Use this checklist before shipping framework updates to downstream projects.

- Re-test the interactive reference patterns in `docs/components.html` for dropdowns, tabs, accordions, modals and mobile navigation.
- Re-test the form reference flows in `docs/forms.html`, including error summaries, field-level messaging and contact-section layout collapse.
- Review reusable section patterns in `docs/sections.html` at mobile, tablet and desktop widths so hero, FAQ, pricing, process, stats and testimonial blocks still compose cleanly.
- Review at least one light theme and one alternate theme so focus, selected and active states remain obvious after token changes.
- Review a high-contrast or forced-colors mode and confirm primary actions, selected tabs, active pagination and open accordion states remain legible.
- Confirm no hidden or collapsed region can still receive keyboard focus once JavaScript enhancement is active.
- Confirm documentation pages still load with `docs/assets/docs.css` plus the shared framework stylesheet and no docs-only selectors have leaked back into `assets/css/fnlla-ui.css`.
- Run `scripts/validate-fnlla-ui.mjs` and confirm it passes before the updated snapshot is treated as trustworthy.
- Run `scripts/test-fnlla-ui-browser.mjs` when interactive behavior or published runtime assets change materially.
- Run `scripts/test-fnlla-ui-browser-matrix.mjs` when more than one supported local Chromium browser is available and the change is broad enough to justify a wider sweep.
- Keep `.github/workflows/fnlla-ui-hardening.yml` green before treating a publication branch as ready.
- Confirm `README.md`, `VERSION`, `LICENSE.md` and the docs set all describe the same current framework state.

## Versioning guidance

- Bump `VERSION` only when the repository snapshot is intentionally being published as a new framework cut.
- Update `README.md` and the relevant docs pages in the same change when the public contract changes.
- Re-run publish, smoke validation and repository validation before treating the new snapshot as canonical.
- Prefer current-state documentation over historical notes. The repository documents what FNLLA UI is today, not how it evolved.

## What is intentionally excluded

- client-specific branding
- business-specific copy
- logos, photos and testimonials
- phone numbers, email addresses and company details
- project-specific back-end integrations
- environment-specific helper scripts
- tracking snippets and measurement code
- custom contact endpoints or AJAX handlers

## Included documentation

- Docs: `docs/index.html`, `docs/distribution.html`, `docs/layout.html`, `docs/components.html`, `docs/sections.html`, `docs/forms.html`, `docs/utilities.html`, `docs/icons.html`, `docs/api.html`, `docs/guides.html`
- Component classification guide: `docs/component-classification.html`
- Team usage and maintenance guide: `docs/team-usage-and-maintenance.html`
- Docs stylesheet: `docs/assets/docs.css` for documentation-only shell and presentation helpers around the shared runtime
- Guide sources: `docs/guides/*.md` for maintainer-authored content that publishes into the HTML guide set
- Runtime manifest: `scripts/fnlla-ui-manifest.mjs` for the shared source-ordering and export contract
- Validator: `scripts/validate-fnlla-ui.mjs` for release-stage structural checks
- Browser smoke test: `scripts/test-fnlla-ui-browser.mjs` for published runtime behavior checks
- License: `LICENSE.md` for proprietary commercial usage terms

Use the docs to review component behavior and copy the patterns you need into real project templates. The docs shell is documentation-specific, but component demos should render from the same default runtime shipped in `assets/css/fnlla-ui.css` and `assets/js/fnlla-ui.js`.
