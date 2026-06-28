/*
  ============================================================================
  FNLLA UI SOURCE MODULE: CONSENT STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function getConsentRuntimeRoot() {
    return document.querySelector(selectors.consent) || document.querySelector(selectors.consentModal) || getTitleRootElement();
  }

  function getConsentCookieName() {
    var root = getConsentRuntimeRoot();
    var configured = root ? normalizeTitlePart(root.getAttribute(attributeNames.consentCookie)) : "";

    return configured || "fnlla-consent";
  }

  function getConsentExpiryDays() {
    var root = getConsentRuntimeRoot();
    var configured = root ? Number(root.getAttribute(attributeNames.consentExpiryDays)) : NaN;

    return Number.isFinite(configured) && configured > 0 ? configured : 180;
  }

  function getDefaultConsentState() {
    return {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      stored: false
    };
  }

  function cloneConsentState(state) {
    return {
      necessary: state.necessary === true,
      preferences: state.preferences === true,
      analytics: state.analytics === true,
      marketing: state.marketing === true,
      stored: state.stored === true
    };
  }

  function normalizeConsentState(input, stored) {
    var base = getDefaultConsentState();
    var source = input && typeof input === "object" ? input : {};

    defaultConsentCategories.forEach(function (category) {
      base[category] = source[category] === true;
    });

    base.necessary = true;
    base.stored = stored === true;
    return base;
  }

  function readCookieValue(name) {
    var encodedName = encodeURIComponent(name) + "=";
    var match = document.cookie.split(/;\s*/).find(function (entry) {
      return entry.indexOf(encodedName) === 0;
    });

    return match ? decodeURIComponent(match.slice(encodedName.length)) : "";
  }

  function writeCookieValue(name, value, expiryDays) {
    var maxAge = Math.round(expiryDays * 24 * 60 * 60);
    var cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/; max-age=" + maxAge + "; SameSite=Lax";

    if (window.location && window.location.protocol === "https:") {
      cookie += "; Secure";
    }

    document.cookie = cookie;
  }

  function clearCookieValue(name) {
    document.cookie = encodeURIComponent(name) + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }

  function getStoredConsentSnapshot() {
    var rawValue = readCookieValue(getConsentCookieName());

    if (!rawValue) {
      return getDefaultConsentState();
    }

    try {
      return normalizeConsentState(JSON.parse(rawValue), true);
    } catch (error) {
      clearCookieValue(getConsentCookieName());
      return getDefaultConsentState();
    }
  }

  function getConsentModalElement() {
    var root = getConsentRuntimeRoot();
    var selector = root ? root.getAttribute("data-fnlla-consent-settings") : "";
    var modal = selector ? resolveModalBySelector(selector) : null;

    return modal || document.querySelector(selectors.consentModal);
  }

  function updateConsentRootAttributes(state) {
    var root = document.documentElement;

    if (!root) {
      return;
    }

    root.setAttribute("data-fnlla-consent-ready", state.stored ? "true" : "false");

    defaultConsentCategories.forEach(function (category) {
      root.setAttribute("data-fnlla-consent-" + category, state[category] ? "granted" : "denied");
    });
  }

  function syncConsentInputs(scope, state) {
    getScopedMatches(scope || document, selectors.consentCategory).forEach(function (input) {
      var category = input.getAttribute(attributeNames.consentCategory) || "";

      if (category === "necessary") {
        input.checked = true;
        input.disabled = true;
        return;
      }

      if (defaultConsentCategories.indexOf(category) === -1) {
        return;
      }

      input.checked = state[category] === true;
    });
  }

  function syncConsentBannerVisibility(state) {
    getScopedMatches(document, selectors.consent).forEach(function (element) {
      var shouldShow = state.stored !== true;

      element.hidden = !shouldShow;
      element.classList.toggle("is-visible", shouldShow);
      element.setAttribute("aria-hidden", shouldShow ? "false" : "true");
      setElementInertState(element, !shouldShow);
    });
  }

  function dispatchConsentChange(state) {
    if (typeof window.CustomEvent !== "function") {
      return;
    }

    document.dispatchEvent(new CustomEvent("fnlla:consentchange", {
      detail: {
        state: cloneConsentState(state)
      }
    }));
  }

  function applyConsentState(state, shouldDispatch) {
    var normalized = normalizeConsentState(state, state && state.stored === true);

    updateConsentRootAttributes(normalized);
    syncConsentBannerVisibility(normalized);
    syncConsentInputs(document, normalized);

    if (shouldDispatch) {
      dispatchConsentChange(normalized);
    }

    return normalized;
  }

  function saveConsentState(state) {
    var normalized = normalizeConsentState(state, true);

    writeCookieValue(getConsentCookieName(), JSON.stringify(normalized), getConsentExpiryDays());
    applyConsentState(normalized, true);
    return cloneConsentState(normalized);
  }

  function collectConsentStateFromScope(scope) {
    var nextState = getDefaultConsentState();
    var inputs = getScopedMatches(scope || document, selectors.consentCategory);

    if (!inputs.length && scope !== document) {
      inputs = getScopedMatches(document, selectors.consentCategory);
    }

    inputs.forEach(function (input) {
      var category = input.getAttribute(attributeNames.consentCategory) || "";

      if (defaultConsentCategories.indexOf(category) === -1) {
        return;
      }

      nextState[category] = input.checked === true;
    });

    return nextState;
  }

  function syncConsentState() {
    return applyConsentState(getStoredConsentSnapshot(), false);
  }

