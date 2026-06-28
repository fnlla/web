/*
  ============================================================================
  FNLLA Web SOURCE MODULE: CUSTOM SELECT SHARED HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function isSingleSelectField(target) {
    if (!target || target.tagName !== "SELECT") {
      return false;
    }

    if (target.multiple) {
      return false;
    }

    if (!target.hasAttribute("size")) {
      return true;
    }

    return target.getAttribute("size") === "1";
  }

  function getSelectState(select) {
    return customSelectStateMap.get(select) || null;
  }

  function getAssociatedSelectLabels(select) {
    return select && select.labels ? toArray(select.labels) : [];
  }

  function getSelectOptionText(option) {
    if (!option) {
      return "";
    }

    return String(option.text || option.label || option.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getSelectableSelectButtons(select) {
    var state = getSelectState(select);

    if (!state) {
      return [];
    }

    return state.optionButtons.filter(function (button) {
      return !button.disabled && button.getAttribute("aria-disabled") !== "true";
    });
  }

  function updateSelectButtonLabel(select) {
    var state = getSelectState(select);
    var selectedOption = select.options[select.selectedIndex] || null;
    var renderedLabel = getSelectOptionText(selectedOption);
    var isPlaceholder = !selectedOption || selectedOption.value === "";

    if (!state) {
      return;
    }

    state.valueLabel.textContent = renderedLabel || "\u00a0";
    state.toggle.classList.toggle("is-placeholder", isPlaceholder);
  }

  function syncSelectState(select) {
    var state = getSelectState(select);
    var describedBy = select.getAttribute("aria-describedby");
    var invalid = select.getAttribute("aria-invalid") === "true";

    if (!state) {
      return;
    }

    state.shell.classList.toggle("is-disabled", !!select.disabled);
    state.shell.classList.toggle("is-invalid", invalid);
    state.toggle.disabled = !!select.disabled;
    state.toggle.setAttribute("aria-invalid", invalid ? "true" : "false");

    if (select.required) {
      state.toggle.setAttribute("aria-required", "true");
    } else {
      state.toggle.removeAttribute("aria-required");
    }

    if (describedBy) {
      state.toggle.setAttribute("aria-describedby", describedBy);
    } else {
      state.toggle.removeAttribute("aria-describedby");
    }

    updateSelectButtonLabel(select);

    state.optionButtons.forEach(function (button) {
      var optionIndex = parseInt(button.getAttribute("data-fnlla-option-index"), 10);
      var option = select.options[optionIndex];
      var isSelected = optionIndex === select.selectedIndex;
      var isDisabled = !option || option.disabled;

      button.disabled = isDisabled;
      button.setAttribute("aria-disabled", isDisabled ? "true" : "false");
      button.setAttribute("aria-selected", isSelected ? "true" : "false");
      button.classList.toggle("is-selected", isSelected);
    });

    if (select.disabled) {
      closeSelectMenu(select);
    }
  }

  function focusSelectOption(button) {
    if (!button || typeof button.focus !== "function") {
      return;
    }

    button.focus();

    if (typeof button.scrollIntoView === "function") {
      button.scrollIntoView({ block: "nearest" });
    }
  }

  function focusSelectOptionByMode(select, mode) {
    var state = getSelectState(select);
    var buttons = getSelectableSelectButtons(select);
    var target = null;

    if (!state || !buttons.length) {
      return;
    }

    if (mode === "selected") {
      target = state.optionButtons.find(function (button) {
        return button.classList.contains("is-selected") && !button.disabled;
      }) || buttons[0];
    } else if (mode === "last") {
      target = buttons[buttons.length - 1];
    } else {
      target = buttons[0];
    }

    focusSelectOption(target);
  }

  function moveFocusedSelectOption(select, step) {
    var buttons = getSelectableSelectButtons(select);
    var currentIndex = buttons.indexOf(document.activeElement);

    if (!buttons.length) {
      return;
    }

    if (currentIndex === -1) {
      focusSelectOption(buttons[step > 0 ? 0 : buttons.length - 1]);
      return;
    }

    focusSelectOption(buttons[(currentIndex + step + buttons.length) % buttons.length]);
  }

  function handleSelectTypeahead(select, character) {
    var state = getSelectState(select);
    var buttons = getSelectableSelectButtons(select);
    var activeIndex = buttons.indexOf(document.activeElement);
    var searchValue = "";
    var startIndex = 0;
    var offset;
    var candidate;

    if (!state || !buttons.length) {
      return;
    }

    searchValue = (state.typeaheadValue + String(character || "")).toLowerCase();
    state.typeaheadValue = searchValue;

    if (state.typeaheadTimer) {
      window.clearTimeout(state.typeaheadTimer);
    }

    state.typeaheadTimer = window.setTimeout(function () {
      state.typeaheadValue = "";
      state.typeaheadTimer = 0;
    }, 260);

    startIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % buttons.length;

    for (offset = 0; offset < buttons.length; offset += 1) {
      candidate = buttons[(startIndex + offset) % buttons.length];

      if ((candidate.textContent || "").trim().toLowerCase().indexOf(searchValue) === 0) {
        focusSelectOption(candidate);
        return;
      }
    }
  }

  function queueSelectObserverRefresh(select) {
    var state = getSelectState(select);

    if (!state || state.observerQueued) {
      return;
    }

    state.observerQueued = true;
    window.setTimeout(function () {
      var refreshedState = getSelectState(select);

      if (!refreshedState) {
        return;
      }

      refreshedState.observerQueued = false;
      refreshedState.rebuildMenu();
      syncSelectState(select);
    }, 0);
  }
