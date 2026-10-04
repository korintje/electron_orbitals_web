// Physical quantities of the displayed hydrogen orbital (Z = 1, atomic units).
import { maximumRadius, type Orbital } from './math';

export const RYDBERG_EV = 13.605693;
export const BOHR_NM = 0.0529177;
/** Real phase rotation period of the n = 1 state, h / |E_1|, in seconds */
export const PERIOD_N1_S = 4.135667e-15 / RYDBERG_EV;

export function energyEV(n: number): number {
  return -RYDBERG_EV / (n * n);
}

/** ⟨r⟩ in a₀ */
export function meanRadius(n: number, l: number): number {
  return (3 * n * n - l * (l + 1)) / 2;
}

export function radialNodes(o: Orbital): number {
  return o.n - o.l - 1;
}

/** Nodal cones θ = const (θ = 90° is the xy-plane) */
export function coneNodes(o: Orbital): number {
  return o.l - Math.abs(o.m);
}

/** Nodal planes containing the z-axis (real orbitals only) */
export function planeNodes(o: Orbital): number {
  return o.real ? Math.abs(o.m) : 0;
}

/** Brightness scale b: displayed intensity I = 1 − exp(−b ∫|ψ|² ds) */
export function brightnessScale(o: Orbital): number {
  const r = Math.fround(maximumRadius(o.n, o.l));
  return Math.fround((r * r) / 2);
}

/** ∫|ψ|² ds (a₀⁻²) that gives displayed intensity I */
export function columnDensityAt(o: Orbital, intensity: number): number {
  return -Math.log(1 - intensity) / brightnessScale(o);
}

/** Phase rotation period of the display, in seconds */
export function displayPeriod(n: number): number {
  return n * n;
}

/** Phase angle added by time evolution at `millis` (same as ScreenDrawer) */
export function timePhase(n: number, millis: number): number {
  const period = n * n * 1000;
  return (2 * Math.PI * (millis % period)) / period;
}

/** Number in the form 5.6×10⁻⁴ (HTML) */
export function sci(x: number, digits = 2): string {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return x.toPrecision(digits);
  const m = x / Math.pow(10, e);
  return `${m.toFixed(digits - 1)}×10<sup>${e}</sup>`;
}
