// Web addition: cross-section view.
// Evaluates ψ on the plane dot(x, planeNormal) = planeOffset (orbital coordinates) and
// writes the same integer format as the integrators, so ScreenDrawer can display it:
//   COLOR: xy = 32767 · ψ/|ψ| (unit phasor), z = 32767 · (1 − exp(−k|ψ|²))
//   mono:  32767 · (1 − exp(−k|ψ|²))
// The radial and azimuthal lookup textures are those of the integrators.
// (Compiled with "#define COLOR" inserted after the #version line for colour mode.)
precision highp int;
precision highp float;
precision highp sampler2D;

const float pi = 3.14159265358979;

in vec3 near, far;
#ifdef COLOR
out ivec3 color;
#else
out int color;
#endif

uniform sampler2D radial;
uniform sampler2D azimuthal;

uniform bool bReal;
uniform float fInverseAzimuthalStepSize;
uniform float fInverseRadialStepSize;
uniform float fM;
uniform float fRadialScaleFactor;
uniform float fRadialExponent;
uniform float fFactorPower;
uniform int iAzimuthalSteps;
uniform int iRadialSteps;
uniform vec3 planeNormal;
uniform float planeOffset;
// k / C², where C is the radial normalisation constant (left out of the evaluation
// below to stay well inside float range)
uniform float fDensityScale;

float radialPart(float r) {
    float positionInTexture = r * fInverseRadialStepSize;
    int texturePosition = int(trunc(positionInTexture));
    if (texturePosition >= iRadialSteps)
        return 0.0;
    vec2 textureValue = texelFetch(radial, ivec2(texturePosition, 0), 0).xy;
    return mix(textureValue.x, textureValue.y, fract(positionInTexture));
}

float azimuthalPart(float theta) {
    float positionInTexture = theta * fInverseAzimuthalStepSize;
    int texturePosition = int(trunc(positionInTexture));
    if (texturePosition >= iAzimuthalSteps)
        return texelFetch(azimuthal, ivec2(iAzimuthalSteps - 1, 0), 0).y;
    vec2 textureValue = texelFetch(azimuthal, ivec2(texturePosition, 0), 0).xy;
    return mix(textureValue.x, textureValue.y, fract(positionInTexture));
}

vec2 longitudinalPart(float phi) {
    vec2 result;
    if (fM == 0.0) {
        result = vec2(1.0, 0.0);
    } else {
        float Mphi = fM * phi;
        if (bReal) {
            const float sqrt2 = sqrt(2.0);
            if (fM > 0.0)
                result = vec2(sqrt2 * cos(Mphi), 0.0);
            else
                result = vec2(sqrt2 * sin(Mphi), 0.0);
        } else {
            result = vec2(cos(Mphi), sin(Mphi));
        }
    }
    const float oneOverSqrt2PI = 1.0 / sqrt(2.0 * pi);
    return result * oneOverSqrt2PI;
}

void main() {
    vec3 ray = normalize(far - near);
    float denom = dot(ray, planeNormal);
    float t = (planeOffset - dot(near, planeNormal)) / denom;
    vec2 psi = vec2(0);
    if (t > 0.0 && abs(denom) > 1e-6) {
        vec3 x = near + t * ray;
        float r = length(x);
        float theta = acos(x.z / r);
        if (!(theta > -pi))
            theta = 0.0;
        float phi = atan(x.y, x.x);
        if (!(phi > -2.0 * pi))
            phi = 0.0;
        float poly = radialPart(r);
        float radialValue;
        if (fFactorPower == 0.0)
            radialValue = exp(r * fRadialExponent) * poly;
        else
            radialValue = pow(r * fRadialScaleFactor * exp(r * fRadialExponent), fFactorPower) * poly;
        psi = radialValue * azimuthalPart(theta) * longitudinalPart(phi);
    }

    float density = dot(psi, psi);
    // Galaxy S6 can't do exp of a negative number correctly (kept from the integrators)
    float intensity = 1.0 - 1.0 / exp(density * fDensityScale);
#ifdef COLOR
    float len = sqrt(density);
    vec2 phasor = len > 0.0 ? psi / len : vec2(0);
    color = ivec3(vec3(phasor, intensity) * 32767.0);
#else
    color = int(intensity * 32767.0);
#endif
}
