/*
  FNLLA UI browser smoke runner.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.

  Purpose:
  - serve the repository locally without an external dev server
  - drive supported browsers through the DevTools protocol
  - verify runtime behavior and docs shell integrity in a real browser
*/

import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import {
  inspectDocsPage,
  inspectDocsThemeToggle,
  inspectFormsLayoutPage,
  inspectGuidePage,
  inspectLoadingDocsPage,
  inspectSectionsLayoutPage,
  runSmokeFixture
} from "./browser-smoke-docs-inspection.mjs";
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";
import { getBrowserFamily } from "./tooling-support.mjs";

const GECKODRIVER_VERSION = "0.36.0";

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

function getSmokeFixtureContent(rootDir, runtimeRootPath) {
  const templatePath = path.join(rootDir, "scripts", "test-fixtures", "browser-smoke.html");
  return fs.readFileSync(templatePath, "utf8")
    .replace('../../assets/css/fnlla-ui.css', `${runtimeRootPath}/css/fnlla-ui.css`)
    .replace('../../assets/js/fnlla-ui.js', `${runtimeRootPath}/js/fnlla-ui.js`);
}

/* Serve repository files over localhost for the browser smoke fixtures and docs pages. */
function startStaticServer(rootDir, port) {
  const virtualFixtureMap = new Map([
    ["/__smoke__/source-runtime.html", getSmokeFixtureContent(rootDir, "/assets")],
    ["/__smoke__/dist-runtime.html", getSmokeFixtureContent(rootDir, "/dist/fnlla-ui/assets")]
  ]);

  const server = http.createServer((request, response) => {
    const requestPath = request.url === "/" ? "/__smoke__/source-runtime.html" : (request.url || "");
    const pathname = decodeURIComponent(requestPath.split("?")[0]);

    if (virtualFixtureMap.has(pathname)) {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff"
      });
      response.end(virtualFixtureMap.get(pathname));
      return;
    }

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
  const debugBaseUrl = typeof debugPort === "number" ? `http://127.0.0.1:${debugPort}` : String(debugPort).replace(/\/+$/, "");

  while ((Date.now() - startedAt) < timeoutMs) {
    try {
      const targets = await getJson(`${debugBaseUrl}/json/list`);
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

function requestJson(method, url, payload = null) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    const body = payload ? JSON.stringify(payload) : null;
    const request = http.request({
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method,
      headers: body ? {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body)
      } : undefined
    }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(parsed?.value?.message || parsed?.message || `HTTP ${response.statusCode}`));
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function waitForWebDriverStatus(port, timeoutMs) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    try {
      const status = await requestJson("GET", `http://127.0.0.1:${port}/status`);
      if (status?.value?.ready) {
        return;
      }
    } catch (error) {
      // Keep polling while geckodriver starts up.
    }

    await delay(150);
  }

  throw new Error("Timed out while waiting for geckodriver to become ready.");
}

function downloadFile(url, targetPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const fetch = (currentUrl) => {
      const request = https.get(currentUrl, {
        headers: {
          "User-Agent": "fnlla-ui-browser-smoke",
          Accept: "application/vnd.github+json",
          ...headers
        }
      }, (response) => {
        if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          response.resume();
          fetch(response.headers.location);
          return;
        }

        if (!response.statusCode || response.statusCode >= 400) {
          reject(new Error(`Download failed with status ${response.statusCode || "unknown"}`));
          response.resume();
          return;
        }

        const file = fs.createWriteStream(targetPath);
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
        file.on("error", reject);
      });

      request.on("error", reject);
    };

    fetch(url);
  });
}

function getGeckodriverAssetName() {
  if (process.platform === "win32") {
    return process.arch === "arm64" ? "win-aarch64.zip" : (process.arch === "x64" ? "win64.zip" : "win32.zip");
  }

  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "macos-aarch64.tar.gz" : "macos.tar.gz";
  }

  return process.arch === "arm64" ? "linux-aarch64.tar.gz" : "linux64.tar.gz";
}

