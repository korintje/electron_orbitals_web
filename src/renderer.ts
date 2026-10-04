// Port of OrbitalRenderer, OrbitalData, Integrator, ScreenDrawer and AxesDrawer.
import integratorColorVert from './shaders/integrator_color.vert?raw';
import integratorColorFrag from './shaders/integrator_color.frag?raw';
import integratorMonoVert from './shaders/integrator_mono.vert?raw';
import integratorMonoFrag from './shaders/integrator_mono.frag?raw';
import screenColorVert from './shaders/screendrawer_color.vert?raw';
import screenColorFrag from './shaders/screendrawer_color.frag?raw';
import screenMonoVert from './shaders/screendrawer_mono.vert?raw';
import screenMonoFrag from './shaders/screendrawer_mono.frag?raw';
import axesLineVert from './shaders/axes_line.vert?raw';
import axesFrag from './shaders/axes.frag?raw';
import originVert from './shaders/origin.vert?raw';
import originFrag from './shaders/origin.frag?raw';
import arrowVert from './shaders/arrow.vert?raw';
import arrowFrag from './shaders/arrow.frag?raw';

import { invertM } from './camera';
import {
  AzimuthalFunction, Orbital, Polynomial, RadialFunction, orbitalEquals, quadratureOrder,
  quadratureSteps,
} from './math';
import type { Settings } from './settings';

type GL = WebGL2RenderingContext;

class Program {
  readonly id: WebGLProgram;
  private readonly uniforms = new Map<string, WebGLUniformLocation | null>();

  constructor(private readonly gl: GL, vs: string, fs: string) {
    const p = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error('Error compiling shader: ' + gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    // Full-screen programs share one VAO with inPosition at location 0.
    gl.bindAttribLocation(p, 0, 'inPosition');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error('Error linking program: ' + gl.getProgramInfoLog(p));
    this.id = p;
  }

  use(): void {
    this.gl.useProgram(this.id);
  }

  loc(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) this.uniforms.set(name, this.gl.getUniformLocation(this.id, name));
    return this.uniforms.get(name)!;
  }

  attrib(name: string): number {
    return this.gl.getAttribLocation(this.id, name);
  }

  set1i(name: string, v: number): void {
    this.gl.uniform1i(this.loc(name), v);
  }

  set1f(name: string, v: number): void {
    this.gl.uniform1f(this.loc(name), v);
  }
}

/** Texture with NEAREST filtering, used with texelFetch. */
class Texture {
  readonly id: WebGLTexture;

  constructor(
    private readonly gl: GL,
    private readonly format: number,
    private readonly type: number,
    private readonly internalFormat: number,
  ) {
    this.id = gl.createTexture()!;
    this.resize(1, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  bind(): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
  }

  resize(w: number, h: number): void {
    this.setImage(w, h, null);
  }

  setImage(w: number, h: number, pixels: ArrayBufferView | null): void {
    const gl = this.gl;
    this.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, w, h, 0, this.format, this.type, pixels);
  }
}

// ---------------------------------------------------------------------------
// Quadrature data (assets/data/{color,mono}-N-L): big-endian float32
// (node, weight) pairs, (steps + 1) rows of `order` points.

const quadratureCache = new Map<string, Promise<Float32Array>>();

