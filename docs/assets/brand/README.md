# FNLLA UI brand assets

This directory stores the committed FNLLA UI logo source and the generated preview images used for repository presentation.

Included files:

- `fnlla-ui.svg`: official logo source provided for FNLLA UI
- `fnlla-ui-dark.svg`: dark-mode logo variant for dark surfaces and repository assets
- `fnlla-github.svg`: simplified organization-avatar mark without the `UI` badge
- `fnlla-github-preview.html`: HTML composition used to render the GitHub organization avatar
- `fnlla-github.png`: GitHub-ready organization avatar export

Regenerate the PNG exports after updating the logo source or preview layouts:

```bash
node .\scripts\render-brand-previews.mjs
```
