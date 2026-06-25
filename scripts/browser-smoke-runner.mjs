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
import { getFnllaUiManifest } from "./fnlla-ui-manifest.mjs";
import { getBrowserFamily } from "./tooling-support.mjs";

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

async function getLatestGeckodriverRelease() {
  return new Promise((resolve, reject) => {
    https.get("https://api.github.com/repos/mozilla/geckodriver/releases/latest", {
      headers: {
        "User-Agent": "fnlla-ui-browser-smoke",
        Accept: "application/vnd.github+json"
      }
    }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          if (!response.statusCode || response.statusCode >= 400) {
            reject(new Error(`Could not resolve latest geckodriver release: HTTP ${response.statusCode || "unknown"}`));
            return;
          }
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
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

  const release = await getLatestGeckodriverRelease();
  const assetSuffix = getGeckodriverAssetName();
  const asset = Array.isArray(release.assets)
    ? release.assets.find((entry) => typeof entry.name === "string" && entry.name.endsWith(assetSuffix))
    : null;

  if (!asset?.browser_download_url) {
    throw new Error(`Could not find a geckodriver release asset for ${process.platform}/${process.arch}.`);
  }

  const cacheRoot = path.join(os.tmpdir(), "fnlla-ui-geckodriver", String(release.tag_name || "latest"));
  const archivePath = path.join(cacheRoot, asset.name);
  const extractedBinaryPath = path.join(cacheRoot, binaryName);

  fs.mkdirSync(cacheRoot, { recursive: true });

  if (!fs.existsSync(extractedBinaryPath)) {
    if (!fs.existsSync(archivePath)) {
      await downloadFile(asset.browser_download_url, archivePath, {
        Accept: "application/octet-stream"
      });
    }

    if (asset.name.endsWith(".zip")) {
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

/* Inspect the loading showcase in docs/components.html for motion and layout regressions. */
async function inspectLoadingDocsPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const showcase = document.querySelector(".loading-showcase");
      const spinner = showcase ? showcase.querySelector(".spinner") : null;
      const progressBar = showcase ? showcase.querySelector(".progress-indeterminate .progress-bar") : null;
      const skeletonLine = showcase ? showcase.querySelector(".skeleton-line") : null;
      const skeletonCard = showcase ? showcase.querySelector(".skeleton-card") : null;
      const spinnerStyles = spinner ? getComputedStyle(spinner) : null;
      const progressStyles = progressBar ? getComputedStyle(progressBar) : null;
      const skeletonLineAfter = skeletonLine ? getComputedStyle(skeletonLine, "::after") : null;
      const skeletonCardStyles = skeletonCard ? getComputedStyle(skeletonCard) : null;

      return {
        hasShowcase: !!showcase,
        spinnerAnimation: spinnerStyles ? spinnerStyles.animationName : "",
        progressAnimation: progressStyles ? progressStyles.animationName : "",
        skeletonAnimation: skeletonLineAfter ? skeletonLineAfter.animationName : "",
        skeletonCardDisplay: skeletonCardStyles ? skeletonCardStyles.display : "",
        docsCurrentLabel: (() => {
          const currentLink = document.querySelector(".doc-nav [aria-current='page']");
          return currentLink ? currentLink.textContent.trim() : "";
        })()
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

  if (!payload.hasShowcase) {
    failures.push(`${url}: missing .loading-showcase demo.`);
  }

  if (payload.docsCurrentLabel !== "Components") {
    failures.push(`${url}: current docs navigation label should be 'Components'.`);
  }

  if (!payload.spinnerAnimation.includes("fw-spin")) {
    failures.push(`${url}: loading showcase spinner lost its motion in docs.`);
  }

  if (!payload.progressAnimation.includes("fw-progress-indeterminate")) {
    failures.push(`${url}: loading showcase indeterminate progress lost its motion in docs.`);
  }

  if (!payload.skeletonAnimation.includes("fw-skeleton-wave")) {
    failures.push(`${url}: loading showcase skeleton shimmer lost its motion in docs.`);
  }

  if (payload.skeletonCardDisplay !== "grid") {
    failures.push(`${url}: loading showcase skeleton card lost its structured layout.`);
  }

  return failures;
}

/* Inspect docs/forms.html for layout spacing regressions in the reusable form patterns. */
async function inspectFormsLayoutPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      function getTrackCount(value) {
        return value && value !== "none" ? value.trim().split(/\\s+/).length : 0;
      }

      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const showcaseGrid = document.querySelector(".doc-forms-showcase-grid");
      const contactGrid = document.querySelector(".contact-grid");
      const contactFieldGrid = document.querySelector(".contact-field-grid");
      const showcaseStyles = showcaseGrid ? getComputedStyle(showcaseGrid) : null;
      const contactStyles = contactGrid ? getComputedStyle(contactGrid) : null;
      const contactFieldStyles = contactFieldGrid ? getComputedStyle(contactFieldGrid) : null;

      return {
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        showcaseDisplay: showcaseStyles ? showcaseStyles.display : "",
        showcaseGap: showcaseStyles ? showcaseStyles.gap : "",
        showcaseTracks: showcaseStyles ? getTrackCount(showcaseStyles.gridTemplateColumns) : 0,
        contactDisplay: contactStyles ? contactStyles.display : "",
        contactGap: contactStyles ? contactStyles.gap : "",
        contactTracks: contactStyles ? getTrackCount(contactStyles.gridTemplateColumns) : 0,
        contactFieldTracks: contactFieldStyles ? getTrackCount(contactFieldStyles.gridTemplateColumns) : 0
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

  if (payload.currentLabel !== "Forms") {
    failures.push(`${url}: current docs navigation label should be 'Forms'.`);
  }

  if (payload.showcaseDisplay !== "grid" || payload.showcaseGap === "0px") {
    failures.push(`${url}: forms showcase grid lost its expected spacing.`);
  }

  if (payload.showcaseTracks < 2) {
    failures.push(`${url}: forms showcase grid should keep its two-column layout at the smoke viewport.`);
  }

  if (payload.contactDisplay !== "grid" || payload.contactGap === "0px") {
    failures.push(`${url}: contact-section layout lost its expected grid spacing.`);
  }

  if (payload.contactTracks < 2) {
    failures.push(`${url}: contact-section layout should keep its split grid at the smoke viewport.`);
  }

  if (payload.contactFieldTracks < 2) {
    failures.push(`${url}: contact field grids should keep their paired field alignment at the smoke viewport.`);
  }

  return failures;
}

/* Inspect docs/sections.html for layout spacing regressions in the reusable section patterns. */
async function inspectSectionsLayoutPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      function getTrackCount(value) {
        return value && value !== "none" ? value.trim().split(/\\s+/).length : 0;
      }

      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const showcaseGrid = document.querySelector(".doc-sections-showcase-grid");
      const hero = document.querySelector(".hero.hero-split");
      const statsGrid = document.querySelector(".stats-grid");
      const pricingGrid = document.querySelector(".pricing-grid");
      const testimonialGrid = document.querySelector(".testimonial-card-grid");
      const showcaseStyles = showcaseGrid ? getComputedStyle(showcaseGrid) : null;
      const heroStyles = hero ? getComputedStyle(hero) : null;
      const statsStyles = statsGrid ? getComputedStyle(statsGrid) : null;
      const pricingStyles = pricingGrid ? getComputedStyle(pricingGrid) : null;
      const testimonialStyles = testimonialGrid ? getComputedStyle(testimonialGrid) : null;

      return {
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        showcaseDisplay: showcaseStyles ? showcaseStyles.display : "",
        showcaseGap: showcaseStyles ? showcaseStyles.gap : "",
        heroDisplay: heroStyles ? heroStyles.display : "",
        heroGap: heroStyles ? heroStyles.gap : "",
        statsTracks: statsStyles ? getTrackCount(statsStyles.gridTemplateColumns) : 0,
        pricingTracks: pricingStyles ? getTrackCount(pricingStyles.gridTemplateColumns) : 0,
        testimonialDisplay: testimonialStyles ? testimonialStyles.display : "",
        testimonialGap: testimonialStyles ? testimonialStyles.gap : ""
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

  if (payload.currentLabel !== "Sections") {
    failures.push(`${url}: current docs navigation label should be 'Sections'.`);
  }

  if (payload.showcaseDisplay !== "grid" || payload.showcaseGap === "0px") {
    failures.push(`${url}: sections showcase grid lost its expected spacing.`);
  }

  if (payload.heroDisplay !== "grid" || payload.heroGap === "0px") {
    failures.push(`${url}: hero section layout lost its expected split spacing.`);
  }

  if (payload.statsTracks < 2) {
    failures.push(`${url}: stats grid should keep multiple visible columns at the smoke viewport.`);
  }

  if (payload.pricingTracks < 2) {
    failures.push(`${url}: pricing grid should keep its multi-column layout at the smoke viewport.`);
  }

  if (payload.testimonialDisplay !== "grid" || payload.testimonialGap === "0px") {
    failures.push(`${url}: testimonial card grid lost its expected spacing.`);
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

async function runSmokeFixture(client, url, label) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  const result = await waitForBrowserResult(client, 12000);

  return {
    result: result.result,
    failures: Array.isArray(result.failures)
      ? result.failures.map((failure) => `${label}: ${failure}`)
      : []
  };
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
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/index.html`, "FNLLA UI Docs", "Overview", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/components.html`, "FNLLA UI Components", "Components", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/forms.html`, "FNLLA UI Forms", "Forms", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/sections.html`, "FNLLA UI Sections", "Sections", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/distribution.html`, "FNLLA UI Distribution", "Distribution", minimumRootNavLinks));
      docsFailures.push(...await inspectDocsPage(client, `http://127.0.0.1:${serverPort}/docs/guides.html`, "FNLLA UI Guides", "Guides", minimumRootNavLinks));
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
