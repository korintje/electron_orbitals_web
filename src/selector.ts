// Port of OrbitalSelector + ValueChanger.
import { MAX_N, type Orbital } from './math';
import { icon } from './icons';
import { strings } from './i18n';

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

  constructor() {
    this.root.className = 'value-changer';
    this.value.className = 'value';
    this.root.append(this.up, this.value, this.down);
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
  real = false;
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

  constructor(private readonly onOrbitalChanged: (o: Orbital, pauseTime: number) => void) {
    this.root.id = 'orbital-selector';
    this.orbitalName.className = 'orbital-name';
    const controls = document.createElement('div');
    controls.className = 'controls';
    const column = document.createElement('div');
    column.className = 'button-column';
    column.append(this.rcChanger, this.colorChanger, this.pauseChanger);
    controls.append(this.nChanger.root, this.lChanger.root, this.mChanger.root, column);
    const spacer = (w: number) => {
      const s = document.createElement('div');
      s.style.flex = `${w} 1 0`;
      return s;
    };
    this.root.append(spacer(0.1), this.orbitalName, spacer(0.8), controls, spacer(0.1));

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
    on(this.pauseChanger, () => (this.pauseTime = this.pauseTime !== 0 ? 0 : Date.now()));
  }

  setLanguage(lang: 'en' | 'ja'): void {
    const s = strings(lang);
    for (const c of [this.nChanger, this.lChanger, this.mChanger]) {
      c.up.setAttribute('aria-label', s.up);
      c.down.setAttribute('aria-label', s.down);
    }
    this.rcChanger.setAttribute('aria-label', s.realComplex);
    this.colorChanger.setAttribute('aria-label', s.colormono);
    this.pauseChanger.setAttribute('aria-label', s.pause);
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
    this.pauseChanger.innerHTML = this.pauseTime === 0 ? icon('play') : icon('pause');
    this.setButtonTint();
    this.setOrbitalName();
    this.onOrbitalChanged({ n: qN, l: qL, m: qM, real, color }, this.pauseTime);
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
    const { qN, qL, qM, real } = this;
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
    this.orbitalName.innerHTML = `<span>${name}<sub>${subscript}</sub></span>`;
  }
}
