// Web addition: arrows of the probability current density
//   j = (ħ/μ) Im(ψ* ∇ψ)
// For a hydrogen eigenstate ψ = R(r) Θ(θ) e^{imφ}/√(2π) (atomic units, ħ = μ = 1):
//   j = m |ψ|² / (r sin θ) φ̂ = m R² Θ² / (2π ρ²) · (−y, x, 0),   ρ² = x² + y²
// Real orbitals and m = 0 carry no current (j = 0). The current is stationary.
//
// Section view: j on the plane; the component normal to the plane is drawn as ⊙/⊗.
// Projection view: ∫ j ds along each line of sight (like the brightness), in-screen part.
import { invertM } from './camera';
import { AzimuthalFunction, RadialFunction, maximumRadius, type Orbital } from './math';
import type { SectionParams } from './renderer';

type Vec3 = [number, number, number];

interface Glyph {
  x: number;
  y: number;
  /** In-screen direction (unit, CSS px space) and magnitude of the in-plane current */
  dx: number;
  dy: number;
  inPlane: number;
  /** Signed component along the viewing direction (section only); > 0 = away from viewer */
  normal: number;
}

export function hasCurrent(o: Orbital): boolean {
  return !o.real && o.m !== 0;
}

export class CurrentOverlay {
  readonly canvas = document.createElement('canvas');
  private key = '';
  private radial: RadialFunction | null = null;
  private azimuthal: AzimuthalFunction | null = null;
  private funcKey = '';
  /** Maximum of |j| over all space for the current orbital */
  private jMax = 0;

  constructor() {
    this.canvas.id = 'current-overlay';
  }

  /** Redraw if anything that affects the arrows has changed. */
  update(
    enabled: boolean, o: Orbital, transform: Float32Array, section: SectionParams | null,
  ): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const on = enabled && hasCurrent(o);
    const key = on
      ? [o.n, o.l, o.m, w, h, dpr, Array.from(transform).join(','),
        section ? `${section.normal.join(',')},${section.offset}` : 'p'].join('|')
      : 'off';
    if (key === this.key) return;
    this.key = key;

