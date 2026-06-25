/*
  ============================================================================
  FNLLA UI SOURCE MODULE: POPOVER STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Resolve the main popover panel inside a documented popover wrapper. */
  function getPopoverPanel(popover) {
    return popover ? popover.querySelector(selectors.popoverPanel) : null;
  }

  /* Close one popover and optionally return focus to its trigger. */
  function closePopover(popover, options) {
    var settings = options || {};
    var trigger = popover ? popover.querySelector(selectors.popoverToggle) : null;
    var panel = getPopoverPanel(popover);

    if (!popover || !panel || !trigger) {
      return;
    }

    popover.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    setElementInertState(panel, true);

    if (settings.restoreFocus && canReceiveFocus(trigger)) {
      trigger.focus();
    }
  }

  /* Open one popover and optionally move focus to the first item inside it. */
  function openPopover(popover, options) {
    var settings = options || {};
    var trigger = popover ? popover.querySelector(selectors.popoverToggle) : null;
    var panel = getPopoverPanel(popover);
    var focusable = getFocusableElements(panel);

    if (!popover || !panel || !trigger) {
      return;
    }

    closeAllPopovers(popover);
    popover.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setElementInertState(panel, false);

    if (settings.focusPanel && focusable.length) {
      focusable[0].focus();
    }
  }

  /* Close every popover except the one explicitly preserved. */
  function closeAllPopovers(exceptPopover) {
    toArray(document.querySelectorAll(selectors.popover)).forEach(function (popover) {
      if (popover !== exceptPopover) {
        closePopover(popover);
      }
    });
  }

  /* Toggle one popover while closing peer popovers first. */
  function togglePopover(popover) {
    if (!popover) {
      return;
    }

    if (popover.classList.contains("is-open")) {
      closePopover(popover);
    } else {
      openPopover(popover);
    }
  }
