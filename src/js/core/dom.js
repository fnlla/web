/*
  ============================================================================
  FNLLA Web SOURCE MODULE: DOM AND FOCUS HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Normalize array-like DOM collections into real arrays. */
  function toArray(collection) {
    return Array.prototype.slice.call(collection || []);
  }

  /* Treat document-like roots as the global document scope. */
  function isDocumentRoot(root) {
    return !root || root === document || root === document.documentElement || root === document.body;
  }

  /* Accept documents, elements and fragments. Fall back to `document`. */
  function normalizeRoot(root) {
    if (isDocumentRoot(root)) {
      return document;
    }

    if (root && (root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11)) {
      return root;
    }

    return document;
  }

  /* Query a scope while also supporting the root node itself as a match. */
  function getScopedMatches(root, selector) {
    var scope = normalizeRoot(root);
    var matches = [];

    if (scope === document) {
      return toArray(document.querySelectorAll(selector));
    }

    if (typeof scope.matches === "function" && scope.matches(selector)) {
      matches.push(scope);
    }

    if (typeof scope.querySelectorAll === "function") {
      matches = matches.concat(toArray(scope.querySelectorAll(selector)));
    }

    return matches;
  }

  /* Generate readable unique IDs for components that need them. */
  function createFnllaUiId(prefix) {
    fnllaUiIdCounter += 1;
    return prefix + "-" + fnllaUiIdCounter;
  }

  /* Apply or clear inert state used to remove hidden regions from focus flow. */
  function setElementInertState(element, shouldBeInert) {
    if (!element) {
      return;
    }

    if (shouldBeInert) {
      element.setAttribute("inert", "");
      return;
    }

    element.removeAttribute("inert");
  }

  /* Ignore nodes hidden through HTML, ARIA or inert state. */
  function isElementVisibleForFocus(element) {
    if (!element) {
      return false;
    }

    return !element.closest("[hidden], [aria-hidden='true'], [inert]");
  }

  /* Ignore controls disabled through a parent fieldset unless the first legend owns them. */
  function isElementDisabledByFieldset(element) {
    if (!element || typeof element.closest !== "function") {
      return false;
    }

    var fieldset = element.closest("fieldset[disabled]");

    if (!fieldset) {
      return false;
    }

    var firstLegend = fieldset.querySelector("legend");

    return !firstLegend || !firstLegend.contains(element);
  }

  /* Reject disconnected or CSS-hidden nodes before sending focus to them. */
  function isElementRendered(element) {
    if (!element || element.isConnected === false) {
      return false;
    }

    if (typeof window.getComputedStyle !== "function") {
      return true;
    }

    var computed = window.getComputedStyle(element);

    if (!computed) {
      return true;
    }

    if (computed.display === "none" || computed.visibility === "hidden" || computed.visibility === "collapse") {
      return false;
    }

    return true;
  }

  /* Check whether a node can safely receive focus right now. */
  function canReceiveFocus(element) {
    if (!element || typeof element.focus !== "function") {
      return false;
    }

    if (!isElementVisibleForFocus(element)) {
      return false;
    }

    if (!isElementRendered(element)) {
      return false;
    }

    if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    if (element.getAttribute("tabindex") === "-1") {
      return false;
    }

    if (isElementDisabledByFieldset(element)) {
      return false;
    }

    return true;
  }

  /* Collect all focusable descendants inside a given container. */
  function getFocusableElements(container) {
    if (!container) {
      return [];
    }

    return toArray(container.querySelectorAll("button:not([disabled]), [href], input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
      .filter(function (element) {
        return canReceiveFocus(element) && element.getAttribute("aria-disabled") !== "true";
      });
  }

  /* Resolve the single element controlled by an aria-controls trigger. */
  function getControlledElement(trigger) {
    var controlsId = trigger ? trigger.getAttribute("aria-controls") : "";

    if (controlsId) {
      return document.getElementById(controlsId);
    }

    return null;
  }

  /* Resolve a modal selector while safely ignoring invalid selectors. */
  function resolveModalBySelector(selector) {
    if (!selector) {
      return null;
    }

    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  /* Resolve a selector string or direct element reference. */
  function resolveElementReference(target, selector) {
    if (!target) {
      return null;
    }

    if (typeof target === "string") {
      try {
        return document.querySelector(target);
      } catch (error) {
        return null;
      }
    }

    if (target.nodeType === 1 && (!selector || target.matches(selector))) {
      return target;
    }

    return null;
  }
