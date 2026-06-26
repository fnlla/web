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

    function syncNavState(isOpen) {
      nav.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      panel.hidden = !isOpen;
    }

    function syncNavMode() {
      if (mobileQuery.matches) {
        syncNavState(false);
        return;
      }

      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = false;
    }

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

    syncNavMode();
  }
