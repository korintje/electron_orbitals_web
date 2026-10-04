// Port of OrbitalSelector + ValueChanger.
import { MAX_N, type Orbital } from './math';
import { icon } from './icons';
import { strings } from './i18n';
import { EDU } from './edu';

const COLOR_DARK = '#000';
const COLOR_DIM = '#808080';
const COLOR_BRIGHT = '#fff';

const PLUS_MINUS = '±';
const MINUS_PLUS = '∓';
const REAL_NUMBERS = 'ℝ';
const COMPLEX_NUMBERS = 'ℂ';

function button(cls: string, content: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'eo-button ' + cls;
  b.innerHTML = content;
  return b;
}

class ValueChanger {
  readonly root = document.createElement('div');
  readonly up = button('arrow', icon('arrowUp'));
  readonly down = button('arrow', icon('arrowDown'));
  private readonly value = document.createElement('div');
  private readonly label = document.createElement('div');

  constructor() {
    this.root.className = 'value-changer';
    this.value.className = 'value';
    this.label.className = 'qn-label';
    this.root.append(this.label, this.up, this.value, this.down);
  }

  /** Web addition: name of the quantum number above the control */
  setLabel(symbol: string, name: string): void {
    this.label.innerHTML = `<i>${symbol}</i><small>${name}</small>`;
  }

  setText(t: string): void {
    this.value.textContent = t;
  }

  setUpTint(c: string): void {
    this.up.style.color = c;
  }

  setDownTint(c: string): void {
    this.down.style.color = c;
  }
}

function ss(x: number): string {
  return `<sup><small>${x}</small></sup>`;
}

export class OrbitalSelector {
  qN = 4;
  qL = 2;
  qM = 1;
  real = true; // web change: real orbitals by default (original: complex)
  color = true;
  pauseTime = 0;

  readonly root = document.createElement('div');
  private readonly orbitalName = document.createElement('div');
  private readonly nChanger = new ValueChanger();
  private readonly lChanger = new ValueChanger();
  private readonly mChanger = new ValueChanger();
  private readonly rcChanger = button('rc', COMPLEX_NUMBERS);
  private readonly colorChanger = button('icon', '');
  private readonly pauseChanger = button('icon', '');
  private readonly rcCaption = document.createElement('div');
  private readonly colorCaption = document.createElement('div');
  private readonly pauseCaption = document.createElement('div');
  private lang: 'en' | 'ja' = 'en';

  // Web addition: cross-section view
  section = false;
  /** Plane position as a fraction of R_max, in [−1, 1] */
  sectionOffset = 0;
  /** log10 of the brightness gain (both views), relative to the default */
  gain = 0;
  /** Web addition: same brightness scale for all orbitals instead of per orbital */
  commonScale = true;
  private readonly sectionRows = document.createElement('div');
  private readonly scaleLabel = document.createElement('span');
  private readonly scaleButtons: HTMLButtonElement[] = [];
  private readonly sectionChanger = button('icon', '');
  private readonly sectionCaption = document.createElement('div');
  readonly sectionPanel = document.createElement('div');
  readonly controls = document.createElement('div');
  private bottomSpacer!: HTMLElement;
  // Web addition: on phones the options panel is folded into this bar and, when opened,
  // takes the place of the n/l/m controls instead of covering the orbital
  private readonly panelBar = document.createElement('button');
  private readonly panelBarTitle = document.createElement('span');
  private readonly panelBarSummary = document.createElement('span');
  private readonly panelBarChevron = document.createElement('span');
  private panelOpen = false;
  private planeText = '';
  private readonly resetButtons: HTMLButtonElement[] = [];
  private readonly planeLabel = document.createElement('div');
  private readonly offsetLabel = document.createElement('span');
  private readonly offsetValue = document.createElement('span');
  private readonly gainLabel = document.createElement('span');
  private readonly gainValue = document.createElement('span');
  private readonly offsetSlider = document.createElement('input');
  private readonly gainSlider = document.createElement('input');
  private rmax = 1;

