/*
  ============================================================================
  FNLLA UI SOURCE MODULE: DOCUMENT TITLE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function getTitleRootElement() {
    return document.documentElement || document.querySelector("html");
  }

  function normalizeTitlePart(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/\s+/g, " ").trim();
  }

  function readDocumentTitleConfig() {
    var root = getTitleRootElement();

    return {
      site: normalizeTitlePart(root ? root.getAttribute("data-fnlla-title-site") : ""),
      page: normalizeTitlePart(root ? root.getAttribute("data-fnlla-title-page") : ""),
      section: normalizeTitlePart(root ? root.getAttribute("data-fnlla-title-section") : ""),
      suffix: normalizeTitlePart(root ? root.getAttribute("data-fnlla-title-suffix") : ""),
      home: root ? root.getAttribute("data-fnlla-title-home") === "true" : false
    };
  }

  function writeDocumentTitleConfig(config) {
    var root = getTitleRootElement();

    if (!root || !config) {
      return;
    }

    [
      ["data-fnlla-title-site", config.site],
      ["data-fnlla-title-page", config.page],
      ["data-fnlla-title-section", config.section],
      ["data-fnlla-title-suffix", config.suffix]
    ].forEach(function (entry) {
      var attributeName = entry[0];
      var value = normalizeTitlePart(entry[1]);

      if (value) {
        root.setAttribute(attributeName, value);
      } else {
        root.removeAttribute(attributeName);
      }
    });

    if (config.home) {
      root.setAttribute("data-fnlla-title-home", "true");
    } else {
      root.removeAttribute("data-fnlla-title-home");
    }
  }

  function getMergedDocumentTitleConfig(nextConfig) {
    var current = readDocumentTitleConfig();

    if (typeof nextConfig === "string") {
      current.page = normalizeTitlePart(nextConfig);
      current.home = false;
      return current;
    }

    if (!nextConfig || typeof nextConfig !== "object") {
      return current;
    }

    if (Object.prototype.hasOwnProperty.call(nextConfig, "site")) {
      current.site = normalizeTitlePart(nextConfig.site);
    }

    if (Object.prototype.hasOwnProperty.call(nextConfig, "page")) {
      current.page = normalizeTitlePart(nextConfig.page);
    }

    if (Object.prototype.hasOwnProperty.call(nextConfig, "section")) {
      current.section = normalizeTitlePart(nextConfig.section);
    }

    if (Object.prototype.hasOwnProperty.call(nextConfig, "suffix")) {
      current.suffix = normalizeTitlePart(nextConfig.suffix);
    }

    if (Object.prototype.hasOwnProperty.call(nextConfig, "home")) {
      current.home = nextConfig.home === true;
    }

    return current;
  }

  function buildDocumentTitle(config) {
    var normalizedConfig = getMergedDocumentTitleConfig(config);
    var parts = [];

    if (normalizedConfig.home && normalizedConfig.site) {
      parts.push(normalizedConfig.site);
    } else {
      parts.push(normalizedConfig.page);
      parts.push(normalizedConfig.section);
      parts.push(normalizedConfig.site);
    }

    if (normalizedConfig.suffix) {
      parts.push(normalizedConfig.suffix);
    }

    return parts
      .filter(Boolean)
      .filter(function (part, index, array) {
        return array.findIndex(function (candidate) {
          return candidate.toLowerCase() === part.toLowerCase();
        }) === index;
      })
      .join(" | ");
  }

  function syncDocumentTitle(config) {
    var nextConfig = getMergedDocumentTitleConfig(config);
    var title = buildDocumentTitle(nextConfig);

    writeDocumentTitleConfig(nextConfig);

    if (title) {
      document.title = title;
    }

    return document.title;
  }

