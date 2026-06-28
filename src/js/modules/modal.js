/*
  ============================================================================
  FNLLA Web SOURCE MODULE: MODAL INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind every modal trigger so it can resolve and open its target dialog. */
  function initModalTriggers(root) {
    getScopedMatches(root, selectors.modalTrigger).forEach(function (trigger) {
      if (initializationState.modalTrigger.has(trigger)) {
        return;
      }

      var selector = trigger.getAttribute(attributeNames.modalOpen);
      var modal = resolveModalBySelector(selector);

      if (!modal) {
        return;
      }

      initializationState.modalTrigger.add(trigger);

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        openModal(modal, trigger);
      });
    });
  }

  /* Prepare modal shells and close controls inside the current scope. */
  function initModals(root) {
    getScopedMatches(root, selectors.modal).forEach(function (modal) {
      if (!initializationState.modal.has(modal)) {
        initializationState.modal.add(modal);

        if (!modal.id) {
          modal.id = createFnllaUiId(idPrefixes.modal);
        }

        if (!modal.hasAttribute("role")) {
          modal.setAttribute("role", "dialog");
        }

        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-hidden", "true");
        modal.hidden = true;
        setElementInertState(modal, true);

        modal.addEventListener("click", function (event) {
          var clickedClose = event.target.closest(selectors.modalClose);
          var clickedBackdrop = event.target === modal;

          if (clickedClose || clickedBackdrop) {
            closeModal(modal);
          }
        });
      }
    });

    getScopedMatches(root, selectors.modalClose).forEach(function (button) {
      if (initializationState.modalClose.has(button)) {
        return;
      }

      initializationState.modalClose.add(button);

      button.addEventListener("click", function (event) {
        var modal = event.currentTarget.closest(selectors.modal);

        if (!modal) {
          return;
        }

        event.preventDefault();
        closeModal(modal);
      });
    });
  }
