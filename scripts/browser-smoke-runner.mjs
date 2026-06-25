/*
  FNLLA UI browser smoke runner.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - serve the repository locally without an external dev server
  - drive a Chromium browser through the DevTools protocol
  - verify runtime behavior and docs shell integrity in a real browser
*/

import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";

function getRandomPort(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Return the content type needed by the local static server. */
function guessContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".md":
      return "text/plain; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

/* Serve repository files over localhost for the browser smoke fixture and docs pages. */
function startStaticServer(rootDir, port) {
  const server = http.createServer((request, response) => {
    const requestPath = request.url === "/" ? "/scripts/test-fixtures/browser-smoke.html" : (request.url || "");
    const pathname = decodeURIComponent(requestPath.split("?")[0]);
    const resolvedPath = path.resolve(rootDir, `.${pathname}`);
    const relativePath = path.relative(rootDir, resolvedPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    fs.stat(resolvedPath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      fs.readFile(resolvedPath, (readError, content) => {
        if (readError) {
          response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          response.end("Server error");
          return;
        }

        response.writeHead(200, {
          "Content-Type": guessContentType(resolvedPath),
          "Cache-Control": "no-store",
          "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          "Cross-Origin-Resource-Policy": "same-origin",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff"
        });
        response.end(content);
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

/* Fetch a small JSON payload from the local DevTools discovery endpoint. */
function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
  });
}

/* Poll the remote debugging endpoint until the target page becomes available. */
async function waitForDebuggerTarget(debugPort, expectedUrlPart, timeoutMs) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    try {
      const targets = await getJson(`http://127.0.0.1:${debugPort}/json/list`);
      const pageTarget = Array.isArray(targets)
        ? targets.find((target) => target.type === "page" && typeof target.url === "string" && expectedUrlPart && target.url.includes(expectedUrlPart))
          || targets.find((target) => target.type === "page" && target.url === "about:blank")
          || targets.find((target) => target.type === "page")
        : null;

      if (pageTarget?.webSocketDebuggerUrl) {
        return pageTarget.webSocketDebuggerUrl;
      }
    } catch (error) {
      // Keep polling while the browser starts up.
    }

    await delay(150);
  }

  throw new Error("Timed out while waiting for the browser DevTools target.");
}

/* Create a tiny CDP client using the browser's DevTools WebSocket endpoint. */
function createCdpClient(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map();
    let nextId = 0;

    socket.addEventListener("open", () => {
      resolve({
        close() {
          socket.close();
        },
        send(method, params = {}) {
          return new Promise((resolveMessage, rejectMessage) => {
            nextId += 1;
            pending.set(nextId, { resolve: resolveMessage, reject: rejectMessage });
            socket.send(JSON.stringify({
              id: nextId,
              method,
              params
            }));
          });
        }
      });
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (!message.id) {
        return;
      }

      const request = pending.get(message.id);
      if (!request) {
        return;
      }

      pending.delete(message.id);

      if (message.error) {
        request.reject(new Error(message.error.message || "CDP request failed"));
        return;
      }

      request.resolve(message.result || {});
    });

    socket.addEventListener("error", (error) => {
      reject(error);
    });

    socket.addEventListener("close", () => {
      pending.forEach((request) => {
        request.reject(new Error("CDP socket closed"));
      });
      pending.clear();
    });
  });
}

/* Wait until the in-browser smoke fixture reports pass or fail. */
async function waitForBrowserResult(client, timeoutMs) {
  const startedAt = Date.now();
  const expression = `(() => {
    const status = document.getElementById("test-status");
    return {
      ready: !!status && status.getAttribute("data-result") !== "pending",
      result: status ? status.getAttribute("data-result") : "",
      failures: Array.from(document.querySelectorAll("#failure-list li")).map((item) => item.textContent.trim())
    };
  })()`;

  while ((Date.now() - startedAt) < timeoutMs) {
    const evaluation = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true
    });

    const payload = evaluation?.result?.value;
    if (payload?.ready) {
      return payload;
    }

    await delay(200);
  }

  throw new Error("Timed out while waiting for the browser smoke fixture to finish.");
}

/* Wait until the current browser page reaches readyState=complete. */
async function waitForDocumentReady(client, timeoutMs) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    const evaluation = await client.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true
    });

    if (evaluation?.result?.value === "complete") {
      return;
    }

    await delay(120);
  }

  throw new Error("Timed out while waiting for the browser page to finish loading.");
}

