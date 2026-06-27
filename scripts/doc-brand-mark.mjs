/*
  Shared inline FNLLA UI brand mark used inside docs headers.
  The mark exposes CSS hooks so docs can publish distinct light and dark variants
  while keeping one shared header template.
*/

export function renderDocBrandMark() {
  return `<svg class="doc-brand-mark" viewBox="0 0 560 520" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect class="doc-brand-mark-tile" x="143" y="75" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="239" y="75" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="335" y="75" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="143" y="171" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="239" y="171" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="143" y="267" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-tile" x="143" y="363" width="82" height="82" rx="12"/>
  <rect class="doc-brand-mark-badge" x="239" y="361" width="150" height="86" rx="18"/>
  <text class="doc-brand-mark-label" x="314" y="406" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="800">UI</text>
</svg>`;
}
