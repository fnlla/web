/*
  ============================================================================
  Documentation-only behavior for the FNLLA UI docs experience.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Responsibilities:
  - highlight inline and block code without an external syntax library
  - smooth-scroll guide table-of-contents links
  - power the local FNLLA Icons catalogue search, staged rendering, categories and copy actions
  ============================================================================
*/

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docsThemeStorageKey = "fnlla-ui-docs-theme";
  var docsThemeColors = {
    default: "#1A4137",
    dark: "#0B1220"
  };
