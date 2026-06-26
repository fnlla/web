# FNLLA UI brand assets

This directory holds the repository identity assets used by the FNLLA UI docs shell and GitHub presentation surfaces.

## Primary mark

- `fnlla-ui-mark.svg`: preferred production mark for docs, favicon usage, avatar export and GitHub-facing preview imagery

## Alternate proposals

- `fnlla-ui-mark-grid.svg`: modular square-grid concept that leans more toward component-library language
- `fnlla-ui-mark-shield.svg`: more protective, governance-heavy concept for stricter enterprise positioning

## GitHub-ready preview exports

- `fnlla-ui-social-preview.html`: HTML composition used to render the social preview bitmap
- `fnlla-ui-social-preview.png`: committed GitHub-ready social preview image export
- `fnlla-ui-avatar-preview.html`: HTML composition used to render the avatar bitmap
- `fnlla-ui-avatar.png`: committed square avatar export

## Maintainer note

Regenerate the PNG exports after updating the mark or preview layouts:

```bash
node .\scripts\render-brand-previews.mjs
```
