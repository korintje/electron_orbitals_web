// Web addition: plots of the radial part for the "About this orbital" panel.
// R_nl(r), R_nl(r)² and the radial distribution function D(r) = r² R_nl(r)², against r/a₀.
import { maximumRadius, RadialFunction, type Orbital } from './math';
import { meanRadius } from './physics';

const SAMPLES = 480;
const W = 360;
const LEFT = 52;
const RIGHT = 8;
const PANEL_H = 78;
const GAP = 22;

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/** Number for SVG text: 0.054, 3.1×10⁻⁴ */
function num(x: number): string {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 2) return Number(x.toPrecision(2)).toString().replace('-', '−');
  const m = (x / Math.pow(10, e)).toFixed(1);
  return `${m}×10${[...String(e)].map((c) => SUPERSCRIPT[c]).join('')}`;
}

/** Tick spacing of 1, 2 or 5 × 10^k giving about `count` ticks */
function tickStep(range: number, count: number): number {
  const raw = range / count;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

export interface RadialFacts {
  /** Positions of the radial nodes, in a₀ */
  nodes: number[];
  /** Most probable radius (global maximum of D), in a₀ */
  rmp: number;
  /** Number of maxima of D */
  peaks: number;
}

function bisect(f: (r: number) => number, a: number, b: number): number {
  let fa = f(a);
  for (let i = 0; i < 60; ++i) {
    const c = (a + b) / 2;
    const fc = f(c);
    if ((fc < 0) === (fa < 0)) {
      a = c;
      fa = fc;
    } else {
      b = c;
    }
  }
  return (a + b) / 2;
}

/** Most probable radius by golden-section search around a grid maximum */
function refineMax(f: (r: number) => number, a: number, b: number): number {
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; ++i) {
    const c = b - g * (b - a), d = a + g * (b - a);
    if (f(c) > f(d)) b = d;
    else a = c;
  }
  return (a + b) / 2;
}

export function radialFacts(o: Orbital): RadialFacts {
  const R = new RadialFunction(1, o.n, o.l);
  const rmax = maximumRadius(o.n, o.l);
  const D = (r: number) => r * r * R.eval(r) ** 2;
  // Radial nodes are the zeros of the Laguerre polynomial (positive r)
  const P = (r: number) => R.oscillatingPart.eval(r);
  const nodes: number[] = [];
  const h = rmax / 4000;
  let best = 0, bestR = 0, peaks = 0;
  let prev = P(h / 2), dPrev = D(0), dRising = true;
  for (let i = 1; i <= 4000; ++i) {
    const r = i * h;
    const p = P(r);
    if ((p < 0) !== (prev < 0)) nodes.push(bisect(P, r - h, r));
    prev = p;
    const d = D(r);
    if (d > best) {
      best = d;
      bestR = r;
    }
    if (dRising && d < dPrev) ++peaks;
    dRising = d >= dPrev;
    dPrev = d;
  }
  return { nodes, rmp: refineMax(D, Math.max(0, bestR - h), bestR + h), peaks };
}

export interface RadialLabels {
  r: string;
  r2: string;
  d: string;
  rmp: string;
  mean: string;
  node: string;
}

