  function getArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function uniquePush(list, value) {
    if (value && list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  function sortStrings(left, right) {
    return String(left).localeCompare(String(right));
  }

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

  function getIconCategoryCounts(records) {
    var counts = { all: records.length };

    records.forEach(function (record) {
      record.categoryNames.forEach(function (categoryName) {
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      });
    });

    return counts;
  }

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
