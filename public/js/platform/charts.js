import { escapeHtml } from '../core/dom.js';

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function percent(value, maximum) {
  if (!maximum) return 0;
  return Math.max(0, Math.min(100, (value / maximum) * 100));
}

function cssPercent(value) {
  return `${Math.round(value * 1000) / 1000}%`;
}

export function thresholdScale({ actual = 0, minimum = 0, target = 0 } = {}) {
  const normalized = Object.freeze({
    actual: nonNegativeNumber(actual),
    minimum: nonNegativeNumber(minimum),
    target: nonNegativeNumber(target)
  });

  const maximum = Math.max(normalized.actual, normalized.minimum, normalized.target, 1);

  return Object.freeze({
    ...normalized,
    maximum,
    actualPct: percent(normalized.actual, maximum),
    minimumPct: percent(normalized.minimum, maximum),
    targetPct: percent(normalized.target, maximum)
  });
}

export function renderThresholdTrack({
  label = 'Progress',
  actual = 0,
  minimum = 0,
  target = 0,
  actualText = String(actual),
  minimumText = String(minimum),
  targetText = String(target)
} = {}) {
  const scale = thresholdScale({ actual, minimum, target });
  const accessibleSummary = `${label}: Actual ${actualText}; Minimum ${minimumText}; Target ${targetText}.`;

  return `<div class="gc-threshold" role="group" aria-label="${escapeHtml(accessibleSummary)}" style="--gc-actual-pct:${cssPercent(scale.actualPct)};--gc-minimum-pct:${cssPercent(scale.minimumPct)};--gc-target-pct:${cssPercent(scale.targetPct)}"><span class="gc-sr-only">${escapeHtml(accessibleSummary)}</span><div class="gc-threshold__track" aria-hidden="true"><span class="gc-threshold__actual"></span>${scale.minimum > 0 ? '<i class="gc-threshold__marker gc-threshold__marker--minimum"></i>' : ''}${scale.target > 0 ? '<i class="gc-threshold__marker gc-threshold__marker--target"></i>' : ''}</div></div>`;
}
