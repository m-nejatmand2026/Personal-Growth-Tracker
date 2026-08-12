import { $ } from './dom.js';

let timeoutId;

export function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => element.classList.remove('show'), 1800);
}
