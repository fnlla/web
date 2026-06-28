# Team Usage and Maintenance

This guide belongs to `FNLLA UI`. It is maintained by `TechAyo LTD (techayo.co.uk)` and published from the framework repository for teams working from `Finella Gardens in Dundee, UK`.

## Use this guide when

- you are starting a new website on top of `FNLLA UI`
- you need to decide whether a change belongs to the website or the framework
- you are updating the vendored runtime in a downstream project
- you need a repeatable maintenance and review workflow

## Operating modes

FNLLA UI has two valid ways of working.

### Consumer mode

Use the ready runtime from `dist/fnlla-ui/` or `assets/`, then build the website on top of that published contract.

### Maintainer mode

Extend or fix the framework itself inside the `fnlla-ui` repository, then republish the runtime and revalidate the docs and release surface.

### Default rule

If you are building one website, default to consumer mode. Move into maintainer mode only when the missing token, pattern or behavior should serve more than one project.

## Before a project starts

Agree on these decisions before page work begins.

- whether the new website only consumes the framework or also contributes back to it
- where the framework runtime will live inside the project repository
- who approves token, pattern and UI-system changes
- who owns accessibility QA and final release review
- whether branding changes stay local or should be upstreamed to the framework

Recommended ownership split:

- `Tech lead`: decides whether a change belongs to the project or to the framework
- `Frontend developer`: builds pages with stable classes and `data-fnlla-*` hooks
- `Design or system owner`: approves tokens, spacing, typography and component reuse
- `Framework maintainer`: edits `src/`, republishes runtime files and runs validation
- `QA owner`: checks responsive behavior, accessibility and critical smoke flows

## Build a new website on FNLLA UI

### Deliver the framework

The safest default is to copy `dist/fnlla-ui/` into the website repository and treat it as a vendored runtime dependency.

```text
my-site/
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
  assets/
    css/
      site.css
    js/
      site.js
    img/
  index.html
  about.html
  contact.html
```

If the project prefers another folder such as `vendor/fnlla-ui/`, keep that path consistent across HTML, CSS, JS and team documentation.

### Include the runtime files

Load the framework runtime on every page, then layer project-specific assets after it.

```html
<link rel="stylesheet" href="fnlla-ui/assets/css/fnlla-ui.css">
<link rel="stylesheet" href="assets/css/site.css">
```

At the end of `body`:

```html
<script src="fnlla-ui/assets/js/fnlla-ui.js"></script>
<script src="assets/js/site.js"></script>
```

The order matters:

- first `fnlla-ui.css`
- then project-level CSS such as `site.css`
- first `fnlla-ui.js`
- then project-level scripts

### Start from a stable page shell

The first page should establish structure before it chases styling detail.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Name</title>
  <link rel="stylesheet" href="fnlla-ui/assets/css/fnlla-ui.css">
  <link rel="stylesheet" href="assets/css/site.css">
</head>
<body data-fnlla-theme="default">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="wrapper">
    <header>
      <div class="container">
        <nav class="navbar" aria-label="Primary navigation">
          <a class="navbar-brand" href="/">Brand</a>
          <ul class="navbar-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
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
        <p class="footer-note">&copy; 2026 Brand</p>
      </div>
    </footer>
  </div>

  <script src="fnlla-ui/assets/js/fnlla-ui.js"></script>
  <script src="assets/js/site.js"></script>
</body>
</html>
```

Keep the responsibility split clear:

- `wrapper` owns the full page flow
- `section` owns the full-width band and rhythm
- `container` owns the shared inner width
- components such as cards or panels sit inside that shell

### Upgrade the header when navigation grows

When the site needs the official mobile navigation behavior, switch the header to the documented toggle and panel pattern.

```html
<header>
  <div class="container">
    <nav class="navbar" aria-label="Primary navigation">
      <a class="navbar-brand" href="/">Brand</a>
      <button
        class="btn btn-outline btn-sm navbar-toggle"
        type="button"
        data-fnlla-nav-toggle
        aria-controls="primary-navigation-panel"
        aria-expanded="false"
        aria-label="Open menu"
      >
        Menu
      </button>
      <div class="navbar-panel" id="primary-navigation-panel">
        <ul class="navbar-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>
    </nav>
  </div>
