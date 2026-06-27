/*
  FNLLA UI structural validator.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - verify repository structure, release metadata and docs sync
  - confirm generated guide pages and runtime export match source state
  - enforce the documented runtime and packaging contract before release
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildGuidePages } from "./build-guides.mjs";
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";
import { writeRuntimeExport } from "./publish-fnlla-ui.mjs";
import { syncDocShells } from "./sync-doc-shells.mjs";
import {
  compareNormalizedContent,
  detectChromiumBrowsers,
  getRepoRoot,
  isDirectExecution,
  normalizeLf,
  pathExists,
  readText
} from "./tooling-support.mjs";

function getSanitizedHtmlContent(targetPath) {
  return readText(targetPath)
    .replace(/<pre\b[^>]*>.*?<\/pre>/gis, "")
    .replace(/<!--.*?-->/gs, "");
}

/* Collect attribute values from HTML strings without a full parser dependency. */
function getAttributeValues(content, pattern) {
  return Array.from(content.matchAll(pattern), (match) => match[1]);
}

/* Read the README folder tree and extract listed guide markdown sources. */
function getReadmeFolderTreeGuideSources(readme) {
  const folderStructureMatch = readme.match(/## Folder structure\s+```text\s*([\s\S]*?)```/i);

  if (!folderStructureMatch) {
    return [];
  }

  const lines = folderStructureMatch[1].split(/\r?\n/);
  const guideSources = [];
  let inGuideDirectory = false;
  let guideIndent = 0;

  lines.forEach((line) => {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = line.trim();

    if (trimmed === "guides/") {
      inGuideDirectory = true;
      guideIndent = indent;
      return;
    }

    if (!inGuideDirectory) {
      return;
    }

    if (!trimmed) {
      return;
    }

    if (indent <= guideIndent) {
      inGuideDirectory = false;
      return;
    }

    if (trimmed.endsWith(".md")) {
      guideSources.push(trimmed);
    }
  });

  return guideSources;
}

function testElementWithIdAndPattern(content, id, requiredPattern) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<[^>]*\\bid\\s*=\\s*"${escapedId}"[^>]*${requiredPattern}[^>]*>|<[^>]*${requiredPattern}[^>]*\\bid\\s*=\\s*"${escapedId}"[^>]*>`, "i");
  return pattern.test(content);
}

/* Accept either plain owner text or the linked footer variant used in docs HTML. */
function contentContainsExpectedOwner(content, expectedOwner) {
  return content.includes(expectedOwner)
    || /TechAyo LTD\s*\(\s*<a[^>]*href="https:\/\/techayo\.co\.uk"[^>]*>\s*techayo\.co\.uk\s*<\/a>\s*\)/i.test(content);
}

/* Run one sibling Node.js script as part of validation. */
function runNodeScript(scriptPath, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    cwd: path.dirname(path.dirname(scriptPath))
  });
}

function getRelativePath(value) {
  return value.replace(/\\/g, "/");
}

function getRelativeDocHref(fromOutput, targetPath) {
  const fromDir = path.posix.dirname(fromOutput.replace(/\\/g, "/"));
  const target = targetPath.replace(/\\/g, "/");
  const relativePath = path.posix.relative(fromDir, target) || path.posix.basename(target);
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

/* Verify the generated dist/fnlla-ui/ handoff matches the published runtime files. */
function validateRuntimeExport(options) {
  const {
    exportRootPath,
    version,
    manifest,
    cssEntrypointPath,
    runtimeScriptPath,
    errors
  } = options;
  const exportLabel = "runtime export";
  const distReadmePath = path.join(exportRootPath, "README.md");
  const distAssetsCssPath = path.join(exportRootPath, manifest.runtime.cssOutput);
  const distAssetsJsPath = path.join(exportRootPath, manifest.runtime.jsOutput);
  const distVersionPath = path.join(exportRootPath, "VERSION");
  const distLicensePath = path.join(exportRootPath, "LICENSE.md");

  if (!pathExists(distReadmePath)) {
    errors.push(`${exportLabel}: missing README.md`);
  } else {
    const distReadme = readText(distReadmePath);
    ["runtime-only FNLLA UI handoff", "scripts/publish-fnlla-ui.mjs", "README.md", "VERSION", "LICENSE.md"].forEach((requiredText) => {
      if (!distReadme.includes(requiredText)) {
        errors.push(`${exportLabel}/README.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(distLicensePath)) {
    errors.push(`${exportLabel}: missing LICENSE.md`);
  }

  if (!pathExists(distVersionPath)) {
    errors.push(`${exportLabel}: missing VERSION`);
  } else if (version) {
    const distVersion = (readText(distVersionPath).split(/\r?\n/)[0] || "").trim();
    if (distVersion !== version) {
      errors.push(`${exportLabel}/VERSION: expected '${version}' but found '${distVersion}'`);
    }
  }

  if (pathExists(distAssetsCssPath) && pathExists(cssEntrypointPath)) {
    if (!compareNormalizedContent(readText(distAssetsCssPath), readText(cssEntrypointPath))) {
      errors.push(`${exportLabel}/assets/css/fnlla-ui.css: export is out of sync with assets/css/fnlla-ui.css`);
    }
  } else {
    errors.push(`${exportLabel}/assets/css/fnlla-ui.css: missing runtime export file`);
  }

  if (pathExists(distAssetsJsPath) && pathExists(runtimeScriptPath)) {
    if (!compareNormalizedContent(readText(distAssetsJsPath), readText(runtimeScriptPath))) {
      errors.push(`${exportLabel}/assets/js/fnlla-ui.js: export is out of sync with assets/js/fnlla-ui.js`);
    }
  } else {
    errors.push(`${exportLabel}/assets/js/fnlla-ui.js: missing runtime export file`);
  }

  manifest.runtime.requiredIconPaths.forEach((requiredIconBundlePath) => {
    if (!pathExists(path.join(exportRootPath, requiredIconBundlePath))) {
      errors.push(`${exportLabel}/${requiredIconBundlePath}: missing required local FNLLA Icons asset`);
    }
  });
}

