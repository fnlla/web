  /*
    Keep the docs navigation predictable across breakpoints.

    On mobile the nav behaves like a collapsible panel so it does not steal too
    much vertical space from the article content. On larger screens the same nav
    must immediately return to an always-visible state, even if the user last
    interacted with it in mobile mode and left it open or closed.
  */
  function initDocsNav() {
    var nav = document.querySelector(".doc-nav");

    if (!nav) {
      return;
    }

    var toggle = nav.querySelector("[data-doc-nav-toggle]");
    var panel = nav.querySelector("[data-doc-nav-panel]");
    var mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 47.9375rem)") : null;

    if (!toggle || !panel || !mobileQuery) {
      return;
    }

    /*
      One helper updates the three pieces that must never drift apart:
      CSS open state, ARIA-expanded state and the hidden state of the panel.
    */
    function syncNavState(isOpen) {
      nav.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      panel.hidden = !isOpen;
    }

    /*
      Breakpoint changes are authoritative.

      If we enter mobile mode, start closed so the nav does not cover content.
      If we leave mobile mode, force the panel visible so desktop never inherits
      a collapsed state that only makes sense on smaller screens.
    */
    function syncNavMode() {
      if (mobileQuery.matches) {
        syncNavState(false);
        return;
      }

      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = false;
    }

    /* Only let the button act as a disclosure control in mobile mode. */
    toggle.addEventListener("click", function () {
      if (!mobileQuery.matches) {
        return;
      }

      syncNavState(panel.hidden);
    });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncNavMode);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(syncNavMode);
    }

    /* Reconcile the initial state immediately on first load. */
    syncNavMode();
  }
