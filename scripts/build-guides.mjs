/*
  Build browser-facing HTML guide pages from maintainers' markdown sources.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - transform guide markdown into docs-shell HTML pages
  - generate stable heading IDs and a sidebar table of contents
  - keep guide publication aligned with VERSION and the manifest
*/

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";
import {
  compareNormalizedContent,
  escapeHtml,
  getRepoRoot,
  isDirectExecution,
  normalizeLf,
  pathExists,
  readText,
  slugify,
  writeText
} from "./tooling-support.mjs";

function formatInline(markdown) {
  return escapeHtml(markdown).replace(/`([^`]+)`/g, "<code>$1</code>");
}

/* Split markdown into simple text and fenced-code blocks without a build tool. */
function splitMarkdownIntoBlocks(markdown) {
  const lines = normalizeLf(markdown).split("\n");
  const blocks = [];
  let current = [];
  let inCodeFence = false;
  let codeFenceLanguage = "";

  const pushCurrent = () => {
    if (!current.length) {
      return;
    }

    blocks.push({ type: inCodeFence ? "code" : "text", language: codeFenceLanguage, lines: current.slice() });
    current = [];
  };

  lines.forEach((line) => {
    const fenceMatch = line.match(/^```([a-z0-9_-]+)?\s*$/i);

    if (fenceMatch) {
      if (inCodeFence) {
        pushCurrent();
        inCodeFence = false;
        codeFenceLanguage = "";
      } else {
        pushCurrent();
        inCodeFence = true;
        codeFenceLanguage = (fenceMatch[1] || "").toLowerCase();
      }
      return;
    }

    if (inCodeFence) {
      current.push(line);
      return;
    }

    if (!line.trim()) {
      pushCurrent();
      return;
    }

    current.push(line);
  });

  pushCurrent();
  return blocks;
}

/* Render flat or nested markdown lists into simple HTML list markup. */
function renderListBlock(lines) {
  let html = "";
  const stack = [];

  const closeCurrentItem = () => {
    const currentList = stack[stack.length - 1];
    if (currentList?.liOpen) {
      html += "</li>";
      currentList.liOpen = false;
    }
  };

  const closeCurrentList = () => {
    const currentList = stack[stack.length - 1];
    if (!currentList) {
      return;
    }

    closeCurrentItem();
    html += `</${currentList.type}>`;
    stack.pop();
  };

  lines.forEach((line) => {
    const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);

    if (!match) {
      const continuation = line.trim();
      if (continuation && stack.length) {
        html += `<br>${formatInline(continuation)}`;
      }
      return;
    }

    const indent = match[1].replace(/\t/g, "  ").length;
    const type = /^\d+\.$/.test(match[2]) ? "ol" : "ul";
    const content = match[3].trim();

    while (stack.length && indent < stack[stack.length - 1].indent) {
      closeCurrentList();
    }

    if (!stack.length || indent > stack[stack.length - 1].indent) {
      html += `<${type}>`;
      stack.push({ indent, type, liOpen: false });
    } else if (type !== stack[stack.length - 1].type) {
      closeCurrentList();
      html += `<${type}>`;
      stack.push({ indent, type, liOpen: false });
    } else {
      closeCurrentItem();
    }

    html += `<li>${formatInline(content)}`;
    stack[stack.length - 1].liOpen = true;
  });

  while (stack.length) {
    closeCurrentList();
  }

  return html;
}

function isListBlock(lines) {
  return lines.every((line) => /^(\s*)([-*]|\d+\.)\s+/.test(line) || /^\s+\S/.test(line));
}

