// Legend overlay: phase colour wheel, brightness scale and length scale.
import { EDU } from './edu';
import { maximumRadius, type Orbital } from './math';
import { monoColor, phaseColor } from './phasecolor';
import { BOHR_NM, sci, timePhase, valueAtIntensity } from './physics';

const BAR_H = 10;
const WHEEL_INTENSITY = 0.8;
const TICKS = [0.5, 0.9];

export class Legend {
  readonly root = document.createElement('div');
  private readonly header = document.createElement('button');
  private readonly body = document.createElement('div');
  private readonly phase = document.createElement('div');
  private readonly wheel = document.createElement('canvas');
  private readonly wheelBox = document.createElement('div');
  private readonly markers = document.createElement('div');
  private readonly phaseText = document.createElement('div');
  private readonly bar = document.createElement('canvas');
  private readonly densityText = document.createElement('div');
  private readonly ticks = document.createElement('div');
  private readonly axisText = document.createElement('div');
  private orbital: Orbital | null = null;
  private colorBlind = -1;
  private lang: 'en' | 'ja' = 'en';
  private collapsed = false;
  private wheelSize = 52; // CSS px
  private barWidth = 150;

  constructor() {
    this.root.className = 'legend';
    this.header.className = 'legend-header';
    this.header.type = 'button';
    this.header.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.body.classList.toggle('hidden', this.collapsed);
      this.updateHeader();
    });
    this.body.className = 'legend-body';
    this.phase.className = 'legend-phase';
    this.wheelBox.className = 'legend-wheel';
    this.markers.className = 'legend-markers';
    this.wheelBox.append(this.wheel, this.markers);
    for (const [label, cls] of [['0', 'e'], ['π/2', 'n'], ['π', 'w'], ['−π/2', 's']]) {
      const s = document.createElement('span');
      s.className = 'wheel-tick ' + cls;
      s.textContent = label;
      this.wheelBox.append(s);
    }
    this.phaseText.className = 'legend-text';
    this.phase.append(this.wheelBox, this.phaseText);
    this.densityText.className = 'legend-text';
    this.ticks.className = 'legend-ticks';
    this.axisText.className = 'legend-text legend-axis';
    this.body.append(this.phase, this.densityText, this.bar, this.ticks, this.axisText);
    this.root.append(this.header, this.body);
  }

  private updateHeader(): void {
    this.header.textContent = `${EDU[this.lang].legend} ${this.collapsed ? '▸' : '▾'}`;
  }

  /**
   * @param section  whether the cross-section view is shown
   * @param k  brightness constant: intensity = 1 − exp(−k·value), value = ∫|ψ|²ds or |ψ|²
   * @param common  whether the brightness scale is common to all orbitals
   */
  update(o: Orbital, colorBlind: number, lang: 'en' | 'ja', section: boolean, k: number,
    common: boolean): void {
    const sectionK = section ? k : null;
    const T = EDU[lang];
    const changedColor = colorBlind !== this.colorBlind;
    this.lang = lang;
    this.orbital = o;
    this.colorBlind = colorBlind;
    this.updateHeader();

    this.phase.classList.toggle('hidden', !o.color);
    if (changedColor) this.drawWheel();
    if (changedColor || this.bar.width === 0) this.drawBar();
    const note = sectionK !== null ? T.legendSectionNote : o.real ? '' : T.legendPhaseNote;
    this.phaseText.innerHTML = `${T.legendPhase}<br><small>${note}</small>`;
    this.markers.classList.toggle('hidden', !o.real);
    if (o.real) {
      this.markers.innerHTML = '<span class="marker plus">+</span><span class="marker minus">−</span>';
      this.phaseText.innerHTML = `${T.legendPhase}<br><small>ℝ: ${T.legendSign} +/−` +
        (sectionK !== null ? `<br>${T.legendSectionNote}` : '') + '</small>';
    }

    this.densityText.innerHTML = (section ? T.legendSectionDensity : T.legendDensity) +
      `<br><small>${common ? T.legendCommon : T.legendPerOrbital}</small>`;
    const parts = ['<span style="left:0">0</span>'];
    for (const i of TICKS) {
      const value = valueAtIntensity(k, i);
      parts.push(`<span style="left:${i * 100}%">${sci(value)}</span>`);
    }
    parts.push(`<span class="unit">${section ? T.legendSectionUnit : T.legendUnit}</span>`);
    this.ticks.innerHTML = parts.join('');

    const axis = 0.75 * maximumRadius(o.n, o.l);
    this.axisText.textContent = T.legendAxis(axis.toFixed(1), (axis * BOHR_NM).toFixed(2));
  }

  /** Web layout: larger legend in the wide-screen sidebar */
  setLarge(large: boolean): void {
    const [w, b] = large ? [96, 260] : [52, 150];
    if (w === this.wheelSize) return;
    this.wheelSize = w;
    this.barWidth = b;
    this.root.classList.toggle('large', large);
    this.drawWheel();
    this.drawBar();
  }

  /** Move the ± markers of real orbitals with the time-dependent phase. */
  tick(millis: number, phaseSign: number): void {
    const o = this.orbital;
    if (!o || !o.color || !o.real) return;
    const a = timePhase(o.n, millis, phaseSign);
    const r = this.wheelSize / 2 - 8;
    const [plus, minus] = this.markers.children as unknown as HTMLElement[];
    // Canvas y grows downwards; phase angle grows counter-clockwise
    plus.style.transform = `translate(${r * Math.cos(a)}px, ${-r * Math.sin(a)}px)`;
    minus.style.transform = `translate(${-r * Math.cos(a)}px, ${r * Math.sin(a)}px)`;
  }

  private drawWheel(): void {
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(this.wheelSize * dpr);
    const c = this.wheel;
    c.width = c.height = size;
    c.style.width = c.style.height = `${this.wheelSize}px`;
    this.wheelBox.style.width = this.wheelBox.style.height = `${this.wheelSize}px`;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(size, size);
    const half = size / 2;
    for (let y = 0; y < size; ++y)
      for (let x = 0; x < size; ++x) {
        const dx = (x + 0.5 - half) / half, dy = -(y + 0.5 - half) / half;
        const rho = Math.hypot(dx, dy);
        const k = 4 * (y * size + x);
        if (rho > 1) continue;
        // Radius = coherence of the phase along the line of sight
        const rgb = phaseColor(dx, dy, WHEEL_INTENSITY, this.colorBlind);
        const edge = Math.min(1, (1 - rho) * half);
        img.data[k] = rgb ? Math.round(rgb[0] * 255) : 0;
        img.data[k + 1] = rgb ? Math.round(rgb[1] * 255) : 0;
        img.data[k + 2] = rgb ? Math.round(rgb[2] * 255) : 0;
        img.data[k + 3] = Math.round(255 * edge);
      }
    ctx.putImageData(img, 0, 0);
  }

  private drawBar(): void {
    const dpr = window.devicePixelRatio || 1;
    const c = this.bar;
    c.width = Math.round(this.barWidth * dpr);
    c.height = Math.round(BAR_H * dpr);
    c.style.width = `${this.barWidth}px`;
    this.ticks.style.width = `${this.barWidth}px`;
    c.style.height = `${BAR_H}px`;
    const ctx = c.getContext('2d')!;
    for (let x = 0; x < c.width; ++x) {
      const g = Math.round(monoColor(x / (c.width - 1)) * 255);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(x, 0, 1, c.height);
    }
  }
}
