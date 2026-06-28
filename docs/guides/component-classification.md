# Component Classification

This guide belongs to `FNLLA Web`. It is maintained by `TechAyo LTD (techayo.co.uk)` from `Finella Gardens in Dundee, UK`.

## Use this guide when

Use this document for repeatable template assembly, component reviews, documentation work and design-system decisions.

Reach for it when you need to answer:

- what a component is
- which category it belongs to
- whether it is structural, presentational or interactive
- what its best-fit usage is
- when it should not be selected

## Classification model

Each component family is described through the same lenses.

- `Role`: structural, presentational or interactive
- `Category`: layout, action, content, operational content, visual support, navigation, form, feedback, data display, process and status, disclosure, overlay, section or utility
- `Interaction level`: static, selectable, input, expandable, dismissible, modal or location-aware
- `Data density`: low, medium or high
- `Dependency level`: CSS only or CSS plus JavaScript hooks
- `Best fit`: the primary intended usage
- `Avoid when`: the most common misuse pattern

## Layout surfaces

### Containers and grids

- Classes: `container`, `container-sm`, `container-lg`, `section`, `section-alt`, `section-surface`, `section-primary-soft`, `grid`, `grid-2`, `grid-3`, `grid-4`, `gap-sm`, `gap-md`, `gap-lg`
- Role: structural
- Category: layout
- Interaction level: static
- Data density: low to high
- Dependency level: CSS only
- Best fit: page shells, section bands, content width control and repeated column layouts
- Avoid when: a one-off custom layout is being built with no intention to keep a shared structural pattern

## Action and content surfaces

### Buttons

