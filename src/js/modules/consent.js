/*
  ============================================================================
  FNLLA UI SOURCE MODULE: CONSENT INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function initConsent(root) {
    getScopedMatches(root, selectors.consent).forEach(function (element) {
      if (initializationState.consent.has(element)) {
        return;
      }

      initializationState.consent.add(element);
      element.setAttribute("aria-hidden", "true");
    });

    getScopedMatches(root, selectors.consentOpen).forEach(function (button) {
      if (initializationState.consentOpen.has(button)) {
        return;
      }

      initializationState.consentOpen.add(button);
      button.addEventListener("click", function (event) {
        var modal = getConsentModalElement();

        event.preventDefault();
        syncConsentInputs(modal || document, getStoredConsentSnapshot());

        if (modal) {
          openModal(modal, button);
        }
      });
    });

    getScopedMatches(root, selectors.consentAccept).forEach(function (button) {
      if (initializationState.consentAccept.has(button)) {
        return;
      }

      initializationState.consentAccept.add(button);
      button.addEventListener("click", function (event) {
        var mode = button.getAttribute("data-fnlla-consent-accept");
        var modal = button.closest(selectors.modal);
        var nextState = {};

        event.preventDefault();
        defaultConsentCategories.forEach(function (category) {
          nextState[category] = mode !== "necessary";
        });

        saveConsentState(nextState);

        if (modal) {
          closeModal(modal);
        }
      });
    });

    getScopedMatches(root, selectors.consentSave).forEach(function (button) {
      if (initializationState.consentSave.has(button)) {
        return;
      }

      initializationState.consentSave.add(button);
      button.addEventListener("click", function (event) {
        var scope = button.closest(selectors.modal) || button.closest(selectors.consent) || document;
        var modal = button.closest(selectors.modal);

        event.preventDefault();
        saveConsentState(collectConsentStateFromScope(scope));

        if (modal) {
          closeModal(modal);
        }
      });
    });

    getScopedMatches(root, selectors.consentReset).forEach(function (button) {
      if (initializationState.consentReset.has(button)) {
        return;
      }

      initializationState.consentReset.add(button);
      button.addEventListener("click", function (event) {
        event.preventDefault();
        clearCookieValue(getConsentCookieName());
        syncConsentState();
      });
    });

    syncConsentState();
  }