/* Convert parsed markdown blocks into guide prose HTML and TOC metadata. */
function renderBlocks(blocks) {
  const rendered = [];
  const usedIds = new Set();
  const toc = [];
  let documentTitle = "";

  blocks.forEach((block, index) => {
    if (block.type === "code") {
      const codeClass = block.language ? ` class="language-${escapeHtml(block.language)}"` : "";
      rendered.push(`<pre><code${codeClass}>${escapeHtml(block.lines.join("\n"))}</code></pre>`);
      return;
    }

    const firstLine = block.lines[0];
    const headingMatch = firstLine.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const baseId = slugify(text);
      let headingId = baseId;
      let duplicateIndex = 2;

      while (usedIds.has(headingId)) {
        headingId = `${baseId}-${duplicateIndex}`;
        duplicateIndex += 1;
      }

      usedIds.add(headingId);

      if (!documentTitle && level === 1 && index === 0) {
        documentTitle = text;
        return;
      }

      if (level >= 2 && level <= 3) {
        toc.push({ level, text, id: headingId });
      }

      rendered.push(`<h${level} id="${headingId}">${formatInline(text)}</h${level}>`);
      return;
    }

    if (isListBlock(block.lines)) {
      rendered.push(renderListBlock(block.lines));
      return;
    }

    rendered.push(`<p>${formatInline(block.lines.map((line) => line.trim()).join(" "))}</p>`);
  });

  return {
    contentHtml: rendered.join("\n\n"),
    documentTitle,
    toc
  };
}

