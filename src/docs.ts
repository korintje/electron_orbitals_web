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
<h3 id="help-read">How to read the image (added in the web version)</h3>
<ul>
<li>The three numbers are the quantum numbers <i>n</i> (principal), <i>l</i> (azimuthal) and
<i>m</i> (magnetic). Tap &#x24d8; for details of the orbital shown: its wave function, radial graphs,
energy, angular momentum, nodes and time scale.</li>
<li>The &#x2102; / &#x211d; button switches between complex orbitals (definite m) and real orbitals
(p<sub>x</sub>, d<sub>xy</sub>, &hellip;). See &ldquo;Complex and real orbitals&rdquo; below.</li>
<li>The palette button switches between colour (the phase of a complex orbital, or the sign of a
real orbital) and black and white (density only). The brightness is the same in both.</li>
<li>The layers / scissors button switches between the projection (each pixel sums the orbital
along its line of sight, like an X-ray image) and the cross-section (&psi; on a plane parallel to
the screen; double tap to align with the xy, yz or zx plane). The sliders move the plane and
change the brightness; double click a slider to reset it.</li>
<li>What exactly the brightness and colours show is explained in &ldquo;What the display shows&rdquo; below.</li>
</ul>
<h3 id="help-values">What the display shows (added in the web version)</h3>
<div class="table-wrap"><table>
<tr><th></th><th>Projection</th><th>Cross-section</th></tr>
<tr><th>Brightness</th><td>N = &int;|&psi;|&sup2; ds [a<sub>0</sub><sup>&minus;2</sup>]<br>probability density summed along the line of sight</td><td>|&psi;|&sup2; [a<sub>0</sub><sup>&minus;3</sup>]<br>probability density on the plane</td></tr>
<tr><th>Colour, complex orbital</th><td>phase of &int;|&psi;|&psi; ds<br>(|&psi;|&sup2;-weighted average phase)</td><td>phase arg &psi;</td></tr>
<tr><th>Colour, real orbital</th><td>sign of &int;|&psi;|&psi; ds<br>(the dominant sign)</td><td>sign of &psi; (+/&minus;)</td></tr>
</table></div>
<ul>
<li><b>Brightness</b> is the probability density. It is compressed as 1 &minus; e<sup>&minus;bN</sup> so that it
never saturates; the legend shows the scale. By default the brightness scale is &ldquo;Per orbital&rdquo;:
b is adjusted for each orbital so that large orbitals are also easy to see, but brightness cannot be
compared between orbitals. &ldquo;Common&rdquo; uses the same b (that of 2p) for every orbital, so brightness
can be compared. Black and white mode shows only this brightness.</li>
<li><b>Colour of a complex orbital</b> is the phase arg &psi; of the wave function (see the colour wheel in
the legend). The colour at one point has no meaning by itself: multiplying &psi; by a constant phase
(as time evolution does) changes every colour but not the state. What is meaningful is how the
colour changes in space: it winds m times around the z-axis, which corresponds to
L<sub>z</sub> = m&hbar;, and its gradient gives the probability current
j = (&hbar;/&mu;)|&psi;|&sup2;&nabla;arg &psi;.</li>
<li><b>Colour of a real orbital</b> is the sign of &psi;: two colours on opposite sides of the colour wheel,
marked + and &minus; in the legend. This is the &ldquo;phase of the lobes&rdquo; drawn in two colours in chemistry
textbooks. The relative sign of the lobes is meaningful (it decides whether the overlap with another
orbital is bonding or antibonding), but the overall sign is not: &minus;&psi; is the same state.
This app follows the original in leaving out the Condon&ndash;Shortley phase, and real orbitals with
m &lt; 0 use sin(m&phi;) = &minus;sin(|m|&phi;), so their sign is opposite to the usual textbook formulas
(e.g. &minus;p<sub>y</sub>, &minus;d<sub>xy</sub>). The density is not affected.</li>
<li>In the projection the colour is the average along the line of sight, weighted by |&psi;|&sup2;.
Where different phases (or + and &minus;) overlap along the line of sight they cancel and the colour turns
pale; the saturation shows how well the phases agree. In the cross-section there is no averaging, and
nodes (&psi; = 0) appear as dark lines.</li>
<li><b>Time evolution</b>: a stationary state evolves as &psi;(t) = &psi; e<sup>&minus;iEt/&hbar;</sup>. Only the overall
phase rotates, so the colours rotate around the colour wheel (for a real orbital the + and &minus; colours
rotate together) while the probability density does not change. The direction of this flow is a phase
velocity, which depends on where the zero of energy is chosen. With the zero at the ionisation limit, as
here, the colours of a complex orbital with m &gt; 0 flow opposite to the electron's probability current.
So the colour flow does not show the direction of the electron's motion; the actual probability current
is described in the &#x24d8; panel.</li>
</ul>
<h3 id="help-basis">Complex and real orbitals (added in the web version)</h3>
<p>The states with the same n and l (for example the three 2p states) all have the same energy, and they
can be described by two different sets of functions. Both are eigenfunctions of the energy and of
L&sup2;; they differ in whether L<sub>z</sub> is definite.</p>
<div class="table-wrap"><table>
<tr><th></th><th>Complex orbitals (&#x2102;)</th><th>Real orbitals (&#x211d;)</th></tr>
<tr><th>2p example</th><td>p<sub>+1</sub> &prop; (x + iy), p<sub>0</sub> &prop; z, p<sub>&minus;1</sub> &prop; (x &minus; iy)</td><td>p<sub>x</sub> &prop; x, p<sub>y</sub> &prop; y, p<sub>z</sub> &prop; z</td></tr>
<tr><th>Definite</th><td>L<sub>z</sub> = m&hbar;</td><td>direction of the lobes</td></tr>
<tr><th>Probability current</th><td>circulates around the z-axis</td><td>zero (standing wave)</td></tr>
<tr><th>Density</th><td>symmetric about the z-axis</td><td>lobes along x, y, z, &hellip;</td></tr>
<tr><th>Colour</th><td>phase; winds m times around z</td><td>sign + / &minus;</td></tr>
<tr><th>Used in</th><td>atomic physics (magnetic fields, spectroscopy, angular momentum)</td><td>chemistry (bonds, molecular orbitals, crystal fields)</td></tr>
</table></div>
<ul>
<li>A real orbital is a sum or difference of the complex orbitals with +m and &minus;m, for example
p<sub>x</sub> = (p<sub>+1</sub> + p<sub>&minus;1</sub>)/&radic;2 and
p<sub>y</sub> = (p<sub>+1</sub> &minus; p<sub>&minus;1</sub>)/(i&radic;2). The imaginary parts cancel, leaving a real
function. In the &#x211d; mode the m number is shown with &plusmn; (&plusmn;|m| for cos, &#x2213;|m| for sin), because L<sub>z</sub> is not definite.</li>
<li>Measuring L<sub>z</sub> in a real orbital gives +|m|&hbar; or &minus;|m|&hbar; with equal probability. In return,
the lobes point in definite directions, which is what is needed to discuss the direction of chemical bonds.</li>
<li>For m = 0 the two are the same function.</li>
<li>Because the states are degenerate, every function of either set is an equally valid stationary state
of the hydrogen atom. Neither is the &ldquo;true shape&rdquo;: they are different states.</li>
</ul>
<h3 id="help-radial">Radial graphs (added in the web version)</h3>
<p>The &#x24d8; panel plots three functions of the distance r from the nucleus. The wave function
separates as &psi; = R<sub>nl</sub>(r) Y<sub>l</sub><sup>m</sup>(&theta;, &phi;), and
&int;|Y|&sup2; d&Omega; = 1.</p>
<ul>
<li><b>R<sub>nl</sub>(r)</b>, the radial wave function: the part of &psi; that depends only on r.
It changes sign at the n &minus; l &minus; 1 radial nodes (dashed lines). Near the nucleus
R &prop; r<sup>l</sup>, so only s orbitals (l = 0) are non-zero at the nucleus; for l &ge; 1 the
centrifugal term l(l+1)/2r&sup2; of the angular momentum keeps the electron away from it.</li>
<li><b>R<sub>nl</sub>(r)&sup2;</b>: the probability density per point along a fixed direction
(|&psi;|&sup2; = R&sup2; |Y|&sup2;). For s orbitals it is largest at the nucleus: point by point,
the most likely place to find an s electron is the nucleus itself.</li>
<li><b>D(r) = r&sup2;R<sub>nl</sub>(r)&sup2;</b>, the radial distribution function: D(r) dr is the
probability of finding the electron in the thin spherical shell between r and r + dr, in any
direction, and &int;D(r) dr = 1. The volume of the shell, 4&pi;r&sup2; dr, grows with r, so even
while the density per point decreases, the growing number of points makes D peak away from the
nucleus. D has n &minus; l peaks; the highest is at the most probable radius r<sub>mp</sub> (dot),
and the dotted line marks the mean radius &lang;r&rang;. For l = n &minus; 1,
r<sub>mp</sub> = n&sup2; a<sub>0</sub>, the orbit radius of the Bohr model.</li>
<li>Why these distances: the distribution is a balance between the Coulomb attraction (the
potential energy is lower closer to the nucleus) and the kinetic energy (which, by the
uncertainty principle, grows as the electron is confined to a smaller region), so the electron
neither falls into the nucleus nor flies away. Larger n means higher energy and a wider spread
(the size grows roughly as n&sup2;).</li>
<li>Penetration: the small inner peaks of D show the electron getting close to the nucleus.
For the same n, smaller l penetrates more; in many-electron atoms such electrons are less
shielded by inner electrons, which lowers their energy (e.g. 2s &lt; 2p).</li>
<li>The horizontal axis is r in units of the Bohr radius a<sub>0</sub> = 0.0529 nm (for hydrogen
Z = 1, so this equals Zr/a<sub>0</sub>), up to the display range R<sub>max</sub>.</li>
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
複素軌道 (&#x2102;) はそれぞれ m の値が確定しており、電子の運動がよくわかります。
これらの状態は外部磁場の中の孤立した原子で最も意味を持ち、
${wiki('量子力学', '量子力学', 'ja')}や${wiki('シュレーディンガー方程式', 'シュレーディンガー方程式', 'ja')}の解の文脈でよく扱われます。
実軌道 (&#x211d;) は、m の値が逆符号の 2 つの状態を組み合わせたもので、
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
<h3 id="help-read">画面の読み方(Web 版で追加)</h3>
<ul>
<li>3 つの数字は量子数 <i>n</i>(主量子数)、<i>l</i>(方位量子数)、<i>m</i>(磁気量子数)です。&#x24d8; ボタンで、表示中の軌道の波動関数・動径部分のグラフ・エネルギー・角運動量・節・時間の尺度を確認できます。</li>
<li>&#x2102; / &#x211d; ボタンで、複素軌道(m が確定)と実軌道(p<sub>x</sub>, d<sub>xy</sub> など)を切り替えます。下の「複素軌道と実軌道」を参照してください。</li>
<li>パレットのボタンで、色あり(複素軌道では位相、実軌道では符号)と白黒(確率密度のみ)を切り替えます。明るさはどちらも同じです。</li>
<li>レイヤー/はさみのボタンで、投影(各画素は視線に沿って足し合わせた値。X 線写真のようなもの)と断面(画面に平行な平面上の &psi;。ダブルタップで xy・yz・zx 平面に揃う)を切り替えます。スライダーで平面の位置と明るさを変えられます(ダブルクリックで元に戻ります)。</li>
<li>明るさと色が何の値を表すかは、下の「表示している値」を参照してください。</li>
</ul>
<h3 id="help-values">表示している値(Web 版で追加)</h3>
<div class="table-wrap"><table>
<tr><th></th><th>投影</th><th>断面</th></tr>
<tr><th>明るさ</th><td>N = &int;|&psi;|&sup2; ds [a<sub>0</sub><sup>&minus;2</sup>]<br>視線に沿って積分した確率密度</td><td>|&psi;|&sup2; [a<sub>0</sub><sup>&minus;3</sup>]<br>平面上の確率密度</td></tr>
<tr><th>色(複素軌道)</th><td>&int;|&psi;|&psi; ds の位相<br>(|&psi;|&sup2; で重み付けした平均の位相)</td><td>位相 arg &psi;</td></tr>
<tr><th>色(実軌道)</th><td>&int;|&psi;|&psi; ds の符号<br>(視線上で優勢な符号)</td><td>&psi; の符号 (+/&minus;)</td></tr>
</table></div>
<ul>
<li><b>明るさ</b>は確率密度です。飽和しないように 1 &minus; e<sup>&minus;bN</sup> で圧縮していて、目盛りは凡例に示しています。標準の「明るさの基準」は「軌道ごと」で、b を軌道ごとに調整するので大きな軌道も見やすくなりますが、軌道間で明るさは比較できません。「全軌道共通」にすると、全軌道で同じ b(2p 軌道の値)を使うので、軌道どうしの明るさを比較できます。白黒表示はこの明るさだけを表示します。</li>
<li><b>複素軌道の色</b>は波動関数の位相 arg &psi; です(凡例の色相環を参照)。1 点の色そのものには意味がありません。&psi; 全体に一定の位相を掛けても(時間変化がまさにそれです)すべての色が変わりますが、状態は同じだからです。意味があるのは色の空間的な変化で、z 軸の周りを m 回巻くことが L<sub>z</sub> = m&hbar; に対応し、位相の勾配が確率流 j = (&hbar;/&mu;)|&psi;|&sup2;&nabla;arg &psi; を決めます。</li>
<li><b>実軌道の色</b>は &psi; の符号で、色相環の反対側にある 2 色です(凡例の + と &minus; の印)。化学の教科書で軌道のローブを 2 色に塗り分けている「ローブの位相」と同じものです。ローブ間の相対的な符号には意味があります(他の軌道との重なりが結合性か反結合性かを決める)が、全体の符号には意味がありません(&minus;&psi; は同じ状態)。このアプリは原作どおり Condon&ndash;Shortley 位相を含まず、m &lt; 0 の実軌道は sin(m&phi;) = &minus;sin(|m|&phi;) を使うので、教科書の式とは符号が逆になります(例: &minus;p<sub>y</sub>、&minus;d<sub>xy</sub>)。確率密度には影響しません。</li>
<li>投影では、色は視線上の |&psi;|&sup2; で重み付けした平均です。視線上で異なる位相(実軌道では + と &minus;)が重なると打ち消し合って白っぽくなり、彩度は位相の揃い具合を表します。断面では平均を取らないので、節 (&psi; = 0) が暗い線として見えます。</li>
<li><b>時間変化</b>: 定常状態は &psi;(t) = &psi; e<sup>&minus;iEt/&hbar;</sup> のように変化します。回るのは全体の位相だけなので、色は色相環上を回り(実軌道では + と &minus; の 2 色が一緒に回る)、確率密度は変化しません。この流れの向きは位相速度で、エネルギーの基準の取り方に依存します。ここでは電離極限をエネルギー 0 としているため、m &gt; 0 の複素軌道では電子の確率の流れと逆向きに見えます。原作のヘルプにある「色の動く向き = 電子の運動の向き」は、厳密にはこの意味で注意が必要です。実際の確率の流れについては &#x24d8; ボタンのパネルを参照してください。</li>
</ul>
<h3 id="help-basis">複素軌道と実軌道(Web 版で追加)</h3>
<p>n と l が同じ状態(例えば 3 つの 2p 状態)はエネルギーが等しく、2 通りの関数の組で表せます。どちらもエネルギーと L&sup2; の固有関数で、違いは L<sub>z</sub> が確定しているかどうかです。</p>
<div class="table-wrap"><table>
<tr><th></th><th>複素軌道 (&#x2102;)</th><th>実軌道 (&#x211d;)</th></tr>
<tr><th>2p の例</th><td>p<sub>+1</sub> &prop; (x + iy)、p<sub>0</sub> &prop; z、p<sub>&minus;1</sub> &prop; (x &minus; iy)</td><td>p<sub>x</sub> &prop; x、p<sub>y</sub> &prop; y、p<sub>z</sub> &prop; z</td></tr>
<tr><th>確定している量</th><td>L<sub>z</sub> = m&hbar;</td><td>ローブの向き</td></tr>
<tr><th>確率流</th><td>z 軸の周りを回る</td><td>0(定在波)</td></tr>
<tr><th>確率密度の形</th><td>z 軸の周りで回転対称</td><td>x, y, z などの方向に伸びたローブ</td></tr>
<tr><th>色</th><td>位相。z 軸の周りを m 回巻く</td><td>符号 + / &minus;</td></tr>
<tr><th>主に使う場面</th><td>原子物理(磁場、分光、角運動量)</td><td>化学(結合、分子軌道、結晶場)</td></tr>
</table></div>
<ul>
<li>実軌道は、+m と &minus;m の複素軌道の和や差です。例えば p<sub>x</sub> = (p<sub>+1</sub> + p<sub>&minus;1</sub>)/&radic;2、p<sub>y</sub> = (p<sub>+1</sub> &minus; p<sub>&minus;1</sub>)/(i&radic;2) で、虚数部分が打ち消し合って実数の関数になります。&#x211d; では L<sub>z</sub> が確定しないので、m の数字を &plusmn; 付きで表示します(cos 型は &plusmn;|m|、sin 型は &#x2213;|m|)。</li>
<li>実軌道で L<sub>z</sub> を測定すると、+|m|&hbar; と &minus;|m|&hbar; が等しい確率で得られます。その代わりにローブの向きが決まるので、化学結合の方向性を議論できます。</li>
<li>m = 0 では両者は同じ関数です。</li>
<li>縮退しているので、どちらの組のどの関数も、水素原子の同じエネルギーの正当な定常状態です。どちらかが「本当の形」というわけではなく、別の状態を表しています。</li>
</ul>
<h3 id="help-radial">動径部分のグラフ(Web 版で追加)</h3>
<p>&#x24d8; ボタンのパネルでは、核からの距離 r の関数を 3 つ描いています。波動関数は &psi; = R<sub>nl</sub>(r) Y<sub>l</sub><sup>m</sup>(&theta;, &phi;) と分けられ、&int;|Y|&sup2; d&Omega; = 1 です。</p>
<ul>
<li><b>R<sub>nl</sub>(r)</b>(動径波動関数): &psi; のうち r だけに依存する部分です。n &minus; l &minus; 1 個の動径節(破線)で符号が変わります。核の近くでは R &prop; r<sup>l</sup> なので、核の位置で 0 にならないのは s 軌道 (l = 0) だけです。l &ge; 1 では、角運動量による遠心力の項 l(l+1)/2r&sup2; が電子を核から遠ざけます。</li>
<li><b>R<sub>nl</sub>(r)&sup2;</b>: 方向を固定したときの 1 点あたりの確率密度です(|&psi;|&sup2; = R&sup2; |Y|&sup2;)。s 軌道では核の位置で最大で、1 点あたりで比べれば、電子が最も見出されやすい点は核そのものです。</li>
<li><b>D(r) = r&sup2;R<sub>nl</sub>(r)&sup2;</b>(動径分布関数): 核からの距離が r と r + dr の間の薄い球殻(方向は問わない)に電子が見出される確率が D(r) dr で、&int;D(r) dr = 1 です。球殻の体積 4&pi;r&sup2; dr は r とともに大きくなるので、1 点あたりの密度が減っていっても、点の数の増加と掛け合わさって核から離れた距離に山ができます。D の山は n &minus; l 個で、最も高い山の位置が最確半径 r<sub>mp</sub>(点)、点線が平均半径 &lang;r&rang; です。l = n &minus; 1 では r<sub>mp</sub> = n&sup2; a<sub>0</sub> となり、ボーア模型の軌道半径と一致します。</li>
<li>なぜその距離か: 電子の分布は、核のクーロン引力(核に近いほどポテンシャルエネルギーが下がる)と運動エネルギー(狭い領域に閉じ込めるほど不確定性原理により大きくなる)の釣り合いで決まるため、核に落ち込むことも無限に広がることもありません。n が大きいほどエネルギーが高く、遠くまで広がります(大きさはおよそ n&sup2; に比例)。</li>
<li>貫入: D の内側の小さな山は、電子が核の近くまで入り込むことを表します。同じ n でも l が小さいほど貫入が大きく、多電子原子では内側の電子による遮蔽を受けにくいためエネルギーが低くなります(例: 2s &lt; 2p)。</li>
<li>横軸は核からの距離 r をボーア半径 a<sub>0</sub> = 0.0529 nm 単位で表したもの(水素原子は Z = 1 なので Zr/a<sub>0</sub> と同じ)で、範囲は表示範囲 R<sub>max</sub> までです。</li>
</ul>
<p class="end"></p>`;

const source = 'https://github.com/bjthinks/android-orbital-explorer';
const webSource = 'https://github.com/korintje/electron_orbitals_web';
const link = (u: string) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`;

const about = (ja: boolean) => `
<h2>Electron Orbitals Web</h2>
<p class="about-lead">${ja
    ? '水素原子の電子軌道を、位相(複素数)と時間変化を含めて GPU で描画する Web アプリです。PC とスマートフォンのブラウザで動作します。'
    : 'A web app that renders the electron orbitals of the hydrogen atom on the GPU, including their phase (complex values) and time evolution. It runs in browsers on PCs and smartphones.'}</p>
<h3>Design &amp; Programming</h3>
<h4>Takuro Hosomi</h4>
<h3>Source Code</h3>
<h4>${link(webSource)}</h4>
<h3>${ja ? 'オリジナル' : 'Original'}</h3>
<p class="about-lead">${ja
    ? 'このアプリは、Android アプリ「Electron Orbitals」(1.7c)を Web に移植し、教育用の機能を加えたものです。'
    : 'This app is a web port of the Android app "Electron Orbitals" (1.7c), with additional features for education.'}</p>
<h4>Electron Orbitals — Design &amp; Programming</h4>
<h4>Brian Johnson</h4>
<h4 class="about-sub">Special Thanks: Marissa Anderson, Paul Berry, Steuard Jensen, Chad Versace</h4>
<h4>${link(source)}</h4>
<h3>${ja ? 'ライセンス' : 'License'}</h3>
<h4 class="end">GNU General Public License v3.0</h4>`;

export function helpHtml(lang: 'en' | 'ja'): string {
  // Source line breaks would otherwise render as spaces between Japanese sentences.
  return lang === 'ja' ? helpJa.replace(/\n(?!<)/g, '') : helpEn;
}

export function aboutHtml(lang: 'en' | 'ja'): string {
  return about(lang === 'ja');
}
