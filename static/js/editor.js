document.addEventListener("DOMContentLoaded", function () {

let activeTextElement = null;
const preview = document.getElementById("card-preview");
if (!preview) return;

/* ================================================= */
/* ================= HELPER FUNCTION ============== */
/* ================================================= */

function getTargetElements() {
    // Returns selected element if one is selected, otherwise returns empty array
    if (activeTextElement) {
        return [activeTextElement];
    }
    // No selection - return empty array (style changes will only apply to selected text)
    return [];
}

function getSelectedElement() {
    // Returns only the specifically selected element (if any)
    if (!activeTextElement) {
        return null;
    }
    return activeTextElement;
}

function showAppliedMessage(targetCount) {
    // Show a message indicating what was changed
    const msg = document.createElement("div");
    msg.className = "absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm rounded-2xl pointer-events-none";
    
    if (activeTextElement) {
        // Get element type for more descriptive message
        const elementId = activeTextElement.id || 'element';
        const elementType = elementId.replace('preview-', '').replace('-', ' ').toUpperCase();
        msg.innerText = `Applied to ${elementType}`;
    } else {
        msg.innerText = `Applied to all ${targetCount} text elements`;
    }
    
    msg.style.zIndex = "100";
    preview.appendChild(msg);
    setTimeout(() => msg.remove(), 1000);
}

/* ================================================= */
/* ============== DYNAMIC POSITIONING ============= */
/* ================================================= */

function recalculateTextPositions() {
    // Prevent text overlapping by adjusting positions based on content height
    const labelEl = document.getElementById("preview-label");
    const titleEl = document.getElementById("preview-title");
    const line1El = document.getElementById("preview-line1");
    const line2El = document.getElementById("preview-line2");
    
    if (!labelEl || !titleEl || !line1El || !line2El) return;
    
    // Get current positions and heights
    const labelTop = parseInt(labelEl.style.top) || 70;
    const titleTop = parseInt(titleEl.style.top) || 130;
    const line1Top = parseInt(line1El.style.top) || 230;
    const line2Top = parseInt(line2El.style.top) || 300;
    
    const labelHeight = labelEl.offsetHeight;
    const titleHeight = titleEl.offsetHeight;
    const line1Height = line1El.offsetHeight;
    const line2Height = line2El.offsetHeight;
    
    // Minimum gap between text elements
    const minGap = 15;
    
    // Calculate new positions to prevent overlap
    let newLabelTop = labelTop;
    let newTitleTop = Math.max(newLabelTop + labelHeight + minGap, titleTop);
    let newLine1Top = Math.max(newTitleTop + titleHeight + minGap, line1Top);
    let newLine2Top = Math.max(newLine1Top + line1Height + minGap, line2Top);
    
    // Apply new positions
    labelEl.style.top = newLabelTop + "px";
    titleEl.style.top = newTitleTop + "px";
    line1El.style.top = newLine1Top + "px";
    line2El.style.top = newLine2Top + "px";
}

// Initial position calculation on load
setTimeout(recalculateTextPositions, 100);

/* ================================================= */
/* ================= HELPER FUNCTION ============== */
/* ================================================= */

/* Note: getTargetElements() is defined at the top of the file - returns all editable text elements */

/* ================================================= */
/* ================= INITIAL SETUP ================= */
/* ================================================= */

document.querySelectorAll(".editable-text").forEach(el => {

    el.addEventListener("click", function (e) {
        e.stopPropagation();
        selectText(el);
    });

    el.addEventListener("dblclick", function () {
        el.contentEditable = true;
        el.style.cursor = "text";
        el.focus();
    });

    el.addEventListener("blur", function () {
        el.contentEditable = false;
        el.style.cursor = "move";
    });
});

/* ================================================= */
/* ============== LOAD SAVED STYLES ============== */
/* ================================================= */

function loadSavedStyles() {
    const cardData = window.cardData;
    if (!cardData) return;
    
    const previewLabel = document.getElementById("preview-label");
    const previewTitle = document.getElementById("preview-title");
    const previewLine1 = document.getElementById("preview-line1");
    const previewLine2 = document.getElementById("preview-line2");
    const preview = document.getElementById("card-preview");
    
    // Load text positions
    if (cardData.label_top && previewLabel) {
        previewLabel.style.top = cardData.label_top + "px";
    }
    if (cardData.title_top && previewTitle) {
        previewTitle.style.top = cardData.title_top + "px";
    }
    if (cardData.line1_top && previewLine1) {
        previewLine1.style.top = cardData.line1_top + "px";
    }
    if (cardData.line2_top && previewLine2) {
        previewLine2.style.top = cardData.line2_top + "px";
    }
    
    // Load text colors
    if (cardData.label_color && previewLabel) {
        previewLabel.style.color = cardData.label_color;
    }
    if (cardData.title_color && previewTitle) {
        previewTitle.style.color = cardData.title_color;
    }
    if (cardData.line1_color && previewLine1) {
        previewLine1.style.color = cardData.line1_color;
    }
    if (cardData.line2_color && previewLine2) {
        previewLine2.style.color = cardData.line2_color;
    }
    
    // Load font family
    if (cardData.font_family) {
        const allTexts = [previewLabel, previewTitle, previewLine1, previewLine2];
        allTexts.forEach(el => {
            if (el) el.style.fontFamily = cardData.font_family;
        });
        // Update font selector
        const fontSelect = document.getElementById("font-family");
        if (fontSelect) {
            const options = fontSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === cardData.font_family || options[i].value.includes(cardData.font_family.replace(/['"]/g, ''))) {
                    fontSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    // Load title size
    if (cardData.title_size && previewTitle) {
        previewTitle.style.fontSize = cardData.title_size + "px";
    }
    const titleSizeSlider = document.getElementById("title-size");
    if (titleSizeSlider && cardData.title_size) {
        titleSizeSlider.value = cardData.title_size;
    }
    
    // Load body size
    if (cardData.body_size && previewLine1) {
        previewLine1.style.fontSize = cardData.body_size + "px";
    }
    if (cardData.body_size && previewLine2) {
        previewLine2.style.fontSize = (parseInt(cardData.body_size) - 4) + "px";
    }
    const bodySizeSlider = document.getElementById("body-size");
    if (bodySizeSlider && cardData.body_size) {
        bodySizeSlider.value = cardData.body_size;
    }
    
    // Load bold style
    if (cardData.text_bold) {
        if (previewTitle) previewTitle.style.fontWeight = "bold";
        const boldToggle = document.getElementById("bold-toggle");
        if (boldToggle) boldToggle.checked = true;
    }
    
    // Load italic style
    if (cardData.text_italic) {
        if (previewTitle) previewTitle.style.fontStyle = "italic";
        const italicToggle = document.getElementById("italic-toggle");
        if (italicToggle) italicToggle.checked = true;
    }
    
    // Load background color
    if (cardData.bg_color && preview) {
        preview.style.backgroundColor = cardData.bg_color;
        const bgColorInput = document.getElementById("bg-color");
        if (bgColorInput) bgColorInput.value = cardData.bg_color;
    }
    
    // Load background image
    if (cardData.bg_image && preview) {
        preview.style.backgroundImage = cardData.bg_image;
        preview.style.backgroundSize = "cover";
        preview.style.backgroundPosition = "center";
    }
    
    // Sync title color control
    const titleColorInput = document.getElementById("title-color");
    if (titleColorInput && cardData.title_color) {
        titleColorInput.value = cardData.title_color;
    }
    
    // Sync body color control
    const bodyColorInput = document.getElementById("body-color");
    if (bodyColorInput && cardData.body_color) {
        bodyColorInput.value = cardData.body_color;
    }
    
    // Sync active text color control
    const activeTextColor = document.getElementById("active-text-color");
    if (activeTextColor && cardData.title_color) {
        activeTextColor.value = cardData.title_color;
    }
    
    // Update hidden inputs with loaded values
    updateHiddenInputs();
}

loadSavedStyles();

/* ================================================= */
/* ================= SELECT SYSTEM ================= */
/* ================================================= */

document.addEventListener("click", function (e) {
    const target = e.target;
    const isInPreview = preview && preview.contains(target);
    const isInSidebar = target.closest('.space-y-8');
    
    if (isInPreview || isInSidebar) {
        return;
    }
    
    document.querySelectorAll(".editable-text").forEach(t => t.classList.remove("active-element"));
    activeTextElement = null;
});

/* ================================================= */
/* ================= DRAG SYSTEM =================== */
/* ================================================= */

let isDragging = false;
let offsetY = 0;

preview.addEventListener("mousedown", function (e) {
    if (!e.target.classList.contains("editable-text")) return;
    if (e.target.isContentEditable) return;

    activeTextElement = e.target;
    selectText(activeTextElement);

    isDragging = true;
    const rect = activeTextElement.getBoundingClientRect();
    offsetY = e.clientY - rect.top;
});

preview.addEventListener("mousemove", function (e) {
    if (!isDragging || !activeTextElement) return;

    const previewRect = preview.getBoundingClientRect();
    let y = e.clientY - previewRect.top - offsetY;
    const maxY = preview.clientHeight - activeTextElement.offsetHeight;
    y = Math.max(0, Math.min(y, maxY));

    activeTextElement.style.top = y + "px";
});

document.addEventListener("mouseup", function () {
    isDragging = false;
});

/* ================================================= */
/* ================= KEYBOARD MOVE ================= */
/* ================================================= */

document.addEventListener("keydown", function (e) {
    if (!activeTextElement || activeTextElement.isContentEditable) return;

    let step = e.shiftKey ? 10 : 2;
    let top = parseInt(activeTextElement.style.top || 0);

    if (e.key === "ArrowUp") activeTextElement.style.top = (top - step) + "px";
    if (e.key === "ArrowDown") activeTextElement.style.top = (top + step) + "px";
    if (e.key === "Delete") {
        activeTextElement.remove();
        activeTextElement = null;
    }
});

/* ================================================= */
/* ================= INPUT SYNC ==================== */
/* ================================================= */

function bindInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const target = document.getElementById(previewId);
    if (!input || !target) return;
    input.addEventListener("input", function () {
        target.innerText = this.value;
        // Recalculate positions after text changes to prevent overlapping
        setTimeout(recalculateTextPositions, 10);
    });
}

bindInput("label-input", "preview-label");
bindInput("title-input", "preview-title");
bindInput("line1-input", "preview-line1");
bindInput("line2-input", "preview-line2");

/* ================================================= */
/* ================= HELPER FUNCTIONS ============== */
/* ================================================= */

function rgbToHex(rgb) {
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return "#d4af37";
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function syncStyleControls(el) {
    if (!el) return;
    
    const colorPicker = document.getElementById("active-text-color");
    const boldToggle = document.getElementById("bold-toggle");
    const italicToggle = document.getElementById("italic-toggle");
    const computedStyle = window.getComputedStyle(el);
    
    if (colorPicker) {
        const color = el.style.color || computedStyle.color;
        if (color.startsWith('rgb')) colorPicker.value = rgbToHex(color);
        else if (color.startsWith('#')) colorPicker.value = color;
    }
    
    if (boldToggle) {
        const fontWeight = el.style.fontWeight || computedStyle.fontWeight;
        boldToggle.checked = fontWeight === "bold" || fontWeight === "700";
    }
    
    if (italicToggle) {
        const fontStyle = el.style.fontStyle || computedStyle.fontStyle;
        italicToggle.checked = fontStyle === "italic";
    }
}

function selectText(el) {
    document.querySelectorAll(".editable-text").forEach(t => t.classList.remove("active-element"));
    activeTextElement = el;
    el.classList.add("active-element");

    const sizeSlider = document.getElementById("active-size");
    if (sizeSlider) {
        const size = parseInt(window.getComputedStyle(el).fontSize);
        sizeSlider.value = size;
    }
    syncStyleControls(el);
}

/* ================================================= */
/* ================= FONT CONTROL ================== */
/* ================================================= */

const fontSelect = document.getElementById("font-family");
if (fontSelect) {
    fontSelect.addEventListener("change", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontFamily = this.value;
            showAppliedMessage(1);
        } else {
            // Apply to all text elements
            const allTexts = ['preview-label', 'preview-title', 'preview-line1', 'preview-line2'];
            let count = 0;
            allTexts.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.fontFamily = this.value;
                    count++;
                }
            });
            showAppliedMessage(count);
        }
    });
    
    setTimeout(() => {
        const previewTitle = document.getElementById("preview-title");
        if (previewTitle && fontSelect) {
            const computedFont = window.getComputedStyle(previewTitle).fontFamily;
            const options = fontSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === computedFont || options[i].value.includes(computedFont.replace(/['"]/g, ''))) {
                    fontSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }, 100);
}

/* ================================================= */
/* ================= SIZE CONTROLS ================= */
/* ================================================= */

const activeSize = document.getElementById("active-size");
if (activeSize) {
    activeSize.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontSize = this.value + "px";
            showAppliedMessage(1);
        } else {
            // Apply to all text elements
            const allTexts = ['preview-label', 'preview-title', 'preview-line1', 'preview-line2'];
            let count = 0;
            allTexts.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.fontSize = this.value + "px";
                    count++;
                }
            });
            showAppliedMessage(count);
        }
        // Recalculate positions after size changes to prevent overlapping
        setTimeout(recalculateTextPositions, 10);
    });
    setTimeout(() => {
        if (activeTextElement) {
            activeSize.value = parseInt(window.getComputedStyle(activeTextElement).fontSize);
        }
    }, 100);
}

