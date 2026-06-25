/*
  ============================================================================
  FNLLA UI SOURCE MODULE: TOOLTIP INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Bind hover and focus tooltip behavior to documented tooltip triggers. */
  function initTooltips(root) {
    getScopedMatches(root, selectors.tooltipTrigger).forEach(function (trigger) {
      if (initializationState.tooltipTrigger.has(trigger)) {
        return;
      }

      if (!trigger.getAttribute(attributeNames.tooltip)) {
        return;
      }

      initializationState.tooltipTrigger.add(trigger);

      trigger.addEventListener("mouseenter", function () {
        showTooltip(trigger);
      });

      trigger.addEventListener("mouseleave", function () {
        hideTooltip(trigger);
      });

      trigger.addEventListener("focus", function () {
        showTooltip(trigger);
      });

      trigger.addEventListener("blur", function () {
        hideTooltip(trigger);
      });
    });
  }
