/*
  ============================================================================
  FNLLA Web SOURCE MODULE: DROPDOWN INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind dropdown behavior to every documented dropdown wrapper in scope. */
  function initDropdowns(root) {
    getScopedMatches(root, selectors.dropdown).forEach(function (dropdown) {
      if (initializationState.dropdown.has(dropdown)) {
        return;
      }

      var toggle = dropdown.querySelector(selectors.dropdownToggle);
      var menu = dropdown.querySelector(selectors.dropdownMenu);

      if (!toggle || !menu) {
        return;
      }

      initializationState.dropdown.add(dropdown);

      if (!toggle.id) {
        toggle.id = createFnllaUiId(idPrefixes.dropdownToggle);
      }

      if (!menu.id) {
        menu.id = createFnllaUiId(idPrefixes.dropdownMenu);
      }

      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", menu.id);
      menu.setAttribute("aria-labelledby", toggle.id);
      menu.hidden = true;
      menu.setAttribute("aria-hidden", "true");
      setElementInertState(menu, true);

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(dropdown);
      });

      toggle.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          closeAllDropdowns(dropdown);
          openDropdown(dropdown, { focusItem: "first" });
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          closeAllDropdowns(dropdown);
          openDropdown(dropdown, { focusItem: "last" });
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeDropdown(dropdown, { restoreFocus: true });
          event.stopPropagation();
        }
      });

      dropdown.addEventListener("focusout", function () {
        window.setTimeout(function () {
          if (!dropdown.contains(document.activeElement)) {
            closeDropdown(dropdown);
          }
        }, 0);
      });

      menu.addEventListener("keydown", function (event) {
        var items = getFocusableElements(menu);
        var currentIndex = items.indexOf(document.activeElement);

        if (event.key === "Escape") {
          event.preventDefault();
          closeDropdown(dropdown, { restoreFocus: true });
          event.stopPropagation();
          return;
        }

        if (!items.length) {
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          items[(currentIndex + 1 + items.length) % items.length].focus();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length].focus();
        }

        if (event.key === "Home") {
          event.preventDefault();
          items[0].focus();
        }

        if (event.key === "End") {
          event.preventDefault();
          items[items.length - 1].focus();
        }
      });
    });
  }