  constructor(
    private readonly onOrbitalChanged: (o: Orbital, pauseTime: number) => void,
  ) {
    this.root.id = 'orbital-selector';
    this.orbitalName.className = 'orbital-name';
    const controls = this.controls;
    controls.className = 'controls';
    const column = document.createElement('div');
    column.className = 'button-column';
    // Web addition: each mode button has a caption stating the current mode
    const columnLabel = document.createElement('div');
    columnLabel.className = 'qn-label';
    column.append(columnLabel);
    for (const [b, c] of [[this.rcChanger, this.rcCaption], [this.colorChanger, this.colorCaption],
      [this.pauseChanger, this.pauseCaption], [this.sectionChanger, this.sectionCaption]] as const) {
      const row = document.createElement('div');
      row.className = 'mode-row';
      c.className = 'mode-caption';
      row.append(b, c);
      column.append(row);
    }
    controls.append(this.nChanger.root, this.lChanger.root, this.mChanger.root, column);
    const spacer = (w: number) => {
      const s = document.createElement('div');
      s.style.flex = `${w} 1 0`;
      return s;
    };
    this.buildSectionPanel();
    this.panelBar.type = 'button';
    this.panelBar.className = 'panel-bar';
    this.panelBarTitle.className = 'panel-bar-title';
    this.panelBarSummary.className = 'panel-bar-summary';
    this.panelBarChevron.className = 'panel-bar-chevron';
    this.panelBar.append(this.panelBarTitle, this.panelBarSummary, this.panelBarChevron);
    this.panelBarTitle.innerHTML = icon('tune');
    this.panelBar.addEventListener('click', () => {
      this.panelOpen = !this.panelOpen;
      this.updateCaptions();
    });
    this.bottomSpacer = spacer(0.1);
    this.root.append(spacer(0.1), this.orbitalName, spacer(0.8), this.sectionPanel, controls,
      this.bottomSpacer);

    const on = (b: HTMLElement, f: () => void) =>
      b.addEventListener('click', () => {
        f();
        this.orbitalChanged();
      });
    on(this.nChanger.up, () => this.increaseN());
    on(this.nChanger.down, () => this.decreaseN());
    on(this.lChanger.up, () => this.increaseL());
    on(this.lChanger.down, () => this.decreaseL());
    on(this.mChanger.up, () => this.increaseM());
    on(this.mChanger.down, () => this.decreaseM());
    on(this.rcChanger, () => (this.real = !this.real));
    on(this.colorChanger, () => (this.color = !this.color));
    on(this.sectionChanger, () => (this.section = !this.section));
    on(this.pauseChanger, () => (this.pauseTime = this.pauseTime !== 0 ? 0 : Date.now()));
  }

  setLanguage(lang: 'en' | 'ja'): void {
    this.lang = lang;
    const T = EDU[lang];
    [this.nChanger, this.lChanger, this.mChanger].forEach((c, i) => c.setLabel(T.qn[i][0], T.qn[i][1]));
    this.updateCaptions();
    const s = strings(lang);
    for (const c of [this.nChanger, this.lChanger, this.mChanger]) {
      c.up.setAttribute('aria-label', s.up);
      c.down.setAttribute('aria-label', s.down);
    }
    this.rcChanger.setAttribute('aria-label', s.realComplex);
    this.colorChanger.setAttribute('aria-label', s.colormono);
    this.pauseChanger.setAttribute('aria-label', s.pause);
    this.sectionChanger.setAttribute('aria-label', `${EDU[lang].projection} / ${EDU[lang].section}`);
  }

  private increaseN(): void {
    if (this.qN < MAX_N) ++this.qN;
  }

  private decreaseN(): void {
    if (this.qN > 1) {
      --this.qN;
      if (this.qL >= this.qN) this.decreaseL();
    }
  }

  private increaseL(): void {
    if (this.qL < MAX_N - 1) {
      ++this.qL;
      if (this.qL >= this.qN) this.increaseN();
    }
  }

  private decreaseL(): void {
    if (this.qL > 0) {
      --this.qL;
      if (this.qM > this.qL) this.decreaseM();
      else if (this.qM < -this.qL) this.increaseM();
    }
  }

  private increaseM(): void {
    if (this.qM < MAX_N - 1) {
      ++this.qM;
      if (this.qM > this.qL) this.increaseL();
    }
  }

  private decreaseM(): void {
    if (this.qM > 1 - MAX_N) {
      --this.qM;
      if (this.qM < -this.qL) this.increaseL();
    }
  }

  orbitalChanged(): void {
    const { qN, qL, qM, real, color } = this;
    this.nChanger.setText(String(qN));
    this.lChanger.setText(String(qL));
    if (real && qM > 0) this.mChanger.setText(PLUS_MINUS + qM);
    else if (real && qM < 0) this.mChanger.setText(MINUS_PLUS + -qM);
    else this.mChanger.setText(String(qM));
    this.rcChanger.textContent = real ? REAL_NUMBERS : COMPLEX_NUMBERS;
    this.colorChanger.innerHTML = color ? icon('palette') : icon('bnw');
    // Web change: show the conventional pause icon while running
    this.pauseChanger.innerHTML = this.pauseTime === 0 ? icon('pause') : icon('play');
    this.setButtonTint();
    this.setOrbitalName();
    this.updateCaptions();
    this.onOrbitalChanged({ n: qN, l: qL, m: qM, real, color }, this.pauseTime);
  }

