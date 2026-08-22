let activeModalCount = 0;

function isFocusableVisible(element) {
  if (element.closest('[hidden],[aria-hidden="true"],[inert]')) return false;
  const style = window.getComputedStyle?.(element);
  return !style || (style.display !== 'none' && style.visibility !== 'hidden');
}

function focusableElements(root) {
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(isFocusableVisible);
}

function isolateBackground(root) {
  const changed = [];
  for (const element of document.body.children) {
    if (element === root || !(element instanceof HTMLElement)) continue;
    changed.push({ element, inert: element.inert });
    element.inert = true;
  }
  return () => changed.forEach(({ element, inert }) => { element.inert = inert; });
}

export function activateModal(root, options = {}) {
  if (!root) return () => {};
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = root.querySelector('[role="dialog"]');
  if (!dialog) return () => {};
  let closed = false;
  const restoreBackground = isolateBackground(root);

  dialog.setAttribute('aria-modal', 'true');
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  activeModalCount += 1;
  document.body.classList.add('gc-modal-open');

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown, true);
    restoreBackground();
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (!activeModalCount) document.body.classList.remove('gc-modal-open');
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
