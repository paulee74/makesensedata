document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     GLOBAL
     ========================================================= */

  const year =
    document.getElementById("year");

  const menuToggle =
    document.querySelector(".menu-toggle");

  const mainNav =
    document.querySelector(".main-nav");

  const dashboard =
    document.querySelector(".hero-dashboard");

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* =========================================================
     FOOTER YEAR
     ========================================================= */

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }


  /* =========================================================
     HERO ENTRANCE
     ========================================================= */

  requestAnimationFrame(() => {
    document.body.classList.add(
      "hero-ready"
    );
  });


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  if (menuToggle && mainNav) {

    menuToggle.addEventListener(
      "click",
      () => {

        const isOpen =
          mainNav.classList.toggle(
            "open"
          );

        document.body.classList.toggle(
          "menu-open",
          isOpen
        );

        menuToggle.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

      }
    );


    mainNav
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          () => {

            mainNav.classList.remove(
              "open"
            );

            document.body.classList.remove(
              "menu-open"
            );

            menuToggle.setAttribute(
              "aria-expanded",
              "false"
            );

          }
        );

      });


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Escape" &&
          mainNav.classList.contains("open")
        ) {

          mainNav.classList.remove(
            "open"
          );

          document.body.classList.remove(
            "menu-open"
          );

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }
    );

  }


  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */

  const revealItems =
    document.querySelectorAll(
      ".reveal"
    );


  if (reduceMotion) {

    revealItems.forEach((item) => {
      item.classList.add("visible");
    });

  }

  else if (
    "IntersectionObserver" in window
  ) {

    const revealObserver =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              entry.target.classList.add(
                "visible"
              );

              revealObserver.unobserve(
                entry.target
              );

            }
          );

        },
        {
          threshold:0.16,
          rootMargin:
            "0px 0px -40px 0px"
        }
      );


    revealItems.forEach((item) => {
      revealObserver.observe(item);
    });

  }

  else {

    revealItems.forEach((item) => {
      item.classList.add("visible");
    });

  }


  /* =========================================================
     HERO DASHBOARD ANIMATION
     ========================================================= */

  if (dashboard) {

    let dashboardStarted = false;


    /* ---------------------------------------------------------
       COUNT A SINGLE METRIC
       --------------------------------------------------------- */

    function countMetric(
      element,
      target,
      suffix = "",
      duration = 1000
    ) {

      let startTime = null;


      function step(timestamp) {

        if (!startTime) {
          startTime = timestamp;
        }


        const elapsed =
          timestamp - startTime;


        const progress =
          Math.min(
            elapsed / duration,
            1
          );


        const eased =
          1 -
          Math.pow(
            1 - progress,
            3
          );


        const value =
          Math.round(
            target * eased
          );


        element.textContent =
          `${value}${suffix}`;


        if (progress < 1) {

          requestAnimationFrame(
            step
          );

        }

      }


      requestAnimationFrame(
        step
      );

    }


    /* ---------------------------------------------------------
       KPI SEQUENCE
       --------------------------------------------------------- */

    function animateServiceMetrics() {

      const metrics =
        dashboard.querySelectorAll(
          ".metric-swap"
        );


      metrics.forEach(
        (metric, index) => {

          const numberEl =
            metric.querySelector(
              ".metric-number"
            );


          if (!numberEl) {
            return;
          }


          const target =
            Number(
              numberEl.dataset.target || 0
            );


          const suffix =
            numberEl.dataset.suffix || "";


          const startDelay =
            index * 220;


          const countDuration =
            1050;


          metric.classList.remove(
            "verified",
            "resolved"
          );


          numberEl.textContent =
            `0${suffix}`;


          window.setTimeout(
            () => {

              countMetric(
                numberEl,
                target,
                suffix,
                countDuration
              );

            },
            startDelay
          );


          window.setTimeout(
            () => {

              metric.classList.add(
                "verified"
              );

            },
            startDelay +
            countDuration +
            180
          );


          window.setTimeout(
            () => {

              metric.classList.remove(
                "verified"
              );

              metric.classList.add(
                "resolved"
              );

            },
            startDelay +
            countDuration +
            900
          );

        }
      );

    }


    /* ---------------------------------------------------------
       START DASHBOARD
       --------------------------------------------------------- */

    function startDashboard() {

      if (dashboardStarted) {
        return;
      }


      dashboardStarted = true;


      document.body.classList.add(
        "dashboard-active"
      );


      if (reduceMotion) {

        dashboard
          .querySelectorAll(
            ".metric-swap"
          )
          .forEach((metric) => {

            metric.classList.add(
              "resolved"
            );

          });

        return;

      }


      window.setTimeout(
        animateServiceMetrics,
        420
      );

    }


    if (reduceMotion) {

      startDashboard();

    }

    else {

      window.setTimeout(
        startDashboard,
        900
      );

    }

  }


  /* =========================================================
     CASE STUDY BROWSER
     ========================================================= */

  document
    .querySelectorAll(
      ".case-browser"
    )
    .forEach((browser) => {


      const cards =
        Array.from(
          browser.querySelectorAll(
            "[data-case-card]"
          )
        );


      const copyBlocks =
        Array.from(
          browser.querySelectorAll(
            "[data-case-copy]"
          )
        );


      const dots =
        Array.from(
          browser.querySelectorAll(
            "[data-case-browser-dot]"
          )
        );


      const menuItems =
        Array.from(
          browser.querySelectorAll(
            "[data-case-menu]"
          )
        );


      const prevButton =
        browser.querySelector(
          "[data-case-browser-prev]"
        );


      const nextButton =
        browser.querySelector(
          "[data-case-browser-next]"
        );


      let currentIndex = 0;
      let rotationTimer;
      const rotationDelay = 2000;


      function stopRotation() {
        window.clearInterval(rotationTimer);
      }


      function startRotation() {
        stopRotation();

        if (reduceMotion || cards.length < 2) {
          return;
        }

        rotationTimer = window.setInterval(
          () => {
            selectCase(currentIndex + 1, false);
          },
          rotationDelay
        );
      }


      /* -------------------------------------------------------
         SELECT CASE
         ------------------------------------------------------- */

      function selectCase(
        index,
        scrollCard = true
      ) {

        if (!cards.length) {
          return;
        }


        if (index < 0) {
          index = cards.length - 1;
        }


        if (
          index >= cards.length
        ) {
          index = 0;
        }


        currentIndex = index;


        cards.forEach(
          (card, cardIndex) => {

            const active =
              cardIndex ===
              currentIndex;


            card.classList.toggle(
              "is-active",
              active
            );


            card.setAttribute(
              "aria-pressed",
              active
                ? "true"
                : "false"
            );

          }
        );


        copyBlocks.forEach(
          (copy, copyIndex) => {

            copy.classList.toggle(
              "is-active",
              copyIndex ===
              currentIndex
            );

          }
        );


        dots.forEach(
          (dot, dotIndex) => {

            const active =
              dotIndex ===
              currentIndex;


            dot.classList.toggle(
              "is-active",
              active
            );


            if (active) {

              dot.setAttribute(
                "aria-current",
                "true"
              );

            }

            else {

              dot.removeAttribute(
                "aria-current"
              );

            }

          }
        );


        menuItems.forEach(
          (item, itemIndex) => {
            const active =
              itemIndex === currentIndex;

            item.classList.toggle(
              "is-active",
              active
            );

            item.setAttribute(
              "aria-pressed",
              active ? "true" : "false"
            );
          }
        );


        if (
          scrollCard &&
          window.innerWidth <= 820
        ) {

          cards[currentIndex]
            ?.scrollIntoView({
              behavior:
                reduceMotion
                  ? "auto"
                  : "smooth",
              block:"nearest",
              inline:"center"
            });

        }

      }


      /* -------------------------------------------------------
         CARD CLICKS
         ------------------------------------------------------- */

      cards.forEach(
        (card, index) => {

          card.addEventListener(
            "click",
            (event) => {

              if (
                event.target.closest("a")
              ) {
                return;
              }


              selectCase(index);

            }
          );


          card.addEventListener(
            "keydown",
            (event) => {

              if (
                event.target.closest("a")
              ) {
                return;
              }


              if (
                event.key === "Enter" ||
                event.key === " "
              ) {

                event.preventDefault();

                selectCase(index);

              }

            }
          );

        }
      );


      /* -------------------------------------------------------
         DOTS
         ------------------------------------------------------- */

      dots.forEach((dot) => {

        dot.addEventListener(
          "click",
          () => {

            const index =
              Number(
                dot.dataset
                  .caseBrowserDot
              );


            if (
              !Number.isNaN(index)
            ) {

              selectCase(index);

            }

          }
        );

      });


      menuItems.forEach((item) => {
        item.addEventListener(
          "click",
          () => {
            const index =
              Number(item.dataset.caseMenu);

            if (!Number.isNaN(index)) {
              selectCase(index, false);
              startRotation();
            }
          }
        );
      });


      /* -------------------------------------------------------
         ARROWS
         ------------------------------------------------------- */

      prevButton?.addEventListener(
        "click",
        () => {

          selectCase(
            currentIndex - 1
          );

        }
      );


      nextButton?.addEventListener(
        "click",
        () => {

          selectCase(
            currentIndex + 1
          );

        }
      );

      /* -------------------------------------------------------
         KEYBOARD NAVIGATION
         ------------------------------------------------------- */

      browser.addEventListener(
        "keydown",
        (event) => {

          if (
            event.target.closest(
              "a, button"
            )
          ) {
            return;
          }


          if (
            event.key ===
            "ArrowLeft"
          ) {

            event.preventDefault();

            selectCase(
              currentIndex - 1
            );

          }


          if (
            event.key ===
            "ArrowRight"
          ) {

            event.preventDefault();

            selectCase(
              currentIndex + 1
            );

          }

        }
      );


      browser.setAttribute(
        "tabindex",
        "0"
      );


      /* -------------------------------------------------------
         INITIALISE
         ------------------------------------------------------- */

      selectCase(
        0,
        false
      );


      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.hidden) {
            stopRotation();
          }
          else {
            startRotation();
          }
        }
      );

      startRotation();

    });

});
