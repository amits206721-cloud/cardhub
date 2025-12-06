function applyTypography() {
  const titleEl = document.getElementById('preview-title');
  const line1El = document.getElementById('preview-line1');
  const line2El = document.getElementById('preview-line2');
  const labelEl = document.getElementById('preview-label');

  const fontFamily = document.getElementById('font-family').value;
  const titleSize = document.getElementById('title-size').value;
  const bodySize = document.getElementById('body-size').value;
  const bold = document.getElementById('bold-toggle').checked;
  const italic = document.getElementById('italic-toggle').checked;

  [titleEl, line1El, line2El].forEach(el => {
    el.style.fontFamily = fontFamily;
  });

  titleEl.style.fontSize = titleSize + 'px';
  line1El.style.fontSize = bodySize + 'px';
  line2El.style.fontSize = bodySize + 'px';

  const weight = bold ? '600' : '400';
  const style = italic ? 'italic' : 'normal';

  [titleEl, line1El, line2El, labelEl].forEach(el => {
    el.style.fontWeight = weight;
    el.style.fontStyle = style;
  });
}

function syncHiddenFields() {
  document.getElementById('hidden-title').value = document.getElementById('title-input').value;
  document.getElementById('hidden-line1').value = document.getElementById('line1-input').value;
  document.getElementById('hidden-line2').value = document.getElementById('line2-input').value;
  document.getElementById('hidden-label').value = document.getElementById('label-input').value;
  document.getElementById('hidden-bg').value = document.getElementById('bg-color').value;
}


// Track which text element on the preview is currently selected for per-text styling
let activeTextElement = null;

function setActiveTextElement(el) {
  if (activeTextElement === el) return;
  // Remove highlight from previous
  document.querySelectorAll('.editable-text.is-selected-text').forEach(node => {
    node.classList.remove('is-selected-text');
  });
  activeTextElement = el;
  if (activeTextElement) {
    activeTextElement.classList.add('is-selected-text');
    // Try to sync the "Selected text size" slider with the element's current font size
    const activeSizeInput = document.getElementById('active-size');
    if (activeSizeInput) {
      const computed = window.getComputedStyle(activeTextElement);
      const sizePx = parseFloat(computed.fontSize) || 16;
      const clamped = Math.min(parseFloat(activeSizeInput.max) || 48, Math.max(parseFloat(activeSizeInput.min) || 10, sizePx));
      activeSizeInput.value = clamped;
    }
    const activeColorInput = document.getElementById('active-text-color');
    if (activeColorInput) {
      const computedColor = window.getComputedStyle(activeTextElement).color;
      // Do not try to convert rgb->hex here, keep the picker value as-is
      // so that user changes immediately override previous colour.
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const labelInput = document.getElementById('label-input');
  const titleInput = document.getElementById('title-input');
  const line1Input = document.getElementById('line1-input');
  const line2Input = document.getElementById('line2-input');

  const labelEl = document.getElementById('preview-label');
  const titleEl = document.getElementById('preview-title');
  const line1El = document.getElementById('preview-line1');
  const line2El = document.getElementById('preview-line2');

  // Make the preview text clickable/selectable (like Canva)
  document.querySelectorAll('.editable-text').forEach(el => {
    el.addEventListener('click', () => {
      setActiveTextElement(el);
    });
  });

  [labelInput, titleInput, line1Input, line2Input].forEach(input => {
    input.addEventListener('input', () => {
      labelEl.textContent = labelInput.value || 'Custom invitation';
      titleEl.textContent = titleInput.value || 'Your card title';
      line1El.textContent = line1Input.value || '';
      line2El.textContent = line2Input.value || '';
      syncHiddenFields();
    });
  });

  const bgColorInput = document.getElementById('bg-color');
  const bgImageInput = document.getElementById('bg-image');
  const cardPreview = document.getElementById('card-preview');

  bgColorInput.addEventListener('input', () => {
    cardPreview.style.backgroundColor = bgColorInput.value;
    document.getElementById('hidden-bg').value = bgColorInput.value;
  });

  bgImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      cardPreview.style.backgroundImage = `url('${e.target.result}')`;
      cardPreview.style.backgroundSize = 'cover';
      cardPreview.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
  });

  ['font-family','title-size','body-size','bold-toggle','italic-toggle'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', applyTypography);
    el.addEventListener('change', applyTypography);
  });

  // Per-text size control
  const activeSizeInput = document.getElementById('active-size');
  if (activeSizeInput) {
    activeSizeInput.addEventListener('input', () => {
      if (activeTextElement) {
        activeTextElement.style.fontSize = activeSizeInput.value + 'px';
      }
    });
  }

  // Per-text colour control (selected text only)
  const activeColorInput = document.getElementById('active-text-color');
  if (activeColorInput) {
    activeColorInput.addEventListener('input', () => {
      if (activeTextElement) {
        activeTextElement.style.color = activeColorInput.value;
      }
    });
  }

  applyTypography();
  syncHiddenFields();

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      if (typeof html2canvas !== 'function') {
        alert('Download not available – the export library failed to load. Please check your internet connection and try again.');
        return;
      }

      const previewNode = document.getElementById('card-preview');
      if (!previewNode) {
        alert('Could not find the card preview to export.');
        return;
      }

      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Preparing image...';

      try {
        const canvas = await html2canvas(previewNode, {
          backgroundColor: null,
          useCORS: true,
          scale: 2
        });

        const link = document.createElement('a');
        link.download = 'cardhub_invitation.png';
        link.href = canvas.toDataURL('image/png');

        // Some browsers need the link to be in the DOM for the click to trigger a download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error(err);
        alert('Unable to generate image. Please try again.');
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download as image';
      }
    });
  }
});
