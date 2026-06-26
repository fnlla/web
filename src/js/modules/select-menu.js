/*
  ============================================================================
  FNLLA UI SOURCE MODULE: CUSTOM SELECT MENU BUILDERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  function createSelectOptionButton(select, option, optionIndex) {
    var button = document.createElement("button");
    var label = document.createElement("span");
    var optionLabel = getSelectOptionText(option);
    var isSelected = optionIndex === select.selectedIndex;
    var isDisabled = !!option.disabled;

    button.type = "button";
    button.className = "select-option";
    button.setAttribute("role", "option");
    button.setAttribute("data-fnlla-select-option", "");
    button.setAttribute("data-fnlla-option-index", String(optionIndex));
    button.setAttribute("aria-selected", isSelected ? "true" : "false");
    button.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    button.disabled = isDisabled;
    button.classList.toggle("is-selected", isSelected);

    label.className = "select-option-label";
    label.textContent = optionLabel || "\u00a0";
    button.appendChild(label);
    return button;
  }

  function rebuildSelectMenu(select) {
    var state = getSelectState(select);
    var optionIndex = 0;

    if (!state) {
      return;
    }

    state.optionButtons = [];
    state.menu.innerHTML = "";

    toArray(select.children).forEach(function (child) {
      if (child.tagName === "OPTION") {
        if (!child.hidden) {
          var standaloneButton = createSelectOptionButton(select, child, optionIndex);

          state.optionButtons.push(standaloneButton);
          state.menu.appendChild(standaloneButton);
        }

        optionIndex += 1;
        return;
      }

      if (child.tagName === "OPTGROUP") {
        var group = document.createElement("div");
        var groupLabel = document.createElement("p");

        group.className = "select-group";
        groupLabel.className = "select-group-label";
        groupLabel.textContent = child.label || "";
        group.appendChild(groupLabel);

        toArray(child.children).forEach(function (optionChild) {
          var groupButton;

          if (optionChild.tagName !== "OPTION") {
            return;
          }

          if (!optionChild.hidden) {
            groupButton = createSelectOptionButton(select, optionChild, optionIndex);
            state.optionButtons.push(groupButton);
            group.appendChild(groupButton);
          }

          optionIndex += 1;
        });

        if (group.childElementCount > 1) {
          state.menu.appendChild(group);
        }
      }
    });

    syncSelectState(select);
  }

  function openSelectMenu(select, focusMode) {
    var state = getSelectState(select);

    if (!state || select.disabled) {
      return;
    }

    state.rebuildMenu();
    closeAllSelectMenus(select);
    state.shell.classList.add("is-open");
    state.toggle.setAttribute("aria-expanded", "true");
    state.menu.hidden = false;
    state.menu.setAttribute("aria-hidden", "false");
    setElementInertState(state.menu, false);

    if (focusMode) {
      focusSelectOptionByMode(select, focusMode);
    }
  }

  function selectOptionByIndex(select, optionIndex) {
    var option = select.options[optionIndex];

    if (!option || option.disabled) {
      return;
    }

    if (select.selectedIndex !== optionIndex) {
      select.selectedIndex = optionIndex;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      syncSelectState(select);
    }

    closeSelectMenu(select, { restoreFocus: true });
  }
