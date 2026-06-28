/*
  FNLLA Web structural validator.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

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
import { getFnllaWebManifest } from "./fnlla-web-manifest.mjs";
import { writeRuntimeExport } from "./publish-fnlla-web.mjs";
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

/* Verify the generated dist/fnlla-web/ handoff matches the published runtime files. */
function validateRuntimeExport(options) {
  const {
    exportRootPath,
    version,
    manifest,
    repositoryManifestPath,
    cssEntrypointPath,
    runtimeScriptPath,
    errors
  } = options;
  const exportLabel = "runtime export";
  const distReadmePath = path.join(exportRootPath, "README.md");
  const distManifestPath = path.join(exportRootPath, "MANIFEST.json");
  const distAssetsCssPath = path.join(exportRootPath, manifest.runtime.cssOutput);
  const distAssetsJsPath = path.join(exportRootPath, manifest.runtime.jsOutput);
  const distVersionPath = path.join(exportRootPath, "VERSION");
  const distLicensePath = path.join(exportRootPath, "LICENSE.md");

  if (!pathExists(distReadmePath)) {
    errors.push(`${exportLabel}: missing README.md`);
  } else {
    const distReadme = readText(distReadmePath);
    ["runtime-only FNLLA Web handoff", "scripts/publish-fnlla-web.mjs", "README.md", "MANIFEST.json", "VERSION", "LICENSE.md"].forEach((requiredText) => {
      if (!distReadme.includes(requiredText)) {
        errors.push(`${exportLabel}/README.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(distLicensePath)) {
    errors.push(`${exportLabel}: missing LICENSE.md`);
  }

  if (!pathExists(distManifestPath)) {
    errors.push(`${exportLabel}: missing MANIFEST.json`);
  } else if (pathExists(repositoryManifestPath)) {
    if (!compareNormalizedContent(readText(distManifestPath), readText(repositoryManifestPath))) {
      errors.push(`${exportLabel}/MANIFEST.json: export is out of sync with repository MANIFEST.json`);
    }
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
      errors.push(`${exportLabel}/assets/css/fnlla-web.css: export is out of sync with assets/css/fnlla-web.css`);
    }
  } else {
    errors.push(`${exportLabel}/assets/css/fnlla-web.css: missing runtime export file`);
  }

  if (pathExists(distAssetsJsPath) && pathExists(runtimeScriptPath)) {
    if (!compareNormalizedContent(readText(distAssetsJsPath), readText(runtimeScriptPath))) {
      errors.push(`${exportLabel}/assets/js/fnlla-web.js: export is out of sync with assets/js/fnlla-web.js`);
    }
  } else {
    errors.push(`${exportLabel}/assets/js/fnlla-web.js: missing runtime export file`);
  }

  manifest.runtime.requiredIconPaths.forEach((requiredIconBundlePath) => {
    if (!pathExists(path.join(exportRootPath, requiredIconBundlePath))) {
      errors.push(`${exportLabel}/${requiredIconBundlePath}: missing required local FNLLA Icons asset`);
    }
  });
}

/* Validate the current repository snapshot against the FNLLA Web contract. */
export function validateFramework(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const manifest = getFnllaWebManifest();
  const expectedProject = manifest.project.name;
  const expectedOwner = manifest.project.owner;
  const expectedOrigin = manifest.project.origin;
  const docsDir = path.join(repoRoot, "docs");
  const readmePath = path.join(repoRoot, "README.md");
  const manifestJsonPath = path.join(repoRoot, "MANIFEST.json");
  const versionPath = path.join(repoRoot, "VERSION");
  const licensePath = path.join(repoRoot, "LICENSE.md");
  const codeOfConductPath = path.join(repoRoot, "CODE_OF_CONDUCT.md");
  const securityPath = path.join(repoRoot, "SECURITY.md");
  const contractDocPath = path.join(docsDir, "contract.html");
  const componentClassificationPath = path.join(repoRoot, manifest.docs.guidePages[0].source);
  const cssEntrypointPath = path.join(repoRoot, manifest.runtime.cssOutput);
  const runtimeScriptPath = path.join(repoRoot, manifest.runtime.jsOutput);
  const docsScriptPath = path.join(repoRoot, manifest.docs.assets.jsOutput);
  const publishScriptPath = path.join(repoRoot, "scripts", "publish-fnlla-web.mjs");
  const validateScriptPath = path.join(repoRoot, "scripts", "validate-fnlla-web.mjs");
  const buildGuidesScriptPath = path.join(repoRoot, "scripts", "build-guides.mjs");
  const syncDocShellsScriptPath = path.join(repoRoot, "scripts", "sync-doc-shells.mjs");
  const manifestScriptPath = path.join(repoRoot, "scripts", "fnlla-web-manifest.mjs");
  const browserSmokeScriptPath = path.join(repoRoot, "scripts", "test-fnlla-web-browser.mjs");
  const browserMatrixScriptPath = path.join(repoRoot, "scripts", "test-fnlla-web-browser-matrix.mjs");
  const browserSmokeDocsInspectionPath = path.join(repoRoot, "scripts", "browser-smoke-docs-inspection.mjs");
  const browserSmokeFixturePath = path.join(repoRoot, "scripts", "test-fixtures", "browser-smoke.html");
  const contributingPath = path.join(repoRoot, ".github", "CONTRIBUTING.md");
  const releaseTemplatePath = path.join(repoRoot, ".github", "RELEASE_TEMPLATE.md");
  const supportPath = path.join(repoRoot, ".github", "SUPPORT.md");
  const githubWorkflowPath = path.join(repoRoot, ".github", "workflows", "fnlla-web-hardening.yml");
  const brandAssetsDir = path.join(repoRoot, "docs", "assets", "brand");
  const brandSvgPath = path.join(brandAssetsDir, "fnlla-web.svg");
  const brandDarkSvgPath = path.join(brandAssetsDir, "fnlla-web-dark.svg");
  const brandGithubSvgPath = path.join(brandAssetsDir, "fnlla-github.svg");
  const brandReadmePath = path.join(brandAssetsDir, "README.md");
  const brandGithubPngPath = path.join(brandAssetsDir, "fnlla-github.png");
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

  if (!pathExists(manifestJsonPath)) {
    errors.push("MANIFEST.json: missing file");
  } else {
    try {
      const repositoryManifest = JSON.parse(readText(manifestJsonPath));
      const product = repositoryManifest.product || {};
      const runtime = repositoryManifest.runtime || {};
      const release = repositoryManifest.release || {};

      if (repositoryManifest.schema_version !== 1) {
        errors.push(`MANIFEST.json: expected schema_version 1 but found '${repositoryManifest.schema_version}'`);
      }

      if (product.name !== expectedProject) {
        errors.push(`MANIFEST.json: expected product.name '${expectedProject}' but found '${product.name}'`);
      }

      if (product.version !== version) {
        errors.push(`MANIFEST.json: expected product.version '${version}' but found '${product.version}'`);
      }

      if (product.owner !== expectedOwner) {
        errors.push(`MANIFEST.json: expected product.owner '${expectedOwner}' but found '${product.owner}'`);
      }

      if (product.repository !== manifest.project.repository) {
        errors.push(`MANIFEST.json: expected product.repository '${manifest.project.repository}' but found '${product.repository}'`);
      }

      if (runtime.distribution_root !== manifest.runtime.distRoot) {
        errors.push(`MANIFEST.json: expected runtime.distribution_root '${manifest.runtime.distRoot}' but found '${runtime.distribution_root}'`);
      }

      if (runtime.css_entrypoint !== manifest.runtime.cssOutput) {
        errors.push(`MANIFEST.json: expected runtime.css_entrypoint '${manifest.runtime.cssOutput}' but found '${runtime.css_entrypoint}'`);
      }

      if (runtime.js_entrypoint !== manifest.runtime.jsOutput) {
        errors.push(`MANIFEST.json: expected runtime.js_entrypoint '${manifest.runtime.jsOutput}' but found '${runtime.js_entrypoint}'`);
      }

      if (release.channel !== "stable") {
        errors.push(`MANIFEST.json: expected release.channel 'stable' but found '${release.channel}'`);
      }
    } catch (error) {
      errors.push(`MANIFEST.json: invalid JSON (${error && error.message ? error.message : String(error)})`);
    }
  }

  const expectedRootDocNames = manifest.docs.rootPages.map((page) => path.basename(page.href));
  const expectedGuideDocNames = manifest.docs.guidePages.map((page) => path.basename(page.output));
  const discoveredRootDocNames = fs.readdirSync(docsDir)
    .filter((name) => name.endsWith(".html"))
    .sort();
  const rootDocFiles = manifest.docs.rootPages.map((page) => ({
    page,
    name: path.basename(page.href),
    fullPath: path.join(docsDir, path.basename(page.href))
  }));
  const guideFiles = manifest.docs.guidePages.map((page) => ({
    page,
    name: path.basename(page.output),
    fullPath: path.join(repoRoot, page.output)
  }));
  const docNames = rootDocFiles.map((file) => file.name);

  discoveredRootDocNames.forEach((name) => {
    if (!expectedRootDocNames.includes(name) && !expectedGuideDocNames.includes(name)) {
      errors.push(`docs/${name}: unexpected top-level docs page not declared in scripts/fnlla-web-manifest.mjs`);
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

    ["../assets/css/fnlla-web.css", "./assets/docs.css", "../assets/js/fnlla-web.js"].forEach((requiredAsset) => {
      if (!content.includes(requiredAsset)) {
        errors.push(`${file.name}: missing required asset reference '${requiredAsset}'`);
      }
    });

    if (!content.includes(`<title>${file.page.title}</title>`)) {
      errors.push(`${file.name}: document title must match manifest title '${file.page.title}'`);
    }

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

    if (!content.includes(`<title>${file.page.title}</title>`)) {
      errors.push(`${file.name}: document title must match manifest title '${file.page.title}'`);
    }

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
      "scripts/validate-fnlla-web.mjs",
      "scripts/publish-fnlla-web.mjs",
      "scripts/fnlla-web-manifest.mjs",
      "scripts/build-guides.mjs",
      "scripts/test-fnlla-web-browser.mjs",
      "scripts/test-fnlla-web-browser-matrix.mjs",
      "LICENSE.md",
      "CODE_OF_CONDUCT.md",
      "SECURITY.md",
      ".github/CONTRIBUTING.md",
      ".github/RELEASE_TEMPLATE.md",
      ".github/SUPPORT.md",
      "docs/assets/brand/fnlla-web.svg",
      "docs/assets/brand/fnlla-web-dark.svg",
      "docs/assets/brand/fnlla-github.svg",
      "docs/assets/brand/fnlla-github.png",
      "dist/fnlla-web/",
      "window.FNLLAWEB.init(root)",
      "window.FNLLAWEB.setTheme(theme, target)",
      "window.FNLLAWEB.setDocumentTitle(config)",
      "window.FNLLAWEB.getConsentState()",
      "window.FNLLAWEB.showToast(target)",
      "window.FNLLAWEB.showOffcanvas(target)",
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
    ["MIT License", "Permission is hereby granted", "THE SOFTWARE IS PROVIDED \"AS IS\""].forEach((requiredText) => {
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
      "FNLLA Web Code of Conduct",
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
      "Contributing to FNLLA Web",
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
      "FNLLA Web Release Notes Template",
      "Stable runtime contract: assets/css/fnlla-web.css, assets/js/fnlla-web.js and assets/icons/",
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
      "FNLLA Web Support",
      "SECURITY.md",
      "CODE_OF_CONDUCT.md",
      "https://techayo.co.uk"
    ].forEach((requiredText) => {
      if (!support.includes(requiredText)) {
        errors.push(`.github/SUPPORT.md: missing required text '${requiredText}'`);
      }
    });
  }

  const rootSupportPath = path.join(repoRoot, "SUPPORT.md");
  const rootTrademarksPath = path.join(repoRoot, "TRADEMARKS.md");

  if (!pathExists(rootSupportPath)) {
    errors.push("SUPPORT.md: missing file");
  } else {
    const supportPolicy = readText(rootSupportPath);
    [
      "Support Policy",
      "MIT License",
      "TechAyo LTD",
      "does not promise",
      "release cadence"
    ].forEach((requiredText) => {
      if (!supportPolicy.includes(requiredText)) {
        errors.push(`SUPPORT.md: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(rootTrademarksPath)) {
    errors.push("TRADEMARKS.md: missing file");
  } else {
    const trademarks = readText(rootTrademarksPath);
    [
      "Trademark Notice",
      "TechAyo LTD",
      "does not grant trademark rights",
      "official FNLLA Web project"
    ].forEach((requiredText) => {
      if (!trademarks.includes(requiredText)) {
        errors.push(`TRADEMARKS.md: missing required text '${requiredText}'`);
      }
    });
  }

  [
    brandSvgPath,
    brandDarkSvgPath,
    brandGithubSvgPath,
    brandReadmePath,
    brandGithubPngPath
  ].forEach((brandPath) => {
    if (!pathExists(brandPath)) {
      errors.push(`${path.relative(repoRoot, brandPath).replace(/\\/g, "/")}: missing file`);
    }
  });

  if (pathExists(brandReadmePath)) {
    const brandReadme = readText(brandReadmePath);
    [
      "FNLLA Web brand assets",
      "fnlla-web.svg",
      "fnlla-web-dark.svg",
      "fnlla-github.svg",
      "fnlla-github.png"
    ].forEach((requiredText) => {
      if (!brandReadme.includes(requiredText)) {
        errors.push(`docs/assets/brand/README.md: missing required text '${requiredText}'`);
      }
    });
  }

  [brandGithubPngPath].forEach((imagePath) => {
    if (pathExists(imagePath) && fs.statSync(imagePath).size < 1024) {
      errors.push(`${path.relative(repoRoot, imagePath).replace(/\\/g, "/")}: file is unexpectedly small`);
    }
  });

  if (!pathExists(githubWorkflowPath)) {
    errors.push(".github/workflows/fnlla-web-hardening.yml: missing file");
  } else {
    const githubWorkflow = readText(githubWorkflowPath);
    [
      "actions/checkout@v5",
      "actions/setup-node@v6",
      "package-manager-cache: false"
    ].forEach((requiredText) => {
      if (!githubWorkflow.includes(requiredText)) {
        errors.push(`.github/workflows/fnlla-web-hardening.yml: missing required text '${requiredText}'`);
      }
    });
  }

  if (!pathExists(contractDocPath)) {
    errors.push("docs/contract.html: missing file");
  } else {
    const contractDoc = readText(contractDocPath);
    [
      expectedOwner,
      "window.FNLLAWEB.init(root)",
      "window.FNLLAWEB.setTheme(theme, target)",
      "window.FNLLAWEB.setDocumentTitle(config)",
      "window.FNLLAWEB.getConsentState()",
      "window.FNLLAWEB.showOffcanvas(target)",
      "assets/icons/",
      "FNLLA Icons",
      "data-fnlla-consent",
      "data-fnlla-consent-category",
      "data-fnlla-toast-open",
      "data-fnlla-offcanvas-open",
      "data-fnlla-popover-toggle",
      "data-fnlla-tooltip",
      "data-fnlla-scrollspy-nav",
      "Accordion behavior without a real <code>aria-controls</code> target"
    ].forEach((requiredText) => {
      if (!contractDoc.includes(requiredText)) {
        errors.push(`docs/contract.html: missing required text '${requiredText}'`);
      }
    });

    if (version && !contractDoc.includes(`<code>${version}</code>`)) {
      errors.push(`docs/contract.html: version '${version}' is not reflected in the API document`);
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
    errors.push(".github/workflows/fnlla-web-hardening.yml: missing file");
  }

  if (pathExists(path.join(repoRoot, "css"))) {
    errors.push("css/: obsolete legacy runtime directory still exists");
  }

  if (pathExists(path.join(repoRoot, "js"))) {
    errors.push("js/: obsolete legacy runtime directory still exists");
  }

  if (!pathExists(cssEntrypointPath)) {
    errors.push("assets/css/fnlla-web.css: missing file");
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
        errors.push("assets/css/fnlla-web.css: public runtime is out of sync with src/css modules. Run scripts/publish-fnlla-web.mjs");
      }
    }
  }

  if (!pathExists(runtimeScriptPath)) {
    errors.push("assets/js/fnlla-web.js: missing file");
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
        errors.push("assets/js/fnlla-web.js: public runtime is out of sync with src/js modules. Run scripts/publish-fnlla-web.mjs");
      }
    }

    const syntaxCheck = spawnSync(process.execPath, ["--check", runtimeScriptPath], { encoding: "utf8" });
    if (syntaxCheck.status !== 0) {
      errors.push(`assets/js/fnlla-web.js: node --check failed: ${(syntaxCheck.stderr || syntaxCheck.stdout || "").trim()}`);
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
        errors.push("docs/assets/docs.js: docs script is out of sync with src/docs/js modules. Run scripts/publish-fnlla-web.mjs");
      }
    }

    const docsSyntaxCheck = spawnSync(process.execPath, ["--check", docsScriptPath], { encoding: "utf8" });
    if (docsSyntaxCheck.status !== 0) {
      errors.push(`docs/assets/docs.js: node --check failed: ${(docsSyntaxCheck.stderr || docsSyntaxCheck.stdout || "").trim()}`);
    }
  }

  if (!errors.length) {
    const exportTempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fnlla-web-export-"));

    try {
      const exportRootPath = path.join(exportTempRoot, "fnlla-web");
      writeRuntimeExport({ repoRoot, manifest, version, distRootPath: exportRootPath });
      validateRuntimeExport({
        exportRootPath,
        version,
        manifest,
        repositoryManifestPath: manifestJsonPath,
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
      errors.push("A Chromium-based browser is required to run the FNLLA Web browser smoke test");
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
    console.log("FNLLA Web validation failed.");
    result.errors.forEach((error) => {
      console.log(`- ${error}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log("FNLLA Web validation passed.");
  console.log(`Validated docs pages: ${result.docCount}`);
  console.log("Validated README, release metadata, guide publication, runtime export generation, MIT license/support/trademark files and runtime syntax.");
}

if (isDirectExecution(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}
