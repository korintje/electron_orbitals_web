#version 300 es
// WebGL only supports 1px lines, so the axes (GL_LINES with glLineWidth in the
// original app) are drawn as screen-space quads of the same pixel width.
in vec3 inPosition;   // this end of the segment
in vec3 inOther;      // the other end of the segment
in float inSide;      // -1 or +1
in vec3 inColor;
out vec3 color;
uniform mat4 projectionMatrix;
uniform mat4 scalingMatrix;
uniform vec2 screenDimensions;
uniform float lineWidth;

// Clip this end against the near plane (z = -w) so lines passing behind the
// camera still render like GL-clipped lines.
vec4 clipNear(vec4 a, vec4 b) {
    float da = a.z + a.w;
    float db = b.z + b.w;
    if (da < 0.0 && db > 0.0)
        return mix(a, b, da / (da - db));
    return a;
}

void main() {
    vec4 a = projectionMatrix * scalingMatrix * vec4(inPosition, 1);
    vec4 b = projectionMatrix * scalingMatrix * vec4(inOther, 1);
    vec4 ca = clipNear(a, b);
    vec4 cb = clipNear(b, a);
    vec2 pa = ca.xy / ca.w * screenDimensions;
    vec2 pb = cb.xy / cb.w * screenDimensions;
    vec2 dir = pb - pa;
    float len = length(dir);
    dir = len > 0.0 ? dir / len : vec2(1, 0);
    vec2 normal = vec2(-dir.y, dir.x);
    vec2 offset = normal * inSide * lineWidth / screenDimensions;
    gl_Position = ca + vec4(offset * ca.w, 0, 0);
    color = inColor;
}
