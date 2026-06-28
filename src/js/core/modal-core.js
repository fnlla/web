/*
  ============================================================================
  FNLLA UI SOURCE MODULE: MODAL STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Prefer an explicit initial-focus target, then fall back to first focusable. */
  function getModalInitialFocusTarget(modal) {
    if (!modal) {
      return null;
    }

    var preferredTarget = modal.querySelector(selectors.modalInitialFocus);
    if (canReceiveFocus(preferredTarget)) {
      return preferredTarget;
    }

    return getFocusableElements(modal)[0] || null;
  }

  /* Collect page branches that must be isolated while a modal is open. */
  function collectModalIsolationTargets(modal) {
    var targets = [];
    var current = modal;

    while (current && current !== document.body) {
      var parent = current.parentElement;

      if (!parent) {
        break;
      }

      toArray(parent.children).forEach(function (sibling) {
        if (sibling !== current && sibling.tagName !== "SCRIPT" && targets.indexOf(sibling) === -1) {
          targets.push(sibling);
        }
      });

      current = parent;
    }

    return targets;
  }

  /* Keep one ordered stack for every active dialog-like layer. */
  function trackOpenLayer(layer) {
    if (!layer) {
      return;
    }

    openLayerStack = openLayerStack.filter(function (item) {
      return item !== layer;
    });
    openLayerStack.push(layer);
  }

  /* Remove one layer from the active stack without disturbing the rest. */
  function untrackOpenLayer(layer) {
    openLayerStack = openLayerStack.filter(function (item) {
      return item !== layer;
    });
  }

  /* Return the top-most active dialog or panel across all overlay families. */
  function getTopOpenLayer() {
    return openLayerStack.length ? openLayerStack[openLayerStack.length - 1] : null;
  }

  /* Restore baseline accessibility state before replaying the active layers. */
  function restoreOverlayIsolationState() {
    overlayIsolationStateMap.forEach(function (state, element) {
      if (!state || !element) {
        return;
      }

      if (state.ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", state.ariaHidden);
      }

      setElementInertState(element, state.wasInert);
    });

    overlayIsolationStateMap.clear();
  }

  /* Record one element's baseline state before a layer overrides it. */
  function rememberOverlayIsolationState(element) {
    if (!element || overlayIsolationStateMap.has(element)) {
      return;
    }

    overlayIsolationStateMap.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      wasInert: element.hasAttribute("inert")
    });
  }

  /* Apply isolation rules for one open dialog-like layer. */
  function applyLayerIsolation(layer) {
    collectModalIsolationTargets(layer).forEach(function (element) {
      rememberOverlayIsolationState(element);
      element.setAttribute("aria-hidden", "true");
      setElementInertState(element, true);
    });
  }

  /* Reveal the active layer and its ancestor branch before replaying isolation. */
  function revealLayerBranch(layer) {
    var current = layer;

    while (current && current !== document.body) {
      rememberOverlayIsolationState(current);
      current.setAttribute("aria-hidden", "false");
      setElementInertState(current, false);
      current = current.parentElement;
    }
  }

  /* Rebuild isolation from the current stack so nested layers stay consistent. */
  function syncOpenLayerIsolation() {
    restoreOverlayIsolationState();
    openLayerStack.forEach(function (layer) {
      revealLayerBranch(layer);
      applyLayerIsolation(layer);
    });
  }

  /* Keep body scroll locked whenever at least one active layer remains open. */
  function syncDocumentScrollLock() {
    if (openLayerStack.length) {
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.removeProperty("overflow");
  }

  /* Close transient menus before elevating a blocking overlay above the page. */
  function closeTransientUi() {
    closeAllDropdowns(null);
    closeAllPopovers(null);
    closeOpenNavigation();
  }

  /* Pick the best focus destination for the currently active top layer. */
  function focusOpenLayer(layer) {
    if (!layer) {
      return;
    }

    var preferredSelector = null;

    if (layer.matches(selectors.modal)) {
      preferredSelector = selectors.modalInitialFocus;
    } else if (layer.matches(selectors.offcanvas)) {
      preferredSelector = selectors.offcanvasInitialFocus;
    }

    if (preferredSelector) {
      var preferredTarget = layer.querySelector(preferredSelector);

      if (canReceiveFocus(preferredTarget)) {
        preferredTarget.focus();
        return;
      }
    }

    var firstFocusable = getFocusableElements(layer)[0] || null;

    if (firstFocusable) {
      firstFocusable.focus();
      return;
    }

    if (!layer.hasAttribute("tabindex")) {
      layer.setAttribute("tabindex", "-1");
    }

    layer.focus();
  }

  /* Close one modal, restore isolation and return focus only when it is safe. */
  function closeModal(modal) {
    if (!modal) {
      return;
    }

    var isTracked = openModalStack.indexOf(modal) !== -1 || openLayerStack.indexOf(modal) !== -1;

    if (!isTracked && modal.hidden) {
      return;
    }

    var wasTopLayer = getTopOpenLayer() === modal;
    var trigger = modalTriggerMap.get(modal);

    modal.hidden = true;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    setElementInertState(modal, true);
    openModalStack = openModalStack.filter(function (item) {
      return item !== modal;
    });
    untrackOpenLayer(modal);
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

  /* Open one modal, lock body scroll and move focus inside the dialog. */
  function openModal(modal, trigger) {
    if (!modal) {
      return;
    }

    closeTransientUi();
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    setElementInertState(modal, false);
    modalTriggerMap.set(modal, trigger || modalTriggerMap.get(modal) || document.activeElement);

    if (openModalStack.indexOf(modal) === -1) {
      openModalStack.push(modal);
    }

    trackOpenLayer(modal);
    syncOpenLayerIsolation();
    syncDocumentScrollLock();
    focusOpenLayer(modal);
  }

  /* Close the most recently opened modal first. */
  function closeTopModal() {
    if (!openModalStack.length) {
      return;
    }

    closeModal(openModalStack[openModalStack.length - 1]);
  }