export function loadQuadrature(o: Orbital): Promise<Float32Array> {
  const name = `${o.color ? 'color' : 'mono'}-${o.n}-${o.l}`;
  let p = quadratureCache.get(name);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/${name}`)
      .then((r) => {
        if (!r.ok) throw new Error('Error opening asset: ' + name);
        return r.arrayBuffer();
      })
      .then((buf) => {
        const order = quadratureOrder(o);
        const steps = quadratureSteps(o);
        const view = new DataView(buf);
        const data = new Float32Array(4 * order * steps);
        let pos = 0;
        for (let i = 0; i <= steps; ++i)
          for (let j = 0; j < order; ++j) {
            const node = view.getFloat32(pos, false);
            const weight = view.getFloat32(pos + 4, false);
            pos += 8;
            if (i !== steps) {
              data[4 * order * i + 4 * j] = node;
              data[4 * order * i + 4 * j + 1] = weight;
            }
            if (i !== 0) {
              data[4 * order * (i - 1) + 4 * j + 2] = node;
              data[4 * order * (i - 1) + 4 * j + 3] = weight;
            }
          }
        return data;
      });
    p.catch(() => quadratureCache.delete(name));
    quadratureCache.set(name, p);
  }
  return p;
}

function functionToBuffer2(f: (x: number) => number, start: number, end: number, n: number) {
  const data = new Float32Array(2 * n);
  const step = (end - start) / n;
  let x = start;
  let value = f(x);
  for (let i = 0; i < n; ++i) {
    data[2 * i] = value;
    x += step;
    value = f(x);
    data[2 * i + 1] = value;
  }
  return data;
}

class OrbitalData {
  orbital: Orbital | null = null;
  maximumRadius = 0;
  private readonly radialTexture: Texture;
  private readonly azimuthalTexture: Texture;
  private readonly quadratureTexture: Texture;
  private u = {
    bReal: false, fBrightness: 0, fInverseAzimuthalStepSize: 0, fInverseQuadratureStepSize: 0,
    fInverseRadialStepSize: 0, fM: 0, fRadialScaleFactor: 0, fRadialExponent: 0,
    fFactorPower: 0, iAzimuthalSteps: 0, iOrder: 0, iQuadratureSteps: 0, iRadialSteps: 0,
  };

  constructor(private readonly gl: GL) {
    this.radialTexture = new Texture(gl, gl.RG, gl.FLOAT, gl.RG32F);
    this.azimuthalTexture = new Texture(gl, gl.RG, gl.FLOAT, gl.RG32F);
    this.quadratureTexture = new Texture(gl, gl.RGBA, gl.FLOAT, gl.RGBA32F);
  }

  load(o: Orbital, quadratureData: Float32Array): void {
    if (orbitalEquals(o, this.orbital)) return;
    this.orbital = { ...o };

    const radial = new RadialFunction(1, o.n, o.l);
    const azimuthal = new AzimuthalFunction(o.l, o.m);
    const order = quadratureOrder(o);
    const steps = quadratureSteps(o);
    this.quadratureTexture.setImage(order, steps, quadratureData);

    const quadratureRadius = Math.fround(radial.maximumRadius);
    const maxLateral = quadratureData[quadratureData.length - 2];
    const maximumRadius = Math.fround(
      Math.sqrt(quadratureRadius * quadratureRadius + maxLateral * maxLateral),
    );
    this.maximumRadius = radial.maximumRadius;

    const radialTextureSize = 1024;
    const osc: Polynomial = radial.oscillatingPart;
    this.radialTexture.setImage(
      radialTextureSize, 1, functionToBuffer2((x) => osc.eval(x), 0, maximumRadius, radialTextureSize),
    );
    const azimuthalTextureSize = 256;
    this.azimuthalTexture.setImage(
      azimuthalTextureSize, 1,
      functionToBuffer2((x) => azimuthal.eval(x), 0, Math.PI, azimuthalTextureSize),
    );

    const u = this.u;
    u.bReal = o.real;
    u.fBrightness = (quadratureRadius * quadratureRadius) / 2;
    u.fInverseAzimuthalStepSize = azimuthalTextureSize / 3.14159265359;
    u.fInverseQuadratureStepSize = steps / quadratureRadius;
    u.fInverseRadialStepSize = radialTextureSize / maximumRadius;
    u.fM = o.m;
    u.fRadialScaleFactor = radial.radialScaleFactor;
    u.fFactorPower = radial.powerOfR;
    u.fRadialExponent =
      radial.powerOfR === 0
        ? radial.exponentialConstant
        : radial.exponentialConstant / radial.powerOfR;
    u.iAzimuthalSteps = azimuthalTextureSize;
    u.iOrder = order;
    u.iQuadratureSteps = steps;
    u.iRadialSteps = radialTextureSize;
  }

  setupForIntegration(p: Program): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    this.radialTexture.bind();
    p.set1i('radial', 0);
    gl.activeTexture(gl.TEXTURE1);
    this.azimuthalTexture.bind();
    p.set1i('azimuthal', 1);
    gl.activeTexture(gl.TEXTURE2);
    this.quadratureTexture.bind();
    p.set1i('quadrature', 2);
    const u = this.u;
    p.set1i('bReal', u.bReal ? 1 : 0);
    p.set1f('fBrightness', u.fBrightness);
    p.set1f('fInverseAzimuthalStepSize', u.fInverseAzimuthalStepSize);
    p.set1f('fInverseQuadratureStepSize', u.fInverseQuadratureStepSize);
    p.set1f('fInverseRadialStepSize', u.fInverseRadialStepSize);
    p.set1f('fM', u.fM);
    p.set1f('fRadialScaleFactor', u.fRadialScaleFactor);
    p.set1f('fRadialExponent', u.fRadialExponent);
    p.set1f('fFactorPower', u.fFactorPower);
    p.set1i('iAzimuthalSteps', u.iAzimuthalSteps);
    p.set1i('iOrder', u.iOrder);
    p.set1i('iQuadratureSteps', u.iQuadratureSteps);
    p.set1i('iRadialSteps', u.iRadialSteps);
  }
}

// ---------------------------------------------------------------------------

export class OrbitalRenderer {
  private readonly gl: GL;
  private readonly data: OrbitalData;

  private readonly screenRectangle: WebGLBuffer;
  private readonly vaoRect: WebGLVertexArrayObject;

  // Integrator
  private readonly programIntColor: Program;
  private readonly programIntMono: Program;
  private readonly outColor: Texture;
  private readonly outMono: Texture;
  private readonly fbColor: WebGLFramebuffer;
  private readonly fbMono: WebGLFramebuffer;
  private lastInverseTransform: Float32Array = new Float32Array(16);
  private integratedOrbital: Orbital | null = null;
  private outputResized = true;

  // ScreenDrawer
  private readonly programScreenColor: Program;
  private readonly programScreenMono: Program;

  // AxesDrawer
  private readonly programAxes: Program;
  private readonly programOrigin: Program;
  private readonly programArrow: Program;
  private readonly vaoAxes: WebGLVertexArrayObject;
  private readonly vaoOrigin: WebGLVertexArrayObject;
  private readonly vaoArrows: WebGLVertexArrayObject;
  private arrowTexture: WebGLTexture;
  private originTexture: WebGLTexture;
  private readonly maxPointSize: number;

  private width = 1;
  private height = 1;
  private integrationWidth = 1;
  private integrationHeight = 1;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly settings: Settings,
    textures: { arrow: Uint8Array; origin: Uint8Array },
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL 2.0 is required.');
    this.gl = gl;

    this.data = new OrbitalData(gl);

    this.screenRectangle = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenRectangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

    // Integrator
    this.outColor = new Texture(gl, gl.RGBA_INTEGER, gl.SHORT, gl.RGBA16I);
    this.fbColor = this.makeFramebuffer(this.outColor);
    this.outMono = new Texture(gl, gl.RED_INTEGER, gl.SHORT, gl.R16I);
    this.fbMono = this.makeFramebuffer(this.outMono);
    this.programIntColor = new Program(gl, integratorColorVert, integratorColorFrag);
    this.programIntMono = new Program(gl, integratorMonoVert, integratorMonoFrag);

    // ScreenDrawer
    this.programScreenColor = new Program(gl, screenColorVert, screenColorFrag);
    this.programScreenMono = new Program(gl, screenMonoVert, screenMonoFrag);

    this.vaoRect = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoRect);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenRectangle);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);

    // AxesDrawer
    this.programAxes = new Program(gl, axesLineVert, axesFrag);
    this.programOrigin = new Program(gl, originVert, originFrag);
    this.programArrow = new Program(gl, arrowVert, arrowFrag);
    this.vaoAxes = this.makeAxesVao();
    this.vaoOrigin = this.makeVao(this.programOrigin, 'inPosition', [0, 0, 0]);
    // Note this is both coordinates and colors :)
    this.vaoArrows = this.makeVao(this.programArrow, 'inPosition', [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this.arrowTexture = this.makeR8Texture(64, textures.arrow);
    this.originTexture = this.makeR8Texture(32, textures.origin);
    this.maxPointSize = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1];
  }

  private makeFramebuffer(t: Texture): WebGLFramebuffer {
    const gl = this.gl;
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.id, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error('Framebuffer not complete');
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fb;
  }

  private makeVao(p: Program, attrib: string, data: number[]): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const loc = p.attrib(attrib);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);
    return vao;
  }

  private makeAxesVao(): WebGLVertexArrayObject {
    const gl = this.gl;
    const p = this.programAxes;
    // Each axis is a quad (two triangles): position, other end, side, color.
    const verts: number[] = [];
    for (let axis = 0; axis < 3; ++axis) {
      const tip = [0, 0, 0];
      tip[axis] = 1;
      const color = tip;
      const o = [0, 0, 0];
      const corners: [number[], number[], number][] = [
        [o, tip, -1], [o, tip, 1], [tip, o, 1],
        [o, tip, -1], [tip, o, 1], [tip, o, -1],
      ];
      for (const [pos, other, side] of corners) {
        // At the tip end the direction is reversed, so flip the side to keep
        // the quad consistent.
        const s = pos === tip ? -side : side;
        verts.push(...pos, ...other, s, ...color);
      }
    }
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const stride = 10 * 4;
    const attrs: [string, number, number][] = [
      ['inPosition', 3, 0], ['inOther', 3, 12], ['inSide', 1, 24], ['inColor', 3, 28],
    ];
    for (const [name, size, offset] of attrs) {
      const loc = p.attrib(name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    }
    gl.bindVertexArray(null);
    return vao;
  }

  private makeR8Texture(size: number, pixels: Uint8Array): WebGLTexture {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  }

  /** Equivalent of onSurfaceChanged. */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const scaleDownFactor = this.settings.ultraQuality ? 1 : 3;
    this.integrationWidth = Math.max(1, Math.floor(width / scaleDownFactor));
    this.integrationHeight = Math.max(1, Math.floor(height / scaleDownFactor));
    this.outColor.resize(this.integrationWidth, this.integrationHeight);
    this.outMono.resize(this.integrationWidth, this.integrationHeight);
    this.outputResized = true;
  }

  get aspectRatio(): number {
    return this.width / this.height;
  }

  get isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  /** Equivalent of onDrawFrame. */
  draw(
    orbital: Orbital, quadratureData: Float32Array, transform: Float32Array<ArrayBuffer>, millis: number,
    lineWidth: number,
  ): void {
    this.data.load(orbital, quadratureData);
    this.integrate(invertM(transform));
    this.drawScreen(millis);
    if (this.settings.showAxes) this.drawAxes(transform, lineWidth);
  }

  private integrate(inverseTransform: Float32Array): void {
    const gl = this.gl;
    let needToIntegrate = false;
    if (!inverseTransform.every((v, i) => v === this.lastInverseTransform[i])) {
      needToIntegrate = true;
      this.lastInverseTransform = inverseTransform;
    }
    if (!orbitalEquals(this.integratedOrbital, this.data.orbital)) {
      needToIntegrate = true;
      this.integratedOrbital = this.data.orbital;
    }
    if (!needToIntegrate && !this.outputResized) return;
    this.outputResized = false;

    const color = this.data.orbital!.color;
    const p = color ? this.programIntColor : this.programIntMono;
    p.use();
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, color ? this.fbColor : this.fbMono);
    gl.viewport(0, 0, this.integrationWidth, this.integrationHeight);
    gl.clearBufferiv(gl.COLOR, 0, new Int32Array([0, 0, 0, 0]));
    this.data.setupForIntegration(p);
    gl.uniformMatrix4fv(p.loc('inverseTransform'), false, inverseTransform);
    gl.bindVertexArray(this.vaoRect);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private drawScreen(millis: number): void {
    const gl = this.gl;
    const o = this.data.orbital!;
    const p = o.color ? this.programScreenColor : this.programScreenMono;
    p.use();
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, this.width, this.height);
    gl.activeTexture(gl.TEXTURE0);
    (o.color ? this.outColor : this.outMono).bind();
    p.set1i('data', 0);
    gl.uniform2f(p.loc('texSize'), this.integrationWidth, this.integrationHeight);
    gl.uniform2i(p.loc('upperClamp'), this.integrationWidth - 1, this.integrationHeight - 1);
    const period = o.n * o.n * 1000; // ms
    const t = (2 * Math.PI * (millis % period)) / period;
    gl.uniformMatrix2fv(p.loc('colorRotation'), false,
      new Float32Array([Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)]));
    gl.uniform1i(p.loc('colorBlindMode'), this.settings.colorBlind);
    gl.bindVertexArray(this.vaoRect);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
  }

  private drawAxes(transform: Float32Array<ArrayBuffer>, lineWidth: number): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.MAX);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.viewport(0, 0, this.width, this.height);

    const mr = Math.fround(this.data.maximumRadius) * 0.75;
    const scaling = new Float32Array([mr, 0, 0, 0, 0, mr, 0, 0, 0, 0, mr, 0, 0, 0, 0, 1]);

    const pa = this.programAxes;
    pa.use();
    gl.uniformMatrix4fv(pa.loc('projectionMatrix'), false, transform);
    gl.uniformMatrix4fv(pa.loc('scalingMatrix'), false, scaling);
    gl.uniform2f(pa.loc('screenDimensions'), this.width, this.height);
    pa.set1f('lineWidth', lineWidth);
    gl.bindVertexArray(this.vaoAxes);
    gl.drawArrays(gl.TRIANGLES, 0, 18);

    const po = this.programOrigin;
    po.use();
    po.set1f('originSize', Math.min(2 * lineWidth, this.maxPointSize));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.originTexture);
    po.set1i('origin', 0);
    gl.bindVertexArray(this.vaoOrigin);
    gl.drawArrays(gl.POINTS, 0, 1);

    const pr = this.programArrow;
    pr.use();
    gl.uniformMatrix4fv(pr.loc('projectionMatrix'), false, transform);
    gl.uniformMatrix4fv(pr.loc('scalingMatrix'), false, scaling);
    pr.set1f('arrowSize', Math.min(6 * lineWidth, this.maxPointSize));
    gl.uniform2f(pr.loc('screenDimensions'), this.width, this.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.arrowTexture);
    pr.set1i('arrow', 0);
    gl.bindVertexArray(this.vaoArrows);
    gl.drawArrays(gl.POINTS, 0, 3);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }
}
