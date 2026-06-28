/*
  ============================================================================
  FNLLA Web SOURCE MODULE: OFFCANVAS INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind offcanvas triggers, panels and close controls in the current scope. */
  function initOffcanvas(root) {
    getScopedMatches(root, selectors.offcanvasTrigger).forEach(function (trigger) {
      if (initializationState.offcanvasTrigger.has(trigger)) {
        return;
      }

      var selector = trigger.getAttribute(attributeNames.offcanvasOpen);
      var offcanvas = resolveModalBySelector(selector);

      if (!offcanvas) {
        return;
      }

      initializationState.offcanvasTrigger.add(trigger);

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        openOffcanvas(offcanvas, trigger);
      });
    });

    getScopedMatches(root, selectors.offcanvas).forEach(function (offcanvas) {
      if (initializationState.offcanvas.has(offcanvas)) {
        return;
      }

      initializationState.offcanvas.add(offcanvas);

      if (!offcanvas.id) {
        offcanvas.id = createFnllaWebId(idPrefixes.offcanvas);
      }

      if (!offcanvas.hasAttribute("role")) {
        offcanvas.setAttribute("role", "dialog");
      }

      offcanvas.setAttribute("aria-modal", "true");
      offcanvas.setAttribute("aria-hidden", "true");
      offcanvas.hidden = true;
      setElementInertState(offcanvas, true);

      offcanvas.addEventListener("click", function (event) {
        var clickedClose = event.target.closest(selectors.offcanvasClose);
        var clickedBackdrop = event.target === offcanvas;

        if (clickedClose || clickedBackdrop) {
          closeOffcanvas(offcanvas);
        }
      });
    });

    getScopedMatches(root, selectors.offcanvasClose).forEach(function (button) {
      if (initializationState.offcanvasClose.has(button)) {
        return;
      }

      initializationState.offcanvasClose.add(button);

      button.addEventListener("click", function (event) {
        var offcanvas = event.currentTarget.closest(selectors.offcanvas);

        if (!offcanvas) {
          return;
        }

        event.preventDefault();
        closeOffcanvas(offcanvas);
      });
    });
  }
