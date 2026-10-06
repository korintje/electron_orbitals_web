// Explanatory text added by the web version for educational use.
import type { Orbital } from './math';
import {
  BOHR_NM, PERIOD_N1_S, coneNodes, energyEV, meanRadius, planeNodes, radialNodes, sci,
} from './physics';
import { maximumRadius } from './math';
import { radialFacts, radialPlotSvg } from './radialplot';

type Lang = 'en' | 'ja';

const SUBSHELL = 'spdfghiklmno';

export const EDU = {
  en: {
    qn: [
      ['n', 'principal'],
      ['l', 'azimuthal'],
      ['m', 'magnetic'],
    ],
    complex: 'Complex orbital',
    complexSub: 'rotation about z (L<sub>z</sub>)',
    real: 'Real orbital',
    realSub: 'shape and direction',
    sameAtM0: 'same function for m = 0',
    colorMode: 'Phase + density',
    signMode: 'Sign + density',
    monoMode: 'Density only',
    running: 'Time: running',
    paused: 'Time: paused',
    timeMonoNote: 'colour mode only',
    menuInfo: 'About this orbital',
    legend: 'Legend',
    legendPhase: 'Colour: phase arg ψ',
    legendPhaseNote: 'average along line of sight; pale = phases cancel',
    legendSign: 'Colour: sign of ψ',
    legendSignNote: 'pale = + and − overlap',
    legendDensity: 'Brightness: <span class="nowrap">∫|ψ|² ds</span> (summed along line of sight)',
    legendUnit: 'a₀⁻²',
    legendAxis: (a0: string, nm: string) => `Axis length ${a0} a₀ (${nm} nm)`,
    projection: 'Projection',
    projectionSub: 'summed along line of sight',
    section: 'Cross-section',
    sectionSub: 'value on a plane',
    sectionOffset: 'Plane position',
    sectionGain: 'Brightness',
    resetDefault: 'Reset to default',
    panelTitle: 'Display options',
    scaleLabel: 'Scale',
    scaleOptions: ['Per orbital', 'Common'],
    viewpoint: 'View from',
    axesShow: 'Show axes',
    axesHide: 'Hide axes',
    viewFrom: (a: string) => `View along the ${a}-axis (tap again for the opposite side)`,
    planeScreen: (d: string) => `Plane parallel to the screen, ${d} a₀ from the nucleus`,
    planeAxis: (name: string, eq: string) => `${name} plane (${eq})`,
    legendSectionNote: 'dark lines = nodes (ψ = 0)',
    legendSectionDensity: 'Brightness: probability density |ψ|² on the plane',
    legendSectionUnit: 'a₀⁻³',
    legendPerOrbital: 'per-orbital scale',
    legendCommon: 'common scale (comparable)',
    prefLegend_Title: 'Show legend',
    prefLegend_Summary: 'Colour wheel, brightness scale and length scale',
  },
  ja: {
    qn: [
      ['n', '主量子数'],
      ['l', '方位量子数'],
      ['m', '磁気量子数'],
    ],
    complex: '複素軌道',
    complexSub: 'z 軸周りの回転(L<sub>z</sub>)を見る',
    real: '実軌道',
    realSub: '形と向きを見る',
    sameAtM0: 'm = 0 では同じ関数',
    colorMode: '位相＋確率密度',
    signMode: '符号＋確率密度',
    monoMode: '確率密度のみ',
    running: '時間発展: 再生中',
    paused: '時間発展: 停止中',
    timeMonoNote: 'カラー表示時のみ',
    menuInfo: 'この軌道について',
    legend: '凡例',
    legendPhase: '色: 位相 arg ψ',
    legendPhaseNote: '視線上の平均。白っぽい = 位相が打ち消し合う',
    legendSign: '色: ψ の符号',
    legendSignNote: '白っぽい = + と − が重なる',
    legendDensity: '明るさ: 確率密度の視線積算 <span class="nowrap">∫|ψ|² ds</span>',
    legendUnit: 'a₀⁻²',
    legendAxis: (a0: string, nm: string) => `軸の長さ ${a0} a₀ (${nm} nm)`,
    projection: '投影',
    projectionSub: '視線方向に積算',
    section: '断面',
    sectionSub: '平面上の値',
    sectionOffset: '断面の位置',
    sectionGain: '明るさ',
    resetDefault: '初期値に戻す',
    panelTitle: '表示の調整',
    scaleLabel: '明るさの基準',
    scaleOptions: ['軌道ごと', '全軌道共通'],
    viewpoint: '視点',
    axesShow: '座標軸を表示',
    axesHide: '座標軸を非表示',
    viewFrom: (a: string) => `${a} 軸方向から見る(もう一度押すと反対側から)`,
    planeScreen: (d: string) => `画面に平行な面(原子核から ${d} a₀)`,
    planeAxis: (name: string, eq: string) => `${name} 平面(${eq})`,
    legendSectionNote: '暗い線 = 節 (ψ = 0)',
    legendSectionDensity: '明るさ: 断面上の確率密度 |ψ|²',
    legendSectionUnit: 'a₀⁻³',
    legendPerOrbital: '軌道ごとの基準',
    legendCommon: '全軌道共通の基準(比較可)',
    prefLegend_Title: '凡例を表示',
    prefLegend_Summary: '色相環・明るさの目盛り・長さのスケール',
  },
};

