/*
  ============================================================================
  FNLLA UI SOURCE MODULE: SCROLLSPY INITIALIZER
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Bind scrollspy behavior so nav links reflect the active document section. */
  function initScrollspy(root) {
    getScopedMatches(root, selectors.scrollspy).forEach(function (container) {
      if (initializationState.scrollspy.has(container)) {
        return;
      }

      var nav = container.querySelector(selectors.scrollspyNav);
      var panel = container.querySelector(".scrollspy-panel");
      var links = nav ? toArray(nav.querySelectorAll("a[href^='#']")) : [];
      var sections = [];

      if (!nav || !links.length) {
        return;
      }

      links.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var id = href.charAt(0) === "#" ? href.slice(1) : "";
        var section = id ? document.getElementById(id) : null;

        if (section) {
          sections.push(section);
        }

        link.addEventListener("click", function () {
          if (id) {
            activateScrollspyLink(container, id);
          }
        });
      });

      if (!sections.length) {
        return;
      }

      initializationState.scrollspy.add(container);
      refreshScrollspy(container, sections);

      var scheduled = false;
      var update = function () {
        if (scheduled) {
          return;
        }

        scheduled = true;
        window.requestAnimationFrame(function () {
          scheduled = false;
          refreshScrollspy(container, sections);
        });
      };

      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);

      if (panel) {
        panel.addEventListener("scroll", update, { passive: true });
      }

      registerScrollspyInstance(container, {
        container: container,
        panel: panel,
        update: update
      });
    });
  }
