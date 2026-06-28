/*
  ============================================================================
  FNLLA Web SOURCE MODULE: ACCORDION STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Collapse one accordion item and remove it from the focus flow. */
  function closeAccordionPanel(button, panel) {
    button.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    setElementInertState(panel, true);

    var item = button.closest(selectors.accordionItem);

    if (item) {
      item.classList.remove("is-open");
    }
  }

  /* Expand one accordion item and restore its panel to the focus flow. */
  function openAccordionPanel(button, panel) {
    button.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setElementInertState(panel, false);

    var item = button.closest(selectors.accordionItem);

    if (item) {
      item.classList.add("is-open");
    }
  }

  /* In single-open accordions, close every sibling except the current one. */
  function closeSiblingAccordionItems(group, currentButton) {
    toArray(group.querySelectorAll(selectors.accordionButton)).forEach(function (button) {
      if (button === currentButton) {
        return;
      }

      var panel = getControlledElement(button);

      if (panel) {
        closeAccordionPanel(button, panel);
      }
    });
  }

  /* Support Arrow, Home and End navigation across accordion triggers. */
  function focusAccordionTrigger(group, currentButton, direction) {
    var buttons = toArray(group.querySelectorAll(selectors.accordionButton));
    var currentIndex = buttons.indexOf(currentButton);

    if (!buttons.length || currentIndex === -1) {
      return;
    }

    if (direction === "first") {
      buttons[0].focus();
      return;
    }

    if (direction === "last") {
      buttons[buttons.length - 1].focus();
      return;
    }

    if (direction === "next") {
      buttons[(currentIndex + 1) % buttons.length].focus();
      return;
    }

    if (direction === "previous") {
      buttons[(currentIndex - 1 + buttons.length) % buttons.length].focus();
    }
  }