/* Force-close the spawned browser process during test shutdown. */
async function terminateBrowserProcess(browserProcess) {
  if (!browserProcess) {
    return;
  }

  if (browserProcess.exitCode !== null || browserProcess.signalCode !== null) {
    return;
  }

  if (process.platform === "win32" && browserProcess.pid) {
    spawnSync("taskkill", ["/PID", String(browserProcess.pid), "/T", "/F"], {
      encoding: "utf8",
      stdio: "ignore"
    });
  } else if (!browserProcess.killed) {
    browserProcess.kill("SIGKILL");
  }

  await Promise.race([
    new Promise((resolve) => {
      browserProcess.once("exit", resolve);
    }),
    delay(2000)
  ]);
}

/* Shut down the local static server and its open sockets cleanly. */
async function stopStaticServer(server) {
  if (!server) {
    return;
  }

  if (typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }

  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }

  await Promise.race([
    new Promise((resolve) => {
      server.close(resolve);
    }),
    delay(2000)
  ]);
}

/* Inspect one top-level docs page for shell regressions after publish. */
async function inspectDocsPage(client, url, expectedTitle, expectedCurrentLabel, minimumNavLinks) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const masthead = document.querySelector(".doc-header");
      const nav = document.querySelector(".doc-nav");
      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      const mastheadStyles = masthead ? getComputedStyle(masthead) : null;
      const navStyles = nav ? getComputedStyle(nav) : null;

      return {
        title: document.title,
        hasMasthead: !!masthead,
        hasNav: !!nav,
        navLinkCount: nav ? nav.querySelectorAll("a").length : 0,
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        themeColor: themeMeta ? themeMeta.getAttribute("content") : "",
        mastheadBackground: mastheadStyles ? mastheadStyles.backgroundImage : "",
        navPosition: navStyles ? navStyles.position : "",
        bodyBackground: getComputedStyle(document.body).backgroundImage
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.title !== expectedTitle) {
    failures.push(`${url}: unexpected page title '${payload.title}'.`);
  }

  if (!payload.hasMasthead) {
    failures.push(`${url}: missing .doc-header shell.`);
  }

  if (!payload.hasNav) {
    failures.push(`${url}: missing .doc-nav shell.`);
  }

  if (payload.navLinkCount < minimumNavLinks) {
    failures.push(`${url}: docs navigation should expose the full page set.`);
  }

  if (payload.currentLabel !== expectedCurrentLabel) {
    failures.push(`${url}: current docs navigation label should be '${expectedCurrentLabel}'.`);
  }

  if (payload.themeColor !== "#1A4137") {
    failures.push(`${url}: expected theme-color '#1A4137'.`);
  }

  if (!payload.mastheadBackground) {
    failures.push(`${url}: docs masthead should have a rendered background.`);
  }

  if (payload.navPosition !== "sticky") {
    failures.push(`${url}: docs navigation should remain sticky.`);
  }

  if (!payload.bodyBackground) {
    failures.push(`${url}: docs body should expose the premium background treatment.`);
  }

  return failures;
}

/* Inspect one generated guide page for docs-shell and sidebar regressions. */
async function inspectGuidePage(client, url, expectedTitle, expectedGuideLabel, expectedRootCurrentLabel, minimumRootNavLinks, minimumGuideNavLinks) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const rootNav = document.querySelector(".doc-nav");
      const guideNav = document.querySelector(".doc-guide-nav");
      const currentRootLink = rootNav ? rootNav.querySelector("[aria-current='page']") : null;
      const currentGuide = guideNav ? guideNav.querySelector("[aria-current='page']") : null;
      const prose = document.querySelector(".doc-guide-prose");

      return {
        title: document.title,
        rootNavLinkCount: rootNav ? rootNav.querySelectorAll("a").length : 0,
        guideNavLinkCount: guideNav ? guideNav.querySelectorAll("a").length : 0,
        currentRootLabel: currentRootLink ? currentRootLink.textContent.trim() : "",
        currentGuideLabel: currentGuide ? currentGuide.textContent.trim() : "",
        hasProse: !!prose,
        proseHeadingCount: prose ? prose.querySelectorAll("h2, h3").length : 0
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.title !== expectedTitle) {
    failures.push(`${url}: unexpected guide page title '${payload.title}'.`);
  }

  if (payload.rootNavLinkCount < minimumRootNavLinks) {
    failures.push(`${url}: root docs navigation should expose the full page set.`);
  }

  if (payload.currentRootLabel !== expectedRootCurrentLabel) {
    failures.push(`${url}: current root docs navigation label should be '${expectedRootCurrentLabel}'.`);
  }

  if (payload.guideNavLinkCount < minimumGuideNavLinks) {
    failures.push(`${url}: guide navigation should expose all guide pages.`);
  }

  if (payload.currentGuideLabel !== expectedGuideLabel) {
    failures.push(`${url}: current guide label should be '${expectedGuideLabel}'.`);
  }

  if (!payload.hasProse) {
    failures.push(`${url}: missing guide prose container.`);
  }

  if (payload.proseHeadingCount < 2) {
    failures.push(`${url}: guide prose should expose multiple rendered headings.`);
  }

  return failures;
}

