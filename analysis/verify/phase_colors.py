"""Phase -> sRGB mapping of screendrawer_color.frag (normal colour vision, coherent phase)."""
import math

def srgb(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def color(phase, I):
    """phase: arg ψ (rad); I = 1 - exp(-b ∫|ψ|²ds) in [0,1]; full phase coherence."""
    u, v = 0.06 * math.cos(phase), 0.06 * math.sin(phase)
    Yt2 = I; Y = 0.5 * Yt2
    k = 1.01 + Yt2 * (1 - 1.01)
    u, v = u * k + 0.19784, v * k + 0.46832
    den = 6 * u - 16 * v + 12
    x, y = 9 * u / den, 4 * v / den
    X, Z = Y / y * x, Y / y * (1 - x - y)
    r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
    g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
    b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z
    if min(r, g, b) < 0 or max(r, g, b) > 1: return None
    return '#%02x%02x%02x' % tuple(round(255 * srgb(c)) for c in (r, g, b))

for deg in range(0, 360, 45):
    print(f'phase {deg:3d}°:', [color(math.radians(deg), I) for I in (0.25, 0.5, 1.0)])
