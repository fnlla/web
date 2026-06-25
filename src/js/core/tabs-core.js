/*
  ============================================================================
  FNLLA UI SOURCE MODULE: TABS STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Only treat tab buttons with a real controlled panel as valid tabs. */
  function getTabButtons(group) {
    return toArray(group.querySelectorAll(selectors.tab)).filter(function (button) {
      return !!getControlledElement(button);
    });
  }

  /* Update selected tab state and panel visibility for one tab group. */
  function activateTab(group, nextButton, options) {
    var settings = options || {};
    var buttons = getTabButtons(group);

    if (!nextButton || buttons.indexOf(nextButton) === -1) {
      return;
    }

    buttons.forEach(function (button) {
      var panel = getControlledElement(button);
      var isSelected = button === nextButton;

      button.setAttribute("aria-selected", isSelected ? "true" : "false");
      button.setAttribute("tabindex", isSelected ? "0" : "-1");

      if (!panel) {
        return;
      }

      panel.hidden = !isSelected;
      panel.setAttribute("aria-hidden", isSelected ? "false" : "true");
      setElementInertState(panel, !isSelected);
    });

    if (settings.focusButton) {
      nextButton.focus();
    }
  }

  /* Move focus and selection across the valid tab buttons in a group. */
  function focusTabButton(group, currentButton, direction) {
    var buttons = getTabButtons(group);
    var currentIndex = buttons.indexOf(currentButton);

    if (!buttons.length || currentIndex === -1) {
      return;
    }

    if (direction === "first") {
      activateTab(group, buttons[0], { focusButton: true });
      return;
    }

    if (direction === "last") {
      activateTab(group, buttons[buttons.length - 1], { focusButton: true });
      return;
    }

    if (direction === "next") {
      activateTab(group, buttons[(currentIndex + 1) % buttons.length], { focusButton: true });
      return;
    }

    if (direction === "previous") {
      activateTab(group, buttons[(currentIndex - 1 + buttons.length) % buttons.length], { focusButton: true });
    }
  }

  /* Read tablist orientation so keyboard behavior can match the axis. */
  function getTabListOrientation(group) {
    var tabList = group.querySelector(selectors.tabList);
    var orientation = tabList ? tabList.getAttribute("aria-orientation") : "";

    return orientation === "vertical" ? "vertical" : "horizontal";
  }
