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
          ? `磁気量子数 m = ±${am}: 実関数は m = +${am} と −${am} の重ね合わせなので、角運動量の z 成分は確定しない`
          : `磁気量子数 m = ${o.m}: 角運動量の z 成分`,
      ],
      wf: '波動関数',
      wfNote: o.real
        ? '実関数(ℝ): 化学結合の議論で使う形。ψ は実数なので、色は符号 (+/−) の 2 色になる。'
        : '複素関数(ℂ): L² と L<sub>z</sub> の同時固有関数。位相 e<sup>imφ</sup> が z 軸の周りで m 回まわる。',
      rad: '動径部分: 電子は核からどの距離にいるか',
      radRows: [
        `<b>${rnl}(r)</b>(動径波動関数): ψ のうち核からの距離 r だけに依存する部分。符号が変わる点が動径節で、この軌道では ${nr} 個` +
          (nr ? `(r = ${nodeList} a₀)` : '') + '。核の近くでは R ∝ r<sup>l</sup> となり、' +
          (o.l === 0
            ? 's 軌道 (l = 0) では核の位置でも 0 にならない。'
            : `l = ${o.l} では核の位置で 0 になる(角運動量による遠心力の項 l(l+1)/2r² が電子を核から遠ざける)。`),
        `<b>${rnl}(r)²</b>: ある方向に沿った 1 点あたりの確率密度。|ψ|² = ${rnl}² |Y|² なので、方向を固定すれば |ψ|² は ${rnl}² に比例する。` +
          (o.l === 0
            ? '最大は核の位置 (r = 0)。1 点ごとに比べれば、電子が最も見出されやすい点は核そのもの。'
            : 'r = 0 では 0 で、核から離れたところで最大になる。'),
        `<b>D(r) = r²${rnl}(r)²</b>(動径分布関数): 核からの距離が r と r + dr の間の薄い球殻(方向は問わない)に電子が見出される確率が D(r) dr で、∫D(r) dr = 1。` +
          '球殻の体積 4πr² dr は r とともに大きくなるので、1 点あたりの密度 R² が減っていっても、点の数の増加と掛け合わさって核から離れた距離に山ができる。' +
          `この軌道の D(r) は n − l = ${rf.peaks} 個の山を持ち、最も見出されやすい距離(最確半径)は r<sub>mp</sub> = ${fmt(rf.rmp)} a₀ (${fmt(rf.rmp * BOHR_NM)} nm)、平均は ⟨r⟩ = ${fmt(rmean)} a₀。` +
          (o.l === o.n - 1 ? `l = n − 1 の軌道では r<sub>mp</sub> = n² a₀ となり、ボーア模型の軌道半径と一致する。` : ''),
        'なぜその距離か: 電子の分布は、核のクーロン引力(核に近いほどポテンシャルエネルギーが下がる)と運動エネルギー(狭い領域に閉じ込めるほど不確定性原理により大きくなる)の釣り合いで決まるため、核に落ち込まず有限の広がりを持つ。n が大きいほどエネルギーが高く、遠くまで広がる(大きさはおよそ n² に比例)。' +
          (nr > 0
            ? '内側の小さな山は、電子が核の近くまで入り込む「貫入」を表す。同じ n でも l が小さいほど貫入が大きく、多電子原子では内側の電子による遮蔽を受けにくいためエネルギーが低くなる(例: 2s < 2p)。'
            : ''),
        '横軸は核からの距離 r(a₀ 単位。水素原子 Z = 1 なので Zr/a₀ と同じ)、範囲は表示範囲 R<sub>max</sub> まで。',
      ],
      energy: 'エネルギー',
      energyRow: `E<sub>${o.n}</sub> = −13.6 eV / ${o.n}² = ${fmt(E)} eV(水素原子では l, m によらず、縮退度 n² = ${o.n * o.n})`,
      am: '角運動量',
      amRow: `|L| = √(l(l+1)) ħ = ${Lstr} ħ、` +
        (o.real && o.m !== 0 ? 'L<sub>z</sub> は確定しない' : `L<sub>z</sub> = mħ = ${o.m} ħ`),
      cur: '確率流',
      curRow: !o.real && o.m !== 0
        ? `j = (ħ/μ) Im(ψ*∇ψ) = (mħ/μ) |ψ|² / (r sin θ) φ̂。この軌道では z 軸の周りを${o.m > 0 ? '反時計回り' : '時計回り'}(+z 側から見て)に流れ、時間変化しない(定常電流)。z 軸上と節では 0。向きは L<sub>z</sub> = mħ の符号と対応する。`
        : `j = (ħ/μ) Im(ψ*∇ψ) = 0。${o.real ? '実関数は +m と −m の流れが打ち消し合った定在波なので、確率の流れがない。' : 'm = 0 では φ 方向に位相が変化しないので、流れがない。'}`,
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
        '明るさ: 確率密度 |ψ|² の視線積算 N = ∫|ψ|² ds を 1 − e<sup>−bN</sup> で圧縮したもの。標準の「全軌道共通」では全軌道で同じ b(2p 軌道の値)を使うので、異なる軌道どうしで明るさを比較できる。「軌道ごと」にすると b が軌道ごとに調整され、大きな軌道も見やすくなるが、軌道間の比較はできない。モノクロ表示はこの明るさだけを表示する。',
        '色: 位相 arg ψ(視線上で |ψ|² の重み付き平均)。視線上で位相が打ち消し合うところは白っぽくなる。',
        '色の流れる向きは位相速度で、エネルギーの基準(ここでは電離極限 = 0)の取り方に依存する。複素関数 (m > 0) の確率の流れ(+φ 向き)とは逆向きに見える。単一の定常状態では全体の位相は観測できないので、色の流れは電子の運動を表さない(電子の確率の流れは「確率流」の項を参照)。',
        '断面表示(はさみのボタン): 画面に平行な平面上の ψ の値を表示する。明るさは確率密度 |ψ|²、色は位相で、節 (ψ = 0) が暗い線として直接見える。ダブルタップで xy・yz・zx 平面に揃い、スライダーで平面を前後に動かせる。',
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
      rad: 'Radial part: how far is the electron from the nucleus?',
      radRows: [
        `<b>${rnl}(r)</b> (radial wave function): the part of ψ that depends only on the distance r from the nucleus. It changes sign at the radial nodes; this orbital has ${nr}` +
          (nr ? ` (r = ${nodeList} a₀)` : '') + '. Near the nucleus R ∝ r<sup>l</sup>, so ' +
          (o.l === 0
            ? 'an s orbital (l = 0) does not vanish at the nucleus.'
            : `with l = ${o.l} it vanishes at the nucleus (the centrifugal term l(l+1)/2r² of the angular momentum keeps the electron away).`),
        `<b>${rnl}(r)²</b>: the probability density per point along a fixed direction. Since |ψ|² = ${rnl}² |Y|², along any fixed direction |ψ|² is proportional to ${rnl}².` +
          (o.l === 0
            ? ' Its maximum is at the nucleus (r = 0): point by point, the most likely place to find the electron is the nucleus itself.'
            : ' It is zero at r = 0 and peaks away from the nucleus.'),
        `<b>D(r) = r²${rnl}(r)²</b> (radial distribution function): D(r) dr is the probability of finding the electron in the thin spherical shell between r and r + dr, in any direction; ∫D(r) dr = 1. ` +
          'The volume of the shell, 4πr² dr, grows with r, so even while the density per point R² decreases, the growing number of points makes D peak away from the nucleus. ' +
          `Here D(r) has n − l = ${rf.peaks} peak${rf.peaks > 1 ? 's' : ''}; the most probable distance is r<sub>mp</sub> = ${fmt(rf.rmp)} a₀ (${fmt(rf.rmp * BOHR_NM)} nm) and the mean is ⟨r⟩ = ${fmt(rmean)} a₀.` +
          (o.l === o.n - 1 ? ' For l = n − 1, r<sub>mp</sub> = n² a₀, the orbit radius of the Bohr model.' : ''),
        'Why this distance: the distribution is a balance between the Coulomb attraction (the potential energy is lower closer to the nucleus) and the kinetic energy (which, by the uncertainty principle, grows as the electron is confined to a smaller region), so the electron does not fall into the nucleus but spreads over a finite size. Larger n means higher energy and a wider spread (the size grows roughly as n²).' +
          (nr > 0
            ? ' The small inner peaks show penetration: the electron gets close to the nucleus. For the same n, smaller l penetrates more; in many-electron atoms this reduces shielding by inner electrons and lowers the energy (e.g. 2s < 2p).'
            : ''),
        'Horizontal axis: distance r from the nucleus in units of a₀ (Z = 1 for hydrogen, so this equals Zr/a₀), up to the display range R<sub>max</sub>.',
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
      size: 'Size',
      sizeRow: `Mean radius ⟨r⟩ = (3n² − l(l+1))/2 a₀ = ${fmt(meanRadius(o.n, o.l))} a₀ (${fmt(meanRadius(o.n, o.l) * BOHR_NM)} nm). Display range R<sub>max</sub> = ${fmt(rmax)} a₀. a₀ = 0.0529 nm (Bohr radius)`,
      time: 'Time evolution',
      timeRow: `ψ(t) = ψ e<sup>−iE<sub>n</sub>t/ħ</sup>. In a stationary state the probability density |ψ|² does not change; only the overall phase rotates. The real period h/|E<sub>n</sub>| = ${sci(realPeriod)} s is shown slowed down to ${o.n * o.n} s (about 3×10<sup>15</sup> times).`,
      read: 'How to read the image',
      readRows: [
        'Each pixel shows a value accumulated along its line of sight: a projection, like an X-ray image, not a cross-section or an isosurface.',
        'Brightness: the column probability density N = ∫|ψ|² ds, compressed as 1 − e<sup>−bN</sup>. By default ("Common") the same b (that of 2p) is used for every orbital, so brightness can be compared between orbitals. "Per orbital" adjusts b for each orbital, which makes large orbitals easier to see but prevents comparison. Mono mode shows only this brightness.',
        'Colour: the phase arg ψ (averaged along the line of sight, weighted by |ψ|²). Where phases cancel along the line of sight the colour turns pale.',
        'The direction in which colours flow is a phase velocity, which depends on the choice of zero energy (here the ionisation limit). For complex orbitals with m > 0 it runs opposite to the probability current (+φ). The overall phase of a single stationary state is not observable, so the colour flow does not show the electron\'s motion (see Probability current for the actual flow).',
        'Cross-section view (scissors button): shows ψ on a plane parallel to the screen. Brightness is the probability density |ψ|², colour is the phase, and nodes (ψ = 0) appear directly as dark lines. Double tap to align with the xy, yz or zx plane, and use the slider to move the plane back and forth.',
      ],
    };

  const li = (rows: string[]) => `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  return `
<h2 class="info-name">${nameHtml}<span class="info-basis">${o.real ? 'ℝ' : 'ℂ'}</span></h2>
<h3>${t.qn}</h3>${li(t.qnRows)}
<h3>${t.wf}</h3><p class="formula">${psi}</p><p>${t.wfNote}</p>
<h3>${t.rad}</h3>${radialPlot}${li(t.radRows)}
<h3>${t.energy}</h3><p>${t.energyRow}</p>
<h3>${t.am}</h3><p>${t.amRow}</p>
<h3>${t.cur}</h3><p>${t.curRow}</p>
<h3>${t.nodes}</h3>${li(t.nodeRows)}
<h3>${t.size}</h3><p>${t.sizeRow}</p>
<h3>${t.time}</h3><p>${t.timeRow}</p>
<h3>${t.read}</h3>${li(t.readRows)}`;
}
