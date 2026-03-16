document.addEventListener("DOMContentLoaded", function () {

  const menuToggle = document.querySelector(".menu-toggle");
  const globalNav = document.querySelector(".global-nav");

  if (!menuToggle || !globalNav) return;

  const overlay = document.createElement("div");
  overlay.className = "menu-overlay";
  document.body.appendChild(overlay);

  function openMenu() {
    menuToggle.classList.add("is-open");
    globalNav.classList.add("is-open");
    overlay.classList.add("is-active");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    menuToggle.classList.remove("is-open");
    globalNav.classList.remove("is-open");
    overlay.classList.remove("is-active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    const isOpen = globalNav.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  overlay.addEventListener("click", closeMenu);

  document.addEventListener("click", function (e) {
    const isMobile = window.innerWidth <= 768;
    const clickedInsideNav = globalNav.contains(e.target);
    const clickedToggle = menuToggle.contains(e.target);

    if (isMobile && globalNav.classList.contains("is-open") && !clickedInsideNav && !clickedToggle) {
      closeMenu();
    }
  });

  globalNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        closeMenu();
      }
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 769) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && globalNav.classList.contains("is-open")) {
      closeMenu();
    }
  });

});
