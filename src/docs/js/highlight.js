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
        result += wrapToken("doc-code-value", match[3]);
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
    if (!valueText) {
      return "";
    }

    return highlightTextSegment(valueText, "doc-code-value")
      .replace(/var\((--[\w-]+)\)/g, function (_, variableName) {
        return wrapToken("doc-code-function", "var")
          + wrapToken("doc-code-punctuation", "(")
          + wrapToken("doc-code-variable", variableName)
          + wrapToken("doc-code-punctuation", ")");
      });
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
      if (!line.trim()) {
        return "";
      }

      var indentMatch = line.match(/^\s*/);
      var indent = indentMatch ? indentMatch[0] : "";
      var core = line.trim();
      var tokens = core.split(/\s+/);
      var firstToken = tokens.shift();
      var rest = tokens.join(" ");
      return escapeHtml(indent)
        + wrapToken("doc-code-command", firstToken)
        + (rest ? " " + highlightTextSegment(rest, "doc-code-path").trim() : "");
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

  function renderPlainCode(text) {
    return text.split("\n").map(function (line) {
      return line ? highlightTextSegment(line, "doc-code-content") : "";
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

    if (/\blanguage-(?:bash|sh|shell|powershell|ps1|cmd)\b/i.test(className)) {
      return "command";
    }

    if (/(^|\n)\s*<\/?[a-z][^>\n]*>/i.test(sourceText) || /<!DOCTYPE/i.test(sourceText)) {
      return "html";
    }

    if ((/(^|\n)\s*[@[.#:\w-][^{\n]*\{\s*$/m.test(sourceText) || /(^|\n)\s*--[\w-]+\s*:/m.test(sourceText)) && /\}/.test(sourceText)) {
      return "css";
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

    if (/^(?:\.[\w-]+|\[[^\]]+\]|#[\w-]+)$/.test(sourceText)) {
      return wrapToken("doc-code-selector", sourceText);
    }

    if (/^(?:[\w.-]+\/)+[\w.-]+$/.test(sourceText) || /^[\w.-]+\.(?:css|js|mjs|html|md|svg|php)$/.test(sourceText)) {
      return wrapToken("doc-code-path", sourceText);
    }

    if (/^[\w$.-]+\([^)]*\)$/.test(sourceText)) {
      return wrapToken("doc-code-function", sourceText);
    }

    return escapeHtml(sourceText);
  }

  function clearPreCodeKindClasses(preElement) {
    preElement.classList.remove("is-html", "is-css", "is-command", "is-tree", "is-plain");
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
