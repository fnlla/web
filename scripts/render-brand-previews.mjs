/*
  FNLLA UI brand preview renderer.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - render GitHub-ready brand preview PNG files from committed local HTML sources
  - keep avatar and social preview assets reproducible instead of hand-exported
*/

import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  ensureDirectory,
  getPreferredChromiumBrowser,
  getRepoRoot,
  isDirectExecution,
  pathExists
} from "./tooling-support.mjs";

/*
  Each preview job renders a committed HTML composition into a committed bitmap.

  That lets GitHub-facing art stay reproducible: maintainers can review the HTML
  source, regenerate the PNG locally, and avoid one-off design exports that drift
  away from repository state.
*/
const PREVIEW_JOBS = [
  {
    source: path.join("docs", "assets", "brand", "fnlla-ui-social-preview.html"),
    output: path.join("docs", "assets", "brand", "fnlla-ui-social-preview.png"),
    width: 1280,
    height: 640
  },
  {
    source: path.join("docs", "assets", "brand", "fnlla-ui-avatar-preview.html"),
    output: path.join("docs", "assets", "brand", "fnlla-ui-avatar.png"),
    width: 512,
    height: 512
  }
];

/*
  Render the committed preview compositions through a local Chromium browser.

  We use the browser itself rather than a drawing library because the preview
  layouts are authored as normal HTML/CSS. That keeps typography, gradients and
  layout behavior consistent with what GitHub will effectively rasterize from the
  uploaded image, while still letting us keep everything inside the repo.
*/
export function renderBrandPreviews(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const browser = options.browserPath ? { path: options.browserPath } : getPreferredChromiumBrowser();

  if (!browser || !browser.path) {
    throw new Error("A Chromium-based browser is required to render FNLLA UI brand previews");
  }

  PREVIEW_JOBS.forEach((job) => {
    const sourcePath = path.join(repoRoot, job.source);
    const outputPath = path.join(repoRoot, job.output);

    if (!pathExists(sourcePath)) {
      throw new Error(`Missing FNLLA UI brand preview source: ${job.source}`);
    }

    ensureDirectory(path.dirname(outputPath));

    /*
      The browser flags bias toward deterministic screenshots:
      - headless/new keeps rendering modern and scriptable
      - hide-scrollbars avoids accidental chrome in exported art
      - force-color-profile=srgb reduces cross-device color surprises
      - virtual-time-budget gives gradients/fonts/layout a moment to settle
    */
    const result = spawnSync(
      browser.path,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-color-profile=srgb",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=1500",
        `--window-size=${job.width},${job.height}`,
        `--screenshot=${outputPath}`,
        pathToFileURL(sourcePath).href
      ],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    if (result.status !== 0) {
      const stderr = String(result.stderr || "").trim();
      throw new Error(`Could not render ${job.output}: ${stderr || `browser exit code ${result.status}`}`);
    }

    console.log(`Rendered FNLLA UI brand preview: ${job.output}`);
  });
}

/* Support direct local execution during manual GitHub-branding refresh work. */
if (isDirectExecution(import.meta.url)) {
  renderBrandPreviews();
}
