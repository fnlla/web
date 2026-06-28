/*
  FNLLA UI browser smoke test entrypoint.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Purpose:
  - expose a small CLI around the shared browser smoke runner
  - choose a preferred local smoke-test browser when one is not passed explicitly
  - keep the one-browser smoke flow easy to run during maintenance
*/

import { runBrowserSmokeTest } from "./browser-smoke-runner.mjs";
import { getBrowserFamily, getPreferredChromiumBrowser, getRepoRoot, isDirectExecution } from "./tooling-support.mjs";

function parseCliArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--browser" && next) {
      options.browserPath = next;
      index += 1;
      continue;
    }

    if (current === "--repo-root" && next) {
      options.repoRoot = next;
      index += 1;
      continue;
    }

    if (current === "--browser-family" && next) {
      options.browserFamily = next;
      index += 1;
    }
  }

  return options;
}

/* Resolve one browser target and run the shared smoke runner against the repo. */
export async function runCli(options = {}) {
  const repoRoot = options.repoRoot || getRepoRoot(import.meta.url);
  const browser = options.browserPath ? { path: options.browserPath } : getPreferredChromiumBrowser();
  const browserFamily = options.browserFamily || getBrowserFamily(browser?.path || "");

  if (!browser?.path) {
    throw new Error("A supported browser is required to run the FNLLA UI browser smoke test");
  }

  const passed = await runBrowserSmokeTest({
    repoRoot,
    browserPath: browser.path,
    browserFamily
  });

  if (!passed) {
    process.exitCode = 1;
  }
}

if (isDirectExecution(import.meta.url)) {
  const options = parseCliArguments(process.argv.slice(2));

  try {
    await runCli(options);
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode || 0);
  }
}
