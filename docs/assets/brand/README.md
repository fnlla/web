# FNLLA UI brand assets

This directory stores the committed FNLLA UI logo source and the generated preview images used for repository presentation.

Included files:

- `fnlla-ui.svg`: official logo source provided for FNLLA UI
- `fnlla-ui-social-preview.html`: HTML composition used to render the social preview image
- `fnlla-ui-social-preview.png`: GitHub-ready wide social preview export
- `fnlla-ui-avatar-preview.html`: HTML composition used to render the square avatar image
- `fnlla-ui-avatar.png`: GitHub-ready square avatar export

Regenerate the PNG exports after updating the logo source or preview layouts:

```bash
node .\scripts\render-brand-previews.mjs
```
