# Contributing to FNLLA Web

## First, understand the repository

FNLLA Web is an MIT-licensed framework maintained by TechAyo LTD (techayo.co.uk).

This repository is public and contributions are welcome, but it remains maintainer-led. Proposed changes are reviewed against framework scope, product direction, maintenance cost, client impact, security posture and long-term coherence.

Before opening work, read:

- [`README.md`](../README.md)
- [`LICENSE.md`](../LICENSE.md)
- [`SUPPORT.md`](../SUPPORT.md)
- [`TRADEMARKS.md`](../TRADEMARKS.md)
- [`SECURITY.md`](../SECURITY.md)
- [`docs/api.html`](../docs/api.html)
- [`docs/team-usage-and-maintenance.html`](../docs/team-usage-and-maintenance.html)

## What kinds of contributions are welcome

The most useful contributions are:

- reproducible bug reports
- docs/runtime parity reports
- small documentation clarifications
- narrowly scoped fixes aligned with the existing runtime contract
- feature proposals that clearly justify shared framework value

## What usually will not be accepted

The following are commonly declined or redirected:

- one-off project customizations that belong in a downstream website
- broad redesigns without agreed scope
- changes that conflict with the documented runtime boundary
- contributions that introduce unclear ownership or third-party IP risk
- large unsolicited pull requests that were not discussed first

## Before writing code

Open an issue or proposal first when the change is non-trivial.

That is especially important for:

- new components or public helpers
- runtime contract changes
- naming changes
- behavior changes that affect docs examples
- structural tooling changes

## Security issues

If the issue may be security-sensitive, stop and follow [`SECURITY.md`](../SECURITY.md) instead of opening a public issue or PR.

## Working rules for changes

When a change is accepted for implementation:

- edit source files under `src/` and maintainer sources under `src/docs/js/` where appropriate
- do not hand-edit generated outputs as the primary source of truth
- keep docs and runtime behavior aligned in the same change
- preserve the documented runtime boundary under `assets/` and `dist/fnlla-web/`
- keep icon usage local and offline

## Maintainer workflow

Recommended local sequence:

```bash
node .\scripts\publish-fnlla-web.mjs
node .\scripts\test-fnlla-web-browser.mjs
node .\scripts\validate-fnlla-web.mjs
```

Use the browser matrix when broader local coverage is needed:

```bash
node .\scripts\test-fnlla-web-browser-matrix.mjs
```

## Pull request expectations

A good pull request should:

- explain what changed and why it belongs in FNLLA Web
- describe runtime, docs and dist impact
- mention validation performed
- call out any release-surface implications

PRs may be closed without merge if they are out of scope, carry ownership risk, duplicate downstream-only needs or conflict with the framework direction.

## Licensing and rights

By submitting a contribution, you represent that:

- you have the right to submit the material
- the material does not knowingly violate another party's IP or confidentiality rights
- the contribution may be reviewed, modified, rejected or incorporated by TechAyo LTD under the repository's MIT licensing model

Submitting a contribution does not transfer ownership of FNLLA Web branding or change the repository license.

## Support and contact

For general repository help, usage routing and business-boundary questions, use the guidance in [`SUPPORT.md`](../SUPPORT.md).
