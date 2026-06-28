/*
  ============================================================================
  FNLLA UI SOURCE MODULE: POPOVER INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind popover toggles, panels and close controls in the current scope. */
  function initPopovers(root) {
    getScopedMatches(root, selectors.popover).forEach(function (popover) {
      if (initializationState.popover.has(popover)) {
        return;
      }

      var trigger = popover.querySelector(selectors.popoverToggle);
      var panel = getPopoverPanel(popover);

      if (!trigger || !panel) {
        return;
      }

      initializationState.popover.add(popover);

      if (!trigger.id) {
        trigger.id = createFnllaUiId(idPrefixes.popoverToggle);
      }

      if (!panel.id) {
        panel.id = createFnllaUiId(idPrefixes.popoverPanel);
      }

      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", trigger.id);
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      setElementInertState(panel, true);

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        togglePopover(popover);
      });

      trigger.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          closePopover(popover, { restoreFocus: true });
        }
      });

      panel.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          closePopover(popover, { restoreFocus: true });
        }
      });
    });

    getScopedMatches(root, selectors.popoverToggle).forEach(function (trigger) {
      if (initializationState.popoverTrigger.has(trigger)) {
        return;
      }

      initializationState.popoverTrigger.add(trigger);
    });

    getScopedMatches(root, selectors.popoverClose).forEach(function (button) {
      if (initializationState.popoverClose.has(button)) {
        return;
      }

      initializationState.popoverClose.add(button);

      button.addEventListener("click", function (event) {
        var popover = event.currentTarget.closest(selectors.popover);

        if (!popover) {
          return;
        }

        event.preventDefault();
        closePopover(popover, { restoreFocus: true });
      });
    });
  }
