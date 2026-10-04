// CPU port of screendrawer_{color,mono}.frag, used to draw legends with exactly the
// colours the renderer produces.

const WHITE_U = 0.19784;
const WHITE_V = 0.46832;

function srgbGamma(c: number): number {
  return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : c * 12.92;
}

/**
 * Colour of a pixel in colour mode.
 * @param re,im  |ψ|²-weighted mean phasor ⟨e^{i arg ψ}⟩ along the line of sight (|·| ≤ 1)
 * @param intensity  I = 1 − exp(−b ∫|ψ|² ds), in [0, 1]
 * @returns sRGB components in [0, 1], or null where the shader outputs black (out of gamut)
 */
export function phaseColor(
  re: number, im: number, intensity: number, colorBlindMode: number,
): [number, number, number] | null {
  let u = 0.06 * re;
  let v = 0.06 * im;
  let maxScale = 1.01;
  if (colorBlindMode !== 0) {
    let cu: number, cv: number;
    if (colorBlindMode === 1) {
      [cu, cv] = [0.65786, 0.501321];
      u *= 1.05; v *= 1.05;
      maxScale = 1.36;
    } else if (colorBlindMode === 2) {
      [cu, cv] = [-1.217391, 0.782608];
      u *= 1.04; v *= 1.04;
      maxScale = 1.36;
    } else {
      [cu, cv] = [0.257336, 0];
      u *= 1.01; v *= 1.01;
      maxScale = 1.0;
    }
    const wu = WHITE_U - cu, wv = WHITE_V - cv;
    let bu = -wv, bv = wu;
    const len = Math.hypot(bu, bv);
    bu /= len; bv /= len;
    const d = u * bu + v * bv;
    u = d * bu;
    v = d * bv;
  }
  const Y = intensity * 0.5;
  const k = maxScale + intensity * (1 - maxScale);
  u = u * k + WHITE_U;
  v = v * k + WHITE_V;
  const den = 6 * u - 16 * v + 12;
  const x = (9 * u) / den, y = (4 * v) / den;
  const X = (Y / y) * x, Z = (Y / y) * (1 - x - y);
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  if (Math.max(r, g, b) > 1 || Math.min(r, g, b) < 0) return null;
  return [srgbGamma(r), srgbGamma(g), srgbGamma(b)];
}

/** Grey level of a pixel in mono mode (and the luminance of colour mode). */
export function monoColor(intensity: number): number {
  const linear = intensity * 0.5;
  return linear > 1 || linear < 0 ? 0 : srgbGamma(linear);
}

export function cssColor(c: [number, number, number] | null): string {
  if (!c) return '#000';
  return `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
}