  private buildSectionPanel(): void {
    this.sectionPanel.className = 'section-panel';
    this.planeLabel.className = 'plane-label';
    const row = (label: HTMLElement, slider: HTMLInputElement, value: HTMLElement,
      min: number, max: number, step: number, get: () => number, set: (v: number) => void) => {
      const r = document.createElement('div');
      r.className = 'slider-row';
      slider.type = 'range';
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(get());
      slider.addEventListener('input', () => {
        set(Number(slider.value));
        this.orbitalChanged();
      });
      const reset = () => {
        set(0);
        slider.value = String(get());
        this.orbitalChanged();
      };
      // Double click resets the slider, as does the reset button
      slider.addEventListener('dblclick', reset);
      const resetButton = button('reset', icon('reset'));
      resetButton.addEventListener('click', reset);
      this.resetButtons.push(resetButton);
      label.className = 'slider-label';
      value.className = 'slider-value';
      r.append(label, slider, value, resetButton);
      return r;
    };
    // Two-way choice shown as a segmented control
    const segmented = (label: HTMLElement, buttons: HTMLButtonElement[],
      get: () => boolean, set: (v: boolean) => void) => {
      const r = document.createElement('div');
      r.className = 'seg-row';
      label.className = 'slider-label';
      const group = document.createElement('div');
      group.className = 'segmented';
      for (const v of [false, true]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.addEventListener('click', () => {
          if (get() === v) return;
          set(v);
          this.orbitalChanged();
        });
        buttons.push(b);
        group.append(b);
      }
      r.append(label, group);
      return r;
    };
    this.sectionRows.append(
      this.planeLabel,
      row(this.offsetLabel, this.offsetSlider, this.offsetValue, -1, 1, 0.005,
        () => this.sectionOffset, (v) => (this.sectionOffset = v)),
    );
    this.sectionPanel.append(
      this.sectionRows,
      row(this.gainLabel, this.gainSlider, this.gainValue, -2, 2, 0.05,
        () => this.gain, (v) => (this.gain = v)),
      segmented(this.scaleLabel, this.scaleButtons, () => this.commonScale,
        (v) => (this.commonScale = v)),
    );
  }

  /**
   * Web addition: put the controls and the section panel into `target` (wide-screen sidebar),
   * or back into their original place below the orbital when `target` is null.
   */
  placePanels(target: HTMLElement | null): void {
    if (target) target.append(this.controls, this.sectionPanel);
    else {
      this.root.insertBefore(this.panelBar, this.bottomSpacer);
      this.root.insertBefore(this.sectionPanel, this.bottomSpacer);
      this.root.insertBefore(this.controls, this.bottomSpacer);
    }
  }

  /** Called by the app with the plane description, which depends on the camera. */
  setPlaneLabel(text: string): void {
    if (this.planeLabel.textContent !== text) this.planeLabel.textContent = text;
    if (this.planeText !== text) {
      this.planeText = text;
      this.updateSummary();
    }
  }

  setMaximumRadius(rmax: number): void {
    this.rmax = rmax;
    this.updateCaptions();
  }

  private updateSummary(): void {
    const T = EDU[this.lang];
    const g = Math.pow(10, this.gain);
    const gain = `×${g < 1 ? g.toFixed(2) : g < 10 ? g.toFixed(1) : Math.round(g)}`;
    const parts = this.section && this.planeText ? [this.planeText, gain]
      : [`${T.sectionGain} ${gain}`, T.scaleOptions[this.commonScale ? 1 : 0]];
    this.panelBarSummary.textContent = parts.join(' · ');
  }

  private updateCaptions(): void {
    const T = EDU[this.lang];
    this.root.classList.toggle('panel-open', this.panelOpen);
    this.panelBar.setAttribute('aria-expanded', String(this.panelOpen));
    this.panelBar.title = T.panelTitle;
    this.panelBarChevron.textContent = this.panelOpen ? '▾' : '▸';
    this.panelBarTitle.innerHTML = `${icon('tune')}<span>${T.panelTitle}</span>`;
    this.updateSummary();
    this.sectionChanger.innerHTML = this.section ? icon('cut') : icon('layers');
    this.sectionCaption.innerHTML = this.section
      ? `${T.section}<small>${T.sectionSub}</small>`
      : `${T.projection}<small>${T.projectionSub}</small>`;
    this.sectionRows.classList.toggle('hidden', !this.section);
    this.scaleLabel.textContent = T.scaleLabel;
    T.scaleOptions.forEach((t, i) => {
      this.scaleButtons[i].textContent = t;
      this.scaleButtons[i].classList.toggle('active', this.commonScale === (i === 1));
    });
    this.offsetLabel.textContent = T.sectionOffset;
    this.gainLabel.textContent = T.sectionGain;
    this.offsetValue.textContent = `${(this.sectionOffset * this.rmax).toFixed(1)} a₀`;
    const g = Math.pow(10, this.gain);
    const T2 = EDU[this.lang];
    [this.sectionOffset, this.gain].forEach((v, i) => {
      const b = this.resetButtons[i];
      if (!b) return;
      b.disabled = v === 0;
      b.title = T2.resetDefault;
      b.setAttribute('aria-label', T2.resetDefault);
    });
    this.gainValue.textContent = `×${g < 1 ? g.toFixed(2) : g < 10 ? g.toFixed(1) : Math.round(g)}`;
    this.rcCaption.innerHTML = this.real
      ? `${T.real}<small>${T.realSub}</small>`
      : `${T.complex}<small>${T.complexSub}</small>`;
    this.colorCaption.textContent = this.color ? T.colorMode : T.monoMode;
    this.pauseCaption.innerHTML = (this.pauseTime === 0 ? T.running : T.paused) +
      (this.color ? '' : `<small>${T.timeMonoNote}</small>`);
    this.pauseCaption.classList.toggle('dim', !this.color);
  }

