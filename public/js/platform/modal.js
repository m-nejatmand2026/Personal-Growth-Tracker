function focusableElements(root) {
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

export function activateModal(root, options = {}) {
  if (!root) return () => {};
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = root.querySelector('[role="dialog"]');
  if (!dialog) return () => {};
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown, true);
    options.onClose?.();
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = focusableElements(dialog);
    if (!items.length) { event.preventDefault(); dialog.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  document.addEventListener('keydown', onKeyDown, true);
  requestAnimationFrame(() => {
    const target = options.initialFocus?.() || dialog.querySelector('[autofocus]') || focusableElements(dialog)[0] || dialog;
    target?.focus();
  });
  return close;
}
