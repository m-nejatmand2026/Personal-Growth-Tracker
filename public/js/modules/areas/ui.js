import {
  api
} from '../../core/api.js';

import {
  $,
  $$,
  escapeHtml
} from '../../core/dom.js';

import {
  toast
} from '../../core/toast.js';

export async function loadAreasModel() {
  const [
    areasResponse,
    templatesResponse
  ] = await Promise.all([
    api('/api/v1/areas'),
    api('/api/v1/area-templates')
  ]);

  return {
    areas:
      areasResponse.items || [],

    templates:
      templatesResponse.items || []
  };
}

export function areasPanelHtml(model) {
  const items = model.areas.length
    ? model.areas.map(
        (area) => `
          <div class="manage-row">
            <div class="manage-main">
              <span
                class="area-dot"
                style="background:${escapeHtml(
                  area.color || '#64748B'
                )}"
              ></span>

              <div>
                <strong>
                  ${escapeHtml(area.name)}
                </strong>

                <div class="small muted">
                  Life area
                </div>
              </div>
            </div>

            <button
              class="text-action danger-text"
              data-archive-area="${area.id}"
              aria-label="Archive ${escapeHtml(
                area.name
              )}"
            >
              Archive
            </button>
          </div>
        `
      ).join('')
    : `
        <div class="empty">
          No areas yet.
        </div>
      `;

  const templateOptions =
    model.templates
      .map(
        (template) => `
          <option
            value="${escapeHtml(
              template.key
            )}"
            data-name="${escapeHtml(
              template.name
            )}"
          >
            ${escapeHtml(
              template.name
            )}
          </option>
        `
      )
      .join('');

  return `
    <div
      class="card"
      id="areasPanel"
    >
      <div class="section-head">
        <div>
          <h2>Areas</h2>
          <p>
            Broad parts of life. Start from a
            template or create your own.
          </p>
        </div>

        <span class="badge">
          ${model.areas.length}
        </span>
      </div>

      <div class="manage-list">
        ${items}
      </div>

      <details class="inline-editor">
        <summary>
          + Add area
        </summary>

        <form
          id="addAreaForm"
          class="stack-form"
        >
          <label>
            <span>Start from</span>

            <select id="areaTemplate">
              <option value="">
                Custom area
              </option>

              ${templateOptions}
            </select>
          </label>

          <label>
            <span>Name</span>

            <input
              id="areaName"
              maxlength="80"
              placeholder="e.g. Family, Photography, Career"
            >
          </label>

          <div class="actions">
            <button
              class="btn primary"
              type="submit"
            >
              Add area
            </button>
          </div>
        </form>
      </details>
    </div>
  `;
}

export function bindAreasPanel(
  model,
  { reloadPlatform }
) {
  const template =
    $('#areaTemplate');

  const name =
    $('#areaName');

  template?.addEventListener(
    'change',
    () => {
      if (
        !template.value
        || name.value.trim()
      ) {
        return;
      }

      const option =
        template.selectedOptions[0];

      name.value =
        option?.dataset.name
        || option?.textContent
        || '';
    }
  );

  $('#addAreaForm')
    ?.addEventListener(
      'submit',
      async (event) => {
        event.preventDefault();

        const areaName =
          name.value.trim()
          || template
            .selectedOptions[0]
            ?.dataset.name
          || '';

        if (!areaName) {
          return toast(
            'Add an area name'
          );
        }

        try {
          await api(
            '/api/v1/areas',
            {
              method: 'POST',

              body: JSON.stringify({
                name: areaName,

                template_key:
                  template.value
                  || null
              })
            }
          );

          toast('Area added');

          await reloadPlatform();
        } catch (error) {
          toast(
            error.message
            || 'Could not add area'
          );
        }
      }
    );

  $$('[data-archive-area]')
    .forEach(
      (button) =>
        button.addEventListener(
          'click',
          async () => {
            const area =
              model.areas.find(
                (item) =>
                  item.id
                  === Number(
                    button.dataset
                      .archiveArea
                  )
              );

            if (
              !area
              || !window.confirm(
                `Archive “${area.name}”? Goals stay in history.`
              )
            ) {
              return;
            }

            try {
              await api(
                `/api/v1/areas/${area.id}`,
                {
                  method: 'DELETE'
                }
              );

              toast(
                'Area archived'
              );

              await reloadPlatform();
            } catch (error) {
              toast(
                error.message
                || 'Could not archive area'
              );
            }
          }
        )
    );
}
