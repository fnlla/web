/*
  ============================================================================
  FNLLA UI SOURCE MODULE: NAVIGATION STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Synchronize visual state, ARIA state and focus behavior for one menu. */
  function syncNavTargetState(toggle, target, expanded, options) {
    var settings = options || {};

    target.classList.toggle("is-open", expanded);
    target.setAttribute("aria-hidden", expanded ? "false" : "true");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    setElementInertState(target, !expanded && isMobileNavigation());

    if (!expanded && settings.restoreFocus && canReceiveFocus(toggle)) {
      toggle.focus();
    }
  }

  /* Central mobile-navigation breakpoint check used by all nav logic. */
  function isMobileNavigation() {
    return mobileNavQuery ? mobileNavQuery.matches : false;
  }

  /* Reconcile navigation markup whenever the viewport mode changes. */
  function syncNavigationMode(root) {
    getScopedMatches(root, selectors.navToggle).forEach(function (toggle) {
      var target = getControlledElement(toggle);

      if (!target) {
        return;
      }

      if (isMobileNavigation()) {
        if (!target.classList.contains("is-open")) {
          target.setAttribute("aria-hidden", "true");
          setElementInertState(target, true);
        } else {
          target.setAttribute("aria-hidden", "false");
          setElementInertState(target, false);
        }
        return;
      }

      target.classList.remove("is-open");
      target.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "false");
      setElementInertState(target, false);
    });
  }

  /* Close every currently open mobile navigation panel. */
  function closeOpenNavigation(options) {
    var settings = options || {};

    if (!isMobileNavigation()) {
      return;
    }

    toArray(document.querySelectorAll(selectors.navToggle)).forEach(function (toggle) {
      var target = getControlledElement(toggle);

      if (!target || !target.classList.contains("is-open")) {
        return;
      }

      syncNavTargetState(toggle, target, false, {
        restoreFocus: settings.restoreFocus
      });
    });
  }
