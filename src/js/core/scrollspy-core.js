/*
  ============================================================================
  FNLLA Web SOURCE MODULE: SCROLLSPY STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Mark one scrollspy link as current and clear the rest. */
  function activateScrollspyLink(container, targetId) {
    var nav = container ? container.querySelector(selectors.scrollspyNav) : null;

    if (!nav) {
      return;
    }

    toArray(nav.querySelectorAll("a[href^='#']")).forEach(function (link) {
      var href = link.getAttribute("href") || "";

      if (href === "#" + targetId) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* Pick the section with the strongest visible presence in the viewport. */
  function getCurrentScrollspySectionId(sections) {
    var currentId = sections.length ? sections[0].id : "";
    var bestScore = -1;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    var viewportAnchor = Math.max(0, Math.min(viewportHeight, viewportHeight * 0.32));
    var viewportBottom = window.scrollY + window.innerHeight;
    var documentBottom = document.documentElement.scrollHeight - 4;

    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      var visibleTop = Math.max(rect.top, 0);
      var visibleBottom = Math.min(rect.bottom, viewportHeight);
      var visibleHeight = Math.max(0, visibleBottom - visibleTop);
      var anchorDistance = Math.abs(rect.top - viewportAnchor);
      var anchoredBonus = Math.max(0, 240 - anchorDistance);
      var score = visibleHeight + anchoredBonus;

      if (score > bestScore) {
        bestScore = score;
        currentId = section.id;
      }
    });

    if (viewportBottom >= documentBottom && sections.length) {
      currentId = sections[sections.length - 1].id;
    }

    return currentId;
  }

  /* Refresh the highlighted scrollspy entry from the current viewport position. */
  function refreshScrollspy(container, sections) {
    var currentId = getCurrentScrollspySectionId(sections);

    if (currentId) {
      activateScrollspyLink(container, currentId);
    }
  }

  function registerScrollspyInstance(container, state) {
    if (!container || !state) {
      return;
    }

    scrollspyObserverMap.set(container, state);
    scrollspyRegistry.push(state);
  }

  function cleanupScrollspyInstance(container) {
    var state = container ? scrollspyObserverMap.get(container) : null;

    if (!state) {
      return;
    }

    window.removeEventListener("scroll", state.update, { passive: true });
    window.removeEventListener("resize", state.update);

    if (state.panel) {
      state.panel.removeEventListener("scroll", state.update, { passive: true });
    }

    initializationState.scrollspy.delete(container);
    scrollspyObserverMap.delete(container);
    scrollspyRegistry = scrollspyRegistry.filter(function (entry) {
      return entry !== state;
    });
  }

  function cleanupDetachedScrollspyInstances() {
    scrollspyRegistry.slice().forEach(function (state) {
      if (!state.container || state.container.isConnected) {
        return;
      }

      cleanupScrollspyInstance(state.container);
    });
  }
