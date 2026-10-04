// Port of the "math" module of Electron Orbitals
// (https://github.com/bjthinks/android-orbital-explorer), GPL-3.0.

export const MAX_N = 12;

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; ++i) r *= i;
  return r;
}

export function fastpow(x: number, n: number): number {
  let r = 1;
  while (n > 0) {
    if (n & 1) r *= x;
    n >>= 1;
    x *= x;
  }
  return r;
}

/** Polynomial with coefficients in increasing powers, trimmed like the Java version. */
export class Polynomial {
  constructor(readonly c: number[] = []) {}

  static constant(a: number): Polynomial {
    return new Polynomial(a === 0 ? [] : [a]);
  }

  static variableToThe(n: number): Polynomial {
    const c = new Array(n + 1).fill(0);
    c[n] = 1;
    return new Polynomial(c);
  }

  add(y: Polynomial): Polynomial {
    const n = Math.max(this.c.length, y.c.length);
    let len = n;
    if (this.c.length === y.c.length) {
      while (len > 0 && this.c[len - 1] + y.c[len - 1] === 0) --len;
    }
    const r = new Array(len);
    for (let i = 0; i < len; ++i) r[i] = (this.c[i] ?? 0) + (y.c[i] ?? 0);
    return new Polynomial(r);
  }

  subtract(a: number): Polynomial {
    return this.add(Polynomial.constant(-a));
  }

  multiply(y: Polynomial | number): Polynomial {
    if (typeof y === 'number') y = Polynomial.constant(y);
    if (this.c.length === 0 || y.c.length === 0) return new Polynomial();
    const r = new Array(this.c.length + y.c.length - 1).fill(0);
    for (let i = 0; i < this.c.length; ++i)
      for (let j = 0; j < y.c.length; ++j) r[i + j] += this.c[i] * y.c[j];
    return new Polynomial(r);
  }

  pow(n: number): Polynomial {
    let r = Polynomial.constant(1);
    for (let i = 0; i < n; ++i) r = r.multiply(this);
    return r;
  }

  derivative(): Polynomial {
    const r: number[] = [];
    for (let i = 1; i < this.c.length; ++i) r.push(this.c[i] * i);
    return new Polynomial(r);
  }

  /** p(a x) */
  rescaleX(a: number): Polynomial {
    return new Polynomial(this.c.map((v, i) => fastpow(a, i) * v));
  }

  eval(x: number): number {
    let r = 0;
    for (let i = this.c.length - 1; i >= 0; --i) r = r * x + this.c[i];
    return r;
  }
}

// Precomputed by the original app's "maxradius" module.
const MAXIMUM_RADIUS_TABLE: number[][] = [
  [],
  [5.875],
  [17.0, 15.875],
  [32.75, 31.75, 29.375],
  [53.0, 52.0, 49.875, 45.875],
  [77.625, 76.75, 74.625, 71.25, 65.5],
  [106.75, 105.75, 103.75, 100.5, 95.625, 87.875],
  [140.125, 139.125, 137.125, 134.0, 129.5, 123.0, 113.125],
  [177.75, 176.875, 174.875, 171.75, 167.375, 161.375, 153.25, 141.125],
  [219.75, 218.75, 216.75, 213.75, 209.5, 203.75, 196.375, 186.375, 171.875],
  [265.875, 264.875, 263.0, 259.875, 255.75, 250.25, 243.25, 234.125, 222.25, 205.125],
  [316.25, 315.375, 313.375, 310.375, 306.25, 300.875, 294.0, 285.5, 274.875, 260.875, 241.125],
  [370.875, 369.875, 368.0, 365.0, 360.875, 355.625, 349.0, 340.875, 330.75, 318.25, 302.25,
    279.625],
];

export function maximumRadius(n: number, l: number): number {
  return MAXIMUM_RADIUS_TABLE[n][l];
}

function binomial(n: number, k: number): number {
  return factorial(n) / factorial(k) / factorial(n - k);
}

