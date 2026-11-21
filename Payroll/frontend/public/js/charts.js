import { esc } from './ui.js';

export const PALETTE = ['#6d4aff', '#ff7a3d', '#14b8a6', '#f5a524', '#ec4899', '#3b82f6', '#84cc16', '#a78bfa'];

/** donut chart (SVG) + legend. items: [{label, value, color?}] */
export function donutChart(items, centerLabel = 'Total') {
  const total = items.reduce((s, i) => s + i.value, 0);
  const size = 170, stroke = 24, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let offset = 0;
  const segs = items.map((it, i) => {
    const len = total ? (it.value / total) * C : 0;
    const s = { ...it, color: it.color || PALETTE[i % PALETTE.length], len, offset };
    offset += len;
    return s;
  });

  const circles = segs.map((s) =>
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}"
       stroke-dasharray="${s.len} ${C - s.len}" stroke-dashoffset="${-s.offset}" />`).join('');

  const legend = segs.map((s) => `
    <div class="d-flex align-items-center gap-2 mb-1">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="flex-grow-1">${esc(s.label)}</span>
      <span class="fw-semibold">${s.value}</span>
      <span class="text-muted small" style="width:42px;text-align:right">${total ? Math.round((s.value / total) * 100) : 0}%</span>
    </div>`).join('');

  return `
  <div class="d-flex align-items-center flex-wrap gap-4 justify-content-center">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f0edfb" stroke-width="${stroke}" />
      ${total > 0 ? `<g transform="rotate(-90 ${size / 2} ${size / 2})">${circles}</g>` : ''}
      <text x="50%" y="48%" text-anchor="middle" font-size="28" font-weight="800" fill="#1d1740">${total}</text>
      <text x="50%" y="62%" text-anchor="middle" font-size="11" fill="#8681a8">${esc(centerLabel)}</text>
    </svg>
    <div class="chart-legend">${legend}</div>
  </div>`;
}

/** horizontal bars. items: [{label, value}] */
export function barList(items, { format = String, color = PALETTE[0] } = {}) {
  if (!items.length) return '<div class="text-muted small">No data</div>';
  const max = Math.max(1, ...items.map((i) => i.value));
  return items.map((it) => `
    <div class="bar-row">
      <div class="d-flex justify-content-between small mb-1">
        <span>${esc(it.label)}</span><span class="fw-semibold">${esc(format(it.value))}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${(it.value / max) * 100}%;background:${color}"></div></div>
    </div>`).join('');
}

/** column chart (SVG). items: [{label, value}] */
export function columnChart(items, color = PALETTE[0]) {
  if (!items.length) return '<div class="text-muted small">No data</div>';
  const W = 520, H = 220, padTop = 24, padBottom = 28;
  const max = Math.max(1, ...items.map((i) => i.value));
  const slot = W / items.length, barW = Math.min(44, slot * 0.6), chartH = H - padTop - padBottom;

  const grid = [0, 0.5, 1].map((t) => {
    const y = padTop + chartH * (1 - t);
    return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="#f0edfb" />`;
  }).join('');

  const bars = items.map((it, i) => {
    const h = (it.value / max) * chartH, x = i * slot + (slot - barW) / 2, y = padTop + chartH - h;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" fill="${color}" />
      <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#1d1740">${it.value}</text>
      <text x="${x + barW / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="#8681a8">${esc(it.label)}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="max-height:260px">${grid}${bars}</svg>`;
}
