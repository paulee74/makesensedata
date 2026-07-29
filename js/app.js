document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const revealItems = document.querySelectorAll(".reveal");
  const dashboard = document.querySelector(".hero-dashboard");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  requestAnimationFrame(() => {
    document.body.classList.add("hero-ready");
  });

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      document.body.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));


  if (dashboard) {
    let dashboardStarted = false;


    const animateServiceMetrics = () => {
      const metrics = document.querySelectorAll(".metric-swap");

      metrics.forEach((metric, index) => {
        const numberEl = metric.querySelector(".metric-number");
        const start = Number(metric.dataset.start || 0);
        const end = Number(metric.dataset.end || 0);
        const suffix = metric.dataset.suffix || "";
        const duration = 1500 + index * 90;
        const delay = index * 300;
        let startedAt = null;

        const formatValue = (value) => {
          const rounded = Math.round(value);

          if (suffix === " sources") {
            return `${rounded} ${rounded === 1 ? "source" : "sources"}`;
          }

          return `${rounded}${suffix}`;
        };

        window.setTimeout(() => {
          const step = (timestamp) => {
            if (!startedAt) startedAt = timestamp;
            const progress = Math.min((timestamp - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * eased;

            numberEl.textContent = formatValue(current);

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              window.setTimeout(() => metric.classList.add("resolved"), 320);
            }
          };

          window.requestAnimationFrame(step);
        }, delay);
      });
    };

    const startDashboard = () => {
      if (dashboardStarted) return;
      dashboardStarted = true;
      document.body.classList.add("dashboard-active");
      window.setTimeout(animateServiceMetrics, 480);
    };

    if (reduceMotion) {
      startDashboard();
    } else {
      window.setTimeout(startDashboard, 3900);
    }
    /* =========================================================
   CASE STUDY CAROUSEL
   ========================================================= */

document.querySelectorAll("[data-case-carousel]").forEach((carousel) => {

  const slides = Array.from(
    carousel.querySelectorAll("[data-case-slide]")
  );

  const dots = Array.from(
    carousel.querySelectorAll("[data-case-dot]")
  );

  const prevButton = carousel.querySelector("[data-case-prev]");
  const nextButton = carousel.querySelector("[data-case-next]");

  let currentIndex = 0;


  function showSlide(index) {

    if (!slides.length) return;

    if (index < 0) {
      index = slides.length - 1;
    }

    if (index >= slides.length) {
      index = 0;
    }

    currentIndex = index;


    slides.forEach((slide, slideIndex) => {

      const isActive = slideIndex === currentIndex;

      slide.classList.toggle("is-active", isActive);

      slide.setAttribute(
        "aria-hidden",
        isActive ? "false" : "true"
      );

    });


    dots.forEach((dot, dotIndex) => {

      const isActive = dotIndex === currentIndex;

      dot.classList.toggle("is-active", isActive);

      dot.setAttribute(
        "aria-current",
        isActive ? "true" : "false"
      );

    });

  }


  /* Previous */

  prevButton?.addEventListener("click", () => {
    showSlide(currentIndex - 1);
  });


  /* Next */

  nextButton?.addEventListener("click", () => {
    showSlide(currentIndex + 1);
  });


  /* Dots */

  dots.forEach((dot) => {

    dot.addEventListener("click", () => {

      const index = Number(dot.dataset.caseDot);

      if (!Number.isNaN(index)) {
        showSlide(index);
      }

    });

  });


  /* Keyboard navigation */

  carousel.setAttribute("tabindex", "0");

  carousel.addEventListener("keydown", (event) => {

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(currentIndex + 1);
    }

  });


  /* Swipe support */

  let touchStartX = 0;
  let touchEndX = 0;


  carousel.addEventListener(
    "touchstart",
    (event) => {

      touchStartX =
        event.changedTouches[0].screenX;

    },
    { passive:true }
  );


  carousel.addEventListener(
    "touchend",
    (event) => {

      touchEndX =
        event.changedTouches[0].screenX;

      const distance =
        touchEndX - touchStartX;

      if (Math.abs(distance) < 50) {
        return;
      }

      if (distance > 0) {
        showSlide(currentIndex - 1);
      } else {
        showSlide(currentIndex + 1);
      }

    },
    { passive:true }
  );


  /* Initialise */

  showSlide(0);

});
  }});
