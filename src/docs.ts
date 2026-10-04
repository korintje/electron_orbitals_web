// Help and About pages (assets/docs/*.html of the original app), with a Japanese translation.

const wiki = (page: string, text: string, lang = 'en') =>
  `<a href="https://${lang}.wikipedia.org/wiki/${page}" target="_blank" rel="noopener">${text}</a>`;

const helpEn = `
<h3>How do I use this app?</h3>
<p>Electron orbitals are the states or ${wiki('Wave_function', 'wave functions')} of electrons in
atoms. Turn the orbital by moving your finger. Change the numbers to show different
orbitals. Pinch to zoom. Double tap to align the axes. Flick your finger to make it spin.
Try setting the numbers to 10, 5, and 1. Don't forget to zoom out!</p>
<p>On a computer, drag with the mouse to turn the orbital, use the mouse wheel to zoom, and
double click to align the axes.</p>
<h3>Can I use images from this app in my own work?</h3>
<p>Yes. Images from this app are in the public domain. I would appreciate it if you attributed
the images to "Electron Orbitals by Brian Johnson", and left feedback on the Google Play
Store about where you used the images.</p>
<h3>What atom or element is this?</h3>
<p>This app shows the orbitals of a Hydrogen atom.
${wiki('Atomic_orbital', 'Atomic orbitals')} are universal,
so the same shapes and patterns occur for all elements.
If an atom has more electrons, more of these states will be
${wiki('Electron_configuration', 'occupied')}.</p>
<h3>What are the numbers?</h3>
<ul>
<li>The first number, N, is the electron's ${wiki('Energy_level', 'energy level')} or shell
number.</li>
<li>The second number, <span class="l">l</span>, is the electron's
${wiki('Angular_momentum', 'orbital angular momentum')},
which determines how much the electron is rotating around the nucleus,
versus oscillating radially.</li>
<li>The third number, m, is the z-component of <span class="l">l</span> and affects how
the electron's orbit is aligned.</li>
</ul>
<h3>What's the &#x2102; or &#x211d;?</h3>
<p>This button selects which generating set or ${wiki('Basis_(linear_algebra)', 'basis')}
of orbitals to display.
The complex or &#x2102; orbitals each have a well-defined value of m,
which gives good knowledge of the electron's motion.
These states are most meaningful for an isolated atom in an external magnetic field,
and they're often studied in the context of ${wiki('Quantum_mechanics', 'quantum mechanics')}
and solutions to ${wiki('Schr%C3%B6dinger_equation', 'Schr&ouml;dinger\'s equation')}.
The real or &#x211d; orbitals are combinations of states with two opposite values of m,
which gives us more knowledge of the electron's position, but leaves its motion less certain.
These states are most meaningful when atoms ${wiki('Chemical_bond', 'bond')} with each other,
and they're often discussed in ${wiki('Chemistry', 'chemistry')}.</p>
<h3>How might real atoms' orbitals differ from what is shown here?</h3>
<p>The orbitals shown here are accurate for a hydrogen atom
(or for an ion like He<sup>+</sup> which has a single electron).
When there are multiple electrons, their mutual repulsion changes the shapes of the orbitals.
These interactions are extremely difficult to calculate.
Loosely speaking, the outer parts of orbitals expand outward due to
the inner electrons masking some of the nuclear charge,
and the orbitals' shapes get distorted slightly
so as to keep the electrons farther away from each other.</p>
<h3>What do the colors mean and why do they change?</h3>
<p>This app uses color to represent the phase or
${wiki('Complex_number#Polar_form', 'argument')}
of the electron's wave function.
The direction the color moves conveys the direction of the electron's motion.</p>
<p>In actual orbitals, the phase is constantly changing.
The rate depends on the electron's ${wiki('Binding_energy', 'binding energy')},
which is largest for the inner electrons and decreases for the outer shells.
To make this visible, time has been slowed down by a factor of 3 quadrillion
from what it would be in an actual atom.
(For comparison, the size of the atom has been enlarged
by "only" a factor of about a billion.)</p>
<h3>How to read the image (added in the web version)</h3>
<ul>
<li>The three numbers are the quantum numbers <i>n</i> (principal), <i>l</i> (azimuthal) and
<i>m</i> (magnetic). Tap &#x24d8; for details of the orbital shown: energy, angular momentum, nodes and size.</li>
<li>Each pixel adds up the orbital along its line of sight, so the image is a projection
(like an X-ray image), not a cross-section.</li>
<li>The scissors button switches to the cross-section view, which shows &psi; on a plane
parallel to the screen. Brightness is |&psi;|&sup2; on the plane and colour is the phase,
so nodes (&psi; = 0) appear as dark lines. Double tap to align the plane with the xy, yz or
zx plane. The sliders move the plane and change the brightness; double click a slider to reset it.</li>
<li>Brightness is the probability density |&psi;|&sup2; summed along the line of sight,
compressed so that it never saturates. It is scaled separately for each orbital, unless the brightness scale is set to "Common".
The palette button switches between this brightness with the phase as colour, and the
brightness alone (black and white).</li>
<li>Colour is the phase arg &psi; of the wave function (see the colour wheel in the legend).
For real (&#x211d;) orbitals there are only two colours, the sign + and &minus; of &psi;.</li>
<li>The colours flow because the phase rotates in time as e<sup>&minus;iEt/&hbar;</sup>.
The probability density itself does not change. The direction of this flow is a
phase velocity, which depends on where the zero of energy is chosen. With the zero at the
ionisation limit, as here, the colours of a complex orbital with m &gt; 0 flow opposite to
the electron's probability current. So the colour flow does not show the direction of the
electron's motion. The probability current itself can be shown as arrows (Current j).</li>
<li>Current j arrows show the probability current density j = (&hbar;/&mu;) Im(&psi;*&nabla;&psi;).
For complex orbitals with m &ne; 0 it circulates around the z-axis; for real orbitals and m = 0
it is zero. In the cross-section view the arrows show j on the plane (&#x2299; toward you,
&#x2297; away from you); in the projection view they show j summed along the line of sight.</li>
</ul>
<p class="end"></p>`;