- Classes: `btn`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-ghost`, `btn-xs`, `btn-sm`, `btn-lg`, `btn-xl`, `btn-block`, `btn-group`, `btn-toolbar`, `close-btn`
- Role: interactive
- Category: action
- Interaction level: selectable
- Data density: low
- Dependency level: CSS only
- Best fit: primary actions, secondary actions and compact workflow triggers
- Avoid when: a plain text link is enough and a control surface would overstate importance

### Panels, messages and menus

- Classes: `panel*`, `message*`, `menu*`, `chip*`
- Role: presentational
- Category: operational content
- Interaction level: static or selectable
- Data density: medium
- Dependency level: CSS only
- Best fit: workspace shells, contextual explanation, subsection navigation and compact status metadata
- Avoid when: a simpler alert, plain list or lightweight card would communicate the same thing with less structure

### Avatars and media objects

- Classes: `avatar*`, `media*`
- Role: presentational
- Category: content
- Interaction level: static
- Data density: low to medium
- Dependency level: CSS only
- Best fit: comments, staff rows, activity streams, support records and ownership metadata
- Avoid when: the content does not benefit from identity or source context

### Icons

- Classes and assets: `icon`, `icon-sm`, `icon-lg`, local files from `assets/icons/*.svg` and `assets/icons/sprite.svg`
- Role: presentational
- Category: visual support
- Interaction level: static
- Data density: low
- Dependency level: CSS only plus local vendored assets
- Best fit: action affordances, navigation hints, status reinforcement and compact visual anchors next to visible labels
- Avoid when: an icon would replace necessary text or depend on an external CDN instead of the local FNLLA Icons bundle

### Search shell

- Classes: `search-shell`, `search-input-wrap`, `search-results`, `search-result*`, `icon`
- Role: interactive
- Category: operational content
- Interaction level: input
- Data density: medium
- Dependency level: CSS only
- Best fit: internal search, documentation lookup, compact navigation launchers and discovery surfaces with result metadata
- Avoid when: a plain input is enough and there are no grouped results or supporting result rows

### Cards

- Classes: `card`, `feature-card`, `service-card`, `testimonial-card`, `cta-card`
- Role: presentational
- Category: content
- Interaction level: static
- Data density: low to medium
- Dependency level: CSS only
- Best fit: grouped information blocks, repeated summaries, service listings and featured content
- Avoid when: the content is a dense dataset that would be clearer as a list group or table

### List groups

- Classes: `list-group`, `list-group-item`, `list-group-item-action`, `list-group-item-title`, `list-group-item-text`, `list-group-item-meta`, `list-group-nav`, `list-group-link`
- Role: presentational
- Category: content
- Interaction level: static or selectable
- Data density: medium
- Dependency level: CSS only
- Best fit: grouped records, inbox-like lists, workspace pickers and status rows
- Avoid when: each row needs a rich independent layout and should really be a full card or a table

### Tables

- Classes: `table-responsive`, `table`, `table-striped`, `table-hover`, `table-compact`, `table-sticky`, `table-borderless`, `table-align-middle`, `table-row-title`, `table-row-meta`, `table-status*`
- Role: presentational
- Category: data display
- Interaction level: static
- Data density: high
- Dependency level: CSS only
- Best fit: comparisons, audits, operational summaries and structured records with real column meaning
- Avoid when: the content is narrative or card-like rather than tabular

### Alerts, empty states and loading

- Classes: `alert*`, `empty-state*`, `progress*`, `spinner*`, `loading-*`, `skeleton*`
- Role: presentational
- Category: feedback
- Interaction level: static
- Data density: low
- Dependency level: CSS only
- Best fit: visible system status, zero-state messaging, loading states and measurable completion
- Avoid when: the user needs a larger structured workflow rather than a short status surface

## Navigation and discovery

### Navbar

- Classes: `navbar`, `navbar-brand`, `navbar-menu`, `navbar-panel`, `navbar-actions`, `navbar-toggle`
- Role: interactive
- Category: navigation
- Interaction level: expandable on smaller screens
- Data density: low to medium
- Dependency level: CSS plus JavaScript hooks for mobile collapse
- Best fit: primary site navigation with a consistent action area
- Avoid when: a local subsection menu is needed rather than top-level navigation

### Dropdown

- Hooks and classes: `data-fnlla-dropdown`, `data-fnlla-dropdown-toggle`, `.dropdown-menu`, `.dropdown-item`
- Role: interactive
- Category: navigation
- Interaction level: expandable and dismissible
- Data density: low to medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: compact action menus, secondary navigation and grouped next-step choices
- Avoid when: all options are equally important and should remain visible all the time

### Tabs

- Hooks and classes: `data-fnlla-tabs`, `data-fnlla-tab-list`, `data-fnlla-tab`, `.tab-panel`
- Role: interactive
- Category: navigation
- Interaction level: selectable
- Data density: medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: switching between related panels without leaving the page
- Avoid when: each panel contains long content that should simply stack vertically

### Scrollspy

- Hooks and classes: `data-fnlla-scrollspy`, `data-fnlla-scrollspy-nav`, `.scrollspy-link`, `.scrollspy-section`
- Role: interactive
- Category: navigation
- Interaction level: location-aware
- Data density: medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: long-form references, guides, policy pages and other pages that need a live in-page index
- Avoid when: the page is too short to justify active section tracking

### Breadcrumb and pagination

- Classes: `breadcrumb*`, `pagination*`
- Role: interactive
- Category: navigation
- Interaction level: selectable
- Data density: low
- Dependency level: CSS only
- Best fit: hierarchy wayfinding and paged result sets
- Avoid when: there is no real hierarchy or there are too few results to paginate

## Forms and submission

### Forms and field controls

- Classes: `form`, `form-group`, `form-row`, `form-actions`, `fieldset`, `fieldset-legend`, `label`, `input`, `textarea`, `select`, `checkbox`, `radio`, `switch*`, `range-*`, `file-*`, `help-text`, `error-text`, `success-text`, `contact-form`, `contact-field-*`, `lead-capture-*`, `form-layout-card`
- Role: interactive
- Category: form
- Interaction level: input
- Data density: low to high
- Dependency level: CSS only
- Best fit: data capture, contact flows, qualification forms and operational inputs
- Avoid when: the page is purely display-oriented and no input is expected

### Input groups

- Classes: `input-group`, `input-group-text`, `input-group-field`, `input-group-action`
- Role: interactive
- Category: form
- Interaction level: input
- Data density: low
- Dependency level: CSS only
- Best fit: fields with fixed prefixes, suffixes or attached submit actions
- Avoid when: the attached prefix or button is not semantically tied to the field

### Form messages

- Classes: `form-message`, `form-message-success`, `form-message-error`
- Role: presentational
- Category: feedback
- Interaction level: static
- Data density: low
- Dependency level: CSS only
- Best fit: submit summaries and next-step explanations close to the relevant form
- Avoid when: the message should auto-disappear without interrupting the current flow

## Process and time

### Timelines and steps

- Classes: `timeline*`, `steps`, `step*`
- Role: presentational
- Category: process and status
- Interaction level: static
- Data density: medium
- Dependency level: CSS only
- Best fit: delivery stages, onboarding progress, audit history and forward progress indicators
- Avoid when: the information has no temporal or sequential meaning

## Disclosure and overlays

### Accordion

- Hooks and classes: `data-fnlla-accordion`, `data-fnlla-accordion-button`, `.accordion-panel`
- Role: interactive
- Category: disclosure
- Interaction level: expandable
- Data density: medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: FAQs, grouped guidance and stacked detail blocks
- Avoid when: the user should compare all content blocks side by side at once

### Modal

- Hooks and classes: `data-fnlla-modal`, `data-fnlla-modal-open`, `data-fnlla-modal-close`
- Role: interactive
- Category: overlay
- Interaction level: modal
- Data density: low to medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: confirmations, short forms, critical branching points and focused review tasks
- Avoid when: the interaction is non-critical and can live inline without interrupting context

### Toast

- Hooks and classes: `data-fnlla-toast`, `data-fnlla-toast-open`, `data-fnlla-toast-close`
- Role: interactive
- Category: feedback
- Interaction level: dismissible
- Data density: low
- Dependency level: CSS plus JavaScript hooks
- Best fit: short-lived confirmation, informational nudges and non-blocking status changes
- Avoid when: the message is critical, blocking or requires guaranteed acknowledgement

### Offcanvas

- Hooks and classes: `data-fnlla-offcanvas`, `data-fnlla-offcanvas-open`, `data-fnlla-offcanvas-close`, `.offcanvas-panel`
- Role: interactive
- Category: overlay
- Interaction level: modal
- Data density: low to medium
- Dependency level: CSS plus JavaScript hooks
- Best fit: filters, inspectors, side workspaces and secondary flows that should stay near the current page context
- Avoid when: the user must stop and make a critical blocking decision that is better served by a modal

### Popover and tooltip

- Hooks and classes: `data-fnlla-popover`, `data-fnlla-popover-toggle`, `data-fnlla-popover-close`, `.popover-panel`, `data-fnlla-tooltip`
- Role: interactive
- Category: overlay
- Interaction level: dismissible or informative
- Data density: low
- Dependency level: CSS plus JavaScript hooks
- Best fit: compact helper content, short clarification and contextual next-step hints
- Avoid when: the content is long, essential or complex enough to require a larger always-visible surface

## Section library

### Hero and section wrappers

- Classes: `hero*`, `hero-copy`, `hero-panel-intro`, `hero-visual*`, `hero-art-*`, `hero-background*`, `hero-inline-*`, `feature-section*`, `service-section*`, `faq-section`, `contact-section`, `stats-section`, `process-section`, `pricing-section`, `pricing-card-head`, `testimonial-section`, `cta-section`, `cta-copy`, `cta-inline-notes`, `cta-proof-grid`, `cta-support`, `footer-top`, `footer-lead`, `footer-pillars`, `footer-pillar`, `footer-body`, `footer-status`, `footer-contact`, `footer-meta-copy`, `footer-legal`
- Role: structural and presentational
- Category: section
- Interaction level: usually static with optional embedded actions
- Data density: low to medium
- Dependency level: mostly CSS only
- Best fit: landing pages, service overviews, process explanation, pricing and trust-building content
- Avoid when: a highly custom one-off composition would be simpler than forcing content into a reusable section shell

## Utilities

### Utility classes

- Classes: spacing, gap, text alignment, weight, display, flex, radius, surface emphasis, width, sticky, scrollbar and accessibility helpers
- Role: structural and presentational
- Category: utility
- Interaction level: static
- Data density: not applicable
- Dependency level: CSS only
- Best fit: small local adjustments that support an existing component or section
- Avoid when: utilities start replacing the base component pattern and create inconsistent markup

## Quick selection rules

- Use `card` when content is grouped but not data-dense.
- Use `list-group` when many rows belong to one shared surface.
- Use `table` when column relationships and headers matter.
- Use `panel` when a workspace needs a structured header, body and footer.
- Use `message` when copy is richer than an alert but still belongs inline.
- Use local FNLLA Icons when a compact visual cue helps scanning, but keep visible text for meaning.
- Use `progress`, `spinner` and `skeleton` only for visible loading or completion states.
- Use `timeline` for past progression and `steps` for current or upcoming staged flows.
- Use `alert` when the message should remain visible in context.
- Use `Toast` when the message should be brief and non-blocking.
- Use `Offcanvas` when the user needs a temporary side workspace without leaving page context.
- Use `Modal` when the user must focus on one task before returning.
- Use `Popover` when helper content is richer than a tooltip but still smaller than a dialog.
- Use `Scrollspy` when a long page needs a live in-page index.

## Maintenance note

When a new component family is added to `FNLLA Web`, extend this file immediately so selection logic, documentation language and validation expectations do not drift apart.