/** Link from the info panel to a section of the help page (handled in main.ts) */
function helpLink(id: string, text: string): string {
  return `<a href="#${id}" class="help-link" data-help="${id}">${text}</a>`;
}

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
  const mhbar = o.m === 1 ? 'ħ' : o.m === -1 ? '−ħ' : `${String(o.m).replace('-', '−')}ħ`;
  const Y = `Y<sub>${o.l}</sub><sup>${o.m}</sup>`;
  const Rnl = `R<sub>${o.n}${o.l}</sub>(r)`;
  const P = `P<sub>${o.l}</sub><sup>${am}</sup>(cos θ)`;

  let psi: string;
  if (!o.real || o.m === 0) {
    psi = `ψ = ${Rnl} ${Y}(θ, φ) ∝ ${Rnl} ${P}${o.m !== 0 ? ` e<sup>i${o.m === 1 ? '' : o.m === -1 ? '−' : o.m}φ</sup>` : ''}`;
  } else {
    const trig = o.m > 0 ? `cos ${am === 1 ? '' : am}φ` : `sin(−${am === 1 ? '' : am}φ)`;
    psi = `ψ ∝ ${Rnl} ${P} ${trig}`;
  }

  const rf = radialFacts(o);
  const rmean = meanRadius(o.n, o.l);
  const nodeList = rf.nodes.map((r) => fmt(r, 3)).join(', ');
  const rnl = `R<sub>${o.n}${o.l}</sub>`;
  const svgR = `R<tspan baseline-shift="sub" font-size="8">${o.n}${o.l}</tspan>`;
  const radialPlot = radialPlotSvg(o, rf, ja
    ? { r: `${svgR}(r)  動径波動関数`, r2: `${svgR}(r)²`, d: `D(r) = r²${svgR}(r)²  動径分布関数`,
      rmp: `r<tspan baseline-shift="sub" font-size="7">mp</tspan> = ${fmt(rf.rmp)} a₀`, mean: '平均 ⟨r⟩', node: '動径節' }
    : { r: `${svgR}(r)  radial wave function`, r2: `${svgR}(r)²`,
      d: `D(r) = r²${svgR}(r)²  radial distribution`,
      rmp: `r<tspan baseline-shift="sub" font-size="7">mp</tspan> = ${fmt(rf.rmp)} a₀`, mean: 'mean ⟨r⟩', node: 'radial node' });

  const t = ja
    ? {
      qn: '量子数',
      qnRows: [
        `主量子数 n = ${o.n}: エネルギー準位(第 ${o.n} 殻)`,
        `方位量子数 l = ${o.l}: 軌道角運動量の大きさ(${sub} 軌道)`,
        o.real && o.m !== 0
          ? `磁気量子数 m = ±${am}: 実軌道は m = +${am} と −${am} の重ね合わせなので、角運動量の z 成分は確定しない`
          : `磁気量子数 m = ${o.m}: 角運動量の z 成分`,
      ],
      wf: '波動関数',
      wfNote: o.real
        ? o.m === 0
          ? 'm = 0 では複素軌道と実軌道は同じ関数。ψ は実数なので、色は ψ の符号 (+/−) を表す。'
          : `実軌道: 複素軌道の m = +${am} と −${am} を足し引きして実数にしたもの(化学で使う形)。L<sub>z</sub> は確定しない代わりに、ローブの向きが決まる。ψ は実数なので、色は ψ の符号 (+/−) を表す。` +
            (o.m < 0 ? `このアプリでは sin(−${am === 1 ? '' : am}φ) を使うため、教科書の式とは全体の符号が逆(+/− の色が入れ替わる。確率密度は同じ)。` : '')
        : o.m === 0
          ? 'm = 0 では複素軌道と実軌道は同じ関数。ψ は実数なので、色は ψ の符号 (+/−) を表す。'
          : `複素軌道: L² と L<sub>z</sub> の同時固有関数で、L<sub>z</sub> = ${mhbar} が確定。位相 e<sup>i${o.m === 1 ? '' : o.m === -1 ? '−' : o.m}φ</sup> が z 軸の周りを ${am} 回まわり、色はこの位相 arg ψ を表す。確率密度は z 軸の周りで回転対称。`,
      wfMore: `複素軌道と実軌道の違いは${helpLink('help-basis', 'ヘルプ「複素軌道と実軌道」')}、色と明るさが表す値は${helpLink('help-values', 'ヘルプ「表示している値」')}を参照。`,
      rad: '動径部分: 電子は核からどの距離にいるか',
      radRows: [
        `${rnl}(r): 動径節は n − l − 1 = ${nr} 個` + (nr ? `(破線、r = ${nodeList} a₀)` : '') + '。' +
          (o.l === 0 ? 's 軌道なので核の位置でも 0 にならない。' : `l = ${o.l} なので核の位置で 0 になる (R ∝ r<sup>${o.l}</sup>)。`),
        `${rnl}(r)²: ` + (o.l === 0
          ? '最大は核の位置 (r = 0)。1 点あたりで比べれば、電子が最も見出されやすい点は核そのもの。'
          : `r = ${fmt(rf.rDensityMax)} a₀ で最大。`),
        `D(r): 山は n − l = ${rf.peaks} 個。最も見出されやすい距離(最確半径)は r<sub>mp</sub> = ${fmt(rf.rmp)} a₀ (${fmt(rf.rmp * BOHR_NM)} nm)、平均は ⟨r⟩ = (3n² − l(l+1))/2 a₀ = ${fmt(rmean)} a₀ (${fmt(rmean * BOHR_NM)} nm)。` +
          (o.l === o.n - 1 ? `l = n − 1 なので r<sub>mp</sub> = n² a₀ = ${o.n * o.n} a₀ で、ボーア模型の軌道半径と一致する。` : '') +
          (nr > 0 ? `内側の ${nr} 個の小さな山は、電子が核の近くまで入り込む「貫入」を表す。` : ''),
        `横軸は 0 から表示範囲 R<sub>max</sub> = ${fmt(rmax)} a₀ まで(a₀ = 0.0529 nm、ボーア半径)。各グラフの意味と、なぜその距離になるかは${helpLink('help-radial', 'ヘルプ「動径部分のグラフ」')}を参照。`,
      ],
      energy: 'エネルギー',
      energyRow: `E<sub>${o.n}</sub> = −13.6 eV / ${o.n}² = ${fmt(E)} eV(水素原子では l, m によらず、縮退度 n² = ${o.n * o.n})`,
      am: '角運動量',
      amRow: `|L| = √(l(l+1)) ħ = ${Lstr} ħ、` +
        (o.real && o.m !== 0 ? 'L<sub>z</sub> は確定しない' : `L<sub>z</sub> = mħ = ${o.m} ħ`),
      cur: '確率流',
      curRow: !o.real && o.m !== 0
        ? `j = (ħ/μ) Im(ψ*∇ψ) = (mħ/μ) |ψ|² / (r sin θ) φ̂。この軌道では z 軸の周りを${o.m > 0 ? '反時計回り' : '時計回り'}(+z 側から見て)に流れ、時間変化しない(定常電流)。z 軸上と節では 0。向きは L<sub>z</sub> = mħ の符号と対応する。`
        : `j = (ħ/μ) Im(ψ*∇ψ) = 0。${o.real ? '実軌道は +m と −m の流れが打ち消し合った定在波なので、確率の流れがない。' : 'm = 0 では φ 方向に位相が変化しないので、流れがない。'}`,
      nodes: '節(ψ = 0 となる面)',
      nodeRows: [
        `動径方向の節(球面): n − l − 1 = ${nr} 個`,
        `角度方向の節: l = ${o.l} 個 … 円錐面 ${nc} 個(θ = 90° のものは xy 平面)` +
          (o.real ? ` + z 軸を含む平面 ${np} 個` : '') +
          (!o.real && o.m !== 0 ? '。複素軌道では |ψ| が z 軸の周りで回転対称なので節平面はなく、代わりに z 軸上で 0 になる' : ''),
      ],
      time: '時間変化',
      timeRow: `ψ(t) = ψ e<sup>−iE<sub>n</sub>t/ħ</sup>。実際の周期 h/|E<sub>n</sub>| = ${sci(realPeriod)} 秒を、ここでは ${o.n * o.n} 秒に引き伸ばして表示(約 3×10<sup>15</sup> 倍)。色の回転の意味は${helpLink('help-values', 'ヘルプ「表示している値」')}を参照。`,
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
        ? o.m === 0
          ? 'For m = 0 the complex and real orbitals are the same function. ψ is real, so the colour shows its sign (+/−).'
          : `Real orbital: the complex orbitals m = +${am} and −${am} added or subtracted to give a real function (the form used in chemistry). L<sub>z</sub> is not definite, but the lobes have a definite direction. ψ is real, so the colour shows its sign (+/−).` +
            (o.m < 0 ? ` This app uses sin(−${am === 1 ? '' : am}φ), so the overall sign is opposite to the textbook formula (the + and − colours are swapped; the density is the same).` : '')
        : o.m === 0
          ? 'For m = 0 the complex and real orbitals are the same function. ψ is real, so the colour shows its sign (+/−).'
          : `Complex orbital: a simultaneous eigenfunction of L² and L<sub>z</sub>, with definite L<sub>z</sub> = ${mhbar}. The phase e<sup>i${o.m === 1 ? '' : o.m === -1 ? '−' : o.m}φ</sup> winds ${am} time${am > 1 ? 's' : ''} around the z-axis, and the colour shows this phase arg ψ. The density is symmetric about the z-axis.`,
      wfMore: `For the difference between complex and real orbitals see ${helpLink('help-basis', 'Help: “Complex and real orbitals”')}; for what the colour and brightness show see ${helpLink('help-values', 'Help: “What the display shows”')}.`,
      rad: 'Radial part: how far is the electron from the nucleus?',
      radRows: [
        `${rnl}(r): n − l − 1 = ${nr} radial node${nr === 1 ? '' : 's'}` + (nr ? ` (dashed, r = ${nodeList} a₀)` : '') + '. ' +
          (o.l === 0 ? 'As an s orbital it does not vanish at the nucleus.' : `With l = ${o.l} it vanishes at the nucleus (R ∝ r<sup>${o.l}</sup>).`),
        `${rnl}(r)²: ` + (o.l === 0
          ? 'maximum at the nucleus (r = 0): point by point, the most likely place to find the electron is the nucleus itself.'
          : `maximum at r = ${fmt(rf.rDensityMax)} a₀.`),
        `D(r): n − l = ${rf.peaks} peak${rf.peaks > 1 ? 's' : ''}. The most probable distance is r<sub>mp</sub> = ${fmt(rf.rmp)} a₀ (${fmt(rf.rmp * BOHR_NM)} nm) and the mean is ⟨r⟩ = (3n² − l(l+1))/2 a₀ = ${fmt(rmean)} a₀ (${fmt(rmean * BOHR_NM)} nm).` +
          (o.l === o.n - 1 ? ` Since l = n − 1, r<sub>mp</sub> = n² a₀ = ${o.n * o.n} a₀, the orbit radius of the Bohr model.` : '') +
          (nr > 0 ? ` The ${nr} small inner peak${nr > 1 ? 's show' : ' shows'} penetration: the electron gets close to the nucleus.` : ''),
        `The horizontal axis runs from 0 to the display range R<sub>max</sub> = ${fmt(rmax)} a₀ (a₀ = 0.0529 nm, the Bohr radius). For what each graph means and why the electron is found at these distances, see ${helpLink('help-radial', 'Help: “Radial graphs”')}.`,
      ],
      energy: 'Energy',
      energyRow: `E<sub>${o.n}</sub> = −13.6 eV / ${o.n}² = ${fmt(E)} eV (in hydrogen independent of l and m; degeneracy n² = ${o.n * o.n})`,
      am: 'Angular momentum',
      amRow: `|L| = √(l(l+1)) ħ = ${Lstr} ħ, ` +
        (o.real && o.m !== 0 ? 'L<sub>z</sub> not definite' : `L<sub>z</sub> = mħ = ${o.m} ħ`),
      cur: 'Probability current',
      curRow: !o.real && o.m !== 0
        ? `j = (ħ/μ) Im(ψ*∇ψ) = (mħ/μ) |ψ|² / (r sin θ) φ̂. In this orbital it circulates ${o.m > 0 ? 'counter-clockwise' : 'clockwise'} around the z-axis (seen from +z) and does not change in time (a steady current). It vanishes on the z-axis and at nodes. Its sense follows the sign of L<sub>z</sub> = mħ.`
        : `j = (ħ/μ) Im(ψ*∇ψ) = 0. ${o.real ? 'A real orbital is a standing wave in which the currents of +m and −m cancel, so there is no probability current.' : 'With m = 0 the phase does not change along φ, so there is no current.'}`,
      nodes: 'Nodes (surfaces where ψ = 0)',
      nodeRows: [
        `Radial nodes (spheres): n − l − 1 = ${nr}`,
        `Angular nodes: l = ${o.l} … ${nc} cone(s) (θ = 90° is the xy-plane)` +
          (o.real ? ` + ${np} plane(s) containing the z-axis` : '') +
          (!o.real && o.m !== 0 ? '. A complex orbital has |ψ| symmetric about the z-axis, so instead of nodal planes it vanishes on the z-axis' : ''),
      ],
      time: 'Time evolution',
      timeRow: `ψ(t) = ψ e<sup>−iE<sub>n</sub>t/ħ</sup>. The real period h/|E<sub>n</sub>| = ${sci(realPeriod)} s is shown slowed down to ${o.n * o.n} s (about 3×10<sup>15</sup> times). For what the rotating colours mean, see ${helpLink('help-values', 'Help: “What the display shows”')}.`,
    };

  const li = (rows: string[]) => `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  return `
<h2 class="info-name">${nameHtml}<span class="info-basis">${o.real ? EDU[lang].real : EDU[lang].complex}</span></h2>
<h3>${t.qn}</h3>${li(t.qnRows)}
<h3>${t.wf}</h3><p class="formula">${psi}</p><p>${t.wfNote}</p><p>${t.wfMore}</p>
<h3>${t.rad}</h3>${radialPlot}${li(t.radRows)}
<h3>${t.energy}</h3><p>${t.energyRow}</p>
<h3>${t.am}</h3><p>${t.amRow}</p>
<h3>${t.cur}</h3><p>${t.curRow}</p>
<h3>${t.nodes}</h3>${li(t.nodeRows)}
<h3>${t.time}</h3><p>${t.timeRow}</p>`;
}