const helpJa = `
<h3>使い方</h3>
<p>電子軌道とは、原子の中の電子の状態、つまり${wiki('波動関数', '波動関数', 'ja')}のことです。
指でなぞると軌道が回転します。数字を変えると別の軌道を表示できます。
ピンチでズーム、ダブルタップで座標軸に揃え、指ではじくと回り続けます。
数字を 10、5、1 にしてみてください。ズームアウトもお忘れなく!</p>
<p>パソコンでは、マウスのドラッグで回転、マウスホイールでズーム、ダブルクリックで座標軸に揃えます。</p>
<h3>このアプリの画像を自分の作品に使ってもよいですか?</h3>
<p>はい。このアプリの画像はパブリックドメインです。
画像のクレジットを「Electron Orbitals by Brian Johnson」としていただき、
どこで画像を使ったかを Google Play ストアのフィードバックで教えていただけると幸いです。(原作者より)</p>
<h3>これは何の原子・元素ですか?</h3>
<p>このアプリは水素原子の軌道を表示しています。
${wiki('原子軌道', '原子軌道', 'ja')}は普遍的なもので、どの元素でも同じ形や模様が現れます。
電子の多い原子では、これらの状態のうちより多くが${wiki('電子配置', '占有', 'ja')}されます。</p>
<h3>数字の意味は?</h3>
<ul>
<li>1 つ目の数字 N は、電子の${wiki('エネルギー準位', 'エネルギー準位', 'ja')}(殻の番号)です。</li>
<li>2 つ目の数字 <span class="l">l</span> は、電子の${wiki('角運動量', '軌道角運動量', 'ja')}で、
電子が原子核の周りをどれだけ回転しているか(動径方向に振動しているのに対して)を決めます。</li>
<li>3 つ目の数字 m は <span class="l">l</span> の z 成分で、電子の軌道の向きに影響します。</li>
</ul>
<h3>&#x2102; や &#x211d; とは?</h3>
<p>このボタンは、表示する軌道の生成系、つまり${wiki('基底_(線型代数学)', '基底', 'ja')}を選びます。
複素数 (&#x2102;) の軌道はそれぞれ m の値が確定しており、電子の運動がよくわかります。
これらの状態は外部磁場の中の孤立した原子で最も意味を持ち、
${wiki('量子力学', '量子力学', 'ja')}や${wiki('シュレーディンガー方程式', 'シュレーディンガー方程式', 'ja')}の解の文脈でよく扱われます。
実数 (&#x211d;) の軌道は、m の値が逆符号の 2 つの状態を組み合わせたもので、
電子の位置はよりよくわかりますが、運動は不確かになります。
これらの状態は原子どうしが${wiki('化学結合', '結合', 'ja')}するときに最も意味を持ち、
${wiki('化学', '化学', 'ja')}でよく扱われます。</p>
<h3>実際の原子の軌道は、ここに表示されたものとどう違うのですか?</h3>
<p>ここに表示される軌道は、水素原子(または He<sup>+</sup> のように電子を 1 個だけ持つイオン)については正確です。
電子が複数あると、互いの反発によって軌道の形が変わります。
この相互作用を計算するのは非常に困難です。
大まかに言えば、内側の電子が原子核の電荷の一部を遮蔽するために軌道の外側の部分は外へ広がり、
電子どうしが互いに離れるように軌道の形がわずかにゆがみます。</p>
<h3>色は何を表していて、なぜ変化するのですか?</h3>
<p>このアプリでは、電子の波動関数の位相、つまり${wiki('複素数#極形式', '偏角', 'ja')}を色で表しています。
色が動く向きは、電子が運動する向きを表しています。</p>
<p>実際の軌道では、位相は絶えず変化しています。
その速さは電子の${wiki('結合エネルギー', '束縛エネルギー', 'ja')}によって決まり、
内側の電子ほど大きく、外側の殻ほど小さくなります。
これを目に見えるようにするため、時間の進み方を実際の原子の 3000 兆分の 1 に遅くしています。
(ちなみに、原子の大きさは「たった」10 億倍ほどに拡大しているだけです。)</p>
<h3>画面の読み方(Web 版で追加)</h3>
<ul>
<li>3 つの数字は量子数 <i>n</i>(主量子数)、<i>l</i>(方位量子数)、<i>m</i>(磁気量子数)です。&#x24d8; ボタンで、表示中の軌道のエネルギー・角運動量・節・大きさを確認できます。</li>
<li>各画素は視線方向に積算した値を表す投影像(X 線写真のようなもの)で、断面図ではありません。</li>
<li>はさみのボタンで断面表示に切り替わり、画面に平行な平面上の &psi; を表示します。明るさは平面上の |&psi;|&sup2;、色は位相で、節 (&psi; = 0) が暗い線として見えます。ダブルタップで xy・yz・zx 平面に揃います。スライダーで平面の位置と明るさを変えられます(ダブルクリックで元に戻ります)。</li>
<li>明るさは確率密度 |&psi;|&sup2; を視線方向に積算したもので、飽和しないように圧縮しています。標準では軌道ごとに明るさの基準が異なりますが、「明るさの基準」を「全軌道共通」にすると軌道どうしで比較できます。パレットボタンで、色付き(位相＋確率密度)と白黒(確率密度のみ)を切り替えます。</li>
<li>色は波動関数の位相 arg &psi; です(凡例の色相環を参照)。実関数 (&#x211d;) では &psi; の符号 + と &minus; の 2 色になります。</li>
<li>色が流れるのは、位相が e<sup>&minus;iEt/&hbar;</sup> で時間とともに回転するためで、確率密度そのものは変化しません。この流れの向きは位相速度で、エネルギーの基準の取り方に依存します。ここでは電離極限をエネルギー 0 としているため、m &gt; 0 の複素関数では電子の確率の流れと逆向きに見えます。原作のヘルプにある「色の動く向き = 電子の運動の向き」は、厳密にはこの意味で注意が必要です。電子の確率の流れは「確率流 j」の矢印で表示できます。</li>
<li>「確率流 j」の矢印は確率流密度 j = (&hbar;/&mu;) Im(&psi;*&nabla;&psi;) を表します。m &ne; 0 の複素関数では z 軸の周りを回り、実関数と m = 0 では 0 です。断面表示では平面上の j(&#x2299; 手前向き、&#x2297; 奥向き)、投影表示では視線方向に積算した j を表示します。</li>
</ul>
<p class="end"></p>`;

const source = 'https://github.com/bjthinks/android-orbital-explorer';
const webSource = 'https://github.com/korintje/electron_orbitals_web';
const link = (u: string) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`;

const about = (ja: boolean) => `
<h2>Electron Orbitals 1.7c</h2>
<h3>Design &amp; Programming</h3>
<h4>Brian Johnson</h4>
<h3>Special Thanks</h3>
<h4>Marissa Anderson</h4>
<h4>Paul Berry</h4>
<h4>Steuard Jensen</h4>
<h4>Chad Versace</h4>
<h3>Source Code</h3>
<h4>${link(source)}</h4>
<h3>${ja ? 'Web 版' : 'Web Version'}</h3>
<h4>${ja ? '移植' : 'Ported by'}: korintje</h4>
<h4>${link(webSource)}</h4>
<h4 class="end">GNU General Public License v3.0</h4>`;

export function helpHtml(lang: 'en' | 'ja'): string {
  // Source line breaks would otherwise render as spaces between Japanese sentences.
  return lang === 'ja' ? helpJa.replace(/\n(?!<)/g, '') : helpEn;
}

export function aboutHtml(lang: 'en' | 'ja'): string {
  return about(lang === 'ja');
}