/** SVG with three stacked panels sharing the r axis. */
export function radialPlotSvg(o: Orbital, facts: RadialFacts, labels: RadialLabels): string {
  const R = new RadialFunction(1, o.n, o.l);
  const xmax = maximumRadius(o.n, o.l);
  const plotW = W - LEFT - RIGHT;
  const xs = (r: number) => LEFT + (r / xmax) * plotW;

  const rs: number[] = [];
  const f0: number[] = [], f1: number[] = [], f2: number[] = [];
  for (let i = 0; i <= SAMPLES; ++i) {
    // Denser sampling near the nucleus, where s orbitals are steep
    const t = i / SAMPLES;
    const r = xmax * t * t * (3 - 2 * t) * 0.5 + xmax * t * 0.5;
    const v = R.eval(r);
    rs.push(r);
    f0.push(v);
    f1.push(v * v);
    f2.push(r * r * v * v);
  }

  const panels = [
    { f: f0, label: labels.r, color: '#8bf', unit: 'a₀⁻³ᐟ²', signed: true },
    { f: f1, label: labels.r2, color: '#f9c', unit: 'a₀⁻³', signed: false },
    { f: f2, label: labels.d, color: '#fc6', unit: 'a₀⁻¹', signed: false, fill: true },
  ];

  const top = (i: number) => 14 + i * (PANEL_H + GAP);
  const parts: string[] = [];

  const xStep = tickStep(xmax, 5);

  panels.forEach((p, i) => {
    const y0 = top(i);
    const hi = Math.max(...p.f);
    const lo = p.signed ? Math.min(0, ...p.f) : 0;
    const span = hi - lo || 1;
    const ys = (v: number) => y0 + PANEL_H * (1 - (v - lo) / span);

    // Frame, grid and zero line
    parts.push(`<rect x="${LEFT}" y="${y0}" width="${plotW}" height="${PANEL_H}" class="rp-frame"/>`);
    for (let x = xStep; x < xmax; x += xStep)
      parts.push(`<line x1="${xs(x)}" x2="${xs(x)}" y1="${y0}" y2="${y0 + PANEL_H}" class="rp-grid"/>`);
    if (lo < 0)
      parts.push(`<line x1="${LEFT}" x2="${LEFT + plotW}" y1="${ys(0)}" y2="${ys(0)}" class="rp-zero"/>`);

    // Radial nodes
    for (const r of facts.nodes)
      parts.push(`<line x1="${xs(r)}" x2="${xs(r)}" y1="${y0}" y2="${y0 + PANEL_H}" class="rp-node"/>`);

    // Curve
    const pts = rs.map((r, k) => `${xs(r).toFixed(1)},${ys(p.f[k]).toFixed(1)}`).join(' ');
    if (p.fill)
      parts.push(`<polygon points="${xs(0)},${ys(0)} ${pts} ${xs(xmax)},${ys(0)}" fill="${p.color}" fill-opacity="0.18"/>`);
    parts.push(`<polyline points="${pts}" fill="none" stroke="${p.color}" stroke-width="1.6" stroke-linejoin="round"/>`);

    // Most probable radius and mean radius on D(r)
    if (p.fill) {
      const mean = meanRadius(o.n, o.l);
      parts.push(`<line x1="${xs(mean)}" x2="${xs(mean)}" y1="${y0}" y2="${y0 + PANEL_H}" class="rp-mean"/>`);
      const x = xs(facts.rmp), y = ys(facts.rmp ** 2 * R.eval(facts.rmp) ** 2);
      parts.push(`<circle cx="${x}" cy="${y}" r="3" fill="${p.color}"/>`);
      const right = x > LEFT + plotW * 0.6;
      parts.push(`<text x="${x + (right ? -6 : 6)}" y="${y + 10}" class="rp-note" text-anchor="${right ? 'end' : 'start'}">${labels.rmp}</text>`);
    }

    // Labels: name and the value range
    parts.push(`<text x="${LEFT}" y="${y0 - 4}" class="rp-label" fill="${p.color}">${p.label}</text>`);
    parts.push(`<text x="${LEFT + plotW}" y="${y0 - 4}" class="rp-unit" text-anchor="end">[${p.unit}]</text>`);
    parts.push(`<text x="${LEFT - 4}" y="${y0 + 8}" class="rp-tick" text-anchor="end">${num(hi)}</text>`);
    parts.push(`<text x="${LEFT - 4}" y="${ys(0) + 3}" class="rp-tick" text-anchor="end">0</text>`);
    if (lo < 0 && y0 + PANEL_H - ys(0) > 12)
      parts.push(`<text x="${LEFT - 4}" y="${y0 + PANEL_H}" class="rp-tick" text-anchor="end">${num(lo)}</text>`);
  });

  // Shared r axis
  const yAxis = top(panels.length - 1) + PANEL_H;
  for (let x = 0; x <= xmax + 1e-9; x += xStep)
    parts.push(`<text x="${xs(x)}" y="${yAxis + 12}" class="rp-tick" text-anchor="middle">${num(x)}</text>`);
  parts.push(`<text x="${LEFT + plotW}" y="${yAxis + 26}" class="rp-tick" text-anchor="end">r / a₀</text>`);

  // Key for the vertical lines
  const keyY = yAxis + 26;
  parts.push(`<line x1="${LEFT}" x2="${LEFT + 14}" y1="${keyY - 4}" y2="${keyY - 4}" class="rp-node"/>`);
  parts.push(`<text x="${LEFT + 18}" y="${keyY}" class="rp-tick">${labels.node}</text>`);
  const keyX = LEFT + 104;
  parts.push(`<line x1="${keyX}" x2="${keyX + 14}" y1="${keyY - 4}" y2="${keyY - 4}" class="rp-mean"/>`);
  parts.push(`<text x="${keyX + 18}" y="${keyY}" class="rp-tick">${labels.mean}</text>`);

  const height = keyY + 6;
  return `<svg class="radial-plot" viewBox="0 0 ${W} ${height}" role="img">${parts.join('')}</svg>`;
}
