/*
  Shared browser-side docs inspections for the FNLLA UI smoke runner.
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
*/

import { setTimeout as delay } from "node:timers/promises";

async function waitForBrowserResult(client, timeoutMs) {
  const startedAt = Date.now();
  const expression = `(() => {
    const status = document.getElementById("test-status");
    return {
      ready: !!status && status.getAttribute("data-result") !== "pending",
      result: status ? status.getAttribute("data-result") : "",
      failures: Array.from(document.querySelectorAll("#failure-list li")).map((item) => item.textContent.trim())
    };
  })()`;

  while ((Date.now() - startedAt) < timeoutMs) {
    const evaluation = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true
    });

    const payload = evaluation?.result?.value;
    if (payload?.ready) {
      return payload;
    }

    await delay(200);
  }

  throw new Error("Timed out while waiting for the browser smoke fixture to finish.");
}

async function waitForDocumentReady(client, timeoutMs) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    const evaluation = await client.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true
    });

    if (evaluation?.result?.value === "complete") {
      return;
    }

    await delay(120);
  }

  throw new Error("Timed out while waiting for the browser page to finish loading.");
}

export async function inspectDocsPage(client, url, expectedTitle, expectedCurrentLabel, minimumNavLinks) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const masthead = document.querySelector(".doc-header");
      const nav = document.querySelector(".doc-nav");
      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const themeToggle = document.querySelector("[data-doc-theme-toggle]");
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      const mastheadStyles = masthead ? getComputedStyle(masthead) : null;
      const navStyles = nav ? getComputedStyle(nav) : null;

      return {
        title: document.title,
        hasMasthead: !!masthead,
        hasNav: !!nav,
        navLinkCount: nav ? nav.querySelectorAll("a").length : 0,
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        hasThemeToggle: !!themeToggle,
        navContainsThemeToggle: !!(nav && themeToggle && nav.contains(themeToggle)),
        themeColor: themeMeta ? themeMeta.getAttribute("content") : "",
        mastheadBackground: mastheadStyles ? mastheadStyles.backgroundImage : "",
        navPosition: navStyles ? navStyles.position : "",
        bodyBackground: getComputedStyle(document.body).backgroundImage
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.title !== expectedTitle) {
    failures.push(`${url}: unexpected page title '${payload.title}'.`);
  }

  if (!payload.hasMasthead) {
    failures.push(`${url}: missing .doc-header shell.`);
  }

  if (!payload.hasNav) {
    failures.push(`${url}: missing .doc-nav shell.`);
  }

  if (payload.navLinkCount < minimumNavLinks) {
    failures.push(`${url}: docs navigation should expose the full page set.`);
  }

  if (payload.currentLabel !== expectedCurrentLabel) {
    failures.push(`${url}: current docs navigation label should be '${expectedCurrentLabel}'.`);
  }

  if (!payload.hasThemeToggle) {
    failures.push(`${url}: missing docs dark mode toggle.`);
  }

  if (!payload.navContainsThemeToggle) {
    failures.push(`${url}: docs dark mode toggle should live inside .doc-nav.`);
  }

  if (payload.themeColor !== "#1A4137") {
    failures.push(`${url}: expected theme-color '#1A4137'.`);
  }

  if (!payload.mastheadBackground) {
    failures.push(`${url}: docs masthead should have a rendered background.`);
  }

  if (payload.navPosition !== "sticky") {
    failures.push(`${url}: docs navigation should remain sticky.`);
  }

  if (!payload.bodyBackground) {
    failures.push(`${url}: docs body should expose the premium background treatment.`);
  }

  return failures;
}

