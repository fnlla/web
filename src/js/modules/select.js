/*
  ============================================================================
  FNLLA Web SOURCE MODULE: CUSTOM SELECT INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  function initSelects(root) {
    getScopedMatches(root, selectors.select).forEach(function (select) {
      var optionObserver;
      if (initializationState.select.has(select) || !isSingleSelectField(select)) {
        return;
      }

      initializationState.select.add(select);

      var shell = document.createElement("div");
      var toggle = document.createElement("button");
      var valueLabel = document.createElement("span");
      var menu = document.createElement("div");
      var associatedLabels = getAssociatedSelectLabels(select);
      var labelIds = [];

      shell.className = "select-shell";
      shell.setAttribute("data-fnlla-select-shell", "");

      select.parentNode.insertBefore(shell, select);
      shell.appendChild(select);

      select.setAttribute("data-fnlla-select-native", "");
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      select.classList.add("select-native");

      toggle.type = "button";
      toggle.className = "select-control";
      toggle.id = createFnllaUiId(idPrefixes.selectToggle);
      toggle.setAttribute("data-fnlla-select-toggle", "");
      toggle.setAttribute("aria-haspopup", "listbox");
      toggle.setAttribute("aria-expanded", "false");

      valueLabel.className = "select-value";
      valueLabel.id = createFnllaUiId("select-value");
      toggle.appendChild(valueLabel);
      shell.appendChild(toggle);

      menu.className = "select-menu scrollbar scrollbar-thin";
      menu.id = createFnllaUiId(idPrefixes.selectMenu);
      menu.hidden = true;
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-controls", menu.id);
      setElementInertState(menu, true);
      shell.appendChild(menu);

      customSelectStateMap.set(select, {
        shell: shell,
        toggle: toggle,
        valueLabel: valueLabel,
        menu: menu,
        optionButtons: [],
        observerQueued: false,
        typeaheadValue: "",
        typeaheadTimer: 0,
        rebuildMenu: function () {
          rebuildSelectMenu(select);
        }
      });

      associatedLabels.forEach(function (label) {
        if (!label.id) {
          label.id = createFnllaUiId("select-label");
        }

        labelIds.push(label.id);

        label.addEventListener("click", function (event) {
          if (select.disabled) {
            return;
          }

          event.preventDefault();
          toggle.focus();
        });
      });

      if (labelIds.length) {
        toggle.setAttribute("aria-labelledby", labelIds.join(" ") + " " + valueLabel.id);
      }

      menu.setAttribute("aria-labelledby", toggle.id);

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (shell.classList.contains("is-open")) {
          closeSelectMenu(select);
          return;
        }

        openSelectMenu(select, "selected");
      });

      toggle.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          openSelectMenu(select, "selected");
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          openSelectMenu(select, "last");
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSelectMenu(select, "selected");
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          openSelectMenu(select, "first");
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          openSelectMenu(select, "last");
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeSelectMenu(select, { restoreFocus: true });
          event.stopPropagation();
        }
      });

      menu.addEventListener("click", function (event) {
        var optionButton = event.target.closest(selectors.selectOption);
        var optionIndex;

        if (!optionButton) {
          return;
        }

        optionIndex = parseInt(optionButton.getAttribute("data-fnlla-option-index"), 10);
        selectOptionByIndex(select, optionIndex);
      });

      menu.addEventListener("keydown", function (event) {
        var optionButton = event.target.closest(selectors.selectOption);
        var optionIndex;

        if (event.key === "Escape") {
          event.preventDefault();
          closeSelectMenu(select, { restoreFocus: true });
          event.stopPropagation();
          return;
        }

        if (event.key === "Tab") {
          closeSelectMenu(select);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocusedSelectOption(select, 1);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocusedSelectOption(select, -1);
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          focusSelectOptionByMode(select, "first");
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          focusSelectOptionByMode(select, "last");
          return;
        }

        if ((event.key === "Enter" || event.key === " ") && optionButton) {
          event.preventDefault();
          optionIndex = parseInt(optionButton.getAttribute("data-fnlla-option-index"), 10);
          selectOptionByIndex(select, optionIndex);
          return;
        }

        if (event.key && event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          handleSelectTypeahead(select, event.key);
        }
      });

      shell.addEventListener("focusout", function () {
        window.setTimeout(function () {
          if (!shell.contains(document.activeElement)) {
            closeSelectMenu(select);
          }
        }, 0);
      });

      select.addEventListener("change", function () {
        syncSelectState(select);
      });
      select.addEventListener("input", function () {
        syncSelectState(select);
      });
      select.addEventListener("invalid", function () {
        syncSelectState(select);
      });

      if (select.form) {
        select.form.addEventListener("reset", function () {
          window.setTimeout(function () {
            rebuildSelectMenu(select);
            syncSelectState(select);
          }, 0);
        });
      }

      if (typeof MutationObserver === "function") {
        optionObserver = new MutationObserver(function () {
          queueSelectObserverRefresh(select);
        });
        optionObserver.observe(select, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["disabled", "hidden", "label", "selected", "value", "aria-invalid", "aria-describedby", "required"]
        });
      }

      rebuildSelectMenu(select);
      syncSelectState(select);
    });
  }
