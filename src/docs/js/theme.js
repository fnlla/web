  function normalizeDocsTheme(theme) {
    return theme === "dark" ? "dark" : "default";
  }

  function readStoredDocsTheme() {
    try {
      return normalizeDocsTheme(window.localStorage.getItem(docsThemeStorageKey));
    } catch (error) {
      return "default";
    }
  }

  function storeDocsTheme(theme) {
    try {
      window.localStorage.setItem(docsThemeStorageKey, normalizeDocsTheme(theme));
    } catch (error) {
      return;
    }
  }

  function applyDocsTheme(theme) {
    var normalizedTheme = normalizeDocsTheme(theme);
    var themeToggle = document.querySelector("[data-doc-theme-toggle]");
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    if (window.FNLLAUI && typeof window.FNLLAUI.setTheme === "function") {
      window.FNLLAUI.setTheme(normalizedTheme);
    } else if (document.body) {
      document.body.setAttribute("data-fnlla-theme", normalizedTheme);
    }

    if (themeToggle) {
      themeToggle.checked = normalizedTheme === "dark";
    }

    if (themeMeta) {
      themeMeta.setAttribute("content", docsThemeColors[normalizedTheme]);
    }
  }

  function initDocsThemeToggle() {
    var themeToggle = document.querySelector("[data-doc-theme-toggle]");
    var initialTheme = readStoredDocsTheme();

    applyDocsTheme(initialTheme);

    if (!themeToggle) {
      return;
    }

    themeToggle.addEventListener("change", function () {
      var nextTheme = themeToggle.checked ? "dark" : "default";
      applyDocsTheme(nextTheme);
      storeDocsTheme(nextTheme);
    });
  }