/* Recreate the shared top-level docs navigation for generated guide pages. */
function renderRootDocsNavigation(rootPages, options = {}) {
  const currentLabel = options.currentLabel || "";
  const hrefPrefix = options.hrefPrefix || "./";

  const linksMarkup = rootPages.map((page) => {
    const current = page.label === currentLabel;
    const buttonClass = current ? "btn btn-outline btn-sm" : "btn btn-ghost btn-sm";
    const currentAttribute = current ? ' aria-current="page"' : "";
    const normalizedHref = page.href.replace(/^\.\//, "");
    return `      <a class="${buttonClass}" href="${hrefPrefix}${normalizedHref}"${currentAttribute}>${page.label}</a>`;
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

/* Build a stable relative href between one generated docs page and another. */
function getRelativeDocHref(fromOutput, targetPath) {
  const fromDir = path.posix.dirname(fromOutput.replace(/\\/g, "/"));
  const target = targetPath.replace(/\\/g, "/");
  const relativePath = path.posix.relative(fromDir, target) || path.posix.basename(target);
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

/* Wrap rendered guide prose in the shared docs shell and guide sidebar. */
function renderGuidePage({ page, version, contentHtml, documentTitle, toc, rootPages, guidePages }) {
  const runtimeCssHref = getRelativeDocHref(page.output, "assets/css/fnlla-ui.css");
  const docsCssHref = getRelativeDocHref(page.output, "docs/assets/docs.css");
  const docsJsHref = getRelativeDocHref(page.output, "docs/assets/docs.js");
  const runtimeJsHref = getRelativeDocHref(page.output, "assets/js/fnlla-ui.js");
  const brandMarkHref = getRelativeDocHref(page.output, "docs/assets/brand/fnlla-ui.svg");
  const rootNavPrefix = getRelativeDocHref(page.output, "docs/index.html").replace(/index\.html$/, "");
  const bodyClassAttribute = page.bodyClass ? ` class="${escapeHtml(page.bodyClass)}"` : "";
  const guideNavigation = guidePages.map((entry) => {
    const href = getRelativeDocHref(page.output, entry.output);
    const current = entry.output === page.output;
    const buttonClass = current ? "btn btn-outline btn-sm" : "btn btn-ghost btn-sm";
    const currentAttribute = current ? ' aria-current="page"' : "";
    return `            <a class="${buttonClass}" href="${href}"${currentAttribute}>${entry.navLabel}</a>`;
  }).join("\n");

  const tocMarkup = toc.length
    ? `<div class="card doc-guide-card">
            <p class="doc-panel-label">On this page</p>
            <div class="doc-guide-toc doc-guide-toc-numbered">
${toc.map((item) => `              <a class="doc-guide-toc-link doc-guide-toc-level-${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`).join("\n")}
            </div>
          </div>`
    : "";

  return `<!DOCTYPE html>
<!-- FNLLA UI documentation page. Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1A4137">
  <title>${escapeHtml(page.title)}</title>
  <link rel="icon" href="${escapeHtml(brandMarkHref)}" type="image/svg+xml">
  <link rel="stylesheet" href="${escapeHtml(runtimeCssHref)}">
  <link rel="stylesheet" href="${escapeHtml(docsCssHref)}">
</head>
<body${bodyClassAttribute} data-fnlla-theme="default">
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <main class="doc-wrapper" id="main-content">
    <header class="doc-header" aria-label="FNLLA UI documentation shell">
      <div class="doc-header-bar">
        <span class="doc-kicker">Guide library</span>
        <span class="doc-status">Stable ${escapeHtml(version)}</span>
      </div>
      <div class="doc-header-grid">
        <div class="doc-brand">
          <img class="doc-brand-mark" src="${escapeHtml(brandMarkHref)}" alt="" width="108" height="100" decoding="async">
          <div class="doc-brand-copy">
            <p class="doc-overline">${escapeHtml(page.heroLabel)}</p>
            <p class="doc-display">FNLLA UI - Guides</p>
            <p class="doc-lead">${escapeHtml(page.description)}</p>
          </div>
        </div>
      </div>
    </header>

    <nav class="doc-nav" aria-label="FNLLA UI documentation">
${renderRootDocsNavigation(rootPages, { currentLabel: "Guides", hrefPrefix: rootNavPrefix || "./" })}
    </nav>

    <section class="section pt-1">
      <div class="doc-guide-layout">
        <article class="card doc-guide-prose doc-guide-prose-numbered">
${contentHtml}
        </article>
        <aside class="doc-guide-sidebar scrollbar scrollbar-thin">
          <div class="card doc-guide-card">
            <p class="doc-panel-label">Guide pages</p>
            <div class="doc-guide-nav" aria-label="Guide pages">
${guideNavigation}
            </div>
          </div>
${tocMarkup}
        </aside>
      </div>
    </section>

    <footer class="doc-footer" aria-label="FNLLA UI ownership notice">
      <p class="content-text">FNLLA UI &copy; 2026 TechAyo LTD (<a href="https://techayo.co.uk">techayo.co.uk</a>). All rights reserved.</p>
    </footer>
  </main>
  <script src="${escapeHtml(runtimeJsHref)}"></script>
  <script src="${escapeHtml(docsJsHref)}"></script>
</body>
</html>`;
}

/* Build or verify every guide page declared in the FNLLA UI manifest. */
export function buildGuidePages(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const check = options.check === true;
  const manifest = getFnllaUiManifest();
  const version = readText(path.join(repoRoot, "VERSION")).split(/\r?\n/, 1)[0].trim();
  const updates = [];

  manifest.docs.guidePages.forEach((page) => {
    const sourcePath = path.join(repoRoot, page.source);
    const outputPath = path.join(repoRoot, page.output);

    if (!pathExists(sourcePath)) {
      throw new Error(`Missing guide source: ${sourcePath}`);
    }

    const markdown = readText(sourcePath);
    const rendered = renderBlocks(splitMarkdownIntoBlocks(markdown));
    const html = renderGuidePage({
      page,
      version,
      contentHtml: rendered.contentHtml,
      documentTitle: rendered.documentTitle,
      toc: rendered.toc,
      rootPages: manifest.docs.rootPages,
      guidePages: manifest.docs.guidePages
    });

    if (check) {
      if (!pathExists(outputPath) || !compareNormalizedContent(readText(outputPath), html)) {
        updates.push(page.output);
      }
      return;
    }

    writeText(outputPath, html);
    updates.push(page.output);
  });

  if (check && updates.length) {
    const error = new Error(`Guide HTML is out of sync: ${updates.join(", ")}`);
    error.code = "GUIDE_OUT_OF_SYNC";
    throw error;
  }

  return updates;
}

function runCli() {
  const repoRoot = getRepoRoot(import.meta.url);
  const check = process.argv.includes("--check");
  const updated = buildGuidePages({ repoRoot, check });

  if (check) {
    console.log(`FNLLA UI guide HTML is in sync across ${getFnllaUiManifest().docs.guidePages.length} page(s).`);
    return;
  }

  console.log(`Built FNLLA UI guide HTML pages: ${updated.join(", ")}`);
}

if (isDirectExecution(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}
