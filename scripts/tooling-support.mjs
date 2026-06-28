/*
  Shared maintainer tooling helpers for FNLLA UI.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Purpose:
  - centralize path, text and filesystem helpers for publish and validation
  - keep line-ending normalization consistent across generated repository files
  - provide local browser discovery for smoke-test tooling
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export function getScriptDirectory(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}

/* Resolve the repository root relative to the current script. */
export function getRepoRoot(importMetaUrl) {
  return path.resolve(getScriptDirectory(importMetaUrl), "..");
}

/* Detect whether an ES module is being run directly from the command line. */
export function isDirectExecution(importMetaUrl) {
  if (!process.argv[1]) {
    return false;
  }

  return pathToFileURL(path.resolve(process.argv[1])).href === importMetaUrl;
}

export function normalizeLf(value) {
  return String(value)
    .replace(/\r+\n/g, "\n")
    .replace(/\r/g, "\n");
}

/* Write generated text with the repository's CRLF policy after LF normalization. */
export function toCrlf(value) {
  return normalizeLf(value).replace(/\n/g, "\r\n");
}

/* Create a directory tree before generated content or copied assets are written. */
export function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

/* Small shared existence check used across validation and browser discovery. */
export function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

/* Read a UTF-8 text file without altering repository-managed line endings. */
export function readText(targetPath) {
  return fs.readFileSync(targetPath, "utf8");
}

/* Write generated text files through one shared CRLF and directory policy. */
export function writeText(targetPath, content) {
  ensureDirectory(path.dirname(targetPath));
  fs.writeFileSync(targetPath, toCrlf(content), "utf8");
}

/* Remove generated directories before rebuilding them from scratch. */
export function removeDirectory(targetPath) {
  if (pathExists(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

/* Copy full runtime directories such as assets/ into generated exports. */
export function copyDirectory(sourcePath, targetPath) {
  ensureDirectory(path.dirname(targetPath));
  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

/* Escape small HTML fragments used by docs generators. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Create stable heading IDs for generated docs pages. */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

/* Compare text content while ignoring repository line-ending differences. */
export function compareNormalizedContent(left, right) {
  return normalizeLf(left).trimEnd() === normalizeLf(right).trimEnd();
}

function getEnvironmentBrowserCandidates() {
  const envMappings = [
    { name: "Configured browser", value: process.env.BROWSER_PATH },
    { name: "Configured browser", value: process.env.CHROME_BIN },
    { name: "Configured browser", value: process.env.CHROMIUM_BIN },
    { name: "Configured browser", value: process.env.FIREFOX_BIN }
  ];

  return envMappings
    .filter((entry) => typeof entry.value === "string" && entry.value.trim())
    .map((entry) => ({ name: entry.name, path: entry.value.trim() }));
}

/* Resolve one browser command from PATH on the current platform. */
function findBrowserOnPath(commandName) {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(locator, [commandName], { encoding: "utf8" });

  if (result.status !== 0) {
    return null;
  }

  const resolvedPath = (result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return resolvedPath || null;
}

function annotateBrowserFamily(candidate) {
  const fingerprint = `${candidate.name} ${candidate.path}`.toLowerCase();
  return {
    ...candidate,
    family: fingerprint.includes("firefox") ? "firefox" : "chromium"
  };
}

/* Collect supported browser executables discoverable from PATH. */
function getPathBrowserCandidates() {
  return [
    { name: "Microsoft Edge", command: "msedge" },
    { name: "Microsoft Edge", command: "microsoft-edge" },
    { name: "Google Chrome", command: "google-chrome" },
    { name: "Google Chrome", command: "google-chrome-stable" },
    { name: "Google Chrome", command: "chrome" },
    { name: "Chromium", command: "chromium" },
    { name: "Chromium", command: "chromium-browser" },
    { name: "Mozilla Firefox", command: "firefox" }
  ]
    .map((candidate) => {
      const resolvedPath = findBrowserOnPath(candidate.command);
      return resolvedPath ? { name: candidate.name, path: resolvedPath } : null;
    })
    .filter(Boolean);
}

/* Provide common default install locations for supported browsers. */
function getPlatformBrowserCandidates() {
  if (process.platform === "win32") {
    return [
      { name: "Microsoft Edge", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" },
      { name: "Microsoft Edge", path: "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" },
      { name: "Google Chrome", path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" },
      { name: "Google Chrome", path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" },
      { name: "Mozilla Firefox", path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe" },
      { name: "Mozilla Firefox", path: "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe" }
    ];
  }

  if (process.platform === "darwin") {
    return [
      { name: "Google Chrome", path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" },
      { name: "Google Chrome", path: path.join(os.homedir(), "Applications", "Google Chrome.app", "Contents", "MacOS", "Google Chrome") },
      { name: "Microsoft Edge", path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" },
      { name: "Chromium", path: "/Applications/Chromium.app/Contents/MacOS/Chromium" },
      { name: "Mozilla Firefox", path: "/Applications/Firefox.app/Contents/MacOS/firefox" }
    ];
  }

  return [
    { name: "Google Chrome", path: "/usr/bin/google-chrome" },
    { name: "Google Chrome", path: "/usr/bin/google-chrome-stable" },
    { name: "Chromium", path: "/usr/bin/chromium" },
    { name: "Chromium", path: "/usr/bin/chromium-browser" },
    { name: "Microsoft Edge", path: "/usr/bin/microsoft-edge" },
    { name: "Mozilla Firefox", path: "/usr/bin/firefox" }
  ];
}

/* Build the full ordered list of supported browser candidates used by smoke tests. */
export function getSmokeBrowserCandidates() {
  return [
    ...getEnvironmentBrowserCandidates(),
    ...getPathBrowserCandidates(),
    ...getPlatformBrowserCandidates()
  ].map(annotateBrowserFamily);
}

export function getBrowserFamily(browserPath = "") {
  return annotateBrowserFamily({ name: "", path: browserPath }).family;
}

/* Keep only real browser executables and remove duplicate paths. */
export function detectSmokeBrowsers() {
  const seen = new Set();
  return getSmokeBrowserCandidates().filter((candidate) => {
    if (!pathExists(candidate.path) || seen.has(candidate.path.toLowerCase())) {
      return false;
    }

    seen.add(candidate.path.toLowerCase());
    return true;
  });
}

/* Build the ordered list of Chromium candidates used by validation and one-browser smoke checks. */
export function getChromiumBrowserCandidates() {
  return getSmokeBrowserCandidates().filter((candidate) => candidate.family === "chromium");
}

/* Keep only real Chromium executables and remove duplicate paths. */
export function detectChromiumBrowsers() {
  return detectSmokeBrowsers().filter((candidate) => candidate.family === "chromium");
}

/* Keep only real Firefox executables and remove duplicate paths. */
export function detectFirefoxBrowsers() {
  return detectSmokeBrowsers().filter((candidate) => candidate.family === "firefox");
}

/* Return the first preferred Chromium browser for one-off smoke tests. */
export function getPreferredChromiumBrowser() {
  return detectChromiumBrowsers()[0] || null;
}

/* Return the first preferred supported browser for broader local sweep tooling. */
export function getPreferredSmokeBrowser() {
  return detectSmokeBrowsers()[0] || null;
}
