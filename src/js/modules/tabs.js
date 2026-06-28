/*
  ============================================================================
  FNLLA Web SOURCE MODULE: TABS INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind one accessible tab system for each documented tabs wrapper. */
  function initTabs(root) {
    getScopedMatches(root, selectors.tabs).forEach(function (tabs) {
      if (initializationState.tabs.has(tabs)) {
        return;
      }

      var tabList = tabs.querySelector(selectors.tabList);
      var buttons = getTabButtons(tabs);
      var selectedButton = null;
      var fallbackButton = buttons[0] || null;

      if (!tabList || !buttons.length) {
        return;
      }

      initializationState.tabs.add(tabs);
      tabList.setAttribute("role", "tablist");

      if (!tabList.hasAttribute("aria-orientation")) {
        tabList.setAttribute("aria-orientation", "horizontal");
      }

      buttons.forEach(function (button) {
        var panel = getControlledElement(button);

        if (!panel) {
          return;
        }

        if (!button.id) {
          button.id = createFnllaUiId(idPrefixes.tabButton);
        }

        button.setAttribute("role", "tab");
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", button.id);

        if (button.getAttribute("aria-selected") === "true") {
          selectedButton = button;
        }

        button.addEventListener("click", function () {
          activateTab(tabs, button);
        });

        button.addEventListener("keydown", function (event) {
          var orientation = getTabListOrientation(tabs);

          if ((orientation === "horizontal" && event.key === "ArrowRight") || (orientation === "vertical" && event.key === "ArrowDown")) {
            event.preventDefault();
            focusTabButton(tabs, button, "next");
          }

          if ((orientation === "horizontal" && event.key === "ArrowLeft") || (orientation === "vertical" && event.key === "ArrowUp")) {
            event.preventDefault();
            focusTabButton(tabs, button, "previous");
          }

          if (event.key === "Home") {
            event.preventDefault();
            focusTabButton(tabs, button, "first");
          }

          if (event.key === "End") {
            event.preventDefault();
            focusTabButton(tabs, button, "last");
          }
        });
      });

      activateTab(tabs, selectedButton || fallbackButton);
    });
  }
