/*
  Synchronize the shared shell for top-level FNLLA Web docs pages.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Purpose:
  - rebuild shared docs chrome from manifest metadata
  - keep VERSION, navigation and shell branding aligned across top-level docs pages
*/

import path from "node:path";
import { renderDocBrandBadge, renderDocBrandMark } from "./doc-brand-mark.mjs";
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";
import {
  compareNormalizedContent,
  escapeHtml,
  getRepoRoot,
  isDirectExecution,
  pathExists,
  readText,
  writeText
} from "./tooling-support.mjs";

function renderRootDocsNavigation(rootPages, currentLabel) {
  const linksMarkup = rootPages.map((page) => {
    const current = page.label === currentLabel;
    const buttonClass = current ? "btn btn-outline btn-sm" : "btn btn-ghost btn-sm";
    const currentAttribute = current ? ' aria-current="page"' : "";
    return `      <a class="${buttonClass}" href="${page.href}"${currentAttribute}>${page.label}</a>`;
  }).join("\n");

  return `      <div class="doc-nav-top">
        <p class="doc-nav-label">Docs Navigation</p>
        <button class="btn btn-ghost btn-sm doc-nav-toggle" type="button" data-doc-nav-toggle aria-expanded="false" aria-controls="doc-nav-panel">
          Browse Docs
        </button>
      </div>
      <div class="doc-nav-panel" id="doc-nav-panel" data-doc-nav-panel>
${linksMarkup}
        <div class="doc-nav-controls">
          <label class="switch doc-theme-toggle">
            <input class="switch-input" id="doc-theme-toggle" data-doc-theme-toggle type="checkbox" aria-label="Enable dark mode for the docs">
            <span class="switch-slider" aria-hidden="true"></span>
            <span class="switch-label">Dark mode</span>
          </label>
        </div>
      </div>`;
}

/* Extract page-specific body content while preserving the shared shell boundary. */
function extractRootDocContent(content, relativePath) {
  const match = content.match(/<nav class="doc-nav" aria-label="FNLLA Web documentation">[\s\S]*?<\/nav>\s*([\s\S]*?)\s*<footer class="doc-footer" aria-label="FNLLA Web ownership notice">/i);

  if (!match) {
    throw new Error(`${relativePath}: could not extract the body content between the docs navigation and footer`);
  }

  return match[1]
    .replace(/(?:\s*<!-- Ownership footer required on every docs page\. -->\s*)+$/i, "")
    .trim();
}

/* Inject runtime, docs and page-specific support scripts in one stable order. */
function renderRootDocScripts(page) {
  const scriptPaths = ["../assets/js/fnlla-ui.js"]
    .concat(Array.isArray(page.extraScripts) ? page.extraScripts : [])
    .concat("./assets/docs.js");

  return scriptPaths.map((scriptPath) => `  <script src="${escapeHtml(scriptPath)}"></script>`).join("\n");
}

/* Rebuild one top-level docs page from shared shell metadata and local content. */
function renderRootDocPage({ page, version, shell, rootPages, contentHtml }) {
  const overline = page.overline || shell.overline;
  const displayTitle = page.displayTitle || shell.displayTitle;
  const lead = page.lead || shell.lead;
  const kicker = page.kicker || shell.kicker;
  const brandMarkHref = "./assets/brand/fnlla-ui.svg";

  return `<!DOCTYPE html>
<!-- FNLLA Web documentation page. Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License. -->
<html lang="en">
<head>
  <!-- =========================================================================
       DOCUMENT HEAD
       ========================================================================= -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="${escapeHtml(shell.themeColor)}">
  <title>${escapeHtml(page.title)}</title>
  <link rel="icon" href="${escapeHtml(brandMarkHref)}" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/css/fnlla-ui.css">
  <link rel="stylesheet" href="./assets/docs.css">
</head>
<body data-fnlla-theme="default">
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <!-- =========================================================================
       DOCUMENT SHELL
       ========================================================================= -->
  <main class="doc-wrapper" id="main-content">
    <header class="doc-header" aria-label="FNLLA Web documentation shell">
      <div class="doc-header-bar">
        <span class="doc-kicker">${escapeHtml(kicker)}</span>
        <span class="doc-status">Stable ${escapeHtml(version)}</span>
      </div>
      <div class="doc-header-grid">
        <p class="doc-overline">${escapeHtml(overline)}</p>
        <div class="doc-brand">
          ${renderDocBrandMark()}
          ${renderDocBrandBadge()}
          <span class="doc-brand-separator" aria-hidden="true">-</span>
          <p class="doc-display">${escapeHtml(displayTitle)}</p>
        </div>
        <p class="doc-lead">${escapeHtml(lead)}</p>
      </div>
    </header>

    <!-- Primary docs navigation shared across the reference set. -->
    <nav class="doc-nav" aria-label="FNLLA Web documentation">
${renderRootDocsNavigation(rootPages, page.label)}
    </nav>

    ${contentHtml}
    <!-- Ownership footer required on every docs page. -->
    <footer class="doc-footer" aria-label="FNLLA Web ownership notice">
      <p class="content-text">FNLLA Web &copy; 2026 TechAyo LTD (<a href="https://techayo.co.uk">techayo.co.uk</a>). Released under the MIT License.</p>
    </footer>
  </main>
  <!-- Shared runtime for interactive demos used inside the docs. -->
${renderRootDocScripts(page)}
</body>
</html>`;
}

/* Update or verify every manifest-declared top-level docs page. */
export function syncDocShells(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const check = options.check === true;
  const manifest = options.manifest || getFnllaUiManifest();
  const version = readText(path.join(repoRoot, "VERSION")).split(/\r?\n/, 1)[0].trim();
  const updates = [];

  manifest.docs.rootPages.forEach((page) => {
    const relativePath = path.posix.join("docs", page.href.replace(/^\.\//, ""));
    const fullPath = path.join(repoRoot, relativePath);

    if (!pathExists(fullPath)) {
      throw new Error(`${relativePath}: missing file`);
    }

    const currentContent = readText(fullPath);
    const bodyContent = extractRootDocContent(currentContent, relativePath);
    const expectedContent = renderRootDocPage({
      page,
      version,
      shell: manifest.docs.rootShell,
      rootPages: manifest.docs.rootPages,
      contentHtml: bodyContent
    });

    if (check) {
      if (!compareNormalizedContent(currentContent, expectedContent)) {
        throw new Error(`${relativePath}: docs shell is out of sync with scripts/sync-doc-shells.mjs`);
      }
      return;
    }

    if (!compareNormalizedContent(currentContent, expectedContent)) {
      writeText(fullPath, expectedContent);
      updates.push(relativePath);
    }
  });

  return updates;
}

function runCli() {
  const updates = syncDocShells();

  if (updates.length) {
    updates.forEach((relativePath) => {
      console.log(`Synchronized docs shell: ${relativePath}`);
    });
    return;
  }

  console.log("Top-level FNLLA Web docs shells are already in sync.");
}

if (isDirectExecution(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}
