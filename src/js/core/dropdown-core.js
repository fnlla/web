/*
  ============================================================================
  FNLLA Web SOURCE MODULE: DROPDOWN STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Close one dropdown and optionally return focus to its toggle. */
  function closeDropdown(dropdown, options) {
    var settings = options || {};
    var toggle = dropdown.querySelector(selectors.dropdownToggle);
    var menu = dropdown.querySelector(selectors.dropdownMenu);

    dropdown.classList.remove("is-open");

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }

    if (menu) {
      menu.hidden = true;
      menu.setAttribute("aria-hidden", "true");
      setElementInertState(menu, true);
    }

    if (settings.restoreFocus && canReceiveFocus(toggle)) {
      toggle.focus();
    }
  }

  /* Move focus to the first or last interactive item inside the menu. */
  function focusDropdownItem(dropdown, direction) {
    var menu = dropdown.querySelector(selectors.dropdownMenu);
    var items = getFocusableElements(menu);

    if (!items.length) {
      return;
    }

    if (direction === "last") {
      items[items.length - 1].focus();
      return;
    }

    items[0].focus();
  }

  /* Open one dropdown and optionally move focus inside it. */
  function openDropdown(dropdown, options) {
    var settings = options || {};
    var toggle = dropdown.querySelector(selectors.dropdownToggle);
    var menu = dropdown.querySelector(selectors.dropdownMenu);

    dropdown.classList.add("is-open");

    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }

    if (menu) {
      menu.hidden = false;
      menu.setAttribute("aria-hidden", "false");
      setElementInertState(menu, false);
    }

    if (settings.focusItem) {
      focusDropdownItem(dropdown, settings.focusItem);
    }
  }

  /* Close every dropdown except the one explicitly preserved. */
  function closeAllDropdowns(exceptDropdown) {
    toArray(document.querySelectorAll(selectors.dropdown)).forEach(function (dropdown) {
      if (dropdown !== exceptDropdown) {
        closeDropdown(dropdown);
      }
    });
  }

  /* Toggle one dropdown while ensuring peer dropdowns are closed first. */
  function toggleDropdown(dropdown) {
    var isOpen = dropdown.classList.contains("is-open");

    closeAllDropdowns(isOpen ? null : dropdown);

    if (isOpen) {
      closeDropdown(dropdown);
    } else {
      openDropdown(dropdown);
    }
  }