  private setButtonTint(): void {
    const { qN, qL, qM } = this;
    this.nChanger.setUpTint(qN === MAX_N ? COLOR_DARK : COLOR_BRIGHT);
    this.nChanger.setDownTint(qN === 1 ? COLOR_DARK : qN <= qL + 1 ? COLOR_DIM : COLOR_BRIGHT);
    this.lChanger.setUpTint(qL === MAX_N - 1 ? COLOR_DARK : qL >= qN - 1 ? COLOR_DIM : COLOR_BRIGHT);
    this.lChanger.setDownTint(qL === 0 ? COLOR_DARK : qL <= Math.abs(qM) ? COLOR_DIM : COLOR_BRIGHT);
    this.mChanger.setUpTint(qM === MAX_N - 1 ? COLOR_DARK : qM >= qL ? COLOR_DIM : COLOR_BRIGHT);
    this.mChanger.setDownTint(
      qM === 1 - MAX_N ? COLOR_DARK : qM <= -qL ? COLOR_DIM : COLOR_BRIGHT,
    );
    this.rcChanger.style.color = qM === 0 ? COLOR_DIM : COLOR_BRIGHT;
    this.pauseChanger.style.color = this.color ? COLOR_BRIGHT : COLOR_DIM;
  }

  private setOrbitalName(): void {
    this.orbitalName.innerHTML = `<span>${orbitalNameHtml(this)}</span>`;
  }
}

export function orbitalNameHtml(o: { qN: number; qL: number; qM: number; real: boolean }): string {
  {
    const { qN, qL, qM, real } = o;
    let name = String(qN);
    let subscript: string;
    if (real) {
      subscript = (qM > 0 ? PLUS_MINUS : qM < 0 ? MINUS_PLUS : '') + Math.abs(qM);
    } else {
      subscript = String(qM);
    }
    const pick = (table: Record<number, string>) => {
      if (real && table[qM] !== undefined) subscript = table[qM];
    };
    switch (qL) {
      case 0:
        name += 's';
        subscript = '';
        break;
      case 1:
        name += 'p';
        pick({ [-1]: 'y', 0: 'z', 1: 'x' });
        break;
      case 2:
        name += 'd';
        pick({ [-2]: 'xy', [-1]: 'yz', 0: 'z' + ss(2), 1: 'xz', 2: 'x' + ss(2) + '-y' + ss(2) });
        break;
      case 3:
        name += 'f';
        pick({
          [-3]: 'y(3x' + ss(2) + '-y' + ss(2) + ')',
          [-2]: 'xyz',
          [-1]: 'yz' + ss(2),
          0: 'z' + ss(3),
          1: 'xz' + ss(2),
          2: 'z(x' + ss(2) + '-y' + ss(2) + ')',
          3: 'x(x' + ss(2) + '-3y' + ss(2) + ')',
        });
        break;
      case 4:
        name += 'g';
        pick({
          [-4]: 'xy(x' + ss(2) + '-y' + ss(2) + ')',
          [-3]: 'zy' + ss(3),
          [-2]: 'z' + ss(2) + 'xy',
          [-1]: 'z' + ss(3) + 'y',
          0: 'z' + ss(4),
          1: 'z' + ss(3) + 'x',
          2: 'z' + ss(2) + '(x' + ss(2) + '-y' + ss(2) + ')',
          3: 'zx' + ss(3),
          4: 'x' + ss(4) + '+y' + ss(4),
        });
        break;
      default:
        name += 'fghiklmno'[qL - 3] ?? String(qL);
    }
    return `${name}<sub>${subscript}</sub>`;
  }
}
