import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';

export async function loadAreasModel() {
  const [areasResponse, templatesResponse] = await Promise.all([
    api('/api/v1/areas'),
    api('/api/v1/area-templates')
  ]);

  return {
    areas: areasResponse.items || [],
    templates: templatesResponse.items || []
  };
}

function areaRows(items) {
  if (!items.length) return '<div class="empty">No life areas yet. Create one that fits your life.</div>';
  return items.map((area, index) => `
    <div class="manage-row area-manage-row">
      <div class="manage-main">
        <span class="area-dot" style="background:${escapeHtml(area.color || '#64748B')}"></span>
        <div>
          <strong>${escapeHtml(area.name)}</strong>
          <div class="small muted">Your life area</div>
        </div>
      </div>
      <div class="row-actions area-row-actions">
        <button class="text-action" type="button" data-move-area="${area.id}" data-move-direction="up" ${index === 0 ? 'disabled' : ''} aria-label="Move ${escapeHtml(area.name)} up">↑</button>
        <button class="text-action" type="button" data-move-area="${area.id}" data-move-direction="down" ${index === items.length - 1 ? 'disabled' : ''} aria-label="Move ${escapeHtml(area.name)} down">↓</button>
        <button class="text-action" type="button" data-edit-area="${area.id}">Rename</button>
        <button class="text-action danger-text" type="button" data-archive-area="${area.id}" aria-label="Archive ${escapeHtml(area.name)}">Archive</button>
      </div>
    </div>
  `).join('');
}

function templateOptions(templates) {
  return templates.map((template) => `
    <option value="${escapeHtml(template.key)}" data-name="${escapeHtml(template.name)}">${escapeHtml(template.name)}</option>
  `).join('');
}

export function areasPanelHtml(model) {
  return `
    <div class="card" id="areasPanel">
      <div class="section-head">
        <div>
          <h2>Life areas</h2>
          <p>Your own broad parts of life. Starter suggestions are optional—you can name, reorder, rename, or archive them.</p>
        </div>
        <span class="badge">${model.areas.length}</span>
      </div>

      <div class="manage-list">${areaRows(model.areas)}</div>

      <details class="inline-editor" id="areaEditor">
        <summary id="areaEditorSummary">＋ New life area</summary>
        <form id="addAreaForm" class="stack-form" data-area-id="">
          <label id="areaTemplateField">
            <span>Start from a suggestion <small>optional</small></span>
            <select id="areaTemplate">
              <option value="">Create my own</option>
              ${templateOptions(model.templates)}
            </select>
          </label>
          <label>
            <span>Life area name</span>
            <input id="areaName" maxlength="80" placeholder="e.g. Relationships, Creativity, Home" required>
          </label>
          <p class="small muted">These are your categories, not Growth Compass categories. Archiving hides an area from new planning while keeping historical facts intact.</p>
          <div class="actions">
            <button class="btn primary" type="submit" id="saveAreaButton">Add life area</button>
            <button class="btn soft" type="button" id="cancelAreaEdit">Clear</button>
          </div>
        </form>
      </details>
    </div>
  `;
}

function resetAreaEditor() {
  const form = $('#addAreaForm');
  if (!form) return;
  form.dataset.areaId = '';
  form.reset();
  $('#areaTemplateField').hidden = false;
  $('#areaEditorSummary').textContent = '＋ New life area';
  $('#saveAreaButton').textContent = 'Add life area';
}

function populateAreaEditor(area) {
  const form = $('#addAreaForm');
  if (!form) return;
  form.dataset.areaId = String(area.id);
  $('#areaName').value = area.name || '';
  $('#areaTemplate').value = area.template_key || '';
  $('#areaTemplateField').hidden = true;
  $('#areaEditorSummary').textContent = `Rename: ${area.name}`;
  $('#saveAreaButton').textContent = 'Save name';
  $('#areaEditor').open = true;
  $('#areaName').focus();
}

async function reorderAreas(model, areaId, direction) {
  const ordered = [...model.areas];
  const index = ordered.findIndex((area) => area.id === areaId);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ordered.length) return false;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  await Promise.all(ordered.map((area, position) => {
    const sortOrder = (position + 1) * 10;
    if (Number(area.sort_order) === sortOrder) return Promise.resolve();
    return api(`/api/v1/areas/${area.id}`, {
      method: 'PUT',
      body: JSON.stringify({ sort_order: sortOrder })
    });
  }));
  return true;
}

export function bindAreasPanel(model, { reloadPlatform }) {
  const template = $('#areaTemplate');
  const name = $('#areaName');

  template?.addEventListener('change', () => {
    if (!template.value || name.value.trim()) return;
    const option = template.selectedOptions[0];
    name.value = option?.dataset.name || option?.textContent || '';
  });

  $('#cancelAreaEdit')?.addEventListener('click', resetAreaEditor);

  $$('[data-edit-area]').forEach((button) => button.addEventListener('click', () => {
    const area = model.areas.find((item) => item.id === Number(button.dataset.editArea));
    if (area) populateAreaEditor(area);
  }));

  $$('[data-move-area]').forEach((button) => button.addEventListener('click', async () => {
    if (button.disabled) return;
    try {
      const moved = await reorderAreas(model, Number(button.dataset.moveArea), button.dataset.moveDirection);
      if (moved) {
        toast('Life area reordered');
        await reloadPlatform();
      }
    } catch (error) {
      toast(error.message || 'Could not reorder life area');
    }
  }));

  $('#addAreaForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const areaId = Number(form.dataset.areaId || 0);
    const areaName = name.value.trim() || template.selectedOptions[0]?.dataset.name || '';
    if (!areaName) return toast('Add a life area name');

    try {
      await api(areaId ? `/api/v1/areas/${areaId}` : '/api/v1/areas', {
        method: areaId ? 'PUT' : 'POST',
        body: JSON.stringify(areaId
          ? { name: areaName }
          : { name: areaName, template_key: template.value || null, sort_order: (model.areas.length + 1) * 10 })
      });
      toast(areaId ? 'Life area renamed' : 'Life area added');
      resetAreaEditor();
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not save life area');
    }
  });

  $$('[data-archive-area]').forEach((button) => button.addEventListener('click', async () => {
    const area = model.areas.find((item) => item.id === Number(button.dataset.archiveArea));
    if (!area || !window.confirm(`Archive “${area.name}”? It will disappear from new planning, while Goals and historical facts stay intact.`)) return;
    try {
      await api(`/api/v1/areas/${area.id}`, { method: 'DELETE' });
      toast('Life area archived');
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not archive life area');
    }
  }));
}
