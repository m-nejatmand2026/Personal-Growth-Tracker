import { $ } from '../core/dom.js';

const ACTIONS = [
  {
    id: 'log-progress',
    title: 'Log progress',
    description: 'Choose something from Today and record what you did.'
  },
  {
    id: 'energy',
    title: 'Energy check-in',
    description: 'Record how you feel right now.'
  },
  {
    id: 'plan',
    title: 'Open Plan',
    description: 'Adjust goals, capacity or recurring time.'
  }
];

export function createQuickAdd({ onSelect }) {
  const host = $('#quickAddHost');
  if (!host) return { open() {}, close() {} };

  host.innerHTML = `
    <div class="action-sheet-backdrop" data-quick-add-close hidden></div>
    <section class="action-sheet" id="quickAddSheet" aria-label="Quick add" hidden>
      <div class="action-sheet-handle" aria-hidden="true"></div>
      <div class="action-sheet-head">
        <div><span class="small muted">Quick add</span><h2>What do you want to do?</h2></div>
        <button class="sheet-close" type="button" data-quick-add-close aria-label="Close">×</button>
      </div>
      <div class="quick-action-list">
        ${ACTIONS.map((action) => `
          <button class="quick-action-card" type="button" data-quick-action="${action.id}">
            <strong>${action.title}</strong>
            <span>${action.description}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;

  const sheet = $('#quickAddSheet');
  const backdrop = host.querySelector('.action-sheet-backdrop');

  function open() {
    sheet.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('sheet-open');
    sheet.querySelector('[data-quick-action]')?.focus();
  }

  function close() {
    sheet.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('sheet-open');
  }

  host.querySelectorAll('[data-quick-add-close]').forEach((button) => button.addEventListener('click', close));
  host.querySelectorAll('[data-quick-action]').forEach((button) => button.addEventListener('click', async () => {
    const action = button.dataset.quickAction;
    close();
    await onSelect?.(action);
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sheet.hidden) close();
  });

  return { open, close };
}
