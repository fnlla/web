/*
  ============================================================================
  FNLLA UI SOURCE MODULE: RUNTIME BINDING AND PUBLIC API
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

  /* Attach the global document-level listeners once for the whole runtime. */
  function bindRuntimeHandlers() {
    if (!runtimeBindings.documentClick) {
      document.addEventListener("click", function (event) {
        toArray(document.querySelectorAll(selectors.selectNative)).forEach(function (select) {
          var state = customSelectStateMap.get(select);

          if (state && !state.shell.contains(event.target)) {
            closeSelectMenu(select);
          }
        });

        toArray(document.querySelectorAll(selectors.dropdown)).forEach(function (dropdown) {
          if (!dropdown.contains(event.target)) {
            closeDropdown(dropdown);
          }
        });

        toArray(document.querySelectorAll(selectors.popover)).forEach(function (popover) {
          if (!popover.contains(event.target)) {
            closePopover(popover);
          }
        });

        if (!isMobileNavigation()) {
          return;
        }

        toArray(document.querySelectorAll(selectors.navToggle)).forEach(function (toggle) {
          var target = getControlledElement(toggle);

          if (!target || !target.classList.contains("is-open")) {
            return;
          }

          if (!toggle.contains(event.target) && !target.contains(event.target)) {
            syncNavTargetState(toggle, target, false);
          }
        });
      });

      runtimeBindings.documentClick = true;
    }

    if (!runtimeBindings.documentKeydown) {
      document.addEventListener("keydown", function (event) {
        trapFocusInModal(event);

        if (event.key !== "Escape") {
          return;
        }

        if (getTopOpenLayer()) {
          closeTopOpenLayer();
          return;
        }

        closeAllSelectMenus(null);
        closeAllDropdowns(null);
        closeAllPopovers(null);
        closeOpenNavigation({ restoreFocus: true });
      });

      runtimeBindings.documentKeydown = true;
    }

    if (!runtimeBindings.mediaQuery && mobileNavQuery) {
      if (typeof mobileNavQuery.addEventListener === "function") {
        mobileNavQuery.addEventListener("change", function () {
          syncNavigationMode(document);
        });
      } else if (typeof mobileNavQuery.addListener === "function") {
        mobileNavQuery.addListener(function () {
          syncNavigationMode(document);
        });
      }

      runtimeBindings.mediaQuery = true;
    }

    if (!runtimeBindings.scrollspyCleanupObserver && typeof MutationObserver === "function") {
      cleanupDetachedScrollspyInstances();
      runtimeBindings.scrollspyCleanupObserver = new MutationObserver(function () {
        cleanupDetachedScrollspyInstances();
      });
      runtimeBindings.scrollspyCleanupObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  /* Public initializer used for first load and any later dynamic subtree init. */
  function initFnllaUi(root) {
    var scope = normalizeRoot(root);

    cleanupDetachedScrollspyInstances();
    document.documentElement.classList.add(runtimeEnhancementClass);
    bindRuntimeHandlers();
    initDropdowns(scope);
    initNavigation(scope);
    initTabs(scope);
    initAccordions(scope);
    initModalTriggers(scope);
    initModals(scope);
    initToasts(scope);
    initOffcanvas(scope);
    initPopovers(scope);
    initTooltips(scope);
    initSelects(scope);
    initRanges(scope);
    initScrollspy(scope);
    syncNavigationMode(scope);

    return fnllaUiApi;
  }

  /* Normalize supported public theme values into the stable runtime contract. */
  function normalizeThemeName(theme) {
    return theme === "dark" ? "dark" : "default";
  }

  /* Resolve the element that should receive the theme attribute. */
  function resolveThemeTarget(target) {
    if (!target || target === document || target === document.documentElement || target === document.body) {
      return document.body;
    }

    return resolveElementReference(target);
  }

  /* Auto-start the runtime once the DOM is ready. */
  function autoInit() {
    if (runtimeBindings.autoInit) {
      return;
    }

    runtimeBindings.autoInit = true;
    initFnllaUi(document);
  }

  /*
    Public API surface:
    keep this small, explicit and stable.
  */
  var fnllaUiApi = {
    version: fnllaUiVersion,
    init: initFnllaUi,
    setTheme: function (theme, target) {
      var themeTarget = resolveThemeTarget(target);

      if (themeTarget) {
        themeTarget.setAttribute("data-fnlla-theme", normalizeThemeName(theme));
      }

      return fnllaUiApi;
    },
    showModal: function (target) {
      var modal = resolveElementReference(target, selectors.modal);

      if (modal) {
        openModal(modal);
      }

      return fnllaUiApi;
    },
    openModal: function (target) {
      var modal = resolveElementReference(target, selectors.modal);

      if (modal) {
        openModal(modal);
      }

      return fnllaUiApi;
    },
    hideModal: function (target) {
      var modal = resolveElementReference(target, selectors.modal);

      if (modal) {
        closeModal(modal);
      }

      return fnllaUiApi;
    },
    closeModal: function (target) {
      var modal = resolveElementReference(target, selectors.modal);

      if (modal) {
        closeModal(modal);
      }

      return fnllaUiApi;
    },
    showToast: function (target) {
      var toast = resolveElementReference(target, selectors.toast);

      if (toast) {
        showToast(toast);
      }

      return fnllaUiApi;
    },
    hideToast: function (target) {
      var toast = resolveElementReference(target, selectors.toast);

      if (toast) {
        hideToast(toast);
      }

      return fnllaUiApi;
    },
    showOffcanvas: function (target) {
      var offcanvas = resolveElementReference(target, selectors.offcanvas);

      if (offcanvas) {
        openOffcanvas(offcanvas);
      }

      return fnllaUiApi;
    },
    openOffcanvas: function (target) {
      var offcanvas = resolveElementReference(target, selectors.offcanvas);

      if (offcanvas) {
        openOffcanvas(offcanvas);
      }

      return fnllaUiApi;
    },
    hideOffcanvas: function (target) {
      var offcanvas = resolveElementReference(target, selectors.offcanvas);

      if (offcanvas) {
        closeOffcanvas(offcanvas);
      }

      return fnllaUiApi;
    },
    closeOffcanvas: function (target) {
      var offcanvas = resolveElementReference(target, selectors.offcanvas);

      if (offcanvas) {
        closeOffcanvas(offcanvas);
      }

      return fnllaUiApi;
    },
    openDropdown: function (target) {
      var dropdown = resolveElementReference(target, selectors.dropdown);

      if (dropdown) {
        openDropdown(dropdown);
      }

      return fnllaUiApi;
    },
    closeDropdown: function (target) {
      var dropdown = resolveElementReference(target, selectors.dropdown);

      if (dropdown) {
        closeDropdown(dropdown);
      }

      return fnllaUiApi;
    },
    openPopover: function (target) {
      var popover = resolveElementReference(target, selectors.popover);

      if (popover) {
        openPopover(popover);
      }

      return fnllaUiApi;
    },
    closePopover: function (target) {
      var popover = resolveElementReference(target, selectors.popover);

      if (popover) {
        closePopover(popover);
      }

      return fnllaUiApi;
    },
    showTooltip: function (target) {
      var trigger = resolveElementReference(target, selectors.tooltipTrigger);

      if (trigger) {
        showTooltip(trigger);
      }

      return fnllaUiApi;
    },
    hideTooltip: function (target) {
      var trigger = resolveElementReference(target, selectors.tooltipTrigger);

      if (trigger) {
        hideTooltip(trigger);
      }

      return fnllaUiApi;
    },
    refreshScrollspy: function (target) {
      var container = resolveElementReference(target, selectors.scrollspy);
      var state = container ? scrollspyObserverMap.get(container) : null;

      if (state && typeof state.update === "function") {
        state.update();
      }

      return fnllaUiApi;
    }
  };

  window.FNLLAUI = fnllaUiApi;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
