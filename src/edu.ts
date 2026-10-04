// Explanatory text added by the web version for educational use.
import type { Orbital } from './math';
import {
  BOHR_NM, PERIOD_N1_S, coneNodes, energyEV, meanRadius, planeNodes, radialNodes, sci,
} from './physics';
import { maximumRadius } from './math';

type Lang = 'en' | 'ja';

const SUBSHELL = 'spdfghiklmno';

export const EDU = {
  en: {
    qn: [
      ['n', 'principal'],
      ['l', 'azimuthal'],
      ['m', 'magnetic'],
    ],
    complex: 'Complex',
    complexSub: 'definite m',
    real: 'Real',
    realSub: 'chemistry',
    colorMode: 'Phase + density',
    monoMode: 'Density |ψ|²',
    running: 'Time: running',
    paused: 'Time: paused',
    timeMonoNote: 'colour mode only',
    menuInfo: 'About this orbital',
    legend: 'Legend',
    legendPhase: 'Colour: phase arg ψ',
    legendPhaseNote: 'pale = phases cancel',
    legendSign: 'sign of ψ',
    legendDensity: 'Brightness: ∫|ψ|² ds (summed along line of sight)',
    legendUnit: 'a₀⁻²',
    legendAxis: (a0: string, nm: string) => `Axis length ${a0} a₀ (${nm} nm)`,
    prefLegend_Title: 'Show legend',
    prefLegend_Summary: 'Colour wheel, brightness scale and length scale',
  },
  ja: {
    qn: [
      ['n', '主量子数'],
      ['l', '方位量子数'],
      ['m', '磁気量子数'],
    ],
    complex: '複素関数',
    complexSub: 'm が確定',
    real: '実関数',
    realSub: '化学で使う形',
    colorMode: '位相＋確率密度',
    monoMode: '確率密度 |ψ|²',
    running: '時間発展: 再生中',
    paused: '時間発展: 停止中',
    timeMonoNote: 'カラー表示時のみ',
    menuInfo: 'この軌道について',
    legend: '凡例',
    legendPhase: '色: 位相 arg ψ',
    legendPhaseNote: '白っぽい = 位相が打ち消し合う',
    legendSign: 'ψ の符号',
    legendDensity: '明るさ: 確率密度の視線積算 ∫|ψ|² ds',
    legendUnit: 'a₀⁻²',
    legendAxis: (a0: string, nm: string) => `軸の長さ ${a0} a₀ (${nm} nm)`,
    prefLegend_Title: '凡例を表示',
    prefLegend_Summary: '色相環・明るさの目盛り・長さのスケール',
  },
};

function fmt(x: number, d = 3): string {
  return Number(x.toPrecision(d)).toString().replace('-', '−');
}