/* ================================================= */
/* ================= STYLE CONTROLS ================= */
/* ================================================= */

const colorPicker = document.getElementById("active-text-color");
if (colorPicker) {
    colorPicker.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.color = this.value;
            showAppliedMessage(1);
        } else {
            // Apply to all text elements
            const allTexts = ['preview-label', 'preview-title', 'preview-line1', 'preview-line2'];
            let count = 0;
            allTexts.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.color = this.value;
                    count++;
                }
            });
            showAppliedMessage(count);
        }
    });
    setTimeout(() => {
        if (activeTextElement) {
            const color = activeTextElement.style.color || window.getComputedStyle(activeTextElement).color;
            if (color.startsWith('rgb')) colorPicker.value = rgbToHex(color);
            else if (color.startsWith('#')) colorPicker.value = color;
        }
    }, 100);
}

const boldToggle = document.getElementById("bold-toggle");
if (boldToggle) {
    boldToggle.addEventListener("change", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontWeight = this.checked ? "bold" : "normal";
            showAppliedMessage(1);
        } else {
            // Apply to all text elements
            const allTexts = ['preview-label', 'preview-title', 'preview-line1', 'preview-line2'];
            let count = 0;
            allTexts.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.fontWeight = this.checked ? "bold" : "normal";
                    count++;
                }
            });
            showAppliedMessage(count);
        }
    });
    setTimeout(() => {
        if (activeTextElement) {
            const fw = activeTextElement.style.fontWeight || window.getComputedStyle(activeTextElement).fontWeight;
            boldToggle.checked = fw === "bold" || fw === "700";
        }
    }, 100);
}

