/*
  FNLLA UI browser matrix smoke test.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - replay the same smoke flow across every detected supported Chromium browser
  - surface environment-specific regressions without changing the base test logic
*/

import path from "node:path";
import { spawnSync } from "node:child_process";
import { detectChromiumBrowsers, getRepoRoot, isDirectExecution } from "./tooling-support.mjs";

export function runBrowserMatrix(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const scriptPath = path.join(repoRoot, "scripts", "test-fnlla-ui-browser.mjs");
  const browsers = detectChromiumBrowsers();

  if (!browsers.length) {
    throw new Error("No supported Chromium-based browsers were found for the FNLLA UI browser matrix smoke test");
  }

  const failures = [];

  browsers.forEach((browser) => {
    console.log(`Running FNLLA UI smoke test in ${browser.name}: ${browser.path}`);
    const result = spawnSync(process.execPath, [scriptPath, "--browser", browser.path, "--repo-root", repoRoot], {
      encoding: "utf8",
      cwd: repoRoot
    });

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status !== 0) {
      failures.push(`${browser.name}: smoke test failed`);
    }
  });

  if (failures.length) {
    console.log("FNLLA UI browser matrix smoke test failed.");
    failures.forEach((failure) => {
      console.log(`- ${failure}`);
    });
    return false;
  }

  console.log(`FNLLA UI browser matrix smoke test passed across ${browsers.length} detected browser(s).`);
  return true;
}

if (isDirectExecution(import.meta.url)) {
  try {
    if (!runBrowserMatrix()) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}
