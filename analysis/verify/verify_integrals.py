"""Check what the integrator shaders compute, using the original quadrature tables.

Claim: for a ray at distance d from the nucleus,
  mono   total   = ∫ |ψ|² ds
  color  total.z = ∫ |ψ|² ds
  color  total.xy = ∫ |ψ| ψ ds          (complex, as a 2-vector)
where ψ = R_nl(r) Y_lm(θ, φ) is the normalized hydrogen wave function (Z=1, atomic units).
"""
import cmath, math, struct, sys, os

DATA = os.path.join(os.path.dirname(__file__), '../../public/data')
MAXR = {(3, 2): 29.375, (4, 2): 49.875, (2, 1): 15.875, (5, 3): 71.25}

def fact(n): return math.factorial(n)

def laguerre(n, a, x):
    return sum((-1) ** i * math.comb(n + a, n - i) / fact(i) * x ** i for i in range(n + 1))

def R(n, l, r):
    rho = 2 * r / n
    c = (2 / n) ** 1.5 * math.sqrt(fact(n - l - 1) / (2 * n * fact(n + l)))
    return c * math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho)

def legendre_poly(l):
    # coefficients of P_l via (x²-1)^l derivative formula
    p = [0.0] * (2 * l + 1)
    for k in range(l + 1):
        p[2 * k] = math.comb(l, k) * (-1) ** (l - k)
    for i in range(l):
        p = [p[j] * j / (2 * (i + 1)) for j in range(1, len(p))]
    return p

def theta_part(l, m, th):
    p = legendre_poly(l)
    for _ in range(abs(m)):
        p = [p[j] * j for j in range(1, len(p))] or [0.0]
    x = math.cos(th)
    val = sum(c * x ** k for k, c in enumerate(p))
    const = math.sqrt((2 * l + 1) / 2 * fact(l - abs(m)) / fact(l + abs(m)))
    return const * val * math.sin(th) ** abs(m)

def Y(l, m, real, x, y, z):
    r = math.sqrt(x * x + y * y + z * z)
    th, ph = math.acos(z / r), math.atan2(y, x)
    t = theta_part(l, m, th) / math.sqrt(2 * math.pi)
    if m == 0: return complex(t)
    if real: return complex(t * math.sqrt(2) * (math.cos(m * ph) if m > 0 else math.sin(m * ph)))
    return t * cmath.exp(1j * m * ph)

def psi(n, l, m, real, p):
    r = math.sqrt(sum(c * c for c in p))
    return R(n, l, r) * Y(l, m, real, *p)

def read_table(kind, n, l):
    order = n + 1 if kind == 'color' else l + 2
    steps = 64 if kind == 'color' else 1024
    raw = open(f'{DATA}/{kind}-{n}-{l}', 'rb').read()
    f = struct.unpack('>%df' % (len(raw) // 4), raw)
    rows = [[(f[2 * (order * i + j)], f[2 * (order * i + j) + 1]) for j in range(order)]
            for i in range(steps + 1)]
    return rows, steps

def shader(kind, n, l, m, real, center, ray):
    """Mirror of integrator_{mono,color}.frag at an exact table row (no interpolation)."""
    rows, steps = read_table(kind, n, l)
    d = math.sqrt(sum(c * c for c in center))
    i = round(d * steps / MAXR[(n, l)])
    tot_xy, tot_z = 0j, 0.0
    sc, ex, pw = 2 / n, -1 / n, l
    for node, w in rows[i]:
        for s in (-1, 1):
            p = [c + s * node * v for c, v in zip(center, ray)]
            r = math.sqrt(sum(c * c for c in p))
            y = Y(l, m, real, *p)
            if kind == 'mono':
                tot_z += w * abs(y) ** 2
            else:
                poly = laguerre(n - l - 1, 2 * l + 1, 2 * r / n)
                factor = (r * sc) ** pw * math.exp(r * ex) * poly if pw else math.exp(r * ex) * poly
                sign = math.copysign(1, poly)
                tot_xy += w * factor ** 2 * abs(y) * sign * y
                tot_z += w * factor ** 2 * abs(y) ** 2
    return tot_xy, tot_z

def direct(n, l, m, real, center, ray, L):
    N = 20000
    h = 2 * L / N
    xy, z = 0j, 0.0
    for k in range(N + 1):
        s = -L + k * h
        wt = 0.5 if k in (0, N) else 1.0
        p = [c + s * v for c, v in zip(center, ray)]
        ps = psi(n, l, m, real, p)
        xy += wt * h * abs(ps) * ps
        z += wt * h * abs(ps) ** 2
    return xy, z

cases = [(4, 2, 1, False), (4, 2, 1, True), (3, 2, -2, False), (5, 3, 2, False)]
for n, l, m, real in cases:
    steps = 64
    d = MAXR[(n, l)] * 7 / steps  # lies exactly on a color table row (and a mono row)
    ray = [0.36, 0.48, 0.8]  # unit vector
    perp = [0.8, -0.6, 0.0]  # unit, perpendicular to ray
    center = [d * c for c in perp]
    L = math.sqrt(MAXR[(n, l)] ** 2 - d * d)
    dxy, dz = direct(n, l, m, real, center, ray, L)
    _, mz = shader('mono', n, l, m, real, center, ray)
    cxy, cz = shader('color', n, l, m, real, center, ray)
    print(f'n={n} l={l} m={m} {"R" if real else "C"}: ∫|ψ|²ds direct={dz:.6e} mono={mz:.6e} '
          f'color.z={cz:.6e} | ∫|ψ|ψds direct={dxy:.4e} color.xy={cxy:.4e}')