/* Validate the current repository snapshot against the FNLLA UI contract. */
export function validateFramework(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const manifest = getFnllaUiManifest();
  const expectedProject = manifest.project.name;
  const expectedOwner = manifest.project.owner;
  const expectedOrigin = manifest.project.origin;
  const docsDir = path.join(repoRoot, "docs");
  const readmePath = path.join(repoRoot, "README.md");
  const versionPath = path.join(repoRoot, "VERSION");
  const licensePath = path.join(repoRoot, "LICENSE.md");
  const codeOfConductPath = path.join(repoRoot, "CODE_OF_CONDUCT.md");
  const securityPath = path.join(repoRoot, "SECURITY.md");
  const apiDocPath = path.join(docsDir, "api.html");
  const componentClassificationPath = path.join(repoRoot, manifest.docs.guidePages[0].source);
  const cssEntrypointPath = path.join(repoRoot, manifest.runtime.cssOutput);
  const runtimeScriptPath = path.join(repoRoot, manifest.runtime.jsOutput);
  const docsScriptPath = path.join(repoRoot, manifest.docs.assets.jsOutput);
  const publishScriptPath = path.join(repoRoot, "scripts", "publish-fnlla-ui.mjs");
  const validateScriptPath = path.join(repoRoot, "scripts", "validate-fnlla-ui.mjs");
  const buildGuidesScriptPath = path.join(repoRoot, "scripts", "build-guides.mjs");
  const syncDocShellsScriptPath = path.join(repoRoot, "scripts", "sync-doc-shells.mjs");
  const manifestScriptPath = path.join(repoRoot, "scripts", "fnlla-ui-manifest.mjs");
  const browserSmokeScriptPath = path.join(repoRoot, "scripts", "test-fnlla-ui-browser.mjs");
  const browserMatrixScriptPath = path.join(repoRoot, "scripts", "test-fnlla-ui-browser-matrix.mjs");
  const brandPreviewScriptPath = path.join(repoRoot, "scripts", "render-brand-previews.mjs");
  const browserSmokeDocsInspectionPath = path.join(repoRoot, "scripts", "browser-smoke-docs-inspection.mjs");
  const browserSmokeFixturePath = path.join(repoRoot, "scripts", "test-fixtures", "browser-smoke.html");
  const contributingPath = path.join(repoRoot, ".github", "CONTRIBUTING.md");
  const releaseTemplatePath = path.join(repoRoot, ".github", "RELEASE_TEMPLATE.md");
  const supportPath = path.join(repoRoot, ".github", "SUPPORT.md");
  const githubWorkflowPath = path.join(repoRoot, ".github", "workflows", "fnlla-ui-hardening.yml");
  const brandAssetsDir = path.join(repoRoot, "docs", "assets", "brand");
  const brandSvgPath = path.join(brandAssetsDir, "fnlla-ui.svg");
  const brandReadmePath = path.join(brandAssetsDir, "README.md");
  const brandSocialPreviewHtmlPath = path.join(brandAssetsDir, "fnlla-ui-social-preview.html");
  const brandAvatarPreviewHtmlPath = path.join(brandAssetsDir, "fnlla-ui-avatar-preview.html");
  const brandSocialPreviewPngPath = path.join(brandAssetsDir, "fnlla-ui-social-preview.png");
  const brandAvatarPngPath = path.join(brandAssetsDir, "fnlla-ui-avatar.png");
  const errors = [];
  let version = "";

  if (!pathExists(docsDir)) {
    throw new Error(`Missing docs directory: ${docsDir}`);
  }

  if (!pathExists(versionPath)) {
    errors.push("VERSION: missing file");
  } else {
    const versionLines = readText(versionPath).split(/\r?\n/);
    version = (versionLines[0] || "").trim();

    if (!version) {
      errors.push("VERSION: first line is empty");
    } else if (!/^\d+\.\d+\.\d+$/.test(version)) {
      errors.push(`VERSION: '${version}' is not a semantic version`);
    }

    ["TechAyo LTD (techayo.co.uk)", "Finella Gardens, Dundee, UK"].forEach((requiredText) => {
      if (!versionLines.join("\n").includes(requiredText)) {
        errors.push(`VERSION: missing required text '${requiredText}'`);
      }
    });
  }

  const expectedRootDocNames = manifest.docs.rootPages.map((page) => path.basename(page.href));
  const expectedGuideDocNames = manifest.docs.guidePages.map((page) => path.basename(page.output));
  const discoveredRootDocNames = fs.readdirSync(docsDir)
    .filter((name) => name.endsWith(".html"))
    .sort();
  const rootDocFiles = expectedRootDocNames.map((name) => ({ name, fullPath: path.join(docsDir, name) }));
  const guideFiles = manifest.docs.guidePages.map((page) => ({
    page,
    name: path.basename(page.output),
    fullPath: path.join(repoRoot, page.output)
  }));
  const docNames = rootDocFiles.map((file) => file.name);

  discoveredRootDocNames.forEach((name) => {
    if (!expectedRootDocNames.includes(name) && !expectedGuideDocNames.includes(name)) {
      errors.push(`docs/${name}: unexpected top-level docs page not declared in scripts/fnlla-ui-manifest.mjs`);
    }
  });

  rootDocFiles.forEach((file) => {
    if (!pathExists(file.fullPath)) {
      errors.push(`docs/${file.name}: missing file`);
      return;
    }

    const content = getSanitizedHtmlContent(file.fullPath);
    const ids = getAttributeValues(content, /(?<![A-Za-z0-9_-])id\s*=\s*"([^"]+)"/gi);

    ids.forEach((id) => {
      if (ids.filter((candidate) => candidate === id).length > 1) {
        errors.push(`${file.name}: duplicate id '${id}'`);
      }
    });

    ["../assets/css/fnlla-ui.css", "./assets/docs.css", "../assets/js/fnlla-ui.js"].forEach((requiredAsset) => {
      if (!content.includes(requiredAsset)) {
        errors.push(`${file.name}: missing required asset reference '${requiredAsset}'`);
      }
    });

    if (/(src|href)\s*=\s*"https?:\/\/[^"]*(lucide\.dev|cdn\.jsdelivr\.net|unpkg\.com|npmjs\.com)/i.test(content)) {
      errors.push(`${file.name}: external icon asset reference detected; FNLLA Icons must stay local and offline`);
    }

    const skipMatch = content.match(/<a[^>]*class="[^"]*skip-link[^"]*"[^>]*href="#([^"]+)"/i);
    if (!skipMatch) {
      errors.push(`${file.name}: missing skip-link`);
    } else if (!ids.includes(skipMatch[1])) {
      errors.push(`${file.name}: skip link target '#${skipMatch[1]}' does not exist`);
    }

    docNames.forEach((docName) => {
      if (!content.includes(`./${docName}`)) {
        errors.push(`${file.name}: docs navigation does not include './${docName}'`);
      }
    });

    if (!content.includes(`./${file.name}`) || !/aria-current="page"/i.test(content)) {
      errors.push(`${file.name}: docs navigation does not expose the current page state`);
    }

    [expectedOwner].forEach((requiredFooterString) => {
      if (!contentContainsExpectedOwner(content, requiredFooterString)) {
        errors.push(`${file.name}: missing ownership footer text '${requiredFooterString}'`);
      }
    });

    if (version && !content.includes(`<span class="doc-status">Stable ${version}</span>`)) {
      errors.push(`${file.name}: doc status must reflect VERSION '${version}'`);
    }

    getAttributeValues(content, /aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!ids.includes(targetId)) {
        errors.push(`${file.name}: aria-controls target '${targetId}' does not exist`);
      }
    });

    getAttributeValues(content, /aria-labelledby\s*=\s*"([^"]+)"/gi).forEach((targetIds) => {
      targetIds.split(/\s+/).filter(Boolean).forEach((targetId) => {
        if (!ids.includes(targetId)) {
          errors.push(`${file.name}: aria-labelledby target '${targetId}' does not exist`);
        }
      });
    });

    getAttributeValues(content, /aria-describedby\s*=\s*"([^"]+)"/gi).forEach((targetIds) => {
      targetIds.split(/\s+/).filter(Boolean).forEach((targetId) => {
        if (!ids.includes(targetId)) {
          errors.push(`${file.name}: aria-describedby target '${targetId}' does not exist`);
        }
      });
    });

    getAttributeValues(content, /data-fnlla-modal-open\s*=\s*"#([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, "data-fnlla-modal")) {
        errors.push(`${file.name}: modal trigger points to '#${targetId}' but no matching modal container exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-toast-open\s*=\s*"#([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, "data-fnlla-toast")) {
        errors.push(`${file.name}: toast trigger points to '#${targetId}' but no matching toast container exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-offcanvas-open\s*=\s*"#([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, "data-fnlla-offcanvas")) {
        errors.push(`${file.name}: offcanvas trigger points to '#${targetId}' but no matching offcanvas container exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-dropdown-toggle[^>]*aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, 'class\\s*=\\s*"[^"]*dropdown-menu')) {
        errors.push(`${file.name}: dropdown toggle points to '${targetId}' but no matching .dropdown-menu exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-nav-toggle[^>]*aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, 'class\\s*=\\s*"[^"]*navbar-panel')) {
        errors.push(`${file.name}: nav toggle points to '${targetId}' but no matching .navbar-panel exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-tab[^>]*aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, 'class\\s*=\\s*"[^"]*tab-panel')) {
        errors.push(`${file.name}: tab points to '${targetId}' but no matching .tab-panel exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-popover-toggle[^>]*aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, 'class\\s*=\\s*"[^"]*popover-panel')) {
        errors.push(`${file.name}: popover toggle points to '${targetId}' but no matching .popover-panel exists`);
      }
    });

    getAttributeValues(content, /data-fnlla-accordion-button[^>]*aria-controls\s*=\s*"([^"]+)"/gi).forEach((targetId) => {
      if (!testElementWithIdAndPattern(content, targetId, 'class\\s*=\\s*"[^"]*accordion-panel')) {
        errors.push(`${file.name}: accordion trigger points to '${targetId}' but no matching .accordion-panel exists`);
      }
    });
  });

  guideFiles.forEach((file) => {
    if (!pathExists(file.fullPath)) {
      errors.push(`${getRelativePath(path.relative(repoRoot, file.fullPath))}: missing file`);
      return;
    }

    const content = getSanitizedHtmlContent(file.fullPath);
    const ids = getAttributeValues(content, /(?<![A-Za-z0-9_-])id\s*=\s*"([^"]+)"/gi);

    ids.forEach((id) => {
      if (ids.filter((candidate) => candidate === id).length > 1) {
        errors.push(`${file.name}: duplicate id '${id}'`);
      }
    });

    [
      getRelativeDocHref(file.page.output, manifest.runtime.cssOutput),
      getRelativeDocHref(file.page.output, "docs/assets/docs.css"),
      getRelativeDocHref(file.page.output, manifest.runtime.jsOutput)
    ].forEach((requiredAsset) => {
      if (!content.includes(requiredAsset)) {
        errors.push(`${file.name}: missing required asset reference '${requiredAsset}'`);
      }
    });

    const skipMatch = content.match(/<a[^>]*class="[^"]*skip-link[^"]*"[^>]*href="#([^"]+)"/i);
    if (!skipMatch) {
      errors.push(`${file.name}: missing skip-link`);
    } else if (!ids.includes(skipMatch[1])) {
      errors.push(`${file.name}: skip link target '#${skipMatch[1]}' does not exist`);
    }

    if (/(src|href)\s*=\s*"https?:\/\/[^"]*(lucide\.dev|cdn\.jsdelivr\.net|unpkg\.com|npmjs\.com)/i.test(content)) {
      errors.push(`${file.name}: external icon asset reference detected; FNLLA Icons must stay local and offline`);
    }

    manifest.docs.rootPages.forEach((page) => {
      const expectedHref = getRelativeDocHref(file.page.output, `docs/${path.basename(page.href)}`);
      if (!content.includes(`href="${expectedHref}"`)) {
        errors.push(`${file.name}: guide root navigation does not include '${expectedHref}'`);
      }
    });

    const currentGuidesHref = getRelativeDocHref(file.page.output, "docs/guides.html");
    const currentGuidesHrefPattern = currentGuidesHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!content.includes(`href="${currentGuidesHref}"`) || !content.includes(">Guides</a>") || !content.match(new RegExp(`<a[^>]*href="${currentGuidesHrefPattern}"[^>]*aria-current="page"[^>]*>Guides<\\/a>|<a[^>]*aria-current="page"[^>]*href="${currentGuidesHrefPattern}"[^>]*>Guides<\\/a>`, "i"))) {
      errors.push(`${file.name}: guide root navigation must expose Guides as the current page`);
    }

    guideFiles.forEach((guideFile) => {
      const expectedGuideHref = getRelativeDocHref(file.page.output, guideFile.page.output);
      if (!content.includes(`href="${expectedGuideHref}"`)) {
        errors.push(`${file.name}: guide page navigation does not include '${expectedGuideHref}'`);
      }
    });

    if (!content.includes(`href="./${file.name}"`) || !content.match(new RegExp(`<a[^>]*href="\\./${file.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*aria-current="page"[^>]*>|<a[^>]*aria-current="page"[^>]*href="\\./${file.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "i"))) {
      errors.push(`${file.name}: guide navigation does not expose the current guide state`);
    }

    [expectedOwner].forEach((requiredFooterString) => {
      if (!contentContainsExpectedOwner(content, requiredFooterString)) {
        errors.push(`${file.name}: missing ownership footer text '${requiredFooterString}'`);
      }
    });

    if (!content.includes(`>${file.page.navLabel}</a>`)) {
      errors.push(`${file.name}: guide navigation is missing label '${file.page.navLabel}'`);
    }

    if (version && !content.includes(`<span class="doc-status">Stable ${version}</span>`)) {
      errors.push(`${file.name}: doc status must reflect VERSION '${version}'`);
    }
  });

  if (!pathExists(readmePath)) {
    errors.push("README.md: missing file");
  } else {
    const readme = readText(readmePath);
    docNames.forEach((docName) => {
      if (!readme.includes(docName)) {
        errors.push(`README.md: included documentation list does not mention '${docName}'`);
      }
    });

    [
      "scripts/validate-fnlla-ui.mjs",
      "scripts/publish-fnlla-ui.mjs",
      "scripts/fnlla-ui-manifest.mjs",
      "scripts/build-guides.mjs",
      "scripts/render-brand-previews.mjs",
      "scripts/test-fnlla-ui-browser.mjs",
      "scripts/test-fnlla-ui-browser-matrix.mjs",
      "LICENSE.md",
      "CODE_OF_CONDUCT.md",
      "SECURITY.md",
      ".github/CONTRIBUTING.md",
      ".github/RELEASE_TEMPLATE.md",
      ".github/SUPPORT.md",
      "docs/assets/brand/fnlla-ui.svg",
      "docs/assets/brand/fnlla-ui-social-preview.png",
      "docs/assets/brand/fnlla-ui-avatar.png",
      "dist/fnlla-ui/",
      "window.FNLLAUI.init(root)",
      "window.FNLLAUI.setTheme(theme, target)",
      "window.FNLLAUI.showToast(target)",
      "window.FNLLAUI.showOffcanvas(target)",
      "docs/component-classification.html",
      "docs/team-usage-and-maintenance.html",
      "assets/icons/sprite.svg",
      "assets/icons/search.svg",
      "assets/icons/NOTICE.md",
      expectedOwner,
      expectedOrigin
    ].forEach((requiredReference) => {
      if (!readme.includes(requiredReference)) {
        errors.push(`README.md: missing required reference '${requiredReference}'`);
      }
    });

    getReadmeFolderTreeGuideSources(readme).forEach((guideSourceName) => {
      if (!pathExists(path.join(repoRoot, "docs", "guides", guideSourceName))) {
        errors.push(`README.md: folder structure lists 'docs/guides/${guideSourceName}' but that file does not exist`);
      }
    });
  }

  manifest.runtime.requiredIconPaths.forEach((requiredIconBundlePath) => {
    if (!pathExists(path.join(repoRoot, requiredIconBundlePath))) {
      errors.push(`${requiredIconBundlePath}: missing required local FNLLA Icons asset`);
    }
  });

  if (!pathExists(componentClassificationPath)) {
    errors.push("docs/guides/component-classification.md: missing file");
  } else {
    const componentClassification = readText(componentClassificationPath);
    [expectedProject, expectedOwner, expectedOrigin, "Buttons", "Forms", "Modal", "Toast", "Offcanvas", "Scrollspy", "Popover"].forEach((requiredText) => {
      if (!componentClassification.includes(requiredText)) {
        errors.push(`docs/guides/component-classification.md: missing required text '${requiredText}'`);
      }
    });
  }

  try {
    syncDocShells({ repoRoot, manifest, check: true });
  } catch (error) {
    errors.push(error && error.message ? error.message : String(error));
  }

  try {
    buildGuidePages({ repoRoot, check: true });
  } catch (error) {
    errors.push(error && error.message ? error.message : String(error));
  }

  if (!pathExists(licensePath)) {
    errors.push("LICENSE.md: missing file");
  } else {
    const license = readText(licensePath);
    [expectedProject, expectedOwner, "productions executed by TechAyo LTD"].forEach((requiredText) => {
      if (!license.includes(requiredText)) {
        errors.push(`LICENSE.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(codeOfConductPath)) {
    errors.push("CODE_OF_CONDUCT.md: missing file");
  } else {
    const codeOfConduct = readText(codeOfConductPath);
    [
      "TechAyo LTD",
      "FNLLA UI Code of Conduct",
      "https://techayo.co.uk"
    ].forEach((requiredText) => {
      if (!codeOfConduct.includes(requiredText)) {
        errors.push(`CODE_OF_CONDUCT.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(securityPath)) {
    errors.push("SECURITY.md: missing file");
  } else {
    const security = readText(securityPath);
    [
      "Security Policy",
      "TechAyo LTD",
      "https://techayo.co.uk",
      "Do not open public GitHub issues"
    ].forEach((requiredText) => {
      if (!security.includes(requiredText)) {
        errors.push(`SECURITY.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(contributingPath)) {
    errors.push(".github/CONTRIBUTING.md: missing file");
  } else {
    const contributing = readText(contributingPath);
    [
      "Contributing to FNLLA UI",
      "TechAyo LTD",
      "SECURITY.md",
      "LICENSE.md"
    ].forEach((requiredText) => {
      if (!contributing.includes(requiredText)) {
        errors.push(`.github/CONTRIBUTING.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(releaseTemplatePath)) {
    errors.push(".github/RELEASE_TEMPLATE.md: missing file");
  } else {
    const releaseTemplate = readText(releaseTemplatePath);
    [
      "FNLLA UI Release Notes Template",
      "Stable runtime contract: assets/css/fnlla-ui.css, assets/js/fnlla-ui.js and assets/icons/",
      "Use plain ASCII"
    ].forEach((requiredText) => {
      if (!releaseTemplate.includes(requiredText)) {
        errors.push(`.github/RELEASE_TEMPLATE.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(supportPath)) {
    errors.push(".github/SUPPORT.md: missing file");
  } else {
    const support = readText(supportPath);
    [
      "FNLLA UI Support",
      "SECURITY.md",
      "CODE_OF_CONDUCT.md",
      "https://techayo.co.uk"
    ].forEach((requiredText) => {
      if (!support.includes(requiredText)) {
        errors.push(`.github/SUPPORT.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(brandPreviewScriptPath)) {
    errors.push("scripts/render-brand-previews.mjs: missing file");
  } else {
    const brandPreviewScript = readText(brandPreviewScriptPath);
    [
      "renderBrandPreviews",
      "fnlla-ui-social-preview.html",
      "fnlla-ui-avatar-preview.html",
      "A Chromium-based browser is required to render FNLLA UI brand previews"
    ].forEach((requiredText) => {
      if (!brandPreviewScript.includes(requiredText)) {
        errors.push(`scripts/render-brand-previews.mjs: missing required text '${requiredText}'`);
      }
    });
  }

  [
    brandSvgPath,
    brandReadmePath,
    brandSocialPreviewHtmlPath,
    brandAvatarPreviewHtmlPath,
    brandSocialPreviewPngPath,
    brandAvatarPngPath
  ].forEach((brandPath) => {
    if (!pathExists(brandPath)) {
      errors.push(`${path.relative(repoRoot, brandPath).replace(/\\/g, "/")}: missing file`);
    }
  });

  if (pathExists(brandReadmePath)) {
    const brandReadme = readText(brandReadmePath);
    [
      "FNLLA UI brand assets",
      "fnlla-ui.svg",
      "fnlla-ui-social-preview.png",
      "fnlla-ui-avatar.png"
    ].forEach((requiredText) => {
      if (!brandReadme.includes(requiredText)) {
        errors.push(`docs/assets/brand/README.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (pathExists(brandSocialPreviewHtmlPath)) {
    const brandSocialPreviewHtml = readText(brandSocialPreviewHtmlPath);
    [
      "FNLLA UI",
      "Stable no-build runtime for static and server-rendered websites.",
      "fnlla-ui.svg"
    ].forEach((requiredText) => {
      if (!brandSocialPreviewHtml.includes(requiredText)) {
        errors.push(`docs/assets/brand/fnlla-ui-social-preview.html: missing required text '${requiredText}'`);
      }
    });
  }

  if (pathExists(brandAvatarPreviewHtmlPath)) {
    const brandAvatarPreviewHtml = readText(brandAvatarPreviewHtmlPath);
    [
      "fnlla-ui.svg",
      "FNLLA UI",
      "theme-color"
    ].forEach((requiredText) => {
      if (!brandAvatarPreviewHtml.includes(requiredText)) {
        errors.push(`docs/assets/brand/fnlla-ui-avatar-preview.html: missing required text '${requiredText}'`);
      }
    });
  }

  [brandSocialPreviewPngPath, brandAvatarPngPath].forEach((imagePath) => {
    if (pathExists(imagePath) && fs.statSync(imagePath).size < 1024) {
      errors.push(`${path.relative(repoRoot, imagePath).replace(/\\/g, "/")}: file is unexpectedly small`);
    }
  });

  if (!pathExists(githubWorkflowPath)) {
    errors.push(".github/workflows/fnlla-ui-hardening.yml: missing file");
  } else {
    const githubWorkflow = readText(githubWorkflowPath);
    [
      "actions/checkout@v5",
      "actions/setup-node@v6",
      "package-manager-cache: false"
    ].forEach((requiredText) => {
      if (!githubWorkflow.includes(requiredText)) {
        errors.push(`.github/workflows/fnlla-ui-hardening.yml: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(apiDocPath)) {
    errors.push("docs/api.html: missing file");
  } else {
    const apiDoc = readText(apiDocPath);
    [
      expectedOwner,
      "FNLLA PHP",
      "window.FNLLAUI.init(root)",
      "window.FNLLAUI.setTheme(theme, target)",
      "window.FNLLAUI.showOffcanvas(target)",
      "assets/icons/",
      "FNLLA Icons",
      "data-fnlla-toast-open",
      "data-fnlla-offcanvas-open",
      "data-fnlla-popover-toggle",
      "data-fnlla-tooltip",
      "data-fnlla-scrollspy-nav",
      "Accordion behavior without a real <code>aria-controls</code> target"
    ].forEach((requiredText) => {
      if (!apiDoc.includes(requiredText)) {
        errors.push(`docs/api.html: missing required text '${requiredText}'`);
      }
    });

    if (version && !apiDoc.includes(`<code>${version}</code>`)) {
      errors.push(`docs/api.html: version '${version}' is not reflected in the API document`);
    }
  }

  [
    publishScriptPath,
    validateScriptPath,
    buildGuidesScriptPath,
    syncDocShellsScriptPath,
    manifestScriptPath,
    browserSmokeScriptPath,
    browserMatrixScriptPath,
    browserSmokeDocsInspectionPath,
    browserSmokeFixturePath
  ].forEach((targetPath) => {
    if (!pathExists(targetPath)) {
      errors.push(`${path.relative(repoRoot, targetPath).replace(/\\/g, "/")}: missing file`);
    }
  });

  if (!pathExists(githubWorkflowPath)) {
    errors.push(".github/workflows/fnlla-ui-hardening.yml: missing file");
  }

  if (pathExists(path.join(repoRoot, "css"))) {
    errors.push("css/: obsolete legacy runtime directory still exists");
  }

  if (pathExists(path.join(repoRoot, "js"))) {
    errors.push("js/: obsolete legacy runtime directory still exists");
  }

  if (!pathExists(cssEntrypointPath)) {
    errors.push("assets/css/fnlla-ui.css: missing file");
  } else {
    const missingCssSources = [];
    const expectedCssModules = [];

    manifest.source.css.forEach((relativePath) => {
      const fullPath = path.join(repoRoot, relativePath);
      if (!pathExists(fullPath)) {
        missingCssSources.push(relativePath);
        return;
      }

      expectedCssModules.push(readText(fullPath).trimEnd());
    });

    if (missingCssSources.length) {
      errors.push(`css source modules missing: ${missingCssSources.join(", ")}`);
    } else {
      const expectedCssRuntime = `${manifest.runtime.cssBanner.trimEnd()}\r\n\r\n${expectedCssModules.join("\r\n\r\n")}\r\n`;
      if (!compareNormalizedContent(readText(cssEntrypointPath), expectedCssRuntime)) {
        errors.push("assets/css/fnlla-ui.css: public runtime is out of sync with src/css modules. Run scripts/publish-fnlla-ui.mjs");
      }
    }
  }

  if (!pathExists(runtimeScriptPath)) {
    errors.push("assets/js/fnlla-ui.js: missing file");
  } else {
    const missingJsSources = [];
    const expectedRuntimeModules = [];

    manifest.source.js.forEach((relativePath) => {
      const fullPath = path.join(repoRoot, relativePath);
      if (!pathExists(fullPath)) {
        missingJsSources.push(relativePath);
        return;
      }

      expectedRuntimeModules.push(readText(fullPath).trimEnd());
    });

    if (missingJsSources.length) {
      errors.push(`js source modules missing: ${missingJsSources.join(", ")}`);
    } else {
      const expectedRuntime = `${expectedRuntimeModules.join("\r\n\r\n")}\r\n`;
      if (!compareNormalizedContent(readText(runtimeScriptPath), expectedRuntime)) {
        errors.push("assets/js/fnlla-ui.js: public runtime is out of sync with src/js modules. Run scripts/publish-fnlla-ui.mjs");
      }
    }

    const syntaxCheck = spawnSync(process.execPath, ["--check", runtimeScriptPath], { encoding: "utf8" });
    if (syntaxCheck.status !== 0) {
      errors.push(`assets/js/fnlla-ui.js: node --check failed: ${(syntaxCheck.stderr || syntaxCheck.stdout || "").trim()}`);
    }
  }

  if (!pathExists(docsScriptPath)) {
    errors.push("docs/assets/docs.js: missing file");
  } else {
    const missingDocsJsSources = [];
    const expectedDocsRuntimeModules = [];

    manifest.docs.assets.js.forEach((relativePath) => {
      const fullPath = path.join(repoRoot, relativePath);
      if (!pathExists(fullPath)) {
        missingDocsJsSources.push(relativePath);
        return;
      }

      expectedDocsRuntimeModules.push(readText(fullPath).trimEnd());
    });

    if (missingDocsJsSources.length) {
      errors.push(`docs js source modules missing: ${missingDocsJsSources.join(", ")}`);
    } else {
      const expectedDocsRuntime = `${expectedDocsRuntimeModules.join("\r\n\r\n")}\r\n`;
      if (!compareNormalizedContent(readText(docsScriptPath), expectedDocsRuntime)) {
        errors.push("docs/assets/docs.js: docs script is out of sync with src/docs/js modules. Run scripts/publish-fnlla-ui.mjs");
      }
    }

    const docsSyntaxCheck = spawnSync(process.execPath, ["--check", docsScriptPath], { encoding: "utf8" });
    if (docsSyntaxCheck.status !== 0) {
      errors.push(`docs/assets/docs.js: node --check failed: ${(docsSyntaxCheck.stderr || docsSyntaxCheck.stdout || "").trim()}`);
    }
  }

  if (!errors.length) {
    const exportTempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fnlla-ui-export-"));

    try {
      const exportRootPath = path.join(exportTempRoot, "fnlla-ui");
      writeRuntimeExport({ repoRoot, manifest, version, distRootPath: exportRootPath });
      validateRuntimeExport({
        exportRootPath,
        version,
        manifest,
        cssEntrypointPath,
        runtimeScriptPath,
        errors
      });
    } catch (error) {
      errors.push(`runtime export generation failed: ${error && error.message ? error.message : String(error)}`);
    } finally {
      fs.rmSync(exportTempRoot, { recursive: true, force: true });
    }
  }

  if (!errors.length) {
    const browser = detectChromiumBrowsers()[0];

    if (!browser) {
      errors.push("A Chromium-based browser is required to run the FNLLA UI browser smoke test");
    } else {
      const smokeResult = runNodeScript(browserSmokeScriptPath, ["--browser", browser.path, "--repo-root", repoRoot]);
      if (smokeResult.status !== 0) {
        errors.push(`Browser smoke test failed: ${(smokeResult.stdout || "")}${(smokeResult.stderr || "")}`.trim());
      }
    }
  }

  return {
    ok: errors.length === 0,
    docCount: rootDocFiles.length + guideFiles.length,
    errors
  };
}

function runCli() {
  const result = validateFramework();

  if (!result.ok) {
    console.log("FNLLA UI validation failed.");
    result.errors.forEach((error) => {
      console.log(`- ${error}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log("FNLLA UI validation passed.");
  console.log(`Validated docs pages: ${result.docCount}`);
  console.log("Validated README, release metadata, guide publication, runtime export generation, proprietary license and runtime syntax.");
}

if (isDirectExecution(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}