const italicToggle = document.getElementById("italic-toggle");
if (italicToggle) {
    italicToggle.addEventListener("change", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontStyle = this.checked ? "italic" : "normal";
            showAppliedMessage(1);
        } else {
            // Apply to all text elements
            const allTexts = ['preview-label', 'preview-title', 'preview-line1', 'preview-line2'];
            let count = 0;
            allTexts.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.fontStyle = this.checked ? "italic" : "normal";
                    count++;
                }
            });
            showAppliedMessage(count);
        }
    });
    setTimeout(() => {
        if (activeTextElement) {
            const fs = activeTextElement.style.fontStyle || window.getComputedStyle(activeTextElement).fontStyle;
            italicToggle.checked = fs === "italic";
        }
    }, 100);
}

/* ================================================= */
/* ================= TITLE CONTROLS ================ */
/* ================================================= */

const titleSize = document.getElementById("title-size");
if (titleSize) {
    titleSize.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontSize = this.value + "px";
            showAppliedMessage(1);
        } else {
            // Apply to title element
            const previewTitle = document.getElementById("preview-title");
            if (previewTitle) {
                previewTitle.style.fontSize = this.value + "px";
                showAppliedMessage(1);
            }
        }
        // Recalculate positions after size changes to prevent overlapping
        setTimeout(recalculateTextPositions, 10);
    });
    // Initialize with current value
    setTimeout(() => {
        const previewTitle = document.getElementById("preview-title");
        if (previewTitle && titleSize) {
            const computedSize = window.getComputedStyle(previewTitle).fontSize;
            titleSize.value = parseInt(computedSize);
        }
    }, 100);
}

