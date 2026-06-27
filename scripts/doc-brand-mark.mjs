/*
  Shared inline FNLLA UI brand primitives used inside docs headers.
  The logo stays clean while the small UI badge is generated as a separate element.
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
</svg>`;
}

export function renderDocBrandBadge() {
  return `<span class="doc-brand-badge" aria-hidden="true">UI</span>`;
}
