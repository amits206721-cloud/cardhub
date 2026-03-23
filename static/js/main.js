document.addEventListener("DOMContentLoaded", () => {

  /* ================================
     Smooth Page Fade (Improved)
  ================================= */

  document.body.style.opacity = "0";
  document.body.style.transform = "translateY(6px)";
  document.body.style.transition = "opacity 0.4s ease, transform 0.4s ease";

  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      document.body.style.opacity = "1";
      document.body.style.transform = "translateY(0)";
    });
  });


  /* ================================
     Premium Card Entrance Animation
  ================================= */

  const cards = document.querySelectorAll(".card-hover");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    cards.forEach(card => {
      card.style.opacity = "0";
      card.style.transform = "translateY(24px)";
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(card);
    });
  }


  /* ================================
     Gold Ripple Tap Effect (Fixed)
  ================================= */

  document.querySelectorAll("a, button").forEach(el => {

    el.addEventListener("click", function (e) {

      // Avoid ripple on disabled elements
      if (this.classList.contains("no-ripple")) return;

      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");

      const size = Math.max(rect.width, rect.height);

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.position = "absolute";
      ripple.style.borderRadius = "50%";
      ripple.style.background = "rgba(212,175,55,0.25)";
      ripple.style.pointerEvents = "none";
      ripple.style.transform = "scale(0)";
      ripple.style.opacity = "1";
      ripple.style.transition = "transform 0.45s ease, opacity 0.45s ease";

      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";

      this.style.position = "relative";
      this.style.overflow = "hidden";

      this.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = "scale(1.5)";
        ripple.style.opacity = "0";
      });

      setTimeout(() => ripple.remove(), 500);
    });

  });


  /* ================================
     Subtle Haptic Feedback (Mobile)
  ================================= */

  if ("vibrate" in navigator) {
    document.querySelectorAll("button").forEach(el => {
      el.addEventListener("click", () => {
        navigator.vibrate(6);
      });
    });
  }

});