const titleColor = document.getElementById("title-color");
if (titleColor) {
    titleColor.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.color = this.value;
            showAppliedMessage(1);
        } else {
            // Apply to title element
            const previewTitle = document.getElementById("preview-title");
            if (previewTitle) {
                previewTitle.style.color = this.value;
                showAppliedMessage(1);
            }
        }
    });
    // Initialize with current value
    setTimeout(() => {
        const previewTitle = document.getElementById("preview-title");
        if (previewTitle && titleColor) {
            const color = previewTitle.style.color || window.getComputedStyle(previewTitle).color;
            if (color.startsWith('rgb')) titleColor.value = rgbToHex(color);
            else if (color.startsWith('#')) titleColor.value = color;
        }
    }, 100);
}

/* ================================================= */
/* ================= BODY CONTROLS ================= */
/* ================================================= */

const bodySize = document.getElementById("body-size");
if (bodySize) {
    bodySize.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.fontSize = this.value + "px";
            showAppliedMessage(1);
        } else {
            // Apply to body text elements (line1 and line2)
            const previewLine1 = document.getElementById("preview-line1");
            const previewLine2 = document.getElementById("preview-line2");
            let count = 0;
            if (previewLine1) {
                previewLine1.style.fontSize = this.value + "px";
                count++;
            }
            if (previewLine2) {
                previewLine2.style.fontSize = (parseInt(this.value) - 4) + "px";
                count++;
            }
            showAppliedMessage(count);
        }
        // Recalculate positions after size changes to prevent overlapping
        setTimeout(recalculateTextPositions, 10);
    });
    // Initialize with current value
    setTimeout(() => {
        const previewLine1 = document.getElementById("preview-line1");
        if (previewLine1 && bodySize) {
            const computedSize = window.getComputedStyle(previewLine1).fontSize;
            bodySize.value = parseInt(computedSize);
        }
    }, 100);
}

