/*
  ============================================================================
  FNLLA UI SOURCE MODULE: PREAMBLE AND SHARED STATE
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  ============================================================================
*/

/*
  FNLLA UI runtime script.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). All rights reserved.
  Produced, maintained and distributed by TechAyo LTD (techayo.co.uk).
  Public runtime asset names and enhancement markers define the supported runtime contract.
*/

/*
  Runtime wrapper:
  - creates one private scope
  - exposes only the public `window.FNLLAUI` API
  - keeps shared state hidden from page-level scripts
*/
(function () {
  "use strict";

  /* Public version marker exposed through the runtime API. */
  var fnllaUiVersion = "1.0.2";
  var openLayerStack = [];
  var openModalStack = [];
  var openOffcanvasStack = [];
  var modalTriggerMap = new WeakMap();
  var offcanvasTriggerMap = new WeakMap();
  var overlayIsolationStateMap = new Map();
  var toastTimerMap = new WeakMap();
  var tooltipPanelMap = new WeakMap();
  var scrollspyObserverMap = new WeakMap();
  var customSelectStateMap = new WeakMap();
  var scrollspyRegistry = [];
  var fnllaUiIdCounter = 0;
  var mobileNavQuery = window.matchMedia ? window.matchMedia("(max-width: 880px)") : null;
  var runtimeEnhancementClass = "fnlla-ui-js";

  /*
    Initialization registry:
    every interactive node is marked after first binding so repeated
    `FNLLAUI.init(root)` calls stay safe and idempotent.
  */
  var initializationState = {
    dropdown: new WeakSet(),
    navToggle: new WeakSet(),
    tabs: new WeakSet(),
    accordionButton: new WeakSet(),
    modalTrigger: new WeakSet(),
    modal: new WeakSet(),
    modalClose: new WeakSet(),
    toastTrigger: new WeakSet(),
    toast: new WeakSet(),
    toastClose: new WeakSet(),
    offcanvasTrigger: new WeakSet(),
    offcanvas: new WeakSet(),
    offcanvasClose: new WeakSet(),
    popover: new WeakSet(),
    popoverTrigger: new WeakSet(),
    popoverClose: new WeakSet(),
    tooltipTrigger: new WeakSet(),
    select: new WeakSet(),
    rangeInput: new WeakSet(),
    scrollspy: new WeakSet()
  };
  /*
    Global runtime bindings:
    these are document-level listeners and watchers that should only be
    attached once no matter how many subtrees are initialized.
  */
  var runtimeBindings = {
    mediaQuery: false,
    documentClick: false,
    documentKeydown: false,
    autoInit: false,
    scrollspyCleanupObserver: null
  };
  var attributeNames = {
    accordionSingle: "data-fnlla-accordion-single",
    modalOpen: "data-fnlla-modal-open",
    toastOpen: "data-fnlla-toast-open",
    toastAutohide: "data-fnlla-toast-autohide",
    offcanvasOpen: "data-fnlla-offcanvas-open",
    rangeOutput: "data-fnlla-range-output",
    rangePrefix: "data-fnlla-range-prefix",
    rangeSuffix: "data-fnlla-range-suffix",
    tooltip: "data-fnlla-tooltip",
    tooltipPosition: "data-fnlla-tooltip-position"
  };
  /* Shared selectors used across all modules. */
  var selectors = {
    dropdown: "[data-fnlla-dropdown]",
    dropdownToggle: "[data-fnlla-dropdown-toggle]",
    dropdownMenu: ".dropdown-menu",
    navToggle: "[data-fnlla-nav-toggle]",
    tabs: "[data-fnlla-tabs]",
    tabList: "[data-fnlla-tab-list]",
    tab: "[data-fnlla-tab]",
    accordion: "[data-fnlla-accordion]",
    accordionButton: "[data-fnlla-accordion-button]",
    accordionItem: ".accordion-item",
    modalTrigger: "[data-fnlla-modal-open]",
    modal: "[data-fnlla-modal]",
    modalClose: "[data-fnlla-modal-close]",
    modalInitialFocus: "[data-fnlla-modal-initial-focus], [autofocus]",
    toastTrigger: "[data-fnlla-toast-open]",
    toast: "[data-fnlla-toast]",
    toastClose: "[data-fnlla-toast-close]",
    offcanvasTrigger: "[data-fnlla-offcanvas-open]",
    offcanvas: "[data-fnlla-offcanvas]",
    offcanvasClose: "[data-fnlla-offcanvas-close]",
    offcanvasInitialFocus: "[data-fnlla-offcanvas-initial-focus], [autofocus]",
    select: "select.select",
    selectShell: "[data-fnlla-select-shell]",
    selectNative: "[data-fnlla-select-native]",
    selectToggle: "[data-fnlla-select-toggle]",
    selectMenu: ".select-menu",
    selectOption: "[data-fnlla-select-option]",
    rangeInput: ".range-input[id]",
    popover: "[data-fnlla-popover]",
    popoverToggle: "[data-fnlla-popover-toggle]",
    popoverPanel: ".popover-panel",
    popoverClose: "[data-fnlla-popover-close]",
    tooltipTrigger: "[data-fnlla-tooltip]",
    scrollspy: "[data-fnlla-scrollspy]",
    scrollspyNav: "[data-fnlla-scrollspy-nav]"
  };
  /* Shared ID prefixes used when markup does not provide explicit IDs. */
  var idPrefixes = {
    dropdownToggle: "dropdown-toggle",
    dropdownMenu: "dropdown-menu",
    tabButton: "tab-button",
    tabPanel: "tab-panel",
    accordionButton: "accordion-button",
    accordionPanel: "accordion-panel",
    modal: "modal",
    toast: "toast",
    offcanvas: "offcanvas",
    selectToggle: "select-toggle",
    selectMenu: "select-menu",
    popoverToggle: "popover-toggle",
    popoverPanel: "popover-panel",
    tooltip: "tooltip"
  };
