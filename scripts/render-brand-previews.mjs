/*
  FNLLA UI brand preview renderer.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - render GitHub-ready PNG previews from the committed FNLLA UI logo source
  - keep repository presentation assets reproducible instead of hand-exported
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

const PREVIEW_JOBS = [
  {
    source: path.join("docs", "assets", "brand", "fnlla-github-preview.html"),
    output: path.join("docs", "assets", "brand", "fnlla-github.png"),
    width: 512,
    height: 512
  }
];

/*
  Render committed HTML preview layouts through a local Chromium browser.

  The browser is the rendering engine here because the preview compositions are
  authored as normal HTML/CSS around the committed SVG logo source.
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

if (isDirectExecution(import.meta.url)) {
  renderBrandPreviews();
}
