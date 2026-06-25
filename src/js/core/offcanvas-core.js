/*
  ============================================================================
  FNLLA UI SOURCE MODULE: OFFCANVAS STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Prefer an explicit initial-focus target, then fall back to the first control. */
  function getOffcanvasInitialFocusTarget(offcanvas) {
    if (!offcanvas) {
      return null;
    }

    var preferredTarget = offcanvas.querySelector(selectors.offcanvasInitialFocus);
    if (canReceiveFocus(preferredTarget)) {
      return preferredTarget;
    }

    return getFocusableElements(offcanvas)[0] || null;
  }

  /* Close one offcanvas panel, restore body scroll and return focus if possible. */
  function closeOffcanvas(offcanvas) {
    if (!offcanvas) {
      return;
    }

    var isTracked = openOffcanvasStack.indexOf(offcanvas) !== -1 || openLayerStack.indexOf(offcanvas) !== -1;

    if (!isTracked && offcanvas.hidden) {
      return;
    }

    var wasTopLayer = getTopOpenLayer() === offcanvas;
    var trigger = offcanvasTriggerMap.get(offcanvas);

    offcanvas.hidden = true;
    offcanvas.classList.remove("is-open");
    offcanvas.setAttribute("aria-hidden", "true");
    setElementInertState(offcanvas, true);
    openOffcanvasStack = openOffcanvasStack.filter(function (item) {
      return item !== offcanvas;
    });
    untrackOpenLayer(offcanvas);
    syncOpenLayerIsolation();
    syncDocumentScrollLock();

    if (!wasTopLayer) {
      return;
    }

    var nextTopLayer = getTopOpenLayer();

    if (nextTopLayer) {
      focusOpenLayer(nextTopLayer);
      return;
    }

    if (canReceiveFocus(trigger)) {
      trigger.focus();
    }
  }

  /* Open one offcanvas panel, lock body scroll and move focus into the panel. */
  function openOffcanvas(offcanvas, trigger) {
    if (!offcanvas) {
      return;
    }

    closeTransientUi();
    offcanvas.hidden = false;
    offcanvas.classList.add("is-open");
    offcanvas.setAttribute("aria-hidden", "false");
    setElementInertState(offcanvas, false);
    offcanvasTriggerMap.set(offcanvas, trigger || offcanvasTriggerMap.get(offcanvas) || document.activeElement);

    if (openOffcanvasStack.indexOf(offcanvas) === -1) {
      openOffcanvasStack.push(offcanvas);
    }

    trackOpenLayer(offcanvas);
    syncOpenLayerIsolation();
    syncDocumentScrollLock();
    focusOpenLayer(offcanvas);
  }

  /* Close whichever blocking layer is actually on top of the stack right now. */
  function closeTopOpenLayer() {
    var topLayer = getTopOpenLayer();

    if (!topLayer) {
      return;
    }

    if (topLayer.matches(selectors.modal)) {
      closeModal(topLayer);
      return;
    }

    if (topLayer.matches(selectors.offcanvas)) {
      closeOffcanvas(topLayer);
    }
  }