    const c = this.canvas;
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!on || w === 0 || h === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fk = `${o.n},${o.l},${o.m}`;
    if (fk !== this.funcKey) {
      this.funcKey = fk;
      this.radial = new RadialFunction(1, o.n, o.l);
      this.azimuthal = new AzimuthalFunction(o.l, o.m);
      this.jMax = this.maximumCurrent(o);
    }
    const glyphs = this.compute(o, transform, section, w, h);
    // Section: lengths relative to the maximum of |j| over all space, so that a plane where
    // j vanishes (e.g. a nodal plane) shows no arrows. Projection: relative to the largest
    // column current in view, unless that is negligible.
    const rmax = maximumRadius(o.n, o.l);
    let viewMax = 0;
    for (const g of glyphs.glyphs) viewMax = Math.max(viewMax, g.inPlane, Math.abs(g.normal));
    const scale = section ? this.jMax : viewMax < 1e-6 * this.jMax * rmax ? 0 : viewMax;
    if (scale > 0) this.draw(ctx, glyphs, section !== null, scale);
  }

  /** max |j| = max |m| R² Θ² / (2π r sin θ), sampled on an (r, θ) grid */
  private maximumCurrent(o: Orbital): number {
    const rmax = maximumRadius(o.n, o.l);
    let max = 0;
    for (let i = 1; i <= 400; ++i) {
      const r = (rmax * i) / 400;
      const R = this.radial!.eval(r);
      for (let k = 1; k < 200; ++k) {
        const th = (Math.PI * k) / 200;
        const T = this.azimuthal!.eval(th);
        max = Math.max(max, (Math.abs(o.m) * R * R * T * T) / (2 * Math.PI * r * Math.sin(th)));
      }
    }
    return max;
  }

  /** j(x) up to a constant factor (the normalisation of the arrows is relative). */
  private current(o: Orbital, p: Vec3): Vec3 {
    const [x, y, z] = p;
    const rho2 = x * x + y * y;
    if (rho2 < 1e-12) return [0, 0, 0];
    const r = Math.sqrt(rho2 + z * z);
    const R = this.radial!.eval(r);
    const T = this.azimuthal!.eval(Math.acos(z / r));
    const f = (o.m * R * R * T * T) / (2 * Math.PI * rho2);
    return [-y * f, x * f, 0];
  }

  private compute(
    o: Orbital, transform: Float32Array, section: SectionParams | null, w: number, h: number,
  ): { glyphs: Glyph[]; step: number } {
    const inv = invertM(transform as Float32Array<ArrayBuffer>);
    const apply = (m: Float32Array, v: number[]) => {
      const out = [0, 1, 2, 3].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
      return [out[0] / out[3], out[1] / out[3], out[2] / out[3], out[3]];
    };
    const toScreen = (p: number[]): [number, number] => {
      const q = apply(transform, [p[0], p[1], p[2], 1]);
      return [((q[0] + 1) / 2) * w, ((1 - q[1]) / 2) * h];
    };
    const rmax = maximumRadius(o.n, o.l);
    // Grid spacing follows the on-screen size of the orbital (radius R_max), and the grid
    // only covers its bounding box
    const c0 = toScreen([0, 0, 0]);
    const vd = apply(inv, [0, 0, 1, 1]);
    const vn = apply(inv, [0, 0, -1, 1]);
    const view = [vd[0] - vn[0], vd[1] - vn[1], vd[2] - vn[2]];
    const pick = Math.abs(view[0]) < 0.9 * Math.hypot(view[0], view[1], view[2]) ? [1, 0, 0] : [0, 1, 0];
    const u = [view[1] * pick[2] - view[2] * pick[1], view[2] * pick[0] - view[0] * pick[2],
      view[0] * pick[1] - view[1] * pick[0]];
    const ul = Math.hypot(u[0], u[1], u[2]);
    const edge = toScreen([(rmax * u[0]) / ul, (rmax * u[1]) / ul, (rmax * u[2]) / ul]);
    const radiusPx = Math.hypot(edge[0] - c0[0], edge[1] - c0[1]);
    const step = Math.min(48, Math.max(14, radiusPx / 6));
    const glyphs: Glyph[] = [];
    const x0 = Math.max(step / 2, c0[0] - radiusPx * 1.2);
    const y0 = Math.max(step / 2, c0[1] - radiusPx * 1.2);
    const x1 = Math.min(w, c0[0] + radiusPx * 1.2);
    const y1 = Math.min(h, c0[1] + radiusPx * 1.2);
    // Align the grid with the nucleus so that the pattern is symmetric
    const gx = c0[0] - Math.floor((c0[0] - x0) / step) * step;
    const gy = c0[1] - Math.floor((c0[1] - y0) / step) * step;

    for (let py = gy; py < y1; py += step)
      for (let px = gx; px < x1; px += step) {
        const nx = (px / w) * 2 - 1, ny = 1 - (py / h) * 2;
        const near = apply(inv, [nx, ny, -1, 1]);
        const far = apply(inv, [nx, ny, 1, 1]);
        let dir: Vec3 = [far[0] - near[0], far[1] - near[1], far[2] - near[2]];
        const dl = Math.hypot(...dir);
        dir = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
        const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

        let anchor: Vec3;
        let j: Vec3;
        let normalDir: Vec3;
        if (section) {
          const n = section.normal;
          const denom = dot(dir, n);
          if (Math.abs(denom) < 1e-6) continue;
          const t = (section.offset - dot(near, n)) / denom;
          if (t <= 0) continue;
          anchor = [near[0] + t * dir[0], near[1] + t * dir[1], near[2] + t * dir[2]];
          if (Math.hypot(...anchor) > rmax) continue;
          j = this.current(o, anchor);
          normalDir = n;
        } else {
          const tc = -dot(near, dir);
          anchor = [near[0] + tc * dir[0], near[1] + tc * dir[1], near[2] + tc * dir[2]];
          const d = Math.hypot(...anchor);
          if (d >= rmax) continue;
          const half = Math.sqrt(rmax * rmax - d * d);
          const N = 64;
          const ds = (2 * half) / N;
          j = [0, 0, 0];
          for (let k = 0; k < N; ++k) {
            const s = -half + (k + 0.5) * ds;
            const v = this.current(o, [anchor[0] + s * dir[0], anchor[1] + s * dir[1], anchor[2] + s * dir[2]]);
            j[0] += v[0] * ds;
            j[1] += v[1] * ds;
            j[2] += v[2] * ds;
          }
          normalDir = dir;
        }
        const jn = dot(j, normalDir);
        const jp: Vec3 = [j[0] - jn * normalDir[0], j[1] - jn * normalDir[1], j[2] - jn * normalDir[2]];
        const mag = Math.hypot(...jp);
        let dx = 0, dy = 0;
        if (mag > 0) {
          const eps = rmax * 1e-3;
          const a = toScreen(anchor);
          const b = toScreen([anchor[0] + (eps * jp[0]) / mag, anchor[1] + (eps * jp[1]) / mag,
            anchor[2] + (eps * jp[2]) / mag]);
          const sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (sl > 0) {
            dx = (b[0] - a[0]) / sl;
            dy = (b[1] - a[1]) / sl;
          }
        }
        glyphs.push({ x: px, y: py, dx, dy, inPlane: mag, normal: section ? jn : 0 });
      }
    return { glyphs, step };
  }

  private draw(
    ctx: CanvasRenderingContext2D, data: { glyphs: Glyph[]; step: number }, section: boolean,
    max: number,
  ): void {
    const { glyphs, step } = data;
    const stroke = (draw: () => void) => {
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 3.5;
      draw();
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      draw();
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const g of glyphs) {
      const outOfPlane = section && Math.abs(g.normal) > g.inPlane;
      const rel = Math.min(1, (outOfPlane ? Math.abs(g.normal) : g.inPlane) / max);
      if (rel < 0.03) continue;
      if (outOfPlane) {
        // ⊙ toward the viewer, ⊗ away from the viewer (normal points away from the camera)
        const r = Math.max(3, step * 0.32 * Math.sqrt(rel));
        stroke(() => {
          ctx.beginPath();
          ctx.arc(g.x, g.y, r, 0, 2 * Math.PI);
        });
        if (g.normal < 0) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(g.x, g.y, Math.max(1.2, r * 0.28), 0, 2 * Math.PI);
          ctx.fill();
        } else {
          const k = r * 0.62;
          stroke(() => {
            ctx.beginPath();
            ctx.moveTo(g.x - k, g.y - k);
            ctx.lineTo(g.x + k, g.y + k);
            ctx.moveTo(g.x + k, g.y - k);
            ctx.lineTo(g.x - k, g.y + k);
          });
        }
        continue;
      }
      // Arrow centred on the grid point, length ∝ |j|
      const len = step * 0.9 * rel;
      const hx = g.dx * len / 2, hy = g.dy * len / 2;
      const head = Math.min(7, Math.max(3, len * 0.35));
      const tipX = g.x + hx, tipY = g.y + hy;
      const px = -g.dy, py = g.dx;
      stroke(() => {
        ctx.beginPath();
        ctx.moveTo(g.x - hx, g.y - hy);
        ctx.lineTo(tipX, tipY);
        ctx.moveTo(tipX - g.dx * head + px * head * 0.6, tipY - g.dy * head + py * head * 0.6);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(tipX - g.dx * head - px * head * 0.6, tipY - g.dy * head - py * head * 0.6);
      });
    }
  }
}
