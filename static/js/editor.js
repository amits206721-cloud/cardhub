document.addEventListener("DOMContentLoaded", () => {
  const cardCanvas = document.getElementById("cardCanvas");
  const cardInner = document.getElementById("cardInner");
  const form = document.querySelector("form");
  const bgColorInput = document.getElementById("bg-color");
  const bgImageInput = document.getElementById("bg-image");
  const bgImageDeleteButton = document.getElementById("bg-image-delete");
  const fontSizeInput = document.getElementById("font-size");
  const fontSizeDisplay = document.getElementById("font-size-display");
  const fontFamilyInput = document.getElementById("font-family");
  const addTextButton = document.getElementById("add-text-btn");
  const undoButton = document.getElementById("undo-btn");
  const typoCard = document.getElementById("typography-card");

  if (!cardCanvas || !cardInner || typeof window.renderCard !== "function") return;

  window.cardData = window.renderCard.normalizeData(window.cardData || {});

  // --- UNDO HISTORY SYSTEM ---
  const historyStack = [];
  let isUndoing = false;

  function saveHistoryState() {
    if (isUndoing) return;
    const currentState = JSON.stringify(window.cardData);
    
    // Prevent duplicate consecutive saves
    if (historyStack.length > 0 && historyStack[historyStack.length - 1] === currentState) {
      return; 
    }
    
    historyStack.push(currentState);
    if (historyStack.length > 30) historyStack.shift(); // Keep last 30 actions
  }

  function undoAction() {
    if (historyStack.length > 1) {
      isUndoing = true;
      historyStack.pop(); // discard current state
      const previousState = JSON.parse(historyStack[historyStack.length - 1]);
      window.cardData = previousState;
      editor.activeElementIndex = -1;
      editor.activeTextElement = null;
      renderEditor();
      isUndoing = false;
    }
  }

  undoButton?.addEventListener("click", undoAction);

  // --- EDITOR ENGINE ---
  const editor = {
    activeElementIndex: -1,
    activeTextElement: null,
    isDragging: false,
    dragTarget: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    pointerStartX: 0,
    pointerStartY: 0,
    hasMoved: false,
    toolbar: null
  };

  function getElementState(index) {
    return index >= 0 ? window.cardData.elements[index] : null;
  }

  function updateFormData() {
    if (!form) return;
    const hiddenEditorState = document.getElementById("editor-state");
    const hiddenBgColor = document.getElementById("bg-color-input");
    const hiddenBgImage = document.getElementById("bg-image-input");
    
    if (hiddenEditorState) hiddenEditorState.value = JSON.stringify(window.cardData);
    if (hiddenBgColor) hiddenBgColor.value = window.cardData.backgroundColor || "#f0f0f0";
    if (hiddenBgImage) hiddenBgImage.value = window.cardData.backgroundImage || "";
  }

  window.updateFormData = updateFormData;

  function syncSidebarControls() {
    if (bgColorInput) {
      bgColorInput.value = window.cardData.backgroundColor || "#f0f0f0";
    }

    // Disable Typography settings if no text is selected
    if (editor.activeElementIndex === -1) {
      if (typoCard) typoCard.style.opacity = "0.5";
      if (fontSizeInput) fontSizeInput.disabled = true;
      if (fontFamilyInput) fontFamilyInput.disabled = true;
      if (fontSizeDisplay) fontSizeDisplay.textContent = "--";
    } else {
      if (typoCard) typoCard.style.opacity = "1";
      if (fontSizeInput) fontSizeInput.disabled = false;
      if (fontFamilyInput) fontFamilyInput.disabled = false;

      const activeState = getElementState(editor.activeElementIndex);
      if (fontSizeInput && activeState) {
        const fontSizeStr = activeState.style?.fontSize || "28px";
        const fontSize = parseInt(fontSizeStr, 10);
        const val = Number.isFinite(fontSize) ? fontSize : 28;
        fontSizeInput.value = val;
        if (fontSizeDisplay) fontSizeDisplay.textContent = `${val}px`;
      }
      if (fontFamilyInput && activeState) {
        fontFamilyInput.value = activeState.style?.fontFamily || "Playfair Display";
      }
    }
  }

  function renderEditor() {
    window.renderCard(cardInner, window.cardData);

    cardInner.querySelectorAll(".editable-text").forEach((element) => {
      bindTextEvents(element);
      if (element.dataset.index === String(editor.activeElementIndex)) {
        editor.activeTextElement = element;
        element.classList.add("active-element");
      }
    });

    if (!cardInner.querySelector(`[data-index="${editor.activeElementIndex}"]`)) {
      editor.activeElementIndex = -1;
      editor.activeTextElement = null;
      hideToolbar();
    } else {
      showToolbar();
    }

    syncSidebarControls();
    updateFormData();
    
    if (historyStack.length === 0) saveHistoryState(); // Save initial state
  }

  function setActiveElement(element) {
    cardInner.querySelectorAll(".editable-text").forEach((node) => {
      node.classList.remove("active-element");
    });

    if (!element) {
      editor.activeElementIndex = -1;
      editor.activeTextElement = null;
      hideToolbar();
      syncSidebarControls();
      return;
    }

    element.classList.add("active-element");
    editor.activeElementIndex = Number.parseInt(element.dataset.index || "-1", 10);
    editor.activeTextElement = element;
    syncSidebarControls();
    showToolbar();
  }

  function enableEditing(element) {
    if (!element) return;
    setActiveElement(element);
    editor.isDragging = false;
    element.contentEditable = "true";
    element.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function saveElementText(element) {
    if (!element) return;
    const state = getElementState(Number.parseInt(element.dataset.index || "-1", 10));
    if (!state) return;

    if (state.text !== element.textContent) {
      state.text = element.textContent || "";
      saveHistoryState();
    }
    
    element.contentEditable = "false";
    updateFormData();
  }

  function removeElement(index) {
    if (index < 0 || index >= window.cardData.elements.length) return;
    window.cardData.elements.splice(index, 1);
    editor.activeElementIndex = -1;
    editor.activeTextElement = null;
    saveHistoryState();
    renderEditor();
  }

  function clampPosition(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function startDrag(event, element) {
    if (event.button !== 0 || element.isContentEditable) return;
    setActiveElement(element);

    const elementRect = element.getBoundingClientRect();
    editor.dragTarget = element;
    editor.dragOffsetX = event.clientX - elementRect.left;
    editor.dragOffsetY = event.clientY - elementRect.top;
    editor.pointerStartX = event.clientX;
    editor.pointerStartY = event.clientY;
    editor.isDragging = true;
    editor.hasMoved = false;

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", endDrag);
    event.preventDefault();
  }

  function doDrag(event) {
    if (!editor.isDragging || !editor.dragTarget || editor.dragTarget.isContentEditable) return;

    const innerRect = cardInner.getBoundingClientRect();
    const deltaX = Math.abs(event.clientX - editor.pointerStartX);
    const deltaY = Math.abs(event.clientY - editor.pointerStartY);

    if (!editor.hasMoved && deltaX < 2 && deltaY < 2) return;

    editor.hasMoved = true;

    const nextLeft = clampPosition(
      event.clientX - innerRect.left - editor.dragOffsetX,
      0,
      Math.max(0, innerRect.width - editor.dragTarget.offsetWidth)
    );
    const nextTop = clampPosition(
      event.clientY - innerRect.top - editor.dragOffsetY,
      0,
      Math.max(0, innerRect.height - editor.dragTarget.offsetHeight)
    );

    editor.dragTarget.classList.add("dragging");
    editor.dragTarget.style.left = `${nextLeft}px`;
    editor.dragTarget.style.top = `${nextTop}px`;
    editor.dragTarget.style.transform = "translateZ(0)";
    showToolbar();
  }

  function endDrag() {
    if (!editor.isDragging) return;

    if (editor.dragTarget && editor.hasMoved) {
      const index = Number.parseInt(editor.dragTarget.dataset.index || "-1", 10);
      const state = getElementState(index);

      if (state) {
        state.left = editor.dragTarget.style.left;
        state.top = editor.dragTarget.style.top;
        saveHistoryState();
      }
    }

    if (editor.dragTarget) editor.dragTarget.classList.remove("dragging");
    
    editor.isDragging = false;
    editor.dragTarget = null;
    editor.hasMoved = false;

    document.removeEventListener("mousemove", doDrag);
    document.removeEventListener("mouseup", endDrag);
    updateFormData();
  }

  function applyStyleChange(property, value) {
    const state = getElementState(editor.activeElementIndex);
    if (!state || !editor.activeTextElement) return;

    state.style = state.style || {};
    state.style[property] = value;
    editor.activeTextElement.style[property] = value;
    editor.activeTextElement.style.transform = "translateZ(0)";
    
    saveHistoryState();
    syncSidebarControls();
    updateFormData();
  }

  function toggleStyle(property, onValue, offValue) {
    const state = getElementState(editor.activeElementIndex);
    if (!state) return;

    const currentValue = state.style?.[property] || offValue;
    applyStyleChange(property, currentValue === onValue ? offValue : onValue);
  }

  // --- FLOATING TOOLBAR ---
  function createToolbar() {
    if (editor.toolbar) return editor.toolbar;

    const toolbar = document.createElement("div");
    toolbar.id = "floating-toolbar";
    toolbar.innerHTML = [
      '<button type="button" id="toolbar-bold" title="Bold">B</button>',
      '<button type="button" id="toolbar-italic" title="Italic"><span style="font-style: italic;">I</span></button>',
      '<input type="color" id="toolbar-color" title="Text color" value="#ffffff">',
      '<button type="button" id="toolbar-delete" title="Delete">Del</button>'
    ].join("");

    document.body.appendChild(toolbar);
    editor.toolbar = toolbar;

    toolbar.querySelector("#toolbar-bold")?.addEventListener("click", () => {
      toggleStyle("fontWeight", "bold", "normal");
      showToolbar();
    });

    toolbar.querySelector("#toolbar-italic")?.addEventListener("click", () => {
      toggleStyle("fontStyle", "italic", "normal");
      showToolbar();
    });

    toolbar.querySelector("#toolbar-color")?.addEventListener("input", (event) => {
      applyStyleChange("color", event.target.value);
      showToolbar();
    });

    toolbar.querySelector("#toolbar-delete")?.addEventListener("click", () => {
      removeElement(editor.activeElementIndex);
    });

    return toolbar;
  }

  function showToolbar() {
    const toolbar = createToolbar();

    if (!editor.activeTextElement || editor.activeTextElement.isContentEditable) {
      toolbar.classList.remove("show");
      toolbar.style.display = "none";
      return;
    }

    const rect = editor.activeTextElement.getBoundingClientRect();
    const top = Math.max(12, rect.top - toolbar.offsetHeight - 12);
    const left = Math.min(
      window.innerWidth - toolbar.offsetWidth - 12,
      Math.max(12, rect.left + rect.width / 2 - toolbar.offsetWidth / 2)
    );

    const colorPicker = toolbar.querySelector("#toolbar-color");
    const state = getElementState(editor.activeElementIndex);

    if (colorPicker && state?.style?.color) {
      colorPicker.value = state.style.color;
    }

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
    toolbar.style.display = "flex";
    toolbar.classList.add("show");
  }

  function hideToolbar() {
    const toolbar = editor.toolbar;
    if (!toolbar) return;

    toolbar.classList.remove("show");
    toolbar.style.display = "none";
  }

  function bindTextEvents(element) {
    element.contentEditable = "false";
    element.style.transform = "translateZ(0)";

    element.addEventListener("click", (event) => {
      if (editor.hasMoved) return;
      event.stopPropagation();
      if (!element.isContentEditable) setActiveElement(element);
    });

    element.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      enableEditing(element);
    });

    element.addEventListener("mousedown", (event) => {
      if (element.isContentEditable) return;
      startDrag(event, element);
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        element.blur();
      }
    });

    element.addEventListener("blur", () => {
      saveElementText(element);
      showToolbar();
    });
  }

  // --- EVENT LISTENERS ---
  bgColorInput?.addEventListener("input", (event) => {
    window.cardData.backgroundColor = event.target.value;
    if (!window.cardData.backgroundImage) {
      cardCanvas.style.backgroundColor = event.target.value;
    }
    renderEditor();
    saveHistoryState();
  });

  bgImageInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      window.cardData.backgroundImage = loadEvent.target?.result || "";
      renderEditor();
      saveHistoryState();
    };
    reader.readAsDataURL(file);
  });

  bgImageDeleteButton?.addEventListener("click", () => {
    window.cardData.backgroundImage = "";
    if (!window.cardData.backgroundColor) window.cardData.backgroundColor = "#f0f0f0";
    if (bgImageInput) bgImageInput.value = "";
    renderEditor();
    saveHistoryState();
  });

  fontSizeInput?.addEventListener("input", (event) => {
    if (editor.activeElementIndex === -1) return; // Prevent silent failure
    if (fontSizeDisplay) fontSizeDisplay.textContent = `${event.target.value}px`;
    applyStyleChange("fontSize", `${event.target.value}px`);
  });

  fontFamilyInput?.addEventListener("change", (event) => {
    if (editor.activeElementIndex === -1) return; // Prevent silent failure
    applyStyleChange("fontFamily", event.target.value);
  });

  addTextButton?.addEventListener("click", () => {
    window.cardData.elements.push({
      id: `custom-${Date.now()}`,
      text: "Double-click to edit",
      left: "10%",
      top: "40%",
      style: {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: fontFamilyInput?.value || "Playfair Display",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        width: "80%"
      }
    });

    editor.activeElementIndex = window.cardData.elements.length - 1;
    saveHistoryState();
    renderEditor();

    const newElement = cardInner.querySelector(`[data-index="${editor.activeElementIndex}"]`);
    if (newElement) enableEditing(newElement);
  });

  form?.addEventListener("submit", updateFormData);

  // ✅ FIXED FOCUS DROPPING BUG HERE ✅
  document.addEventListener("mousedown", (event) => {
    const toolbar = createToolbar();
    const clickedInsideToolbar = toolbar.contains(event.target);
    const clickedInsideCanvas = cardCanvas.contains(event.target);
    const clickedText = event.target.closest(".editable-text");
    
    // Check if the user is clicking inside the sidebar tools
    const clickedSidebar = document.querySelector(".tools-sidebar")?.contains(event.target);

    // Only drop selection if clicking outside canvas, floating toolbar, AND sidebar
    if (!clickedInsideToolbar && (!clickedInsideCanvas || !clickedText) && !clickedSidebar) {
      if (editor.activeTextElement && !editor.activeTextElement.isContentEditable) {
        setActiveElement(null);
      }
    }
  });

  window.addEventListener("resize", showToolbar);
  
  // Initial Render
  renderEditor();
});