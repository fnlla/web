/*
  ============================================================================
  FNLLA Web SOURCE MODULE: ACCORDION INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind accordion buttons, panels and keyboard navigation in scope. */
  function initAccordions(root) {
    getScopedMatches(root, selectors.accordion).forEach(function (accordion) {
      toArray(accordion.querySelectorAll(selectors.accordionButton)).forEach(function (button) {
        if (initializationState.accordionButton.has(button)) {
          return;
        }

        var panel = getControlledElement(button);

        if (!panel) {
          return;
        }

        initializationState.accordionButton.add(button);

        if (!button.id) {
          button.id = createFnllaWebId(idPrefixes.accordionButton);
        }

        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", button.id);

        var isExpanded = button.getAttribute("aria-expanded") === "true";
        panel.hidden = !isExpanded;

        if (isExpanded) {
          openAccordionPanel(button, panel);
        } else {
          closeAccordionPanel(button, panel);
        }

        button.addEventListener("click", function () {
          var expanded = button.getAttribute("aria-expanded") === "true";

          if (accordion.hasAttribute(attributeNames.accordionSingle)) {
            closeSiblingAccordionItems(accordion, button);
          }

          if (expanded) {
            closeAccordionPanel(button, panel);
          } else {
            openAccordionPanel(button, panel);
          }
        });

        button.addEventListener("keydown", function (event) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            focusAccordionTrigger(accordion, button, "next");
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            focusAccordionTrigger(accordion, button, "previous");
          }

          if (event.key === "Home") {
            event.preventDefault();
            focusAccordionTrigger(accordion, button, "first");
          }

          if (event.key === "End") {
            event.preventDefault();
            focusAccordionTrigger(accordion, button, "last");
          }
        });
      });
    });
  }
