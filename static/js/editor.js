// ===============================
// CARDHUB FULL EDITOR SCRIPT
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  let activeTextElement = null;
  const card = document.getElementById("card-preview");

  // ===============================
  // SELECT TEXT WHEN CLICKED
  // ===============================
  document.querySelectorAll(".editable-text").forEach(el => {
    el.style.cursor = "pointer";

    el.addEventListener("click", function (e) {
      e.stopPropagation();

      document.querySelectorAll(".editable-text").forEach(t => {
        t.classList.remove("ring-2", "ring-pink-500");
      });

      this.classList.add("ring-2", "ring-pink-500");
      activeTextElement = this;
    });
  });

  // Remove selection if clicked outside
  document.addEventListener("click", function () {
    document.querySelectorAll(".editable-text").forEach(t => {
      t.classList.remove("ring-2", "ring-pink-500");
    });
    activeTextElement = null;
  });

  // ===============================
  // TEXT COLOR CHANGE
  // ===============================
  const textColorPicker = document.getElementById("active-text-color");

  if (textColorPicker) {
    textColorPicker.addEventListener("input", function () {
      if (activeTextElement) {
        activeTextElement.style.color = this.value;
      }
    });
  }

  // ===============================
  // BACKGROUND COLOR
  // ===============================
  const bgColorPicker = document.getElementById("bg-color-picker");

  if (bgColorPicker) {
    bgColorPicker.addEventListener("input", function () {
      card.style.backgroundColor = this.value;
      card.style.backgroundImage = "none";
    });
  }

  // ===============================
  // BACKGROUND IMAGE UPLOAD
  // ===============================
  const bgImageInput = document.getElementById("bg-image-input");

  if (bgImageInput) {
    bgImageInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        card.style.backgroundImage = `url(${e.target.result})`;
        card.style.backgroundSize = "cover";
        card.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    });
  }

  // ===============================
  // DRAG TEXT MOVEMENT
  // ===============================
  document.querySelectorAll(".editable-text").forEach(el => {

    let isDragging = false;
    let offsetX, offsetY;

    el.addEventListener("mousedown", function (e) {
      isDragging = true;
      activeTextElement = this;

      offsetX = e.offsetX;
      offsetY = e.offsetY;

      this.style.position = "absolute";
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging || !activeTextElement) return;

      const rect = card.getBoundingClientRect();

      activeTextElement.style.left = (e.clientX - rect.left - offsetX) + "px";
      activeTextElement.style.top = (e.clientY - rect.top - offsetY) + "px";
    });

    document.addEventListener("mouseup", function () {
      isDragging = false;
    });

  });

  // ===============================
  // EXPORT AS PNG
  // ===============================
  function exportPNG() {
    if (!card) return;

    html2canvas(card, { scale: 3 }).then(canvas => {
      const link = document.createElement("a");
      link.download = "card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", exportPNG);
  }

  // ===============================
  // EXPORT AS PDF
  // ===============================
  const pdfBtn = document.getElementById("pdf-btn");

  if (pdfBtn) {
    pdfBtn.addEventListener("click", function () {
      if (!card) return;

      html2canvas(card, { scale: 3 }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jspdf.jsPDF("landscape");
        pdf.addImage(imgData, "PNG", 10, 10, 270, 150);
        pdf.save("card.pdf");
      });
    });
  }

});