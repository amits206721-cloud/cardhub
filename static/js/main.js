(function () {
  function toCssUnit(value, fallback) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value}px`;
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    return fallback;
  }

  function safeParseJSON(value) {
    if (typeof value !== "string") {
      return value;
    }

    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "string" ? safeParseJSON(parsed) : parsed;
    } catch (error) {
      return null;
    }
  }

  function normalizeElement(element, index) {
    const style = element && typeof element.style === "object" ? { ...element.style } : {};

    delete style.left;
    delete style.top;
    delete style.position;
    delete style.transform;

    return {
      id: element?.id || `element-${index}`,
      text: typeof element?.text === "string" ? element.text : "",
      left: toCssUnit(element?.left, `${24 + index * 8}px`),
      top: toCssUnit(element?.top, `${48 + index * 32}px`),
      style: {
        fontSize: style.fontSize || "28px",
        color: style.color || "#ffffff",
        fontFamily: style.fontFamily || "inherit",
        fontWeight: style.fontWeight || "normal",
        fontStyle: style.fontStyle || "normal",
        textAlign: style.textAlign || "left",
        ...style
      }
    };
  }

  function buildLegacyElements(source) {
    if (!source || typeof source !== "object") {
      return [];
    }

    const sharedFontFamily = source.font_family || source.fontFamily || "inherit";
    const sharedFontWeight = source.text_bold ? "bold" : "normal";
    const sharedFontStyle = source.text_italic ? "italic" : "normal";

    return [
      {
        text: source.label_text || source.labelText || "",
        left: source.label_left || "32px",
        top: source.label_top || source.labelTop || 70,
        style: {
          fontSize: "12px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: source.label_color || source.labelColor || "#ffffff",
          fontFamily: sharedFontFamily,
          fontWeight: sharedFontWeight,
          fontStyle: sharedFontStyle,
          opacity: "0.85"
        }
      },
      {
        text: source.title_text || source.titleText || "",
        left: source.title_left || "32px",
        top: source.title_top || source.titleTop || 130,
        style: {
          fontSize: toCssUnit(source.title_size || source.titleSize, "48px"),
          color: source.title_color || source.titleColor || "#ffffff",
          fontFamily: sharedFontFamily,
          fontWeight: sharedFontWeight,
          fontStyle: sharedFontStyle
        }
      },
      {
        text: source.line1_text || source.line1Text || "",
        left: source.line1_left || "32px",
        top: source.line1_top || source.line1Top || 230,
        style: {
          fontSize: toCssUnit(source.body_size || source.bodySize, "18px"),
          color: source.line1_color || source.line1Color || source.body_color || source.bodyColor || "#ffffff",
          fontFamily: sharedFontFamily,
          fontWeight: sharedFontWeight,
          fontStyle: sharedFontStyle
        }
      },
      {
        text: source.line2_text || source.line2Text || "",
        left: source.line2_left || "32px",
        top: source.line2_top || source.line2Top || 300,
        style: {
          fontSize: toCssUnit(source.body_size || source.bodySize, "18px"),
          color: source.line2_color || source.line2Color || source.body_color || source.bodyColor || "#ffffff",
          fontFamily: sharedFontFamily,
          fontWeight: sharedFontWeight,
          fontStyle: sharedFontStyle
        }
      }
    ].filter((element) => element.text.trim());
  }

  function normalizeCardState(data) {
    const source = safeParseJSON(data);
    const objectSource = source && typeof source === "object" ? source : {};
    const editorState = safeParseJSON(objectSource.editor_state);
    const parsedState = editorState && typeof editorState === "object" ? editorState : objectSource;
    const elementsSource = Array.isArray(parsedState.elements) && parsedState.elements.length
      ? parsedState.elements
      : buildLegacyElements(objectSource);

    return {
      backgroundColor:
        parsedState.backgroundColor ||
        parsedState.bgColor ||
        objectSource.backgroundColor ||
        objectSource.bg_color ||
        objectSource.bgColor ||
        "#f0f0f0",
      backgroundImage:
        parsedState.backgroundImage ||
        parsedState.bgImage ||
        objectSource.backgroundImage ||
        objectSource.bg_image ||
        objectSource.bgImage ||
        "",
      elements: elementsSource.map(normalizeElement).filter((element) => element.text.trim())
    };
  }

  window.renderCard = function renderCard(container, data) {
    if (!container) {
      return;
    }

    const state = normalizeCardState(data);
    const canvas = container.classList.contains("card-canvas")
      ? container
      : container.closest(".card-canvas");

    if (canvas) {
      canvas.style.backgroundColor = state.backgroundColor || "#f0f0f0";
      canvas.style.backgroundImage = state.backgroundImage ? `url(${state.backgroundImage})` : "none";
      canvas.style.backgroundSize = "cover";
      canvas.style.backgroundPosition = "center";
      canvas.style.backgroundRepeat = "no-repeat";
    }

    container.innerHTML = "";

    state.elements.forEach((element, index) => {
      const node = document.createElement("div");
      node.className = "editable-text";
      node.dataset.index = String(index);
      node.dataset.elementId = element.id || `element-${index}`;
      node.textContent = element.text;

      Object.assign(node.style, {
        position: "absolute",
        left: toCssUnit(element.left, "32px"),
        top: toCssUnit(element.top, "48px"),
        transform: "translateZ(0)"
      });

      Object.entries(element.style || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          node.style[key] = value;
        }
      });

      container.appendChild(node);
    });
  };

  window.renderCard.normalizeData = normalizeCardState;

  function renderPreviewCards() {
    document.querySelectorAll(".card-canvas[data-state]").forEach((canvas) => {
      const inner = canvas.querySelector(".card-inner");
      if (!inner) {
        return;
      }

      window.renderCard(inner, canvas.dataset.state);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = "0";
    document.body.style.transform = "translateY(6px)";
    document.body.style.transition = "opacity 0.4s ease, transform 0.4s ease";

    window.addEventListener("load", () => {
      requestAnimationFrame(() => {
        document.body.style.opacity = "1";
        document.body.style.transform = "translateY(0)";
      });
    });

    const cards = document.querySelectorAll(".card-hover");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      cards.forEach((card) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(24px)";
        card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(card);
      });
    }

    document.querySelectorAll("a, button").forEach((element) => {
      element.addEventListener("click", function handleRipple(event) {
        if (this.classList.contains("no-ripple")) {
          return;
        }

        const rect = this.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.position = "absolute";
        ripple.style.borderRadius = "50%";
        ripple.style.background = "rgba(212,175,55,0.25)";
        ripple.style.pointerEvents = "none";
        ripple.style.transform = "scale(0)";
        ripple.style.opacity = "1";
        ripple.style.transition = "transform 0.45s ease, opacity 0.45s ease";
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        this.style.position = "relative";
        this.style.overflow = "hidden";
        this.appendChild(ripple);

        requestAnimationFrame(() => {
          ripple.style.transform = "scale(1.5)";
          ripple.style.opacity = "0";
        });

        window.setTimeout(() => ripple.remove(), 500);
      });
    });

    if ("vibrate" in navigator) {
      document.querySelectorAll("button").forEach((element) => {
        element.addEventListener("click", () => navigator.vibrate(6));
      });
    }

    renderPreviewCards();
  });
})();