const bodyColor = document.getElementById("body-color");
if (bodyColor) {
    bodyColor.addEventListener("input", function (e) {
        e.stopPropagation();
        // Check if a text element is selected
        if (activeTextElement) {
            // Apply to selected element only
            activeTextElement.style.color = this.value;
            showAppliedMessage(1);
        } else {
            // Apply to body text elements (line1 and line2)
            const previewLine1 = document.getElementById("preview-line1");
            const previewLine2 = document.getElementById("preview-line2");
            let count = 0;
            if (previewLine1) {
                previewLine1.style.color = this.value;
                count++;
            }
            if (previewLine2) {
                previewLine2.style.color = this.value;
                count++;
            }
            showAppliedMessage(count);
        }
    });
    // Initialize with current value
    setTimeout(() => {
        const previewLine1 = document.getElementById("preview-line1");
        if (previewLine1 && bodyColor) {
            const color = previewLine1.style.color || window.getComputedStyle(previewLine1).color;
            if (color.startsWith('rgb')) bodyColor.value = rgbToHex(color);
            else if (color.startsWith('#')) bodyColor.value = color;
        }
    }, 100);
}

/* ================================================= */
/* ================= POSITION CONTROLS ============= */
/* ================================================= */

function bindPositionControl(controlId, previewId, hiddenInputId) {
    const control = document.getElementById(controlId);
    const target = document.getElementById(previewId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!control || !target) return;
    
    control.addEventListener("input", function() {
        target.style.top = this.value + "px";
        if (hiddenInput) {
            hiddenInput.value = this.value;
        }
    });
    
    // Initialize with current position
    setTimeout(() => {
        const currentTop = parseInt(target.style.top) || 70;
        control.value = currentTop;
        if (hiddenInput) {
            hiddenInput.value = currentTop;
        }
    }, 100);
}

