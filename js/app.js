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
  }});
