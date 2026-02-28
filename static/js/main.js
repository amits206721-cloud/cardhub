
document.addEventListener('DOMContentLoaded', () => {
  // smooth page enter
  document.body.classList.add('page-enter-active');
  document.body.classList.remove('opacity-0');

  // light haptic feedback on taps (mobile only)
  if ('vibrate' in navigator) {
    const tapSelectors = [
      '.interactive-tap',
      '.btn-primary',
      '.btn-ghost',
      '.nav-chip',
      '.card-hover',
      '.card-hover-small'
    ];
    const elements = document.querySelectorAll(tapSelectors.join(','));
    elements.forEach(el => {
      el.addEventListener('click', () => {
        navigator.vibrate(12);
      });
    });
  }
});
