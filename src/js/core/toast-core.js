/*
  ============================================================================
  FNLLA UI SOURCE MODULE: TOAST STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Clear any pending auto-hide timer before changing toast state. */
  function clearToastTimer(toast) {
    var timerId = toastTimerMap.get(toast);

    if (timerId) {
      window.clearTimeout(timerId);
      toastTimerMap.delete(toast);
    }
  }

  /* Start a new auto-hide timer when the toast requests it. */
  function scheduleToastAutoHide(toast) {
    var delay = parseInt(toast.getAttribute(attributeNames.toastAutohide), 10);

    clearToastTimer(toast);

    if (!delay || delay < 0) {
      return;
    }

    toastTimerMap.set(toast, window.setTimeout(function () {
      hideToast(toast);
    }, delay));
  }

  /* Reveal one toast and arm its optional auto-hide timer. */
  function showToast(toast) {
    if (!toast) {
      return;
    }

    if (!toast.id) {
      toast.id = createFnllaUiId(idPrefixes.toast);
    }

    toast.hidden = false;
    toast.classList.add("is-visible");
    toast.setAttribute("aria-hidden", "false");
    scheduleToastAutoHide(toast);
  }

  /* Hide one toast immediately and clear any pending timer. */
  function hideToast(toast) {
    if (!toast) {
      return;
    }

    clearToastTimer(toast);
    toast.classList.remove("is-visible");
    toast.setAttribute("aria-hidden", "true");
    toast.hidden = true;
  }
