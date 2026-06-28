/*
  ============================================================================
  FNLLA Web SOURCE MODULE: FOCUS MANAGEMENT HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Keep Tab navigation inside the currently active overlay or dialog layer. */
  function trapFocusInModal(event) {
    if (event.key !== "Tab") {
      return;
    }

    var activeLayer = getTopOpenLayer();

    if (!activeLayer) {
      return;
    }

    var focusable = getFocusableElements(activeLayer);

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var activeElement = document.activeElement;

    if (!activeLayer.contains(activeElement)) {
      event.preventDefault();

      if (event.shiftKey) {
        last.focus();
      } else {
        first.focus();
      }

      return;
    }

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
