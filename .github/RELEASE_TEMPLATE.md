# FNLLA Web Release Notes Template

Use plain ASCII in GitHub release notes so file paths and bullets stay stable across shells, terminals and browsers.

Template:

```md
FNLLA Web <version> is the current stable release of the maintained FNLLA Web framework.

Highlights
- Stable runtime contract: assets/css/fnlla-ui.css, assets/js/fnlla-ui.js and assets/icons/
- Updated docs coverage across overview, distribution, layout, components, sections, forms, utilities, icons, API and guides
- Runtime and docs examples aligned with the shipped CSS and JS contract
- Runtime-only handoff prepared under dist/fnlla-ui/

Operational notes
- README.md, MANIFEST.json, VERSION and LICENSE.md are aligned for the release line
- Follow-up cleanup and hardening work is tracked in GitHub after publication when needed
```

Before publishing:

- replace `<version>` with the actual version tag
- keep runtime paths exactly as shown above
- avoid smart quotes, special bullets and non-ASCII separators
