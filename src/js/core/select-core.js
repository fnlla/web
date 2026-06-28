/*
  ============================================================================
  FNLLA Web SOURCE MODULE: CUSTOM SELECT CORE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function closeSelectMenu(select, options) {
    var settings = options || {};
    var state = customSelectStateMap.get(select);

    if (!state) {
      return;
    }

    state.shell.classList.remove("is-open");
    state.toggle.setAttribute("aria-expanded", "false");
    state.menu.hidden = true;
    state.menu.setAttribute("aria-hidden", "true");
    setElementInertState(state.menu, true);

    if (settings.restoreFocus && canReceiveFocus(state.toggle)) {
      state.toggle.focus();
    }
  }

  function closeAllSelectMenus(exceptSelect) {
    toArray(document.querySelectorAll(selectors.selectNative)).forEach(function (select) {
      if (select !== exceptSelect) {
        closeSelectMenu(select);
      }
    });
  }