</header>
```

Use that responsive header when navigation will grow, collapse or include actions that should live inside one shared mobile panel.

### Compose from docs before inventing variants

Before writing new markup, check these references first:

- `docs/layout.html`
- `docs/components.html`
- `docs/sections.html`
- `docs/components.html`
- `docs/utilities.html`
- `docs/contract.html`
- `docs/component-classification.html`

Recommended build loop:

1. Pick the closest documented pattern.
2. Copy the markup into the project.
3. Replace content, links and images.
4. Add project-level helper classes only if composition is still not enough.

### Brand with tokens first

Project branding should start in project CSS, not in manual edits to `fnlla-ui.css`.

```css
:root {
  --fnlla-color-primary: #0b3b35;
  --fnlla-color-text: #10211d;
  --fnlla-color-surface: #f6fbf8;
  --fnlla-font-family-base: "Manrope", sans-serif;
  --fnlla-font-family-heading: "Fraunces", serif;
}
```

Change colors, typography, spacing and radius through tokens before reaching for component-selector overrides.

### Use documented hooks and runtime re-init

Use `data-fnlla-*` hooks in implementation work and match the API page exactly.

Common examples:

- `data-fnlla-nav-toggle`
- `data-fnlla-dropdown`
- `data-fnlla-dropdown-toggle`
- `data-fnlla-tabs`
- `data-fnlla-tab`
- `data-fnlla-modal`
- `data-fnlla-modal-open`
- `data-fnlla-toast`
- `data-fnlla-offcanvas`
- `data-fnlla-popover`
- `data-fnlla-tooltip`
- `data-fnlla-scrollspy`

If the website injects HTML dynamically through AJAX, HTMX or custom JS, re-initialize the runtime on the new subtree.

```js
window.FNLLAUI.init(rootElement);
```

### Keep icons local

Do not load icons from a CDN when the framework already ships the local bundle.

Supported options:

- local SVG files from `fnlla-ui/assets/icons/*.svg`
- the local sprite from `fnlla-ui/assets/icons/sprite.svg`

Example:

```html
<span class="icon" aria-hidden="true">
  <img src="fnlla-ui/assets/icons/search.svg" alt="">
</span>
```

## Day-to-day website workflow

Working rules:

- treat the framework as a runtime dependency, not as a place for quick project hotfixes
- keep project-specific fixes in `site.css`, `site.js` and project templates
- change the framework itself only when the change makes sense for more than one project
- keep interactive work aligned with `docs/contract.html`
- check layout behavior on mobile, tablet and desktop before review

Typical frontend loop:

1. Choose the page or section to build.
2. Find the closest documented pattern.
3. Compose markup from existing framework classes.
4. Add project content and assets.
5. Add only minimal project-level overrides.
6. Check keyboard navigation, focus states and mobile layout.
7. Send the result for review.

## Decide when a change belongs in the framework

Upstream a change into the `fnlla-ui` repository when:

- the same pattern will be reused across multiple projects
- the current component has a runtime bug or accessibility bug
- tokens are not enough and a shared variant is missing
- framework documentation is out of sync with the real runtime

Keep the change local to the website project when:

- it is branding for one website
- it is a one-off landing page composition
- it only affects content, imagery or local integrations

## Maintain a downstream website

### Content or layout change

Use this path for copy edits, section-order changes and local page polish.

1. Open the relevant template or HTML file.
2. Update the content, section order or links.
3. Reuse existing layout and utility classes where possible.
4. Check mobile and desktop views.
5. Confirm focus flow, skip link behavior and CTA clarity.

### Visual polish

Use this path for small branding or spacing changes.

1. Try token overrides in `site.css` first.
2. If tokens are not enough, add local project styles.
3. Do not edit `fnlla-ui/assets/css/fnlla-ui.css` directly unless the project is intentionally forking the runtime.
4. Re-check contrast, focus states and dark-theme behavior if the project uses it.

### Interaction issue

Use this path when a component behaves incorrectly on the website.

1. Check the markup against `docs/contract.html`.
2. Confirm the `data-fnlla-*` hook is correct.
3. Confirm `aria-controls`, `aria-labelledby` and target `id` values exist.
4. Confirm the framework JS is actually loaded on the page.
5. If the markup is correct and the bug remains, raise it as a framework maintenance issue.

### Framework update inside a website project

Use this path when the downstream site upgrades its vendored FNLLA UI runtime.

1. Create an update branch.
2. Replace the project `fnlla-ui/` folder with a fresh `dist/fnlla-ui/` export from the framework repository.
3. Check `VERSION`.
4. Read `README.md` and `docs/contract.html` to confirm the current contract.
5. Search the project for legacy patterns such as `data-ui-*`, `ui-*` and outdated token overrides.
6. Re-test navigation, dropdowns, tabs, accordions, modals, forms and any local overrides.
7. Re-test on mobile, tablet and desktop.
8. Merge only after the downstream site passes its own review and QA checks.

## Maintain FNLLA UI itself

### Work in source, not runtime

For CSS, work in:

- `src/css/tokens.css`
- `src/css/base.css`
- `src/css/layout.css`
- `src/css/components/*.css`
- `src/css/sections/*.css`
- `src/css/utilities.css`
- `src/css/responsive.css`
- `src/css/a11y.css`

For JS, work in:

- `src/js/core/*.js`
- `src/js/modules/*.js`
- `src/docs/js/*.js` when the change belongs to the documentation shell rather than the public website runtime

Do not start with manual edits to:

- `assets/css/fnlla-ui.css`
- `assets/js/fnlla-ui.js`
- `docs/assets/docs.js`
- `dist/fnlla-ui/`

### Update docs when the public contract changes

If the change affects public usage, update the relevant reference surface in the same pull request.

- `README.md`
- `docs/contract.html`
- `docs/layout.html`
- `docs/components.html`
- `docs/sections.html`
- `docs/utilities.html`
- `docs/component-classification.html`
- `docs/team-usage-and-maintenance.html` and its markdown source when workflow guidance changed
- `docs/assets/docs.js` indirectly through `src/docs/js/*.js` when documentation-only browser behavior changed

Rule:

- code and docs should not drift across separate PRs when the public contract moved

### Republish, smoke-test and validate

After source changes, refresh the readable runtime and generated docs.

```bash
node .\scripts\publish-fnlla-ui.mjs
```

When behavior or packaging changed, run the browser smoke test.

```bash
node .\scripts\test-fnlla-ui-browser.mjs
```

Then confirm the repository contract.

```bash
node .\scripts\validate-fnlla-ui.mjs
```

### Review checklist before merge

Before merging a framework change, confirm all of the following:

- the change begins in `src/`, not in generated runtime files
- runtime files and generated guide pages were republished
- docs match the current behavior and naming
- keyboard, focus and responsive behavior were checked
- the packaging boundary still keeps `docs/assets/` outside the runtime contract
- downstream projects would understand the change from `README.md`, `docs/contract.html` and the relevant guide page