bindPositionControl("label-top-ctrl", "preview-label", "label-top-input");
bindPositionControl("title-top-ctrl", "preview-title", "title-top-input");
bindPositionControl("line1-top-ctrl", "preview-line1", "line1-top-input");
bindPositionControl("line2-top-ctrl", "preview-line2", "line2-top-input");

/* ================================================= */
/* ================= ACTIVE TEXT BOLD/ITALIC ======= */
/* ================================================= */

const activeBoldToggle = document.getElementById("active-bold-toggle");
if (activeBoldToggle) {
    activeBoldToggle.addEventListener("change", function(e) {
        e.stopPropagation();
        if (activeTextElement) {
            activeTextElement.style.fontWeight = this.checked ? "bold" : "normal";
        }
    });
}

const activeItalicToggle = document.getElementById("active-italic-toggle");
if (activeItalicToggle) {
    activeItalicToggle.addEventListener("change", function(e) {
        e.stopPropagation();
        if (activeTextElement) {
            activeTextElement.style.fontStyle = this.checked ? "italic" : "normal";
        }
    });
}

/* ================================================= */
/* ================= BACKGROUND ==================== */
/* ================================================= */

const bgColor = document.getElementById("bg-color");
if (bgColor) {
    bgColor.addEventListener("input", function (e) {
        e.stopPropagation();
        preview.style.backgroundImage = "none";
        preview.style.backgroundColor = this.value;
    });
}

const bgImage = document.getElementById("bg-image");
if (bgImage) {
    bgImage.addEventListener("change", function (e) {
        e.stopPropagation();
        const reader = new FileReader();
        reader.onload = function (event) {
            preview.style.backgroundImage = `url(${event.target.result})`;
            preview.style.backgroundSize = "cover";
            preview.style.backgroundPosition = "center";
        };
        if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
    });
}

/* ================================================= */
/* ================= BG IMAGE DELETE ============== */
/* ================================================= */

const bgImageDelete = document.getElementById("bg-image-delete");
if (bgImageDelete) {
    bgImageDelete.addEventListener("click", function (e) {
        e.stopPropagation();
        preview.style.backgroundImage = "none";
        preview.style.backgroundColor = document.getElementById("bg-color")?.value || "#111111";
        document.getElementById("bg-image").value = "";
    });
}

/* ================================================= */
/* ================= ADD TEXT BUTTON =============== */
/* ================================================= */

const addTextBtn = document.getElementById("add-text-btn");
if (addTextBtn) {
    addTextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const newText = document.createElement("div");
        newText.className = "editable-text text-lg text-white";
        newText.style.top = "200px";
        newText.style.left = "50%";
        newText.style.transform = "translateX(-50%)";
        newText.contentEditable = false;
        newText.style.cursor = "move";
        newText.innerText = "New Text";
        
        // Add event listeners
        newText.addEventListener("click", function (evt) {
            evt.stopPropagation();
            selectText(newText);
        });
        
        newText.addEventListener("dblclick", function () {
            newText.contentEditable = true;
            newText.style.cursor = "text";
            newText.focus();
        });
        
        newText.addEventListener("blur", function () {
            newText.contentEditable = false;
            newText.style.cursor = "move";
        });
        
        preview.appendChild(newText);
        selectText(newText);
    });
}

/* ================================================= */
/* ================= DOWNLOAD ====================== */
/* ================================================= */