function generalizedLaguerrePolynomial(n: number, a: number): Polynomial {
  let result = new Polynomial();
  for (let i = 0; i <= n; ++i) {
    let coeff = binomial(n + a, n - i) / factorial(i);
    if (i & 1) coeff = -coeff;
    result = result.add(Polynomial.variableToThe(i).multiply(coeff));
  }
  return result;
}

/**
 * Radial part R_{Z,N,L}(r) = C exp(-Zr/N) (2Zr/N)^L L_{N-L-1}^{2L+1}(2Zr/N).
 */
export class RadialFunction {
  readonly constantFactors: number;
  readonly radialScaleFactor: number;
  readonly exponentialConstant: number;
  readonly powerOfR: number;
  readonly oscillatingPart: Polynomial;
  readonly maximumRadius: number;

  constructor(z: number, n: number, l: number) {
    this.constantFactors =
      Math.pow((2 * z) / n, 1.5) * Math.sqrt(factorial(n - l - 1) / (2 * n * factorial(n + l)));
    this.radialScaleFactor = (2 * z) / n;
    this.exponentialConstant = -this.radialScaleFactor / 2;
    this.powerOfR = l;
    this.oscillatingPart = generalizedLaguerrePolynomial(n - l - 1, 2 * l + 1).rescaleX(
      this.radialScaleFactor,
    );
    this.maximumRadius = maximumRadius(n, l);
  }

  eval(r: number): number {
    return this.constantFactors * this.oscillatingPart.eval(r) *
      fastpow(r * this.radialScaleFactor, this.powerOfR) * Math.exp(this.exponentialConstant * r);
  }
}

/** Normalized associated Legendre function of colatitude, without Condon-Shortley phase. */
export class AzimuthalFunction {
  private readonly sinThetaPower: number;
  private readonly cosThetaPolynomial: Polynomial;

  constructor(l: number, m: number) {
    const absM = Math.abs(m);
    let p = Polynomial.variableToThe(2).subtract(1).pow(l);
    for (let i = 0; i < l; ++i) p = p.derivative().multiply(1 / (2 * (i + 1)));
    for (let i = 0; i < absM; ++i) p = p.derivative();
    const constant =
      Math.sqrt((2 * l + 1) / 2) * Math.sqrt(factorial(l - absM) / factorial(l + absM));
    this.cosThetaPolynomial = p.multiply(constant);
    this.sinThetaPower = absM;
  }

  eval(theta: number): number {
    return this.cosThetaPolynomial.eval(Math.cos(theta)) * fastpow(Math.sin(theta), this.sinThetaPower);
  }
}

export interface Orbital {
  n: number;
  l: number;
  m: number;
  real: boolean;
  color: boolean;
}

export function orbitalEquals(a: Orbital | null, b: Orbital | null): boolean {
  return (
    !!a && !!b && a.n === b.n && a.l === b.l && a.m === b.m && a.real === b.real &&
    a.color === b.color
  );
}

export function quadratureOrder(o: Orbital): number {
  return o.color ? o.n + 1 : o.l + 2;
}

export function quadratureSteps(o: Orbital): number {
  return o.color ? 64 : 1024;
}

/** Maximum of |ψ|² over all space (a₀⁻³), used to normalise the section view. */
export function maximumDensity(o: Orbital): number {
  const radial = new RadialFunction(1, o.n, o.l);
  const azimuthal = new AzimuthalFunction(o.l, o.m);
  let maxR = 0;
  const rmax = radial.maximumRadius;
  for (let i = 0; i <= 4000; ++i) maxR = Math.max(maxR, radial.eval((rmax * i) / 4000) ** 2);
  let maxT = 0;
  for (let i = 0; i <= 1000; ++i) maxT = Math.max(maxT, azimuthal.eval((Math.PI * i) / 1000) ** 2);
  // |Φ|² ≤ 1/(2π), or 2/(2π) for real orbitals with m ≠ 0
  return (maxR * maxT * (o.real && o.m !== 0 ? 2 : 1)) / (2 * Math.PI);
}
