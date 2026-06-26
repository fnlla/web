  /* Normalize optional array-like inputs so data loading can fail soft. */
  function getArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /* Shared DOM text helper used by both render and status code paths. */
  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  /* Keep arrays unique without depending on Set ordering semantics. */
  function uniquePush(list, value) {
    if (value && list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  /* Central string comparator so every icon list sorts the same way. */
  function sortStrings(left, right) {
    return String(left).localeCompare(String(right));
  }

  /*
    Normalize category metadata into one stable shape.

    The docs bundle accepts both compact tuple syntax and object syntax because
    maintainers may regenerate icon metadata in different formats over time.
    Everything is converted here so the rest of the catalogue code can operate on
    one predictable category API.
  */
  function normalizeIconCategoryDefinitions(categoryDefinitions) {
    var categoryTitleMap = {};
    var categoryOrderMap = {};
    var categoryOptions = [{ name: "all", title: "All icons" }];

    getArray(categoryDefinitions).forEach(function (rawCategoryDefinition, index) {
      var categoryName = "";
      var categoryTitle = "";

      if (Array.isArray(rawCategoryDefinition)) {
        categoryName = String(rawCategoryDefinition[0] || "").trim();
        categoryTitle = rawCategoryDefinition[1] ? String(rawCategoryDefinition[1]) : categoryName;
      } else if (rawCategoryDefinition && rawCategoryDefinition.name) {
        categoryName = String(rawCategoryDefinition.name).trim();
        categoryTitle = rawCategoryDefinition.title ? String(rawCategoryDefinition.title) : categoryName;
      }

      if (!categoryName) {
        return;
      }

      categoryTitleMap[categoryName] = categoryTitle;
      categoryOrderMap[categoryName] = index;
      categoryOptions.push({
        name: categoryName,
        title: categoryTitle
      });
    });

    return {
      categoryOptions: categoryOptions,
      categoryOrderMap: categoryOrderMap,
      categoryTitleMap: categoryTitleMap
    };
  }

  /*
    Resolve category references used by compact icon records.

    Compact data may reference categories by number to shrink generated payloads.
    This helper maps those numeric references back to the canonical category name
    and also supports plain string names for readability and backwards-compat.
  */
  function resolveIconCategoryName(rawCategory, categoryDefinitions) {
    var indexedCategoryDefinition;

    if (typeof rawCategory === "number") {
      indexedCategoryDefinition = categoryDefinitions[rawCategory];

      if (Array.isArray(indexedCategoryDefinition)) {
        return String(indexedCategoryDefinition[0] || "").trim();
      }

      if (indexedCategoryDefinition && indexedCategoryDefinition.name) {
        return String(indexedCategoryDefinition.name).trim();
      }

      return "";
    }

    return String(rawCategory || "").trim();
  }

  /*
    Build one normalized icon record used by the interactive catalogue.

    This is the point where the catalogue contract is established: canonical file
    name, aliases, category titles and search text are all derived here so render
    code later only consumes ready-to-use records instead of repeating cleanup.
  */
  function buildIconRecord(canonicalName, aliasNames, categoryNames, categoryTitleMap, categoryOrderMap) {
    var normalizedCanonicalName = String(canonicalName || "").trim();
    var normalizedAliasNames = [];
    var normalizedCategoryNames = [];

    if (!normalizedCanonicalName) {
      return null;
    }

    getArray(aliasNames).forEach(function (rawAliasName) {
      var aliasName = String(rawAliasName || "").trim();

      if (!aliasName || aliasName === normalizedCanonicalName) {
        return;
      }

      uniquePush(normalizedAliasNames, aliasName);
    });

    getArray(categoryNames).forEach(function (rawCategoryName) {
      var categoryName = String(rawCategoryName || "").trim();

      if (!categoryTitleMap[categoryName]) {
        return;
      }

      uniquePush(normalizedCategoryNames, categoryName);
    });

    normalizedAliasNames.sort(sortStrings);
    normalizedCategoryNames.sort(function (left, right) {
      var leftOrder = Object.prototype.hasOwnProperty.call(categoryOrderMap, left) ? categoryOrderMap[left] : 999999;
      var rightOrder = Object.prototype.hasOwnProperty.call(categoryOrderMap, right) ? categoryOrderMap[right] : 999999;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return sortStrings(left, right);
    });

    var searchableNames = [normalizedCanonicalName].concat(normalizedAliasNames);
    var categoryTitles = normalizedCategoryNames.map(function (categoryName) {
      return categoryTitleMap[categoryName] || categoryName;
    });

    return {
      canonicalName: normalizedCanonicalName,
      aliasNames: normalizedAliasNames,
      categoryNames: normalizedCategoryNames,
      categoryTitles: categoryTitles,
      previewPath: "../assets/icons/" + normalizedCanonicalName + ".svg",
      runtimePath: "assets/icons/" + normalizedCanonicalName + ".svg",
      aliasSearchText: searchableNames.join(" ").toLowerCase(),
      categorySearchText: categoryTitles.join(" ").toLowerCase(),
      searchText: searchableNames.concat(normalizedCategoryNames, categoryTitles).join(" ").toLowerCase()
    };
  }

  /*
    Build records from the current compact data shape generated for docs.

    Compact data is the preferred path because it is smaller and already groups
    most icon metadata into near-final records, while still allowing category
    references to be stored as short numeric indexes.
  */
  function buildIconRecordsFromCompactData(categoryDefinitions, categoryTitleMap, categoryOrderMap) {
    return getArray(window.FNLLA_ICON_RECORDS).map(function (rawRecord) {
      var canonicalName = "";
      var aliasNames = [];
      var categoryNames = [];

      if (Array.isArray(rawRecord)) {
        canonicalName = String(rawRecord[0] || "").trim();
        aliasNames = getArray(rawRecord[1]);
        categoryNames = getArray(rawRecord[2]).map(function (rawCategory) {
          return resolveIconCategoryName(rawCategory, categoryDefinitions);
        });
      } else if (rawRecord) {
        canonicalName = String(rawRecord.canonicalName || "").trim();
        aliasNames = getArray(rawRecord.aliasNames);
        categoryNames = getArray(rawRecord.categoryNames).map(function (rawCategory) {
          return resolveIconCategoryName(rawCategory, categoryDefinitions);
        });
      }

      return buildIconRecord(canonicalName, aliasNames, categoryNames, categoryTitleMap, categoryOrderMap);
    }).filter(Boolean).sort(function (left, right) {
      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /*
    Build records from the older split-window globals.

    This legacy path exists so older docs payloads or transitional generated files
    can still produce the same final catalogue records without breaking the page.
    Canonical names collapse duplicate aliases that map to the same shipped SVG.
  */
  function buildIconRecordsFromLegacyData(categoryTitleMap, categoryOrderMap) {
    var iconNames = getArray(window.FNLLA_ICON_NAMES);
    var categoryMap = window.FNLLA_ICON_CATEGORY_MAP && typeof window.FNLLA_ICON_CATEGORY_MAP === "object"
      ? window.FNLLA_ICON_CATEGORY_MAP
      : {};
    var canonicalMap = window.FNLLA_ICON_CANONICAL_NAMES && typeof window.FNLLA_ICON_CANONICAL_NAMES === "object"
      ? window.FNLLA_ICON_CANONICAL_NAMES
      : {};
    var recordsByCanonicalName = {};

    iconNames.forEach(function (rawIconName) {
      var iconName = String(rawIconName || "").trim();

      if (!iconName) {
        return;
      }

      var canonicalName = String(canonicalMap[iconName] || iconName).trim();

      if (!canonicalName) {
        return;
      }

      if (!recordsByCanonicalName[canonicalName]) {
        recordsByCanonicalName[canonicalName] = {
          aliasNames: [],
          categoryNames: []
        };
      }

      var record = recordsByCanonicalName[canonicalName];
      uniquePush(record.aliasNames, iconName);

      getArray(categoryMap[iconName]).forEach(function (categoryName) {
        if (categoryTitleMap[categoryName]) {
          uniquePush(record.categoryNames, categoryName);
        }
      });
    });

    return Object.keys(recordsByCanonicalName).map(function (canonicalName) {
      var record = recordsByCanonicalName[canonicalName];
      return buildIconRecord(canonicalName, record.aliasNames, record.categoryNames, categoryTitleMap, categoryOrderMap);
    }).filter(Boolean).sort(function (left, right) {
      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /*
    Prefer compact records when available, otherwise transparently fall back to
    the legacy globals. The rest of the docs code never needs to know which data
    source produced the final record list.
  */
  function buildIconCatalogueData() {
    var categoryDefinitions = getArray(window.FNLLA_ICON_CATEGORIES);
    var categoryMetadata = normalizeIconCategoryDefinitions(categoryDefinitions);
    var records = getArray(window.FNLLA_ICON_RECORDS).length
      ? buildIconRecordsFromCompactData(
        categoryDefinitions,
        categoryMetadata.categoryTitleMap,
        categoryMetadata.categoryOrderMap
      )
      : buildIconRecordsFromLegacyData(
        categoryMetadata.categoryTitleMap,
        categoryMetadata.categoryOrderMap
      );

    return {
      categoryOptions: categoryMetadata.categoryOptions,
      categoryTitleMap: categoryMetadata.categoryTitleMap,
      records: records
    };
  }

  /*
    Search ranking favors canonical-name precision before broader matches.

    This ranking does not decide inclusion, only ordering. Exact canonical names
    should appear first, then prefix matches, then aliases, then category-text
    matches, so maintainers can still find the real shipped file quickly.
  */
  function getIconSearchRank(record, normalizedQuery) {
    if (!normalizedQuery) {
      return 0;
    }

    if (record.canonicalName === normalizedQuery) {
      return 0;
    }

    if (record.canonicalName.indexOf(normalizedQuery) === 0) {
      return 1;
    }

    if (record.aliasSearchText.indexOf(normalizedQuery) !== -1) {
      return 2;
    }

    if (record.categorySearchText.indexOf(normalizedQuery) !== -1) {
      return 3;
    }

    return 4;
  }

  /*
    Filter by active category and free-text query, then rank results so the most
    likely canonical match appears first without hiding valid broader matches.
  */
  function filterIconRecords(records, activeCategory, query) {
    var normalizedQuery = String(query || "").trim().toLowerCase();

    return records.filter(function (record) {
      var matchesCategory = activeCategory === "all" || record.categoryNames.indexOf(activeCategory) !== -1;
      var matchesQuery = !normalizedQuery || record.searchText.indexOf(normalizedQuery) !== -1;
      return matchesCategory && matchesQuery;
    }).sort(function (left, right) {
      var leftRank = getIconSearchRank(left, normalizedQuery);
      var rightRank = getIconSearchRank(right, normalizedQuery);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return sortStrings(left.canonicalName, right.canonicalName);
    });
  }

  /* Precompute category counts once so the category sidebar can stay lightweight. */
  function getIconCategoryCounts(records) {
    var counts = { all: records.length };

    records.forEach(function (record) {
      record.categoryNames.forEach(function (categoryName) {
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      });
    });

    return counts;
  }

  /*
    Copy runtime icon paths with a permissive browser fallback.

    Some docs environments may not expose the async Clipboard API. The fallback
    keeps the catalogue usable in stricter or older browsers rather than silently
    losing the copy action altogether.
  */
  function copyTextWithFallback(text, onSuccess, onFailure) {
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        if (document.execCommand("copy")) {
          document.body.removeChild(textarea);
          onSuccess();
          return;
        }
      } catch (error) {
        // Intentionally fall through to shared failure handling.
      }

      document.body.removeChild(textarea);
      onFailure();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(onSuccess, fallbackCopy);
      return;
    }

    fallbackCopy();
  }

  /* Show a short-lived per-card status message without stacking timers. */
  function setIconCopyStatus(statusElement, message) {
    if (!statusElement) {
      return;
    }

    setText(statusElement, message);

    if (statusElement._docIconTimer) {
      window.clearTimeout(statusElement._docIconTimer);
    }

    statusElement._docIconTimer = window.setTimeout(function () {
      setText(statusElement, "");
      statusElement._docIconTimer = null;
    }, 2200);
  }