async function ensureGeckodriverBinary() {
  const binaryName = process.platform === "win32" ? "geckodriver.exe" : "geckodriver";
  const envPath = process.env.GECKODRIVER_PATH;

  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const commandName = process.platform === "win32" ? "where.exe" : "which";
  const existing = spawnSync(commandName, [binaryName], { encoding: "utf8" });
  if (existing.status === 0) {
    const resolved = (existing.stdout || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (resolved) {
      return resolved;
    }
  }

  const assetSuffix = getGeckodriverAssetName();
  const assetName = `geckodriver-v${GECKODRIVER_VERSION}-${assetSuffix}`;
  const downloadUrl = `https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/${assetName}`;
  const cacheRoot = path.join(os.tmpdir(), "fnlla-ui-geckodriver", GECKODRIVER_VERSION);
  const archivePath = path.join(cacheRoot, assetName);
  const extractedBinaryPath = path.join(cacheRoot, binaryName);

  fs.mkdirSync(cacheRoot, { recursive: true });

  if (!fs.existsSync(extractedBinaryPath)) {
    if (!fs.existsSync(archivePath)) {
      await downloadFile(downloadUrl, archivePath, {
        Accept: "application/octet-stream"
      });
    }

    if (assetName.endsWith(".zip")) {
      const extraction = spawnSync("powershell", [
        "-NoLogo",
        "-NoProfile",
        "-Command",
        "Expand-Archive",
        "-LiteralPath",
        archivePath,
        "-DestinationPath",
        cacheRoot,
        "-Force"
      ], {
        encoding: "utf8"
      });

      if (extraction.status !== 0) {
        throw new Error(`Could not extract geckodriver archive: ${(extraction.stderr || extraction.stdout || "").trim()}`);
      }
    } else {
      const extraction = spawnSync("tar", ["-xzf", archivePath, "-C", cacheRoot], {
        encoding: "utf8"
      });

      if (extraction.status !== 0) {
        throw new Error(`Could not extract geckodriver archive: ${(extraction.stderr || extraction.stdout || "").trim()}`);
      }
    }
  }

  if (!fs.existsSync(extractedBinaryPath)) {
    throw new Error("geckodriver was downloaded but the executable could not be found after extraction.");
  }

  return extractedBinaryPath;
}

async function startFirefoxDebugSession({ browserPath }) {
  const geckodriverPath = await ensureGeckodriverBinary();
  const geckodriverPort = getRandomPort(43001, 47000);
  const geckodriverProcess = spawn(geckodriverPath, ["--port", String(geckodriverPort)], {
    stdio: "ignore"
  });

  await waitForWebDriverStatus(geckodriverPort, 10000);

  const sessionResponse = await requestJson("POST", `http://127.0.0.1:${geckodriverPort}/session`, {
    capabilities: {
      alwaysMatch: {
        browserName: "firefox",
        "moz:firefoxOptions": {
          binary: browserPath,
          args: ["-headless"]
        }
      }
    }
  });

  const sessionId = sessionResponse?.value?.sessionId || sessionResponse?.sessionId;

  if (!sessionId) {
    throw new Error("Firefox session could not be created through geckodriver.");
  }

  await requestJson("POST", `http://127.0.0.1:${geckodriverPort}/session/${sessionId}/window/rect`, {
    width: 800,
    height: 2200
  });

  return {
    geckodriverPort,
    geckodriverProcess,
    sessionId
  };
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

/* Create a tiny WebDriver client for Firefox while preserving the runner's CDP-like interface. */
function createWebDriverClient({ geckodriverPort, sessionId }) {
  const sessionBaseUrl = `http://127.0.0.1:${geckodriverPort}/session/${sessionId}`;

  return {
    close() {
      return;
    },
    async send(method, params = {}) {
      if (method === "Page.enable" || method === "Runtime.enable") {
        return {};
      }

      if (method === "Page.navigate") {
        await requestJson("POST", `${sessionBaseUrl}/url`, {
          url: params.url
        });
        return {};
      }

      if (method === "Runtime.evaluate") {
        const evaluation = await requestJson("POST", `${sessionBaseUrl}/execute/sync`, {
          script: `return JSON.stringify(${params.expression});`,
          args: []
        });
        return {
          result: {
            value: JSON.parse(typeof evaluation?.value === "string" ? evaluation.value : "null")
          }
        };
      }

      throw new Error(`Unsupported Firefox WebDriver bridge method: ${method}`);
    }
  };
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

/* Run the full browser smoke flow against runtime fixtures and docs pages. */
export async function runBrowserSmokeTest({ repoRoot, browserPath, browserFamily = "" }) {
  const manifest = getFnllaUiManifest();
  const serverPort = getRandomPort(31000, 36000);
  const debugPort = getRandomPort(39001, 43000);
  const userDataDir = path.join(os.tmpdir(), `fnlla-ui-browser-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const sourceFixtureUrlPath = "/__smoke__/source-runtime.html";
  const distFixtureUrlPath = "/__smoke__/dist-runtime.html";
  const sourceFixtureUrl = `http://127.0.0.1:${serverPort}${sourceFixtureUrlPath}`;
  const distFixtureUrl = `http://127.0.0.1:${serverPort}${distFixtureUrlPath}`;
  const fixturePath = path.join(repoRoot, "scripts", "test-fixtures", "browser-smoke.html");
  const minimumRootNavLinks = manifest.docs.rootPages.length;
  const minimumGuideNavLinks = manifest.docs.guidePages.length;
  const resolvedBrowserFamily = browserFamily || getBrowserFamily(browserPath);

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
  let geckodriverProcess = null;
  let geckodriverSessionId = "";
  let geckodriverPort = 0;
  let client = null;

  try {
    server = await startStaticServer(repoRoot, serverPort);

    if (resolvedBrowserFamily === "firefox") {
      const firefoxSession = await startFirefoxDebugSession({
        browserPath
      });

      geckodriverProcess = firefoxSession.geckodriverProcess;
      geckodriverSessionId = firefoxSession.sessionId;
      geckodriverPort = firefoxSession.geckodriverPort;
    } else {
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

      const debuggerSocketUrl = await waitForDebuggerTarget(debugPort, sourceFixtureUrlPath, 10000);
      client = await createCdpClient(debuggerSocketUrl);
    }

    if (resolvedBrowserFamily === "firefox") {
      client = createWebDriverClient({
        geckodriverPort,
        sessionId: geckodriverSessionId
      });
    }

    await client.send("Page.enable");
    await client.send("Runtime.enable");
    const sourceResult = await runSmokeFixture(client, sourceFixtureUrl, "source runtime");
    const distResult = sourceResult.result === "pass"
      ? await runSmokeFixture(client, distFixtureUrl, "dist runtime")
      : { result: "fail", failures: [] };
    const docsFailures = [];

    if (sourceResult.result === "pass" && distResult.result === "pass") {
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/index.html`, "Overview - FNLLA UI Documentation", "Overview", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/components.html`, "Components - FNLLA UI Documentation", "Components", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/forms.html`, "Forms - FNLLA UI Documentation", "Forms", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/sections.html`, "Sections - FNLLA UI Documentation", "Sections", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/distribution.html`, "Distribution - FNLLA UI Documentation", "Distribution", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/guides.html`, "Guides - FNLLA UI Documentation", "Guides", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsThemeToggle(client, `http://127.0.0.1:${serverPort}/docs/index.html`));
      docsFailures.push(...await inspectLoadingDocsPage(client, `http://127.0.0.1:${serverPort}/docs/components.html`));
      docsFailures.push(...await inspectFormsLayoutPage(client, `http://127.0.0.1:${serverPort}/docs/forms.html`));
      docsFailures.push(...await inspectSectionsLayoutPage(client, `http://127.0.0.1:${serverPort}/docs/sections.html`));
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

    if (sourceResult.result === "pass" && distResult.result === "pass" && docsFailures.length === 0) {
      console.log("FNLLA UI browser smoke test passed.");
      return true;
    }

    console.log("FNLLA UI browser smoke test failed.");
    [...sourceResult.failures, ...distResult.failures].forEach((failure) => {
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

    if (geckodriverPort && geckodriverSessionId) {
      try {
        await requestJson("DELETE", `http://127.0.0.1:${geckodriverPort}/session/${geckodriverSessionId}`);
      } catch (error) {
        // Ignore Firefox session shutdown errors during cleanup.
      }
    }

    await terminateBrowserProcess(browserProcess);
    await terminateBrowserProcess(geckodriverProcess);

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