/** Body of the "About this orbital" panel. */
export function infoHtml(o: Orbital, nameHtml: string, lang: Lang): string {
  const ja = lang === 'ja';
  const sub = SUBSHELL[o.l];
  const E = energyEV(o.n);
  const rmax = maximumRadius(o.n, o.l);
  const am = Math.abs(o.m);
  const nr = radialNodes(o), nc = coneNodes(o), np = planeNodes(o);
  const L = Math.sqrt(o.l * (o.l + 1));
  const Lstr = Number.isInteger(L) ? `${L}` : `√${o.l * (o.l + 1)}`;
  const realPeriod = PERIOD_N1_S * o.n * o.n;
  const Y = `Y<sub>${o.l}</sub><sup>${o.m}</sup>`;
  const Rnl = `R<sub>${o.n}${o.l}</sub>(r)`;
  const P = `P<sub>${o.l}</sub><sup>${am}</sup>(cos θ)`;

  let psi: string;
  if (!o.real || o.m === 0) {
    psi = `ψ = ${Rnl} ${Y}(θ, φ) ∝ ${Rnl} ${P}${o.m !== 0 ? ` e<sup>i${o.m === 1 ? '' : o.m === -1 ? '−' : o.m}φ</sup>` : ''}`;
  } else {
    const trig = o.m > 0 ? `cos ${am === 1 ? '' : am}φ` : `sin(${o.m}φ)`;
    psi = `ψ ∝ ${Rnl} ${P} ${trig}`;
  }

  const t = ja
    ? {
      qn: '量子数',
      qnRows: [
        `主量子数 n = ${o.n}: エネルギー準位(第 ${o.n} 殻)`,
        `方位量子数 l = ${o.l}: 軌道角運動量の大きさ(${sub} 軌道)`,
        o.real && o.m !== 0
          ? `磁気量子数 m = ±${am}: 実関数は m = +${am} と −${am} の重ね合わせなので、角運動量の z 成分は確定しない`
          : `磁気量子数 m = ${o.m}: 角運動量の z 成分`,
      ],
      wf: '波動関数',
      wfNote: o.real
        ? '実関数(ℝ): 化学結合の議論で使う形。ψ は実数なので、色は符号 (+/−) の 2 色になる。'
        : '複素関数(ℂ): L² と L<sub>z</sub> の同時固有関数。位相 e<sup>imφ</sup> が z 軸の周りで m 回まわる。',
      energy: 'エネルギー',
      energyRow: `E<sub>${o.n}</sub> = −13.6 eV / ${o.n}² = ${fmt(E)} eV(水素原子では l, m によらず、縮退度 n² = ${o.n * o.n})`,
      am: '角運動量',
      amRow: `|L| = √(l(l+1)) ħ = ${Lstr} ħ、` +
        (o.real && o.m !== 0 ? 'L<sub>z</sub> は確定しない' : `L<sub>z</sub> = mħ = ${o.m} ħ`),
      nodes: '節(ψ = 0 となる面)',
      nodeRows: [
        `動径方向の節(球面): n − l − 1 = ${nr} 個`,
        `角度方向の節: l = ${o.l} 個 … 円錐面 ${nc} 個(θ = 90° のものは xy 平面)` +
          (o.real ? ` + z 軸を含む平面 ${np} 個` : '') +
          (!o.real && o.m !== 0 ? '。複素関数では |ψ| が z 軸の周りで回転対称なので節平面はなく、代わりに z 軸上で 0 になる' : ''),
      ],
      size: '大きさ',
      sizeRow: `平均半径 ⟨r⟩ = (3n² − l(l+1))/2 a₀ = ${fmt(meanRadius(o.n, o.l))} a₀ (${fmt(meanRadius(o.n, o.l) * BOHR_NM)} nm)。表示範囲 R<sub>max</sub> = ${fmt(rmax)} a₀。a₀ = 0.0529 nm(ボーア半径)`,
      time: '時間変化',
      timeRow: `ψ(t) = ψ e<sup>−iE<sub>n</sub>t/ħ</sup>。定常状態なので確率密度 |ψ|² は変化せず、全体の位相だけが回る。実際の周期 h/|E<sub>n</sub>| = ${sci(realPeriod)} 秒を、ここでは ${o.n * o.n} 秒に引き伸ばして表示(約 3×10<sup>15</sup> 倍)。`,
      read: '画面の読み方',
      readRows: [
        '各画素は、その視線に沿って積算した値を表す投影像(X 線写真のようなもの)で、断面図や等値面ではない。',
        '明るさ: 確率密度 |ψ|² の視線積算 N = ∫|ψ|² ds を 1 − e<sup>−bN</sup> で圧縮したもの。b は軌道ごとに調整されるため、異なる軌道どうしで明るさは比較できない。モノクロ表示はこの明るさだけを表示する。',
        '色: 位相 arg ψ(視線上で |ψ|² の重み付き平均)。視線上で位相が打ち消し合うところは白っぽくなる。',
        '色の流れる向きは位相速度で、エネルギーの基準(ここでは電離極限 = 0)の取り方に依存する。複素関数 (m > 0) の確率の流れ(+φ 向き)とは逆向きに見える。',
      ],
    }
    : {
      qn: 'Quantum numbers',
      qnRows: [
        `Principal n = ${o.n}: energy level (shell ${o.n})`,
        `Azimuthal l = ${o.l}: magnitude of the orbital angular momentum (${sub} orbital)`,
        o.real && o.m !== 0
          ? `Magnetic m = ±${am}: a real orbital mixes m = +${am} and −${am}, so the z-component of angular momentum is not definite`
          : `Magnetic m = ${o.m}: z-component of the angular momentum`,
      ],
      wf: 'Wave function',
      wfNote: o.real
        ? 'Real (ℝ): the form used for chemical bonding. ψ is real, so the colour shows only its sign (+/−).'
        : 'Complex (ℂ): a simultaneous eigenfunction of L² and L<sub>z</sub>. The phase e<sup>imφ</sup> winds m times around the z-axis.',
      energy: 'Energy',
      energyRow: `E<sub>${o.n}</sub> = −13.6 eV / ${o.n}² = ${fmt(E)} eV (in hydrogen independent of l and m; degeneracy n² = ${o.n * o.n})`,
      am: 'Angular momentum',
      amRow: `|L| = √(l(l+1)) ħ = ${Lstr} ħ, ` +
        (o.real && o.m !== 0 ? 'L<sub>z</sub> not definite' : `L<sub>z</sub> = mħ = ${o.m} ħ`),
      nodes: 'Nodes (surfaces where ψ = 0)',
      nodeRows: [
        `Radial nodes (spheres): n − l − 1 = ${nr}`,
        `Angular nodes: l = ${o.l} … ${nc} cone(s) (θ = 90° is the xy-plane)` +
          (o.real ? ` + ${np} plane(s) containing the z-axis` : '') +
          (!o.real && o.m !== 0 ? '. A complex orbital has |ψ| symmetric about the z-axis, so instead of nodal planes it vanishes on the z-axis' : ''),
      ],
      size: 'Size',
      sizeRow: `Mean radius ⟨r⟩ = (3n² − l(l+1))/2 a₀ = ${fmt(meanRadius(o.n, o.l))} a₀ (${fmt(meanRadius(o.n, o.l) * BOHR_NM)} nm). Display range R<sub>max</sub> = ${fmt(rmax)} a₀. a₀ = 0.0529 nm (Bohr radius)`,
      time: 'Time evolution',
      timeRow: `ψ(t) = ψ e<sup>−iE<sub>n</sub>t/ħ</sup>. In a stationary state the probability density |ψ|² does not change; only the overall phase rotates. The real period h/|E<sub>n</sub>| = ${sci(realPeriod)} s is shown slowed down to ${o.n * o.n} s (about 3×10<sup>15</sup> times).`,
      read: 'How to read the image',
      readRows: [
        'Each pixel shows a value accumulated along its line of sight: a projection, like an X-ray image, not a cross-section or an isosurface.',
        'Brightness: the column probability density N = ∫|ψ|² ds, compressed as 1 − e<sup>−bN</sup>. b is adjusted per orbital, so brightness cannot be compared between orbitals. Mono mode shows only this brightness.',
        'Colour: the phase arg ψ (averaged along the line of sight, weighted by |ψ|²). Where phases cancel along the line of sight the colour turns pale.',
        'The direction in which colours flow is a phase velocity, which depends on the choice of zero energy (here the ionisation limit). For complex orbitals with m > 0 it runs opposite to the probability current (+φ).',
      ],
    };

  const li = (rows: string[]) => `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  return `
<h2 class="info-name">${nameHtml}<span class="info-basis">${o.real ? 'ℝ' : 'ℂ'}</span></h2>
<h3>${t.qn}</h3>${li(t.qnRows)}
<h3>${t.wf}</h3><p class="formula">${psi}</p><p>${t.wfNote}</p>
<h3>${t.energy}</h3><p>${t.energyRow}</p>
<h3>${t.am}</h3><p>${t.amRow}</p>
<h3>${t.nodes}</h3>${li(t.nodeRows)}
<h3>${t.size}</h3><p>${t.sizeRow}</p>
<h3>${t.time}</h3><p>${t.timeRow}</p>
<h3>${t.read}</h3>${li(t.readRows)}`;
}
