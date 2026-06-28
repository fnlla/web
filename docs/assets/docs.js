/*
  ============================================================================
  Documentation-only behavior for the FNLLA Web docs experience.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.

  Responsibilities:
  - highlight inline and block code without an external syntax library
  - smooth-scroll guide table-of-contents links
  - power the local FNLLA Icons catalogue search, staged rendering, categories and copy actions
  ============================================================================
*/

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docsThemeStorageKey = "fnlla-web-docs-theme";
  var docsThemeColors = {
    default: "#1A4137",
    dark: "#0B1220"
  };

  /*
    Keep the docs navigation predictable across breakpoints.

    On mobile the nav behaves like a collapsible panel so it does not steal too
    much vertical space from the article content. On larger screens the same nav
    must immediately return to an always-visible state, even if the user last
    interacted with it in mobile mode and left it open or closed.
  */
  function initDocsNav() {
    var nav = document.querySelector(".doc-nav");

    if (!nav) {
      return;
    }

    var toggle = nav.querySelector("[data-doc-nav-toggle]");
    var panel = nav.querySelector("[data-doc-nav-panel]");
    var mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 47.9375rem)") : null;

    if (!toggle || !panel || !mobileQuery) {
      return;
    }

    /*
      One helper updates the three pieces that must never drift apart:
      CSS open state, ARIA-expanded state and the hidden state of the panel.
    */
    function syncNavState(isOpen) {
      nav.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      panel.hidden = !isOpen;
    }

    /*
      Breakpoint changes are authoritative.

      If we enter mobile mode, start closed so the nav does not cover content.
      If we leave mobile mode, force the panel visible so desktop never inherits
      a collapsed state that only makes sense on smaller screens.
    */
    function syncNavMode() {
      if (mobileQuery.matches) {
        syncNavState(false);
        return;
      }

      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = false;
    }

    /* Only let the button act as a disclosure control in mobile mode. */
    toggle.addEventListener("click", function () {
      if (!mobileQuery.matches) {
        return;
      }

      syncNavState(panel.hidden);
    });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncNavMode);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(syncNavMode);
    }

    /* Reconcile the initial state immediately on first load. */
    syncNavMode();
  }

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

    if (window.FNLLAWEB && typeof window.FNLLAWEB.setTheme === "function") {
      window.FNLLAWEB.setTheme(normalizedTheme);
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

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function wrapToken(className, text) {
    return '<span class="' + className + '">' + escapeHtml(text) + "</span>";
  }

  function highlightTextSegment(text, className) {
    if (!text) {
      return "";
    }

    if (!text.trim()) {
      return escapeHtml(text);
    }

    var leadingWhitespaceMatch = text.match(/^\s*/);
    var trailingWhitespaceMatch = text.match(/\s*$/);
    var leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : "";
    var trailingWhitespace = trailingWhitespaceMatch ? trailingWhitespaceMatch[0] : "";
    var core = text.slice(leadingWhitespace.length, text.length - trailingWhitespace.length);
    return escapeHtml(leadingWhitespace)
      + (core ? wrapToken(className || "doc-code-content", core) : "")
      + escapeHtml(trailingWhitespace);
  }

  function renderHtmlAttributes(attributesText) {
    var pattern = /([^\s=/>]+)(\s*=\s*)?(".*?"|'.*?'|[^\s>]+)?/g;
    var result = "";
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(attributesText))) {
      result += escapeHtml(attributesText.slice(lastIndex, match.index));
      result += wrapToken("doc-code-attr", match[1]);

      if (match[2]) {
        var separator = match[2];
        var equalsIndex = separator.indexOf("=");
        result += escapeHtml(separator.slice(0, equalsIndex));
        result += wrapToken("doc-code-punctuation", "=");
        result += escapeHtml(separator.slice(equalsIndex + 1));
      }

      if (match[3]) {
        result += wrapToken("doc-code-string", match[3]);
      }

      lastIndex = pattern.lastIndex;
    }

    result += escapeHtml(attributesText.slice(lastIndex));
    return result;
  }

  function renderHtmlTag(tagText) {
    if (/^<!DOCTYPE/i.test(tagText)) {
      return wrapToken("doc-code-doctype", tagText);
    }

    if (/^<!--/.test(tagText)) {
      return wrapToken("doc-code-comment", tagText);
    }

    var closingTagMatch = tagText.match(/^<\/\s*([^\s>]+)\s*>$/);

    if (closingTagMatch) {
      return wrapToken("doc-code-punctuation", "</")
        + wrapToken("doc-code-tag", closingTagMatch[1])
        + wrapToken("doc-code-punctuation", ">");
    }

    var openingTagMatch = tagText.match(/^<\s*([^\s/>]+)([\s\S]*?)(\/?)>$/);

    if (!openingTagMatch) {
      return wrapToken("doc-code-content", tagText);
    }

    return wrapToken("doc-code-punctuation", "<")
      + wrapToken("doc-code-tag", openingTagMatch[1])
      + renderHtmlAttributes(openingTagMatch[2] || "")
      + (openingTagMatch[3] ? wrapToken("doc-code-punctuation", "/") : "")
      + wrapToken("doc-code-punctuation", ">");
  }

  function renderHtmlCode(text) {
    var tagPattern = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[^>\n]+>/g;
    var result = "";
    var lastIndex = 0;
    var match;

    while ((match = tagPattern.exec(text))) {
      result += highlightTextSegment(text.slice(lastIndex, match.index), "doc-code-content");
      result += renderHtmlTag(match[0]);
      lastIndex = tagPattern.lastIndex;
    }

    result += highlightTextSegment(text.slice(lastIndex), "doc-code-content");
    return result;
  }

  function renderCssValue(valueText) {
    var cssValueTokenPattern = /\/\*[\s\S]*?\*\/|var(?=\()|#[0-9a-fA-F]{3,8}\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|--[\w-]+|\b-?\d+(?:\.\d+)?(?:%|[a-z]+)?\b|[A-Za-z_-][\w-]*(?=\()|\b(?:auto|inherit|initial|unset|none|solid|dashed|relative|absolute|fixed|sticky|block|inline|inline-block|flex|grid|center|between|start|end|repeat|minmax|max-content|min-content|cover|contain|transparent|currentColor)\b|[(),/:]/g;
    var result = "";
    var lastIndex = 0;
    var match;

    if (!valueText) {
      return "";
    }

    while ((match = cssValueTokenPattern.exec(valueText))) {
      var token = match[0];
      var className = "doc-code-content";

      result += escapeHtml(valueText.slice(lastIndex, match.index));

      if (/^(?:\/\*)/.test(token)) {
        className = "doc-code-comment";
      } else if (/^var$/.test(token)) {
        className = "doc-code-function";
      } else if (/^#/.test(token) || /^['"]/.test(token)) {
        className = "doc-code-string";
      } else if (/^--/.test(token)) {
        className = "doc-code-variable";
      } else if (/^-?\d/.test(token)) {
        className = "doc-code-number";
      } else if (/^[A-Za-z_-][\w-]*(?=\()/.test(token)) {
        className = "doc-code-function";
      } else if (/^(?:auto|inherit|initial|unset|none|solid|dashed|relative|absolute|fixed|sticky|block|inline|inline-block|flex|grid|center|between|start|end|repeat|minmax|max-content|min-content|cover|contain|transparent|currentColor)$/.test(token)) {
        className = "doc-code-keyword";
      } else {
        className = "doc-code-operator";
      }

      result += wrapToken(className, token);
      lastIndex = cssValueTokenPattern.lastIndex;
    }

    result += escapeHtml(valueText.slice(lastIndex));
    return result;
  }

  function renderCssCode(text) {
    return text.split("\n").map(function (line) {
      if (!line.trim()) {
        return "";
      }

      if (/^\s*\/\*/.test(line)) {
        return highlightTextSegment(line, "doc-code-comment");
      }

      var closingBraceMatch = line.match(/^(\s*)(})(\s*;?\s*)$/);

      if (closingBraceMatch) {
        return escapeHtml(closingBraceMatch[1])
          + wrapToken("doc-code-punctuation", closingBraceMatch[2])
          + escapeHtml(closingBraceMatch[3]);
      }

      var propertyMatch = line.match(/^(\s*)(--[\w-]+|[\w-]+)(\s*:\s*)(.*?)(;?\s*)$/);

      if (propertyMatch) {
        var separator = propertyMatch[3];
        var colonIndex = separator.indexOf(":");
        var propertyClassName = /^--/.test(propertyMatch[2]) ? "doc-code-variable" : "doc-code-property";
        return escapeHtml(propertyMatch[1])
          + wrapToken(propertyClassName, propertyMatch[2])
          + escapeHtml(separator.slice(0, colonIndex))
          + wrapToken("doc-code-punctuation", ":")
          + escapeHtml(separator.slice(colonIndex + 1))
          + renderCssValue(propertyMatch[4])
          + (propertyMatch[5].indexOf(";") !== -1 ? wrapToken("doc-code-punctuation", ";") : "")
          + escapeHtml(propertyMatch[5].replace(";", ""));
      }

      var openingBraceMatch = line.match(/^(\s*)(.+?)(\s*)(\{)(\s*)$/);

      if (openingBraceMatch) {
        return escapeHtml(openingBraceMatch[1])
          + wrapToken("doc-code-selector", openingBraceMatch[2])
          + escapeHtml(openingBraceMatch[3])
          + wrapToken("doc-code-punctuation", openingBraceMatch[4])
          + escapeHtml(openingBraceMatch[5]);
      }

      return highlightTextSegment(line, "doc-code-content");
    }).join("\n");
  }

  function renderCommandCode(text) {
    return text.split("\n").map(function (line) {
      var commandTokenPattern;

      if (!line.trim()) {
        return "";
      }

      var indentMatch = line.match(/^\s*/);
      var indent = indentMatch ? indentMatch[0] : "";
      var core = line.trim();

      if (/^#/.test(core)) {
        return escapeHtml(indent) + wrapToken("doc-code-comment", core);
      }

      commandTokenPattern = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|--?[\w.-]+|(?:\.\.?[\\/]|\/)?[\w./\\:-]+|[|&><]/g;

      var result = escapeHtml(indent);
      var lastIndex = 0;
      var match;
      var tokenIndex = 0;

      while ((match = commandTokenPattern.exec(core))) {
        var token = match[0];
        var className = "doc-code-content";

        result += escapeHtml(core.slice(lastIndex, match.index));

        if (tokenIndex === 0) {
          className = "doc-code-command";
        } else if (/^['"]/.test(token)) {
          className = "doc-code-string";
        } else if (/^--?[\w.-]+$/.test(token)) {
          className = "doc-code-property";
        } else if (isPathLikeCodeText(token)) {
          className = "doc-code-path";
        } else {
          className = "doc-code-operator";
        }

        result += wrapToken(className, token);
        lastIndex = commandTokenPattern.lastIndex;
        tokenIndex++;
      }

      result += escapeHtml(core.slice(lastIndex));
      return result;
    }).join("\n");
  }

  function renderTreeCode(text) {
    return text.split("\n").map(function (line) {
      if (!line.trim()) {
        return "";
      }

      var indentMatch = line.match(/^\s*/);
      var indent = indentMatch ? indentMatch[0] : "";
      var core = line.trim();
      var className = /\/$/.test(core) ? "doc-code-path" : "doc-code-content";
      return escapeHtml(indent) + wrapToken(className, core);
    }).join("\n");
  }

  function isKnownDotfile(text) {
    return /^\.(?:env(?:\.example)?|git|github|gitignore|gitattributes|editorconfig|htaccess|npmrc|nvmrc|prettierignore|prettierrc|eslintignore|eslintrc(?:\.[\w-]+)?)$/i.test(text);
  }

  function isPathLikeCodeText(text) {
    return /^(?:\.\.?[\\/]|\/|[A-Za-z]:[\\/])[\w .\-\\/]+$/.test(text)
      || /^(?:[\w.-]+[\\/])+[\w.-]+\/?$/.test(text)
      || /^[\w.-]+\.(?:css|js|mjs|html|md|svg|php|json|txt|yml|yaml|xml|sql|ps1|sh|cmd|env|lock)$/i.test(text)
      || isKnownDotfile(text);
  }

  function renderPhpSegment(text) {
    var phpKeywordPattern = /^(?:__halt_compiler|abstract|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|exit|extends|false|final|finally|fn|for|foreach|from|function|global|if|implements|include|include_once|instanceof|interface|isset|list|match|namespace|new|null|parent|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|true|try|use|var|while|yield)\b/;
    var phpTokenPattern = /<\?(?:php|=)?|\?>|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\$[A-Za-z_\x80-\xff][\w\x80-\xff]*|\b\d+(?:\.\d+)?\b|[A-Za-z_\x80-\xff][\w\x80-\xff]*(?=\s*\()|\?->|->|::|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|[()[\]{}.,;:+\-*\/%=&|!<>?:]/g;
    var result = "";
    var lastIndex = 0;
    var match;

    while ((match = phpTokenPattern.exec(text))) {
      var token = match[0];
      var className = "doc-code-content";

      result += escapeHtml(text.slice(lastIndex, match.index));

      if (/^<\?/.test(token) || token === "?>") {
        className = "doc-code-operator";
      } else if (/^(?:\/\*|\/\/|#)/.test(token)) {
        className = "doc-code-comment";
      } else if (/^['"]/.test(token)) {
        className = "doc-code-string";
      } else if (/^\d/.test(token)) {
        className = "doc-code-number";
      } else if (/^\$/.test(token)) {
        className = "doc-code-variable";
      } else if (phpKeywordPattern.test(token)) {
        className = "doc-code-keyword";
      } else if (/^[A-Za-z_\x80-\xff]/.test(token)) {
        className = "doc-code-function";
      } else {
        className = "doc-code-operator";
      }

      result += wrapToken(className, token);
      lastIndex = phpTokenPattern.lastIndex;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function renderPhpCode(text) {
    var phpBlockPattern = /<\?(?:php|=)?[\s\S]*?(?:\?>|$)/g;
    var hasPhpTags = /<\?/.test(text);
    var result = "";
    var lastIndex = 0;
    var match;

    if (!hasPhpTags) {
      return renderPhpSegment(text);
    }

    while ((match = phpBlockPattern.exec(text))) {
      result += renderHtmlCode(text.slice(lastIndex, match.index));
      result += renderPhpSegment(match[0]);
      lastIndex = phpBlockPattern.lastIndex;
    }

    result += renderHtmlCode(text.slice(lastIndex));
    return result;
  }

  function renderJavascriptCode(text) {
    var javascriptKeywordPattern = /^(?:await|async|break|case|catch|class|const|continue|default|delete|do|else|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|super|switch|this|throw|true|try|typeof|undefined|var|void|while|yield)\b/;
    var javascriptTokenPattern = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\s*\()|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\.\.\.|[()[\]{}.,;:+\-*\/%=&|!<>?:]/g;
    var result = "";
    var lastIndex = 0;
    var match;

    while ((match = javascriptTokenPattern.exec(text))) {
      var token = match[0];
      var className = "doc-code-content";

      result += escapeHtml(text.slice(lastIndex, match.index));

      if (/^(?:\/\*|\/\/)/.test(token)) {
        className = "doc-code-comment";
      } else if (/^['"`]/.test(token)) {
        className = "doc-code-string";
      } else if (/^\d/.test(token)) {
        className = "doc-code-number";
      } else if (javascriptKeywordPattern.test(token)) {
        className = "doc-code-keyword";
      } else if (/^[A-Za-z_$]/.test(token)) {
        className = "doc-code-function";
      } else {
        className = "doc-code-operator";
      }

      result += wrapToken(className, token);
      lastIndex = javascriptTokenPattern.lastIndex;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function renderJsonCode(text) {
    var jsonTokenPattern = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b(?:true|false|null)\b|[{}\[\]:,]/g;
    var result = "";
    var lastIndex = 0;
    var match;

    while ((match = jsonTokenPattern.exec(text))) {
      var token = match[0];
      var className = "doc-code-content";

      result += escapeHtml(text.slice(lastIndex, match.index));

      if (/^"/.test(token) && /^\s*:/.test(text.slice(jsonTokenPattern.lastIndex))) {
        className = "doc-code-attr";
      } else if (/^"/.test(token)) {
        className = "doc-code-string";
      } else if (/^-?\d/.test(token)) {
        className = "doc-code-number";
      } else if (/^(?:true|false|null)$/.test(token)) {
        className = "doc-code-keyword";
      } else {
        className = "doc-code-operator";
      }

      result += wrapToken(className, token);
      lastIndex = jsonTokenPattern.lastIndex;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function renderPlainCode(text) {
    return text.split("\n").map(function (line) {
      if (!line) {
        return "";
      }

      var indentMatch = line.match(/^\s*/);
      var indent = indentMatch ? indentMatch[0] : "";
      var core = line.trim();

      if (core && isPathLikeCodeText(core)) {
        return escapeHtml(indent) + wrapToken("doc-code-path", core);
      }

      return highlightTextSegment(line, "doc-code-content");
    }).join("\n");
  }

  function detectPreCodeKind(codeElement, sourceText) {
    var className = codeElement.className || "";

    if (/\blanguage-html\b/i.test(className)) {
      return "html";
    }

    if (/\blanguage-css\b/i.test(className)) {
      return "css";
    }

    if (/\blanguage-php\b/i.test(className)) {
      return "php";
    }

    if (/\blanguage-(?:js|javascript)\b/i.test(className)) {
      return "javascript";
    }

    if (/\blanguage-json\b/i.test(className)) {
      return "json";
    }

    if (/\blanguage-text\b/i.test(className)) {
      if (/\n/.test(sourceText) && /(^|\n)\s*[\w.-]+\/\s*$/m.test(sourceText)) {
        return "tree";
      }

      return "plain";
    }

    if (/\blanguage-(?:bash|sh|shell|powershell|ps1|cmd)\b/i.test(className)) {
      return "command";
    }

    if (/(^|\n)\s*<\/?[a-z][^>\n]*>/i.test(sourceText) || /<!DOCTYPE/i.test(sourceText)) {
      return "html";
    }

    if ((/(^|\n)\s*[@[.#:\w-][^{\n]*\{\s*$/m.test(sourceText) || /(^|\n)\s*--[\w-]+\s*:/m.test(sourceText)) && /\}/.test(sourceText)) {
      return "css";
    }

    if (/(?:<\?(?:php|=)?|\$\w+|->|::|\b(?:public|protected|private|static|final|abstract)\s+function\b|\bnamespace\s+[\w\\]+;|\buse\s+[\w\\]+;)/.test(sourceText)) {
      return "php";
    }

    if (/^\s*[\[{]/.test(sourceText) && /"\s*:/.test(sourceText)) {
      return "json";
    }

    if (/(^|\n)\s*(?:const|let|var|function|export|import)\b/.test(sourceText) || /\bwindow\.[A-Za-z_$][\w$]*\b/.test(sourceText)) {
      return "javascript";
    }

    if (/(^|\n)\s*(node|npm|npx|pnpm|yarn|php|curl|git|rg|Test-Path)\b/m.test(sourceText)) {
      return "command";
    }

    if (/\n/.test(sourceText) && /(^|\n)\s*[\w.-]+\/\s*$/m.test(sourceText)) {
      return "tree";
    }

    return "plain";
  }

  function renderInlineCode(sourceText) {
    if (/^--[\w-]+$/.test(sourceText)) {
      return wrapToken("doc-code-variable", sourceText);
    }

    if (isPathLikeCodeText(sourceText)) {
      return wrapToken("doc-code-path", sourceText);
    }

    if (/^(?:\.[\w-]+|\[[^\]]+\]|#[\w-]+)$/.test(sourceText)) {
      return wrapToken("doc-code-selector", sourceText);
    }

    if (/^[\w$.-]+\([^)]*\)$/.test(sourceText)) {
      return wrapToken("doc-code-function", sourceText);
    }

    return escapeHtml(sourceText);
  }

  function clearPreCodeKindClasses(preElement) {
    preElement.classList.remove("is-html", "is-css", "is-php", "is-javascript", "is-json", "is-command", "is-tree", "is-plain");
  }

  function highlightCodeElement(codeElement) {
    if (!codeElement) {
      return;
    }

    var sourceText = codeElement.textContent.replace(/\r\n/g, "\n");
    var sourceKey = sourceText;
    var inPre = codeElement.parentElement && codeElement.parentElement.tagName === "PRE";

    if (!sourceText.trim()) {
      codeElement.dataset.docHighlightSource = sourceKey;
      codeElement.dataset.docHighlightKind = inPre ? "plain" : "inline";
      return;
    }

    if (codeElement.dataset.docHighlightSource === sourceKey) {
      return;
    }

    if (inPre) {
      var preElement = codeElement.parentElement;
      var detectedKind = detectPreCodeKind(codeElement, sourceText);
      var renderedHtml = "";

      if (detectedKind === "html") {
        renderedHtml = renderHtmlCode(sourceText);
      } else if (detectedKind === "css") {
        renderedHtml = renderCssCode(sourceText);
      } else if (detectedKind === "php") {
        renderedHtml = renderPhpCode(sourceText);
      } else if (detectedKind === "javascript") {
        renderedHtml = renderJavascriptCode(sourceText);
      } else if (detectedKind === "json") {
        renderedHtml = renderJsonCode(sourceText);
      } else if (detectedKind === "command") {
        renderedHtml = renderCommandCode(sourceText);
      } else if (detectedKind === "tree") {
        renderedHtml = renderTreeCode(sourceText);
      } else {
        renderedHtml = renderPlainCode(sourceText);
      }

      clearPreCodeKindClasses(preElement);
      preElement.classList.add("doc-code-block", "is-" + detectedKind);
      codeElement.innerHTML = renderedHtml;
      codeElement.dataset.docHighlightKind = detectedKind;
      codeElement.dataset.docHighlightSource = sourceKey;
      return;
    }

    codeElement.innerHTML = renderInlineCode(sourceText);
    codeElement.dataset.docHighlightKind = "inline";
    codeElement.dataset.docHighlightSource = sourceKey;
  }

  function highlightCodeWithin(root) {
    if (!root || root.nodeType !== 1) {
      return;
    }

    if (root.matches && root.matches("code")) {
      highlightCodeElement(root);
    }

    if (!root.querySelectorAll) {
      return;
    }

    Array.prototype.forEach.call(root.querySelectorAll("code"), function (codeElement) {
      highlightCodeElement(codeElement);
    });
  }

  function bindGuideTocLinks() {
    var guideTocLinks = document.querySelectorAll(".doc-guide-toc-link[href^='#']");

    Array.prototype.forEach.call(guideTocLinks, function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");

        if (!href || href === "#") {
          return;
        }

        var target = document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });

        if (window.history && typeof window.history.pushState === "function") {
          window.history.pushState(null, "", href);
        } else {
          window.location.hash = href;
        }
      });
    });
  }

  /* Normalize optional array-like inputs so data loading can fail soft. */
  function getArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /* Shared DOM text helper used by both render and status code paths. */
  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  /* Keep arrays unique without depending on Set ordering semantics. */
  function uniquePush(list, value) {
    if (value && list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  /* Central string comparator so every icon list sorts the same way. */
  function sortStrings(left, right) {
    return String(left).localeCompare(String(right));
  }

  /*
    Normalize category metadata into one stable shape.

    The docs bundle accepts both compact tuple syntax and object syntax because
    maintainers may regenerate icon metadata in different formats over time.
    Everything is converted here so the rest of the catalogue code can operate on
    one predictable category API.
  */
  function normalizeIconCategoryDefinitions(categoryDefinitions) {
    var categoryTitleMap = {};
    var categoryOrderMap = {};
    var categoryOptions = [{ name: "all", title: "All icons" }];

    getArray(categoryDefinitions).forEach(function (rawCategoryDefinition, index) {
      var categoryName = "";
      var categoryTitle = "";

      if (Array.isArray(rawCategoryDefinition)) {
        categoryName = String(rawCategoryDefinition[0] || "").trim();
        categoryTitle = rawCategoryDefinition[1] ? String(rawCategoryDefinition[1]) : categoryName;
      } else if (rawCategoryDefinition && rawCategoryDefinition.name) {
        categoryName = String(rawCategoryDefinition.name).trim();
        categoryTitle = rawCategoryDefinition.title ? String(rawCategoryDefinition.title) : categoryName;
      }

      if (!categoryName) {
        return;
      }

      categoryTitleMap[categoryName] = categoryTitle;
      categoryOrderMap[categoryName] = index;
      categoryOptions.push({
        name: categoryName,
        title: categoryTitle
      });
    });

    return {
      categoryOptions: categoryOptions,
      categoryOrderMap: categoryOrderMap,
      categoryTitleMap: categoryTitleMap
    };
  }

  /*
    Resolve category references used by compact icon records.

    Compact data may reference categories by number to shrink generated payloads.
    This helper maps those numeric references back to the canonical category name
    and also supports plain string names for readability and backwards-compat.
  */
  function resolveIconCategoryName(rawCategory, categoryDefinitions) {
    var indexedCategoryDefinition;

    if (typeof rawCategory === "number") {
      indexedCategoryDefinition = categoryDefinitions[rawCategory];

      if (Array.isArray(indexedCategoryDefinition)) {
        return String(indexedCategoryDefinition[0] || "").trim();
      }

      if (indexedCategoryDefinition && indexedCategoryDefinition.name) {
        return String(indexedCategoryDefinition.name).trim();
      }

      return "";
    }

    return String(rawCategory || "").trim();
  }

  /*
    Build one normalized icon record used by the interactive catalogue.

    This is the point where the catalogue contract is established: canonical file
    name, aliases, category titles and search text are all derived here so render
    code later only consumes ready-to-use records instead of repeating cleanup.
  */
  function buildIconRecord(canonicalName, aliasNames, categoryNames, categoryTitleMap, categoryOrderMap) {
    var normalizedCanonicalName = String(canonicalName || "").trim();
    var normalizedAliasNames = [];
    var normalizedCategoryNames = [];

    if (!normalizedCanonicalName) {
      return null;
    }

    getArray(aliasNames).forEach(function (rawAliasName) {
      var aliasName = String(rawAliasName || "").trim();

      if (!aliasName || aliasName === normalizedCanonicalName) {
        return;
      }

      uniquePush(normalizedAliasNames, aliasName);
    });

    getArray(categoryNames).forEach(function (rawCategoryName) {
      var categoryName = String(rawCategoryName || "").trim();

      if (!categoryTitleMap[categoryName]) {
        return;
      }

      uniquePush(normalizedCategoryNames, categoryName);
    });

    normalizedAliasNames.sort(sortStrings);
    normalizedCategoryNames.sort(function (left, right) {
      var leftOrder = Object.prototype.hasOwnProperty.call(categoryOrderMap, left) ? categoryOrderMap[left] : 999999;
      var rightOrder = Object.prototype.hasOwnProperty.call(categoryOrderMap, right) ? categoryOrderMap[right] : 999999;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return sortStrings(left, right);
    });

    var searchableNames = [normalizedCanonicalName].concat(normalizedAliasNames);
    var categoryTitles = normalizedCategoryNames.map(function (categoryName) {
      return categoryTitleMap[categoryName] || categoryName;
    });

    return {
      canonicalName: normalizedCanonicalName,
      aliasNames: normalizedAliasNames,
      categoryNames: normalizedCategoryNames,
      categoryTitles: categoryTitles,
      previewPath: "../assets/icons/" + normalizedCanonicalName + ".svg",
      runtimePath: "assets/icons/" + normalizedCanonicalName + ".svg",
      aliasSearchText: searchableNames.join(" ").toLowerCase(),
      categorySearchText: categoryTitles.join(" ").toLowerCase(),
      searchText: searchableNames.concat(normalizedCategoryNames, categoryTitles).join(" ").toLowerCase()
    };
  }

  /*
    Build records from the current compact data shape generated for docs.

    Compact data is the preferred path because it is smaller and already groups
    most icon metadata into near-final records, while still allowing category
    references to be stored as short numeric indexes.
  */
  function buildIconRecordsFromCompactData(categoryDefinitions, categoryTitleMap, categoryOrderMap) {
    return getArray(window.FNLLA_ICON_RECORDS).map(function (rawRecord) {
      var canonicalName = "";
      var aliasNames = [];
      var categoryNames = [];

      if (Array.isArray(rawRecord)) {
        canonicalName = String(rawRecord[0] || "").trim();
        aliasNames = getArray(rawRecord[1]);
        categoryNames = getArray(rawRecord[2]).map(function (rawCategory) {
          return resolveIconCategoryName(rawCategory, categoryDefinitions);
        });
      } else if (rawRecord) {
        canonicalName = String(rawRecord.canonicalName || "").trim();
        aliasNames = getArray(rawRecord.aliasNames);
        categoryNames = getArray(rawRecord.categoryNames).map(function (rawCategory) {
          return resolveIconCategoryName(rawCategory, categoryDefinitions);
        });
      }

      return buildIconRecord(canonicalName, aliasNames, categoryNames, categoryTitleMap, categoryOrderMap);
    }).filter(Boolean).sort(function (left, right) {
      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /*
    Build records from the older split-window globals.

    This legacy path exists so older docs payloads or transitional generated files
    can still produce the same final catalogue records without breaking the page.
    Canonical names collapse duplicate aliases that map to the same shipped SVG.
  */
  function buildIconRecordsFromLegacyData(categoryTitleMap, categoryOrderMap) {
    var iconNames = getArray(window.FNLLA_ICON_NAMES);
    var categoryMap = window.FNLLA_ICON_CATEGORY_MAP && typeof window.FNLLA_ICON_CATEGORY_MAP === "object"
      ? window.FNLLA_ICON_CATEGORY_MAP
      : {};
    var canonicalMap = window.FNLLA_ICON_CANONICAL_NAMES && typeof window.FNLLA_ICON_CANONICAL_NAMES === "object"
      ? window.FNLLA_ICON_CANONICAL_NAMES
      : {};
    var recordsByCanonicalName = {};

    iconNames.forEach(function (rawIconName) {
      var iconName = String(rawIconName || "").trim();

      if (!iconName) {
        return;
      }

      var canonicalName = String(canonicalMap[iconName] || iconName).trim();

      if (!canonicalName) {
        return;
      }

      if (!recordsByCanonicalName[canonicalName]) {
        recordsByCanonicalName[canonicalName] = {
          aliasNames: [],
          categoryNames: []
        };
      }

      var record = recordsByCanonicalName[canonicalName];
      uniquePush(record.aliasNames, iconName);

      getArray(categoryMap[iconName]).forEach(function (categoryName) {
        if (categoryTitleMap[categoryName]) {
          uniquePush(record.categoryNames, categoryName);
        }
      });
    });

    return Object.keys(recordsByCanonicalName).map(function (canonicalName) {
      var record = recordsByCanonicalName[canonicalName];
      return buildIconRecord(canonicalName, record.aliasNames, record.categoryNames, categoryTitleMap, categoryOrderMap);
    }).filter(Boolean).sort(function (left, right) {
      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /*
    Prefer compact records when available, otherwise transparently fall back to
    the legacy globals. The rest of the docs code never needs to know which data
    source produced the final record list.
  */
  function buildIconCatalogueData() {
    var categoryDefinitions = getArray(window.FNLLA_ICON_CATEGORIES);
    var categoryMetadata = normalizeIconCategoryDefinitions(categoryDefinitions);
    var records = getArray(window.FNLLA_ICON_RECORDS).length
      ? buildIconRecordsFromCompactData(
        categoryDefinitions,
        categoryMetadata.categoryTitleMap,
        categoryMetadata.categoryOrderMap
      )
      : buildIconRecordsFromLegacyData(
        categoryMetadata.categoryTitleMap,
        categoryMetadata.categoryOrderMap
      );

    return {
      categoryOptions: categoryMetadata.categoryOptions,
      categoryTitleMap: categoryMetadata.categoryTitleMap,
      records: records
    };
  }

  /*
    Search ranking favors canonical-name precision before broader matches.

    This ranking does not decide inclusion, only ordering. Exact canonical names
    should appear first, then prefix matches, then aliases, then category-text
    matches, so maintainers can still find the real shipped file quickly.
  */
  function getIconSearchRank(record, normalizedQuery) {
    if (!normalizedQuery) {
      return 0;
    }

    if (record.canonicalName === normalizedQuery) {
      return 0;
    }

    if (record.canonicalName.indexOf(normalizedQuery) === 0) {
      return 1;
    }

    if (record.aliasSearchText.indexOf(normalizedQuery) !== -1) {
      return 2;
    }

    if (record.categorySearchText.indexOf(normalizedQuery) !== -1) {
      return 3;
    }

    return 4;
  }

  /*
    Filter by active category and free-text query, then rank results so the most
    likely canonical match appears first without hiding valid broader matches.
  */
  function filterIconRecords(records, activeCategory, query) {
    var normalizedQuery = String(query || "").trim().toLowerCase();

    return records.filter(function (record) {
      var matchesCategory = activeCategory === "all" || record.categoryNames.indexOf(activeCategory) !== -1;
      var matchesQuery = !normalizedQuery || record.searchText.indexOf(normalizedQuery) !== -1;
      return matchesCategory && matchesQuery;
    }).sort(function (left, right) {
      var leftRank = getIconSearchRank(left, normalizedQuery);
      var rightRank = getIconSearchRank(right, normalizedQuery);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /* Precompute category counts once so the category sidebar can stay lightweight. */
  function getIconCategoryCounts(records) {
    var counts = { all: records.length };

    records.forEach(function (record) {
      record.categoryNames.forEach(function (categoryName) {
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      });
    });

    return counts;
  }

  /*
    Copy runtime icon paths with a permissive browser fallback.

    Some docs environments may not expose the async Clipboard API. The fallback
    keeps the catalogue usable in stricter or older browsers rather than silently
    losing the copy action altogether.
  */
  function copyTextWithFallback(text, onSuccess, onFailure) {
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        if (document.execCommand("copy")) {
          document.body.removeChild(textarea);
          onSuccess();
          return;
        }
      } catch (error) {
        // Intentionally fall through to shared failure handling.
      }

      document.body.removeChild(textarea);
      onFailure();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(onSuccess, fallbackCopy);
      return;
    }

    fallbackCopy();
  }

  /* Show a short-lived per-card status message without stacking timers. */
  function setIconCopyStatus(statusElement, message) {
    if (!statusElement) {
      return;
    }

    setText(statusElement, message);

    if (statusElement._docIconTimer) {
      window.clearTimeout(statusElement._docIconTimer);
    }

    statusElement._docIconTimer = window.setTimeout(function () {
      setText(statusElement, "");
      statusElement._docIconTimer = null;
    }, 2200);
  }

  /*
    Rebuild the category button list from current state.

    The button list is regenerated on each render so pressed state, counts and
    focus restoration always describe the same filtered dataset the grid shows.
  */
  function renderIconCategoryButtons(state) {
    var categoryListElement = state.categoryListElement;

    if (!categoryListElement) {
      return;
    }

    categoryListElement.innerHTML = "";
    var fragment = document.createDocumentFragment();

    state.categoryOptions.forEach(function (category) {
      var button = document.createElement("button");
      var count = state.categoryCounts[category.name] || 0;
      var countElement = document.createElement("span");

      button.className = "doc-icon-category-button";
      if (category.name === state.activeCategory) {
        button.className += " is-active";
      }
      button.type = "button";
      button.setAttribute("data-icon-category", category.name);
      button.setAttribute("aria-pressed", category.name === state.activeCategory ? "true" : "false");
      button.appendChild(document.createTextNode(category.title));

      countElement.className = "doc-icon-category-count";
      countElement.textContent = String(count);
      button.appendChild(countElement);

      button.addEventListener("click", function () {
        state.activeCategory = category.name;
        state.visibleCount = state.pageSize;
        renderIconCatalogue(state, { restoreCategoryFocus: true });
      });

      fragment.appendChild(button);
    });

    categoryListElement.appendChild(fragment);
  }

  /* Replace the grid with one explicit empty state when no records match. */
  function renderIconEmptyState(state) {
    state.iconGrid.innerHTML = "";

    var emptyState = document.createElement("article");
    var title = document.createElement("h3");
    var text = document.createElement("p");

    emptyState.className = "empty-state";
    title.className = "empty-state-title";
    title.textContent = "No icons match this filter";
    text.className = "empty-state-text";
    text.textContent = "Try a shorter search term or switch to another category.";

    emptyState.appendChild(title);
    emptyState.appendChild(text);
    state.iconGrid.appendChild(emptyState);
  }

  /*
    Render progress and the "load more" control for the current result set.

    The catalogue intentionally pages results in the UI even though all metadata
    is already local. That keeps the docs responsive on smaller devices when the
    icon set is large, while still avoiding any network fetch.
  */
  function renderIconActions(state, totalCount, visibleCount) {
    var actionsElement = state.actionsElement;

    if (!actionsElement) {
      return;
    }

    actionsElement.innerHTML = "";

    if (!totalCount) {
      return;
    }

    var progressElement = document.createElement("p");
    progressElement.className = "doc-icon-progress";

    if (visibleCount < totalCount) {
      progressElement.textContent = "Showing " + visibleCount + " of " + totalCount + " matching icons.";
    } else {
      progressElement.textContent = "All " + totalCount + " matching icons are visible.";
    }

    actionsElement.appendChild(progressElement);

    if (visibleCount >= totalCount) {
      return;
    }

    var loadMoreButton = document.createElement("button");
    var remainingCount = totalCount - visibleCount;
    var nextStepCount = remainingCount > state.pageSize ? state.pageSize : remainingCount;

    loadMoreButton.className = "btn btn-outline btn-sm doc-icon-load-more";
    loadMoreButton.type = "button";
    loadMoreButton.textContent = "Load " + nextStepCount + " more icons";
    loadMoreButton.addEventListener("click", function () {
      state.visibleCount = Math.min(totalCount, state.visibleCount + state.pageSize);
      renderIconCatalogue(state, {
        preserveVisibleCount: true,
        restoreLoadMoreFocus: true
      });
    });

    actionsElement.appendChild(loadMoreButton);
  }

  /*
    Render only the currently visible slice of icon records.

    Each card is built from the shared template so preview image, runtime path and
    copy affordance remain structurally consistent even as filtering changes.
  */
  function renderIconCards(state, records) {
    var template = state.cardTemplate;
    var grid = state.iconGrid;

    grid.innerHTML = "";

    if (!records.length) {
      renderIconEmptyState(state);
      return;
    }

    var fragment = document.createDocumentFragment();

    records.forEach(function (record) {
      var clone = template.content.cloneNode(true);
      var previewImage = clone.querySelector(".doc-icon-preview img");
      var nameElement = clone.querySelector(".doc-icon-name");
      var categoriesElement = clone.querySelector(".doc-icon-categories");
      var aliasesElement = clone.querySelector(".doc-icon-aliases");
      var pathElement = clone.querySelector(".doc-icon-path code");
      var statusElement = clone.querySelector(".doc-icon-status");
      var copyButton = clone.querySelector(".doc-icon-copy");

      previewImage.src = record.previewPath;
      previewImage.alt = "";
      previewImage.loading = "lazy";
      previewImage.decoding = "async";
      previewImage.width = 32;
      previewImage.height = 32;
      setText(nameElement, record.canonicalName);
      setText(categoriesElement, record.categoryTitles.length ? record.categoryTitles.join(" / ") : "Uncategorized");
      setText(aliasesElement, record.aliasNames.length ? "Also searchable as: " + record.aliasNames.join(", ") : "Canonical asset name");
      setText(pathElement, record.runtimePath);

      copyButton.addEventListener("click", function () {
        copyTextWithFallback(
          record.runtimePath,
          function () {
            setIconCopyStatus(statusElement, "Runtime path copied.");
          },
          function () {
            setIconCopyStatus(statusElement, "Copy failed in this browser.");
          }
        );
      });

      fragment.appendChild(clone);
    });

    grid.appendChild(fragment);
  }

  /*
    Central catalogue render pass.

    This function owns the relationship between search query, active category,
    visible slice size, assistive text and focus restoration. Keeping those pieces
    in one place reduces the risk of the sidebar, results label and grid drifting
    out of sync after a future maintenance change.
  */
  function renderIconCatalogue(state, options) {
    var renderOptions = options || {};
    var query = String(state.searchInput.value || "").trim();
    var activeCategoryTitle = state.categoryTitleMap[state.activeCategory] || "All icons";
    var filteredRecords = filterIconRecords(state.records, state.activeCategory, query);
    var visibleCount;
    var visibleRecords;
    var hasMoreResults;
    var countLabel;
    var activeCategoryMessage;

    if (!renderOptions.preserveVisibleCount) {
      state.visibleCount = state.pageSize;
    }

    visibleCount = Math.min(filteredRecords.length, state.visibleCount);
    visibleRecords = filteredRecords.slice(0, visibleCount);
    hasMoreResults = visibleCount < filteredRecords.length;

    state.iconGrid.setAttribute("aria-busy", "true");
    renderIconCategoryButtons(state);
    renderIconCards(state, visibleRecords);
    renderIconActions(state, filteredRecords.length, visibleCount);
    state.iconGrid.setAttribute("aria-busy", "false");

    if (!query && state.activeCategory === "all") {
      countLabel = hasMoreResults
        ? "Showing first " + visibleCount + " of " + filteredRecords.length + " shipped runtime icons."
        : "Showing " + filteredRecords.length + " shipped runtime icons.";
      activeCategoryMessage = "Browse the full local FNLLA Icons bundle. Copy buttons use the stable runtime path under assets/icons/.";
    } else if (query && state.activeCategory === "all") {
      countLabel = hasMoreResults
        ? "Showing " + visibleCount + " of " + filteredRecords.length + " matching runtime icons for \"" + query + "\"."
        : "Showing " + filteredRecords.length + " matching runtime icons for \"" + query + "\".";
      activeCategoryMessage = "Search matches include canonical asset names, merged aliases and category labels from the local bundle.";
    } else if (!query) {
      countLabel = hasMoreResults
        ? "Showing first " + visibleCount + " of " + filteredRecords.length + " runtime icons in " + activeCategoryTitle + "."
        : "Showing " + filteredRecords.length + " runtime icons in " + activeCategoryTitle + ".";
      activeCategoryMessage = "These icons are tagged under " + activeCategoryTitle + ". Copy buttons still return the runtime path under assets/icons/.";
    } else {
      countLabel = hasMoreResults
        ? "Showing " + visibleCount + " of " + filteredRecords.length + " matching runtime icons for \"" + query + "\" in " + activeCategoryTitle + "."
        : "Showing " + filteredRecords.length + " matching runtime icons for \"" + query + "\" in " + activeCategoryTitle + ".";
      activeCategoryMessage = "The category filter stays active while search narrows the same local runtime bundle.";
    }

    if (hasMoreResults) {
      activeCategoryMessage += " More matches load in smaller batches to keep this page responsive on mobile and slower devices.";
    }

    setText(state.resultsCountElement, countLabel);
    setText(state.activeCategoryElement, activeCategoryTitle);
    setText(state.activeCategoryTextElement, activeCategoryMessage);

    if (renderOptions.restoreCategoryFocus) {
      var activeCategoryButton = state.categoryListElement.querySelector("[data-icon-category=\"" + state.activeCategory + "\"]");

      if (activeCategoryButton && typeof activeCategoryButton.focus === "function") {
        activeCategoryButton.focus();
      }
    }

    if (renderOptions.restoreLoadMoreFocus && hasMoreResults) {
      var nextLoadMoreButton = state.actionsElement.querySelector(".doc-icon-load-more");

      if (nextLoadMoreButton && typeof nextLoadMoreButton.focus === "function") {
        nextLoadMoreButton.focus();
      }
    }
  }

  /*
    Bind the catalogue only when the required docs shell elements exist.

    The icons page is the only place that ships the full interactive catalogue,
    so every dependency is checked up front. Failing soft here prevents unrelated
    docs pages from paying a runtime penalty or logging noisy errors.
  */
  function initIconCatalogue() {
    var iconGrid = document.getElementById("icon-grid");

    if (!iconGrid) {
      return;
    }

    var searchInput = document.getElementById("icon-search");
    var resultsCountElement = document.getElementById("icon-results-count");
    var categoryListElement = document.getElementById("icon-category-list");
    var activeCategoryElement = document.getElementById("icon-active-category");
    var activeCategoryTextElement = document.getElementById("icon-active-category-text");
    var actionsElement = document.getElementById("icon-actions");
    var cardTemplate = document.getElementById("icon-card-template");
    var data = buildIconCatalogueData();

    if (!searchInput || !resultsCountElement || !categoryListElement || !activeCategoryElement || !activeCategoryTextElement || !actionsElement || !cardTemplate) {
      return;
    }

    if (!data.records.length) {
      setText(resultsCountElement, "The local icon catalogue is unavailable on this page.");
      setText(activeCategoryElement, "Catalogue unavailable");
      setText(activeCategoryTextElement, "docs/assets/icons-data.js is required for the interactive catalogue.");
      iconGrid.innerHTML = "";
      return;
    }

    var mergedCategoryTitleMap = { all: "All icons" };
    Object.keys(data.categoryTitleMap).forEach(function (categoryName) {
      mergedCategoryTitleMap[categoryName] = data.categoryTitleMap[categoryName];
    });

    var state = {
      activeCategory: "all",
      activeCategoryElement: activeCategoryElement,
      activeCategoryTextElement: activeCategoryTextElement,
      actionsElement: actionsElement,
      cardTemplate: cardTemplate,
      categoryCounts: getIconCategoryCounts(data.records),
      categoryListElement: categoryListElement,
      categoryOptions: data.categoryOptions,
      categoryTitleMap: mergedCategoryTitleMap,
      iconGrid: iconGrid,
      pageSize: 60,
      records: data.records,
      resultsCountElement: resultsCountElement,
      searchInput: searchInput,
      visibleCount: 60
    };

    /*
      A new query should start from the first visible slice again.
      renderIconCatalogue will restore the default page size whenever we do not
      explicitly request visible-count preservation.
    */
    searchInput.addEventListener("input", function () {
      renderIconCatalogue(state);
    });

    renderIconCatalogue(state);
  }

  initDocsNav();
  initDocsThemeToggle();

  if (document.body) {
    highlightCodeWithin(document.body);
  }

  bindGuideTocLinks();
  initIconCatalogue();
})();
