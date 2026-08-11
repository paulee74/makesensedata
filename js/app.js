document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = reduceMotionQuery.matches;
  const year = document.getElementById("year");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const dashboard = document.querySelector(".hero-dashboard");

  if (year) year.textContent = String(new Date().getFullYear());
  requestAnimationFrame(() => document.body.classList.add("hero-ready"));

  function closeMenu({ returnFocus = false } = {}) {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) menuToggle.focus();
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      document.body.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mainNav.classList.contains("open")) closeMenu({ returnFocus: true });
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && mainNav.classList.contains("open")) closeMenu();
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  if (dashboard) {
    let dashboardStarted = false;

    function countMetric(element, target, suffix = "", duration = 1050) {
      if (reduceMotion) {
        element.textContent = `${target}${suffix}`;
        return;
      }
      let startTime;
      function step(timestamp) {
        startTime ??= timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function animateServiceMetrics() {
      dashboard.querySelectorAll(".metric-swap").forEach((metric, index) => {
        const numberEl = metric.querySelector(".metric-number");
        if (!numberEl) return;
        const target = Number(numberEl.dataset.target || 0);
        const suffix = numberEl.dataset.suffix || "";
        const delay = index * 220;
        metric.classList.remove("verified", "resolved");
        numberEl.textContent = `0${suffix}`;
        window.setTimeout(() => countMetric(numberEl, target, suffix), delay);
        window.setTimeout(() => metric.classList.add("verified"), delay + 1230);
        window.setTimeout(() => {
          metric.classList.remove("verified");
          metric.classList.add("resolved");
        }, delay + 1950);
      });
    }

    function startDashboard() {
      if (dashboardStarted) return;
      dashboardStarted = true;
      document.body.classList.add("dashboard-active");
      if (reduceMotion) {
        dashboard.querySelectorAll(".metric-swap").forEach((metric) => {
          const numberEl = metric.querySelector(".metric-number");
          if (numberEl) numberEl.textContent = `${Number(numberEl.dataset.target || 0)}${numberEl.dataset.suffix || ""}`;
          metric.classList.add("resolved");
        });
      } else {
        window.setTimeout(animateServiceMetrics, 420);
      }
    }

    if (reduceMotion || !("IntersectionObserver" in window)) startDashboard();
    else {
      const dashboardObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startDashboard();
          observer.disconnect();
        }
      }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
      dashboardObserver.observe(dashboard);
    }
  }

  document.querySelectorAll(".case-browser").forEach((browser) => {
    const cards = [...browser.querySelectorAll("[data-case-card]")];
    const copyBlocks = [...browser.querySelectorAll("[data-case-copy]")];
    const dots = [...browser.querySelectorAll("[data-case-browser-dot]")];
    const menuItems = [...browser.querySelectorAll("[data-case-menu]")];
    const prevButton = browser.querySelector("[data-case-browser-prev]");
    const nextButton = browser.querySelector("[data-case-browser-next]");
    const itemCount = Math.max(cards.length, copyBlocks.length, dots.length, menuItems.length);
    const rotationDelay = 8000;
    let currentIndex = 0;
    let rotationTimer = null;
    let browserIsVisible = true;
    let pointerInside = false;
    let focusInside = false;

    if (!itemCount) return;

    const normaliseIndex = (index) => ((index % itemCount) + itemCount) % itemCount;
    const indexFrom = (element, dataKey, fallback) => {
      const parsed = Number(element.dataset[dataKey]);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    function stopRotation() {
      if (rotationTimer !== null) window.clearInterval(rotationTimer);
      rotationTimer = null;
    }

    function canRotate() {
      return !reduceMotion && itemCount > 1 && !document.hidden && browserIsVisible && !pointerInside && !focusInside;
    }

    function startRotation() {
      stopRotation();
      if (!canRotate()) return;
      rotationTimer = window.setInterval(() => selectCase(currentIndex + 1, false), rotationDelay);
    }

    function restartRotation() {
      stopRotation();
      startRotation();
    }

    function selectCase(index, scrollCard = true) {
      currentIndex = normaliseIndex(index);
      cards.forEach((card, cardIndex) => {
        const active = indexFrom(card, "caseCard", cardIndex) === currentIndex;
        card.classList.toggle("is-active", active);
        card.setAttribute("aria-pressed", String(active));
        card.setAttribute("tabindex", active ? "0" : "-1");
      });
      copyBlocks.forEach((copy, copyIndex) => {
        const active = indexFrom(copy, "caseCopy", copyIndex) === currentIndex;
        copy.classList.toggle("is-active", active);
        copy.setAttribute("aria-hidden", String(!active));
      });
      dots.forEach((dot, dotIndex) => {
        const active = indexFrom(dot, "caseBrowserDot", dotIndex) === currentIndex;
        dot.classList.toggle("is-active", active);
        if (active) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      menuItems.forEach((item, itemIndex) => {
        const active = indexFrom(item, "caseMenu", itemIndex) === currentIndex;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      if (scrollCard && window.innerWidth <= 820) {
        const activeCard = cards.find((card, cardIndex) => indexFrom(card, "caseCard", cardIndex) === currentIndex);
        activeCard?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
      }
    }

    function manualSelect(index, scroll = true) {
      selectCase(index, scroll);
      restartRotation();
    }

    cards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        if (!event.target.closest("a")) manualSelect(indexFrom(card, "caseCard", index));
      });
      card.addEventListener("keydown", (event) => {
        if (event.target.closest("a")) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          manualSelect(indexFrom(card, "caseCard", index));
        }
      });
    });

    dots.forEach((dot, index) => dot.addEventListener("click", () => manualSelect(indexFrom(dot, "caseBrowserDot", index))));
    menuItems.forEach((item, index) => item.addEventListener("click", () => manualSelect(indexFrom(item, "caseMenu", index), false)));
    prevButton?.addEventListener("click", () => manualSelect(currentIndex - 1));
    nextButton?.addEventListener("click", () => manualSelect(currentIndex + 1));

    browser.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.target.closest("a, input, textarea, select")) return;
      event.preventDefault();
      manualSelect(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
    });
    browser.addEventListener("mouseenter", () => { pointerInside = true; stopRotation(); });
    browser.addEventListener("mouseleave", () => { pointerInside = false; startRotation(); });
    browser.addEventListener("focusin", () => { focusInside = true; stopRotation(); });
    browser.addEventListener("focusout", (event) => {
      if (!browser.contains(event.relatedTarget)) { focusInside = false; startRotation(); }
    });

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        browserIsVisible = entry.isIntersecting;
        if (browserIsVisible) startRotation(); else stopRotation();
      }, { threshold: 0.15 });
      visibilityObserver.observe(browser);
    }

    document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());
    selectCase(0, false);
    startRotation();
  });
});
