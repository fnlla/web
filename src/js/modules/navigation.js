/*
  ============================================================================
  FNLLA UI SOURCE MODULE: NAVIGATION INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Bind mobile navigation toggle behavior to documented navbar triggers. */
  function initNavigation(root) {
    getScopedMatches(root, selectors.navToggle).forEach(function (toggle) {
      if (initializationState.navToggle.has(toggle)) {
        return;
      }

      var target = getControlledElement(toggle);

      if (!target) {
        return;
      }

      initializationState.navToggle.add(toggle);
      toggle.setAttribute("aria-expanded", "false");
      target.classList.remove("is-open");

      if (isMobileNavigation()) {
        target.setAttribute("aria-hidden", "true");
        setElementInertState(target, true);
      } else {
        target.setAttribute("aria-hidden", "false");
        setElementInertState(target, false);
      }

      toggle.addEventListener("click", function (event) {
        event.preventDefault();

        var isExpanded = toggle.getAttribute("aria-expanded") === "true";
        syncNavTargetState(toggle, target, !isExpanded);
      });
    });
  }