export async function inspectDocsThemeToggle(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const toggle = document.querySelector("[data-doc-theme-toggle]");
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      const readState = () => ({
        bodyTheme: document.body ? document.body.getAttribute("data-fnlla-theme") : "",
        themeColor: themeMeta ? themeMeta.getAttribute("content") : "",
        storedTheme: (() => {
          try {
            return window.localStorage.getItem("fnlla-ui-docs-theme") || "";
          } catch (error) {
            return "";
          }
        })()
      });

      if (!toggle) {
        return {
          hasToggle: false
        };
      }

      const initialState = readState();
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
      const darkState = readState();
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
      const resetState = readState();

      return {
        hasToggle: true,
        initialState,
        darkState,
        resetState
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (!payload.hasToggle) {
    failures.push(`${url}: missing docs dark mode toggle.`);
    return failures;
  }

  if (payload.initialState?.bodyTheme !== "default") {
    failures.push(`${url}: docs should initialize in default theme.`);
  }

  if (payload.initialState?.themeColor !== "#1A4137") {
    failures.push(`${url}: default docs theme should expose theme-color '#1A4137'.`);
  }

  if (payload.darkState?.bodyTheme !== "dark") {
    failures.push(`${url}: docs dark mode toggle should switch body theme to 'dark'.`);
  }

  if (payload.darkState?.themeColor !== "#0B1220") {
    failures.push(`${url}: docs dark mode toggle should switch theme-color to '#0B1220'.`);
  }

  if (payload.darkState?.storedTheme !== "dark") {
    failures.push(`${url}: docs dark mode toggle should persist the selected theme.`);
  }

  if (payload.resetState?.bodyTheme !== "default") {
    failures.push(`${url}: docs dark mode toggle should switch back to default theme.`);
  }

  if (payload.resetState?.themeColor !== "#1A4137") {
    failures.push(`${url}: docs should restore theme-color '#1A4137' after toggling back.`);
  }

  if (payload.resetState?.storedTheme !== "default") {
    failures.push(`${url}: docs should persist the restored default theme after toggling back.`);
  }

  return failures;
}

export async function inspectLoadingDocsPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const showcase = document.querySelector(".loading-showcase");
      const spinner = showcase ? showcase.querySelector(".spinner") : null;
      const progressBar = showcase ? showcase.querySelector(".progress-indeterminate .progress-bar") : null;
      const skeletonLine = showcase ? showcase.querySelector(".skeleton-line") : null;
      const skeletonCard = showcase ? showcase.querySelector(".skeleton-card") : null;
      const spinnerStyles = spinner ? getComputedStyle(spinner) : null;
      const progressStyles = progressBar ? getComputedStyle(progressBar) : null;
      const skeletonLineAfter = skeletonLine ? getComputedStyle(skeletonLine, "::after") : null;
      const skeletonCardStyles = skeletonCard ? getComputedStyle(skeletonCard) : null;

      return {
        hasShowcase: !!showcase,
        spinnerAnimation: spinnerStyles ? spinnerStyles.animationName : "",
        progressAnimation: progressStyles ? progressStyles.animationName : "",
        skeletonAnimation: skeletonLineAfter ? skeletonLineAfter.animationName : "",
        skeletonCardDisplay: skeletonCardStyles ? skeletonCardStyles.display : "",
        docsCurrentLabel: (() => {
          const currentLink = document.querySelector(".doc-nav [aria-current='page']");
          return currentLink ? currentLink.textContent.trim() : "";
        })()
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (!payload.hasShowcase) {
    failures.push(`${url}: missing .loading-showcase demo.`);
  }

  if (payload.docsCurrentLabel !== "Components") {
    failures.push(`${url}: current docs navigation label should be 'Components'.`);
  }

  if (!payload.spinnerAnimation.includes("fw-spin")) {
    failures.push(`${url}: loading showcase spinner lost its motion in docs.`);
  }

  if (!payload.progressAnimation.includes("fw-progress-indeterminate")) {
    failures.push(`${url}: loading showcase indeterminate progress lost its motion in docs.`);
  }

  if (!payload.skeletonAnimation.includes("fw-skeleton-wave")) {
    failures.push(`${url}: loading showcase skeleton shimmer lost its motion in docs.`);
  }

  if (payload.skeletonCardDisplay !== "grid") {
    failures.push(`${url}: loading showcase skeleton card lost its structured layout.`);
  }

  return failures;
}

export async function inspectComponentsLayoutPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      function getTrackCount(value) {
        return value && value !== "none" ? value.trim().split(/\\s+/).length : 0;
      }

      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const showcaseGrid = document.querySelector(".doc-forms-showcase-grid");
      const contactGrid = document.querySelector(".contact-grid");
      const contactFieldGrid = document.querySelector(".contact-field-grid");
      const showcaseStyles = showcaseGrid ? getComputedStyle(showcaseGrid) : null;
      const contactStyles = contactGrid ? getComputedStyle(contactGrid) : null;
      const contactFieldStyles = contactFieldGrid ? getComputedStyle(contactFieldGrid) : null;

      return {
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        showcaseDisplay: showcaseStyles ? showcaseStyles.display : "",
        showcaseGap: showcaseStyles ? showcaseStyles.gap : "",
        showcaseTracks: showcaseStyles ? getTrackCount(showcaseStyles.gridTemplateColumns) : 0,
        contactDisplay: contactStyles ? contactStyles.display : "",
        contactGap: contactStyles ? contactStyles.gap : "",
        contactTracks: contactStyles ? getTrackCount(contactStyles.gridTemplateColumns) : 0,
        contactFieldTracks: contactFieldStyles ? getTrackCount(contactFieldStyles.gridTemplateColumns) : 0
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.currentLabel !== "Components") {
    failures.push(`${url}: current docs navigation label should be 'Components'.`);
  }

  if (payload.showcaseDisplay !== "grid" || payload.showcaseGap === "0px") {
    failures.push(`${url}: forms showcase grid lost its expected spacing.`);
  }

  if (payload.showcaseTracks < 2) {
    failures.push(`${url}: forms showcase grid should keep its two-column layout at the smoke viewport.`);
  }

  if (payload.contactDisplay !== "grid" || payload.contactGap === "0px") {
    failures.push(`${url}: contact-section layout lost its expected grid spacing.`);
  }

  if (payload.contactTracks < 2) {
    failures.push(`${url}: contact-section layout should keep its split grid at the smoke viewport.`);
  }

  if (payload.contactFieldTracks < 2) {
    failures.push(`${url}: contact field grids should keep their paired field alignment at the smoke viewport.`);
  }

  return failures;
}