/* Run the full browser smoke flow against runtime fixtures and docs pages. */
export async function runBrowserSmokeTest({ repoRoot, browserPath }) {
  const manifest = getFnllaUiManifest();
  const serverPort = getRandomPort(31000, 36000);
  const debugPort = getRandomPort(39001, 43000);
  const userDataDir = path.join(os.tmpdir(), `fnlla-ui-browser-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const fixtureUrlPath = "/scripts/test-fixtures/browser-smoke.html";
  const fixtureUrl = `http://127.0.0.1:${serverPort}${fixtureUrlPath}`;
  const fixturePath = path.join(repoRoot, "scripts", "test-fixtures", "browser-smoke.html");
  const minimumRootNavLinks = manifest.docs.rootPages.length;
  const minimumGuideNavLinks = manifest.docs.guidePages.length;

  if (!browserPath) {
    throw new Error("Missing browser path for FNLLA UI browser smoke runner.");
  }

  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Missing browser smoke fixture: ${fixturePath}`);
  }

  if (typeof WebSocket !== "function") {
    throw new Error("This Node.js runtime does not expose a global WebSocket implementation.");
  }

  let server = null;
  let browserProcess = null;
  let client = null;

  try {
    server = await startStaticServer(repoRoot, serverPort);

    browserProcess = spawn(browserPath, [
      "--headless=new",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-sync",
      "--no-first-run",
      "--window-size=800,2200",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank"
    ], {
      stdio: "ignore"
    });

    const debuggerSocketUrl = await waitForDebuggerTarget(debugPort, fixtureUrlPath, 10000);
    client = await createCdpClient(debuggerSocketUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Page.navigate", { url: fixtureUrl });
    await waitForDocumentReady(client, 10000);

    const result = await waitForBrowserResult(client, 12000);
    const docsFailures = [];

    if (result.result === "pass") {
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/index.html`, "FNLLA UI Docs", "Overview", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/distribution.html`, "FNLLA UI Distribution", "Distribution", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/guides.html`, "FNLLA UI Guides", "Guides", minimumRootNavLinks));
      for (const guidePage of manifest.docs.guidePages) {
        docsFailures.push(...await inspectGuidePage(
          client,
          `http://127.0.0.1:${serverPort}/${guidePage.output}`,
          guidePage.title,
          guidePage.navLabel,
          "Guides",
          minimumRootNavLinks,
          minimumGuideNavLinks
        ));
      }
    }

    if (result.result === "pass" && docsFailures.length === 0) {
      console.log("FNLLA UI browser smoke test passed.");
      return true;
    }

    console.log("FNLLA UI browser smoke test failed.");
    (result.failures || []).forEach((failure) => {
      console.log(`- ${failure}`);
    });
    docsFailures.forEach((failure) => {
      console.log(`- ${failure}`);
    });
    return false;
  } finally {
    if (client) {
      try {
        client.close();
      } catch (error) {
        // Ignore close errors during shutdown.
      }
    }

    await terminateBrowserProcess(browserProcess);

    await stopStaticServer(server);

    if (fs.existsSync(userDataDir)) {
      try {
        await delay(200);
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (error) {
        // Browser profiles on Windows can release file handles a little late.
      }
    }
  }
}
