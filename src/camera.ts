// Port of Camera.java / Quaternion.java and the parts of android.opengl.Matrix they use.
import { MAX_N, maximumRadius } from './math';

type Mat4 = Float32Array<ArrayBuffer>;

// ---- android.opengl.Matrix equivalents (column-major) ----

function frustumM(l: number, r: number, b: number, t: number, n: number, f: number): Mat4 {
  const m = new Float32Array(16);
  const rw = 1 / (r - l), rh = 1 / (t - b), rd = 1 / (n - f);
  m[0] = 2 * n * rw;
  m[5] = 2 * n * rh;
  m[8] = (r + l) * rw;
  m[9] = (t + b) * rh;
  m[10] = (f + n) * rd;
  m[11] = -1;
  m[14] = 2 * f * n * rd;
  return m;
}

function setLookAtM(
  ex: number, ey: number, ez: number, cx: number, cy: number, cz: number,
  ux: number, uy: number, uz: number,
): Mat4 {
  let fx = cx - ex, fy = cy - ey, fz = cz - ez;
  const rlf = 1 / Math.hypot(fx, fy, fz);
  fx *= rlf; fy *= rlf; fz *= rlf;
  let sx = fy * uz - fz * uy, sy = fz * ux - fx * uz, sz = fx * uy - fy * ux;
  const rls = 1 / Math.hypot(sx, sy, sz);
  sx *= rls; sy *= rls; sz *= rls;
  const vx = sy * fz - sz * fy, vy = sz * fx - sx * fz, vz = sx * fy - sy * fx;
  const m = new Float32Array([sx, vx, -fx, 0, sy, vy, -fy, 0, sz, vz, -fz, 0, 0, 0, 0, 1]);
  for (let i = 0; i < 4; ++i) m[12 + i] += m[i] * -ex + m[4 + i] * -ey + m[8 + i] * -ez;
  return m;
}

export function multiplyMM(a: Mat4, b: Mat4): Mat4 {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; ++c)
    for (let row = 0; row < 4; ++row) {
      let s = 0;
      for (let k = 0; k < 4; ++k) s += a[k * 4 + row] * b[c * 4 + k];
      r[c * 4 + row] = s;
    }
  return r;
}

export function invertM(m: Mat4): Mat4 {
  const inv = new Float32Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const d = 1 / det;
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d;
  inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d;
  inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d;
  inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d;
  inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d;
  inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d;
  inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d;
  inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d;
  inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d;
  inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d;
  inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d;
  inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d;
  inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
  return inv;
}

// ---- Quaternion ----

export class Quaternion {
  constructor(readonly r: number, readonly i: number, readonly j: number, readonly k: number) {}

  multiply(y: Quaternion): Quaternion {
    const { r, i, j, k } = this;
    return new Quaternion(
      r * y.r - i * y.i - j * y.j - k * y.k,
      r * y.i + i * y.r + j * y.k - k * y.j,
      r * y.j - i * y.k + j * y.r + k * y.i,
      r * y.k + i * y.j - j * y.i + k * y.r,
    );
  }

  norm(): number {
    return Math.hypot(this.r, this.i, this.j, this.k);
  }

  normalize(): Quaternion {
    const s = 1 / this.norm();
    return new Quaternion(this.r * s, this.i * s, this.j * s, this.k * s);
  }

  dist(y: Quaternion): number {
    return Math.hypot(this.r - y.r, this.i - y.i, this.j - y.j, this.k - y.k);
  }

  asRotationMatrix(): Mat4 {
    const { r, i, j, k } = this;
    return new Float32Array([
      r * r + i * i - j * j - k * k, 2 * r * k + 2 * i * j, -2 * r * j + 2 * i * k, 0,
      -2 * r * k + 2 * i * j, r * r - i * i + j * j - k * k, 2 * r * i + 2 * j * k, 0,
      2 * r * j + 2 * i * k, -2 * r * i + 2 * j * k, r * r - i * i - j * j + k * k, 0,
      0, 0, 0, 1,
    ]);
  }
}

function rotation(angle: number, x: number, y: number, z: number): Quaternion {
  const s = Math.sin(angle / 2), c = Math.cos(angle / 2);
  const n = Math.hypot(x, y, z);
  return new Quaternion(c, (x / n) * s, (y / n) * s, (z / n) * s);
}