window.downloadCard = function () {
    // Clone the preview element to modify it for download without affecting the editor
    const clone = preview.cloneNode(true);
    
    // Get computed styles for background
    const computedStyle = window.getComputedStyle(preview);
    const bgColor = preview.style.backgroundColor || computedStyle.backgroundColor;
    const bgImage = preview.style.backgroundImage || computedStyle.backgroundImage;
    
    // Set background explicitly - override any pseudo-element effects
    if (bgImage && bgImage !== "none") {
        clone.style.background = bgImage;
        clone.style.backgroundSize = preview.style.backgroundSize || "cover";
        clone.style.backgroundPosition = preview.style.backgroundPosition || "center";
    } else if (bgColor) {
        clone.style.background = bgColor;
    } else {
        clone.style.background = "#111111";
    }
    
    // Remove border and radius for clean export (or keep radius if desired)
    clone.style.border = "none";
    
    // Ensure the clone has the same dimensions
    clone.style.width = preview.offsetWidth + "px";
    clone.style.height = preview.offsetHeight + "px";
    
    // Remove any ::before or ::after pseudo-element effects by removing them from clone
    // This is done by explicitly setting content and styles
    clone.style.overflow = "hidden";
    
    // Temporarily append to body (hidden) for html2canvas to capture
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    document.body.appendChild(clone);
    
    html2canvas(clone, { 
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false
    }).then(canvas => {
        // Remove clone from body
        document.body.removeChild(clone);
        
        const link = document.createElement("a");
        link.download = "cardhub-design.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
};

/* ================================================= */
/* ================= SYNC CONTROLS ON SELECT ====== */
/* ================================================= */

function syncControlsToSelection() {
    if (!activeTextElement) return;
    
    const el = activeTextElement;
    const computedStyle = window.getComputedStyle(el);
    
    // Update color picker
    const colorPicker = document.getElementById("active-text-color");
    if (colorPicker) {
        const color = el.style.color || computedStyle.color;
        if (color.startsWith('rgb')) colorPicker.value = rgbToHex(color);
        else if (color.startsWith('#')) colorPicker.value = color;
    }
    
    // Update bold toggle
    const boldToggle = document.getElementById("bold-toggle");
    if (boldToggle) {
        const fontWeight = el.style.fontWeight || computedStyle.fontWeight;
        boldToggle.checked = fontWeight === "bold" || fontWeight === "700";
    }
    
    // Update italic toggle
    const italicToggle = document.getElementById("italic-toggle");
    if (italicToggle) {
        const fontStyle = el.style.fontStyle || computedStyle.fontStyle;
        italicToggle.checked = fontStyle === "italic";
    }
    
    // Update size slider
    const sizeSlider = document.getElementById("active-size");
    if (sizeSlider) {
        const size = parseInt(computedStyle.fontSize);
        sizeSlider.value = size;
    }
}

// Modify selectText function to sync controls
const originalSelectText = selectText;
selectText = function(el) {
    originalSelectText(el);
    syncControlsToSelection();
};

/* ================================================= */
/* ================= UPDATE HIDDEN INPUTS ========= */
/* ================================================= */

function updateHiddenInputs() {
    // Font family
    const fontFamilyInput = document.getElementById("font-family-input");
    const fontSelect = document.getElementById("font-family");
    if (fontFamilyInput && fontSelect) {
        fontFamilyInput.value = fontSelect.value;
    }
    
    // Title size and color
    const titleSizeInput = document.getElementById("title-size-input");
    const titleSize = document.getElementById("title-size");
    const titleColorInput = document.getElementById("title-color-input");
    const titleColor = document.getElementById("title-color");
    const previewTitle = document.getElementById("preview-title");
    
    if (titleSizeInput && titleSize) {
        titleSizeInput.value = titleSize.value;
    }
    if (titleColorInput && titleColor) {
        titleColorInput.value = titleColor.value;
    }
    if (previewTitle && titleColorInput) {
        titleColorInput.value = previewTitle.style.color || "#d4af37";
    }
    
    // Body size and color
    const bodySizeInput = document.getElementById("body-size-input");
    const bodySize = document.getElementById("body-size");
    const bodyColorInput = document.getElementById("body-color-input");
    const bodyColor = document.getElementById("body-color");
    
    if (bodySizeInput && bodySize) {
        bodySizeInput.value = bodySize.value;
    }
    if (bodyColorInput && bodyColor) {
        bodyColorInput.value = bodyColor.value;
    }
    
    // Bold and italic for selected element
    const textBoldInput = document.getElementById("text-bold-input");
    const textItalicInput = document.getElementById("text-italic-input");
    const boldToggle = document.getElementById("bold-toggle");
    const italicToggle = document.getElementById("italic-toggle");
    
    if (textBoldInput && boldToggle) {
        textBoldInput.value = boldToggle.checked ? "1" : "0";
    }
    if (textItalicInput && italicToggle) {
        textItalicInput.value = italicToggle.checked ? "1" : "0";
    }
    
    // Background image
    const bgImageInput = document.getElementById("bg-image-input");
    if (bgImageInput && preview) {
        const bgImage = preview.style.backgroundImage;
        if (bgImage && bgImage !== "none") {
            bgImageInput.value = bgImage;
        }
    }
    
    // Background color
    const bgColorInput = document.getElementById("bg-color-input");
    const bgColorControl = document.getElementById("bg-color");
    if (bgColorInput && bgColorControl) {
        bgColorInput.value = bgColorControl.value;
    }
    
    // Text positions
    const labelTopInput = document.getElementById("label-top-input");
    const titleTopInput = document.getElementById("title-top-input");
    const line1TopInput = document.getElementById("line1-top-input");
    const line2TopInput = document.getElementById("line2-top-input");
    
    const previewLabel = document.getElementById("preview-label");
    const previewLine1 = document.getElementById("preview-line1");
    const previewLine2 = document.getElementById("preview-line2");
    
    if (labelTopInput && previewLabel) {
        labelTopInput.value = parseInt(previewLabel.style.top) || 70;
    }
    if (titleTopInput && previewTitle) {
        titleTopInput.value = parseInt(previewTitle.style.top) || 130;
    }
    if (line1TopInput && previewLine1) {
        line1TopInput.value = parseInt(previewLine1.style.top) || 230;
    }
    if (line2TopInput && previewLine2) {
        line2TopInput.value = parseInt(previewLine2.style.top) || 300;
    }
}

// Bind form submit to update hidden inputs
const form = document.querySelector("form[action*='save_card']");
if (form) {
    form.addEventListener("submit", function() {
        updateHiddenInputs();
    });
}

/* ================================================= */
/* ================= INITIALIZE CONTROLS =========== */
/* ================================================= */

function initializeControls() {
    // Set font selector to match current title font
    setTimeout(() => {
        const previewTitle = document.getElementById("preview-title");
        const fontSelect = document.getElementById("font-family");
        if (previewTitle && fontSelect) {
            const computedFont = window.getComputedStyle(previewTitle).fontFamily;
            const options = fontSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value.includes(computedFont.replace(/['"]/g, ''))) {
                    fontSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Initialize title size slider
        const titleSize = document.getElementById("title-size");
        if (titleSize && previewTitle) {
            titleSize.value = parseInt(window.getComputedStyle(previewTitle).fontSize) || 50;
        }
        
        // Initialize title color
        const titleColor = document.getElementById("title-color");
        if (titleColor && previewTitle) {
            const color = previewTitle.style.color || window.getComputedStyle(previewTitle).color;
            if (color.startsWith('rgb')) titleColor.value = rgbToHex(color);
            else if (color.startsWith('#')) titleColor.value = color;
        }
        
        // Initialize body size slider
        const bodySize = document.getElementById("body-size");
        const previewLine1 = document.getElementById("preview-line1");
        if (bodySize && previewLine1) {
            bodySize.value = parseInt(window.getComputedStyle(previewLine1).fontSize) || 18;
        }
        
        // Initialize body color
        const bodyColor = document.getElementById("body-color");
        if (bodyColor && previewLine1) {
            const color = previewLine1.style.color || window.getComputedStyle(previewLine1).color;
            if (color.startsWith('rgb')) bodyColor.value = rgbToHex(color);
            else if (color.startsWith('#')) bodyColor.value = color;
        }
        
        // Initialize background color
        const bgColor = document.getElementById("bg-color");
        if (bgColor && preview) {
            const bg = preview.style.backgroundColor;
            if (bg && bg.startsWith('rgb')) bgColor.value = rgbToHex(bg);
            else if (bg && bg.startsWith('#')) bgColor.value = bg;
        }
    }, 150);
}

initializeControls();

});