export async function inspectSectionsLayoutPage(client, url) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      function getTrackCount(value) {
        return value && value !== "none" ? value.trim().split(/\\s+/).length : 0;
      }

      const currentLink = document.querySelector(".doc-nav [aria-current='page']");
      const showcaseGrid = document.querySelector(".doc-sections-showcase-grid");
      const hero = document.querySelector(".hero.hero-split");
      const statsGrid = document.querySelector(".stats-grid");
      const pricingGrid = document.querySelector(".pricing-grid");
      const testimonialGrid = document.querySelector(".testimonial-card-grid");
      const showcaseStyles = showcaseGrid ? getComputedStyle(showcaseGrid) : null;
      const heroStyles = hero ? getComputedStyle(hero) : null;
      const statsStyles = statsGrid ? getComputedStyle(statsGrid) : null;
      const pricingStyles = pricingGrid ? getComputedStyle(pricingGrid) : null;
      const testimonialStyles = testimonialGrid ? getComputedStyle(testimonialGrid) : null;

      return {
        currentLabel: currentLink ? currentLink.textContent.trim() : "",
        showcaseDisplay: showcaseStyles ? showcaseStyles.display : "",
        showcaseGap: showcaseStyles ? showcaseStyles.gap : "",
        heroDisplay: heroStyles ? heroStyles.display : "",
        heroGap: heroStyles ? heroStyles.gap : "",
        statsTracks: statsStyles ? getTrackCount(statsStyles.gridTemplateColumns) : 0,
        pricingTracks: pricingStyles ? getTrackCount(pricingStyles.gridTemplateColumns) : 0,
        testimonialDisplay: testimonialStyles ? testimonialStyles.display : "",
        testimonialGap: testimonialStyles ? testimonialStyles.gap : ""
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.currentLabel !== "Sections") {
    failures.push(`${url}: current docs navigation label should be 'Sections'.`);
  }

  if (payload.showcaseDisplay !== "grid" || payload.showcaseGap === "0px") {
    failures.push(`${url}: sections showcase grid lost its expected spacing.`);
  }

  if (payload.heroDisplay !== "grid" || payload.heroGap === "0px") {
    failures.push(`${url}: hero section layout lost its expected split spacing.`);
  }

  if (payload.statsTracks < 2) {
    failures.push(`${url}: stats grid should keep multiple visible columns at the smoke viewport.`);
  }

  if (payload.pricingTracks < 2) {
    failures.push(`${url}: pricing grid should keep its multi-column layout at the smoke viewport.`);
  }

  if (payload.testimonialDisplay !== "grid" || payload.testimonialGap === "0px") {
    failures.push(`${url}: testimonial card grid lost its expected spacing.`);
  }

  return failures;
}

