  function bindGuideTocLinks() {
    var guideTocLinks = document.querySelectorAll(".doc-guide-toc-link[href^='#']");

    Array.prototype.forEach.call(guideTocLinks, function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");

        if (!href || href === "#") {
          return;
        }

        var target = document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });

        if (window.history && typeof window.history.pushState === "function") {
          window.history.pushState(null, "", href);
        } else {
          window.location.hash = href;
        }
      });
    });
  }
