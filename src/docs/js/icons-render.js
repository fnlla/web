  /*
    Rebuild the category button list from current state.

    The button list is regenerated on each render so pressed state, counts and
    focus restoration always describe the same filtered dataset the grid shows.
  */
  function renderIconCategoryButtons(state) {
    var categoryListElement = state.categoryListElement;

    if (!categoryListElement) {
      return;
    }

    categoryListElement.innerHTML = "";
    var fragment = document.createDocumentFragment();

    state.categoryOptions.forEach(function (category) {
      var button = document.createElement("button");
      var count = state.categoryCounts[category.name] || 0;
      var countElement = document.createElement("span");

      button.className = "doc-icon-category-button";
      if (category.name === state.activeCategory) {
        button.className += " is-active";
      }
      button.type = "button";
      button.setAttribute("data-icon-category", category.name);
      button.setAttribute("aria-pressed", category.name === state.activeCategory ? "true" : "false");
      button.appendChild(document.createTextNode(category.title));

      countElement.className = "doc-icon-category-count";
      countElement.textContent = String(count);
      button.appendChild(countElement);

      button.addEventListener("click", function () {
        state.activeCategory = category.name;
        state.visibleCount = state.pageSize;
        renderIconCatalogue(state, { restoreCategoryFocus: true });
      });

      fragment.appendChild(button);
    });

    categoryListElement.appendChild(fragment);
  }

  /* Replace the grid with one explicit empty state when no records match. */
  function renderIconEmptyState(state) {
    state.iconGrid.innerHTML = "";

    var emptyState = document.createElement("article");
    var title = document.createElement("h3");
    var text = document.createElement("p");

    emptyState.className = "empty-state";
    title.className = "empty-state-title";
    title.textContent = "No icons match this filter";
    text.className = "empty-state-text";
    text.textContent = "Try a shorter search term or switch to another category.";

    emptyState.appendChild(title);
    emptyState.appendChild(text);
    state.iconGrid.appendChild(emptyState);
  }

  /*
    Render progress and the "load more" control for the current result set.

    The catalogue intentionally pages results in the UI even though all metadata
    is already local. That keeps the docs responsive on smaller devices when the
    icon set is large, while still avoiding any network fetch.
  */
  function renderIconActions(state, totalCount, visibleCount) {
    var actionsElement = state.actionsElement;

    if (!actionsElement) {
      return;
    }

    actionsElement.innerHTML = "";

    if (!totalCount) {
      return;
    }

    var progressElement = document.createElement("p");
    progressElement.className = "doc-icon-progress";

    if (visibleCount < totalCount) {
      progressElement.textContent = "Showing " + visibleCount + " of " + totalCount + " matching icons.";
    } else {
      progressElement.textContent = "All " + totalCount + " matching icons are visible.";
    }

    actionsElement.appendChild(progressElement);

    if (visibleCount >= totalCount) {
      return;
    }

    var loadMoreButton = document.createElement("button");
    var remainingCount = totalCount - visibleCount;
    var nextStepCount = remainingCount > state.pageSize ? state.pageSize : remainingCount;

    loadMoreButton.className = "btn btn-outline btn-sm doc-icon-load-more";
    loadMoreButton.type = "button";
    loadMoreButton.textContent = "Load " + nextStepCount + " more icons";
    loadMoreButton.addEventListener("click", function () {
      state.visibleCount = Math.min(totalCount, state.visibleCount + state.pageSize);
      renderIconCatalogue(state, {
        preserveVisibleCount: true,
        restoreLoadMoreFocus: true
      });
    });

    actionsElement.appendChild(loadMoreButton);
  }

  /*
    Render only the currently visible slice of icon records.

    Each card is built from the shared template so preview image, runtime path and
    copy affordance remain structurally consistent even as filtering changes.
  */
  function renderIconCards(state, records) {
    var template = state.cardTemplate;
    var grid = state.iconGrid;

    grid.innerHTML = "";

    if (!records.length) {
      renderIconEmptyState(state);
      return;
    }

    var fragment = document.createDocumentFragment();

    records.forEach(function (record) {
      var clone = template.content.cloneNode(true);
      var previewImage = clone.querySelector(".doc-icon-preview img");
      var nameElement = clone.querySelector(".doc-icon-name");
      var categoriesElement = clone.querySelector(".doc-icon-categories");
      var aliasesElement = clone.querySelector(".doc-icon-aliases");
      var pathElement = clone.querySelector(".doc-icon-path code");
      var statusElement = clone.querySelector(".doc-icon-status");
      var copyButton = clone.querySelector(".doc-icon-copy");

      previewImage.src = record.previewPath;
      previewImage.alt = "";
      previewImage.loading = "lazy";
      previewImage.decoding = "async";
      previewImage.width = 32;
      previewImage.height = 32;
      setText(nameElement, record.canonicalName);
      setText(categoriesElement, record.categoryTitles.length ? record.categoryTitles.join(" / ") : "Uncategorized");
      setText(aliasesElement, record.aliasNames.length ? "Also searchable as: " + record.aliasNames.join(", ") : "Canonical asset name");
      setText(pathElement, record.runtimePath);

      copyButton.addEventListener("click", function () {
        copyTextWithFallback(
          record.runtimePath,
          function () {
            setIconCopyStatus(statusElement, "Runtime path copied.");
          },
          function () {
            setIconCopyStatus(statusElement, "Copy failed in this browser.");
          }
        );
      });

      fragment.appendChild(clone);
    });

    grid.appendChild(fragment);
  }

  /*
    Central catalogue render pass.

    This function owns the relationship between search query, active category,
    visible slice size, assistive text and focus restoration. Keeping those pieces
    in one place reduces the risk of the sidebar, results label and grid drifting
    out of sync after a future maintenance change.
  */
  function renderIconCatalogue(state, options) {
    var renderOptions = options || {};
    var query = String(state.searchInput.value || "").trim();
    var activeCategoryTitle = state.categoryTitleMap[state.activeCategory] || "All icons";
    var filteredRecords = filterIconRecords(state.records, state.activeCategory, query);
    var visibleCount;
    var visibleRecords;
    var hasMoreResults;
    var countLabel;
    var activeCategoryMessage;

    if (!renderOptions.preserveVisibleCount) {
      state.visibleCount = state.pageSize;
    }

    visibleCount = Math.min(filteredRecords.length, state.visibleCount);
    visibleRecords = filteredRecords.slice(0, visibleCount);
    hasMoreResults = visibleCount < filteredRecords.length;

    state.iconGrid.setAttribute("aria-busy", "true");
    renderIconCategoryButtons(state);
    renderIconCards(state, visibleRecords);
    renderIconActions(state, filteredRecords.length, visibleCount);
    state.iconGrid.setAttribute("aria-busy", "false");

    if (!query && state.activeCategory === "all") {
      countLabel = hasMoreResults
        ? "Showing first " + visibleCount + " of " + filteredRecords.length + " shipped runtime icons."
        : "Showing " + filteredRecords.length + " shipped runtime icons.";
      activeCategoryMessage = "Browse the full local FNLLA Icons bundle. Copy buttons use the stable runtime path under assets/icons/.";
    } else if (query && state.activeCategory === "all") {
      countLabel = hasMoreResults
        ? "Showing " + visibleCount + " of " + filteredRecords.length + " matching runtime icons for \"" + query + "\"."
        : "Showing " + filteredRecords.length + " matching runtime icons for \"" + query + "\".";
      activeCategoryMessage = "Search matches include canonical asset names, merged aliases and category labels from the local bundle.";
    } else if (!query) {
      countLabel = hasMoreResults
        ? "Showing first " + visibleCount + " of " + filteredRecords.length + " runtime icons in " + activeCategoryTitle + "."
        : "Showing " + filteredRecords.length + " runtime icons in " + activeCategoryTitle + ".";
      activeCategoryMessage = "These icons are tagged under " + activeCategoryTitle + ". Copy buttons still return the runtime path under assets/icons/.";
    } else {
      countLabel = hasMoreResults
        ? "Showing " + visibleCount + " of " + filteredRecords.length + " matching runtime icons for \"" + query + "\" in " + activeCategoryTitle + "."
        : "Showing " + filteredRecords.length + " matching runtime icons for \"" + query + "\" in " + activeCategoryTitle + ".";
      activeCategoryMessage = "The category filter stays active while search narrows the same local runtime bundle.";
    }

    if (hasMoreResults) {
      activeCategoryMessage += " More matches load in smaller batches to keep this page responsive on mobile and slower devices.";
    }

    setText(state.resultsCountElement, countLabel);
    setText(state.activeCategoryElement, activeCategoryTitle);
    setText(state.activeCategoryTextElement, activeCategoryMessage);

    if (renderOptions.restoreCategoryFocus) {
      var activeCategoryButton = state.categoryListElement.querySelector("[data-icon-category=\"" + state.activeCategory + "\"]");

      if (activeCategoryButton && typeof activeCategoryButton.focus === "function") {
        activeCategoryButton.focus();
      }
    }

    if (renderOptions.restoreLoadMoreFocus && hasMoreResults) {
      var nextLoadMoreButton = state.actionsElement.querySelector(".doc-icon-load-more");

      if (nextLoadMoreButton && typeof nextLoadMoreButton.focus === "function") {
        nextLoadMoreButton.focus();
      }
    }
  }

  /*
    Bind the catalogue only when the required docs shell elements exist.

    The icons page is the only place that ships the full interactive catalogue,
    so every dependency is checked up front. Failing soft here prevents unrelated
    docs pages from paying a runtime penalty or logging noisy errors.
  */
  function initIconCatalogue() {
    var iconGrid = document.getElementById("icon-grid");

    if (!iconGrid) {
      return;
    }

    var searchInput = document.getElementById("icon-search");
    var resultsCountElement = document.getElementById("icon-results-count");
    var categoryListElement = document.getElementById("icon-category-list");
    var activeCategoryElement = document.getElementById("icon-active-category");
    var activeCategoryTextElement = document.getElementById("icon-active-category-text");
    var actionsElement = document.getElementById("icon-actions");
    var cardTemplate = document.getElementById("icon-card-template");
    var data = buildIconCatalogueData();

    if (!searchInput || !resultsCountElement || !categoryListElement || !activeCategoryElement || !activeCategoryTextElement || !actionsElement || !cardTemplate) {
      return;
    }

    if (!data.records.length) {
      setText(resultsCountElement, "The local icon catalogue is unavailable on this page.");
      setText(activeCategoryElement, "Catalogue unavailable");
      setText(activeCategoryTextElement, "docs/assets/icons-data.js is required for the interactive catalogue.");
      iconGrid.innerHTML = "";
      return;
    }

    var mergedCategoryTitleMap = { all: "All icons" };
    Object.keys(data.categoryTitleMap).forEach(function (categoryName) {
      mergedCategoryTitleMap[categoryName] = data.categoryTitleMap[categoryName];
    });

    var state = {
      activeCategory: "all",
      activeCategoryElement: activeCategoryElement,
      activeCategoryTextElement: activeCategoryTextElement,
      actionsElement: actionsElement,
      cardTemplate: cardTemplate,
      categoryCounts: getIconCategoryCounts(data.records),
      categoryListElement: categoryListElement,
      categoryOptions: data.categoryOptions,
      categoryTitleMap: mergedCategoryTitleMap,
      iconGrid: iconGrid,
      pageSize: 60,
      records: data.records,
      resultsCountElement: resultsCountElement,
      searchInput: searchInput,
      visibleCount: 60
    };

    /*
      A new query should start from the first visible slice again.
      renderIconCatalogue will restore the default page size whenever we do not
      explicitly request visible-count preservation.
    */
    searchInput.addEventListener("input", function () {
      renderIconCatalogue(state);
    });

    renderIconCatalogue(state);
  }
