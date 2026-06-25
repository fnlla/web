/*
  ============================================================================
  FNLLA UI SOURCE MODULE: TOAST INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Prepare toasts, open triggers and close controls inside the scope. */
  function initToasts(root) {
    getScopedMatches(root, selectors.toast).forEach(function (toast) {
      if (!initializationState.toast.has(toast)) {
        initializationState.toast.add(toast);

        if (!toast.id) {
          toast.id = createFnllaUiId(idPrefixes.toast);
        }

        var startsVisible = toast.classList.contains("is-visible");
        toast.setAttribute("aria-hidden", startsVisible ? "false" : "true");
        toast.hidden = !startsVisible;

        if (startsVisible) {
          scheduleToastAutoHide(toast);
        }
      }
    });

    getScopedMatches(root, selectors.toastTrigger).forEach(function (trigger) {
      if (initializationState.toastTrigger.has(trigger)) {
        return;
      }

      var selector = trigger.getAttribute(attributeNames.toastOpen);
      var toast = resolveElementReference(selector, selectors.toast);

      if (!toast) {
        return;
      }

      initializationState.toastTrigger.add(trigger);

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        showToast(toast);
      });
    });

    getScopedMatches(root, selectors.toastClose).forEach(function (button) {
      if (initializationState.toastClose.has(button)) {
        return;
      }

      initializationState.toastClose.add(button);

      button.addEventListener("click", function (event) {
        var toast = event.currentTarget.closest(selectors.toast);

        if (!toast) {
          return;
        }

        event.preventDefault();
        hideToast(toast);
      });
    });
  }