const S = Math.sqrt(0.5);
const ALIGNED_ROTATIONS: Quaternion[] = (() => {
  const q: Quaternion[] = [];
  // ±1 on a single component
  for (let a = 0; a < 4; ++a)
    for (const s of [1, -1]) {
      const v = [0, 0, 0, 0];
      v[a] = s;
      q.push(new Quaternion(v[0], v[1], v[2], v[3]));
    }
  // ±sqrt(1/2) on two components
  for (let a = 0; a < 4; ++a)
    for (let b = a + 1; b < 4; ++b)
      for (const sa of [S, -S])
        for (const sb of [S, -S]) {
          const v = [0, 0, 0, 0];
          v[a] = sa;
          v[b] = sb;
          q.push(new Quaternion(v[0], v[1], v[2], v[3]));
        }
  // ±1/2 on all components
  for (const a of [0.5, -0.5])
    for (const b of [0.5, -0.5])
      for (const c of [0.5, -0.5])
        for (const d of [0.5, -0.5]) q.push(new Quaternion(a, b, c, d));
  return q;
})();

const MIN_CAMERA_DISTANCE = 1.5;
const MAX_CAMERA_DISTANCE = 1.575 * maximumRadius(MAX_N, 0);
const INITIAL_CAMERA_DISTANCE = 70.0;
const INITIAL_ROTATION = rotation(Math.PI / 2, 1, 0, 0)
  .multiply(rotation(Math.PI, 0, 1, 0))
  .multiply(rotation(-0.75 * Math.PI, 0, 0, 1))
  .multiply(rotation(Math.PI / 6, -1, 1, 0));

// Maximum half-turns per second
const MAX_FLING_SPEED = 6.0;
// Fraction of total speed lost per second
const FLING_SLOWDOWN_LINEAR = 0.5;
// Seconds before stopping, if there were no linear slowdown
const MAX_FLING_TIME = 5.0;
const FLING_SLOWDOWN_CONSTANT = MAX_FLING_SPEED / MAX_FLING_TIME;

export class Camera {
  private cameraDistance = INITIAL_CAMERA_DISTANCE;
  private totalRotation = INITIAL_ROTATION;
  private flingX = 0;
  private flingY = 0;
  private stillFlinging = false;
  private lastFlingTime = 0;

  /** Two finger zoom by an incremental size ratio */
  zoom(factor: number): void {
    this.cameraDistance /= factor;
    this.cameraDistance = Math.min(
      MAX_CAMERA_DISTANCE,
      Math.max(MIN_CAMERA_DISTANCE, this.cameraDistance),
    );
  }

  /** One finger drag; x and y are multiples of the (mean) screen size */
  drag(x: number, y: number): void {
    const yRotation = rotation(Math.PI * x, 0, 1, 0);
    const xRotation = rotation(-Math.PI * y, 1, 0, 0);
    this.totalRotation = xRotation.multiply(yRotation).multiply(this.totalRotation).normalize();
  }

  /** Two finger twist by an angle increment */
  twist(theta: number): void {
    this.totalRotation = rotation(theta, 0, 0, 1).multiply(this.totalRotation).normalize();
  }

  fling(x: number, y: number): void {
    this.flingX = x;
    this.flingY = y;
    const speed = Math.hypot(x, y);
    if (speed > MAX_FLING_SPEED) {
      this.flingX *= MAX_FLING_SPEED / speed;
      this.flingY *= MAX_FLING_SPEED / speed;
    }
    this.stillFlinging = true;
    this.lastFlingTime = Date.now();
  }

  stopFling(): boolean {
    this.flingX = this.flingY = 0;
    const r = this.stillFlinging;
    this.stillFlinging = false;
    return r;
  }

  continueFling(): boolean {
    if (this.stillFlinging) {
      const now = Date.now();
      const dt = (now - this.lastFlingTime) / 1000;
      this.lastFlingTime = now;
      const f = 1 - Math.min(1, FLING_SLOWDOWN_LINEAR * dt);
      this.flingX *= f;
      this.flingY *= f;
      const speed = Math.hypot(this.flingX, this.flingY);
      if (speed < FLING_SLOWDOWN_CONSTANT * dt) {
        this.stopFling();
      } else {
        const red = (FLING_SLOWDOWN_CONSTANT * dt) / speed;
        this.flingX -= this.flingX * red;
        this.flingY -= this.flingY * red;
        this.drag(this.flingX * dt, this.flingY * dt);
      }
    }
    return this.stillFlinging;
  }

  snapToAxis(): void {
    let best = -1;
    let bestDistance = 1e9;
    ALIGNED_ROTATIONS.forEach((q, i) => {
      const d = this.totalRotation.dist(q);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    if (best >= 0) this.totalRotation = ALIGNED_ROTATIONS[best];
  }

  computeShaderTransform(aspectRatio: number): Mat4 {
    const ratio = Math.sqrt(aspectRatio);
    const near = this.cameraDistance * 0.1;
    const far = this.cameraDistance * 2.0;
    const lr = near * ratio;
    const bt = near / ratio;
    const projection = frustumM(-lr, lr, -bt, bt, near, far);
    const view = setLookAtM(0, 0, -this.cameraDistance, 0, 0, 0, 0, 1, 0);
    return multiplyMM(multiplyMM(projection, view), this.totalRotation.asRotationMatrix());
  }
}
