/*
  ============================================================================
  FNLLA UI SOURCE MODULE: RANGE OUTPUT INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  function initRanges(root) {
    getScopedMatches(root, selectors.rangeInput).forEach(function (input) {
      if (initializationState.rangeInput.has(input)) {
        return;
      }

      var outputSelector = "[" + attributeNames.rangeOutput + "=\"" + input.id + "\"]";
      var output = document.querySelector(outputSelector);

      if (!output) {
        return;
      }

      initializationState.rangeInput.add(input);

      function syncOutput() {
        var prefix = input.getAttribute(attributeNames.rangePrefix) || "";
        var suffix = input.getAttribute(attributeNames.rangeSuffix);
        var renderedValue = prefix + String(input.value) + (suffix === null ? "" : suffix);
        var min = parseFloat(input.min || "0");
        var max = parseFloat(input.max || "100");
        var current = parseFloat(input.value || "0");
        var progress = max > min ? ((current - min) / (max - min)) * 100 : 0;

        output.textContent = renderedValue;
        input.style.setProperty("--fnlla-range-percent", progress + "%");

        if (output.tagName === "OUTPUT") {
          output.value = renderedValue;
        }
      }

      syncOutput();
      input.addEventListener("input", syncOutput);
      input.addEventListener("change", syncOutput);
    });
  }