export async function inspectGuidePage(client, url, expectedTitle, expectedGuideLabel, expectedRootCurrentLabel, minimumRootNavLinks, minimumGuideNavLinks) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  await delay(200);

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const rootNav = document.querySelector(".doc-nav");
      const guideNav = document.querySelector(".doc-guide-nav");
      const currentRootLink = rootNav ? rootNav.querySelector("[aria-current='page']") : null;
      const currentGuide = guideNav ? guideNav.querySelector("[aria-current='page']") : null;
      const prose = document.querySelector(".doc-guide-prose");

      return {
        title: document.title,
        rootNavLinkCount: rootNav ? rootNav.querySelectorAll("a").length : 0,
        guideNavLinkCount: guideNav ? guideNav.querySelectorAll("a").length : 0,
        currentRootLabel: currentRootLink ? currentRootLink.textContent.trim() : "",
        currentGuideLabel: currentGuide ? currentGuide.textContent.trim() : "",
        hasProse: !!prose,
        proseHeadingCount: prose ? prose.querySelectorAll("h2, h3").length : 0
      };
    })()`,
    returnByValue: true
  });

  const payload = evaluation?.result?.value;
  const failures = [];

  if (!payload) {
    failures.push(`Could not inspect ${url}.`);
    return failures;
  }

  if (payload.title !== expectedTitle) {
    failures.push(`${url}: unexpected guide page title '${payload.title}'.`);
  }

  if (payload.rootNavLinkCount < minimumRootNavLinks) {
    failures.push(`${url}: root docs navigation should expose the full page set.`);
  }

  if (payload.currentRootLabel !== expectedRootCurrentLabel) {
    failures.push(`${url}: current root docs navigation label should be '${expectedRootCurrentLabel}'.`);
  }

  if (payload.guideNavLinkCount < minimumGuideNavLinks) {
    failures.push(`${url}: guide navigation should expose all guide pages.`);
  }

  if (payload.currentGuideLabel !== expectedGuideLabel) {
    failures.push(`${url}: current guide label should be '${expectedGuideLabel}'.`);
  }

  if (!payload.hasProse) {
    failures.push(`${url}: missing guide prose container.`);
  }

  if (payload.proseHeadingCount < 2) {
    failures.push(`${url}: guide prose should expose multiple rendered headings.`);
  }

  return failures;
}

export async function runSmokeFixture(client, url, label) {
  await client.send("Page.navigate", { url });
  await waitForDocumentReady(client, 10000);
  const result = await waitForBrowserResult(client, 12000);

  return {
    result: result.result,
    failures: Array.isArray(result.failures)
      ? result.failures.map((failure) => `${label}: ${failure}`)
      : []
  };
}
