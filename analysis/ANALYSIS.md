# Electron Orbitals (com.gputreats.orbitalexplorer 1.7c) 解析メモ

## 0. 解析環境
| パス | 内容 |
|---|---|
| `electron_orbitals_android/apk/` | 元APK (1.7c, APKPure) |
| `analysis/jadx/` | jadx 1.5.1 による Java 逆コンパイル結果 (`tools/jadx/bin/jadx`) |
| `analysis/original_source/` | **公式ソース** github.com/bjthinks/android-orbital-explorer (GPL-3.0) |

- APK の About 画面にソースURLが記載されていた。upstream は versionName 1.7c で APK と一致。
- `assets/` の shaders・data・textures は APK と upstream で**バイト同一**(docs/shaders の差分は改行コードのみ)。
- 逆コンパイル結果 (`defpackage/uq, tq, c8, ...`) と upstream ソースの対応を確認済み。以降は upstream ソースを正とする。

**ライセンス: GPL-3.0** → Web版も GPL-3.0 で公開し、原作者 (Brian Johnson) をクレジットする必要がある。
画面に表示される画像は作者がパブリックドメインと明言 (help.html)。

## 1. 物理モデル
- 水素原子 (Z=1 固定) の固有状態 ψ_nlm。n=1..12, l=0..n-1, m=-l..l。
- 複素基底 (ℂ): Y_lm ∝ P_l^|m|(cosθ)·e^{imφ}。実基底 (ℝ): m>0 → √2·cos(mφ)、m<0 → √2·sin(mφ)。
- 表示量は**視線方向の積分** ∫|ψ|² ds (ボリュームレイキャストではなく、各画素の視線上の線積分)。
- カラーモードでは ψ の位相 (arg) を色相で表示。輝度 = ∫|ψ|²、色度 = ∫|ψ|·ψ/|ψ| の重み付き平均。
- 時間発展: 単一固有状態なので全体位相 e^{-iEt} の回転のみ → **色相回転行列で実装** (周期 n² 秒、E∝1/n²)。
  `angle = 2π · (t_ms mod n²·1000) / (n²·1000)`

## 2. 描画パイプライン (OrbitalRenderer)
軽さの秘訣: (1) 低解像度 (画面の1/3、ultra quality で1/1) で積分、(2) 積分は**カメラか軌道が変わった時だけ**再実行、(3) 色相回転だけなら全画面パス1回。

1. **Integrator** (`integrator_{color,mono}.{vert,frag}`) → 整数テクスチャへオフスクリーン描画
   - color: RGBA16I (xy = 色度ベクトル×32767, z = 輝度)、mono: R16I
   - 全画面クアッド。`inverseTransform` で near/far 点を求め、原点に最も近い視線上の点 `center` と距離 d を算出。
   - **ガウス求積**: d ごとに事前計算した節点 x_i・重み w_i (テクスチャ) で ∫ f(s) ds ≈ Σ w_i [f(c−x_i r̂)+f(c+x_i r̂)]。
     - mono: 重み関数 = 動径部分 R(r)² (r=√(d²+s²)) を求積に内包 → シェーダは角度部分²のみ評価。次数 = l+2, d方向 1024 ステップ。
     - color: 動径部分の符号が必要なので重みは別 (`exp`項)。次数 = n+1, d方向 64 ステップ。動径多項式テクスチャ (1024) と `pow(r·scale·exp(r·exp/L), L)` 因子をシェーダで掛ける。
   - 出力圧縮: `1 − exp(−brightness·total)`, brightness = R_max²/2。
2. **ScreenDrawer** (`screendrawer_{color,mono}`) → 画面へ
   - 整数テクスチャを手動バイリニア補間 (整数テクスチャはフィルタ不可)。
   - color: CIE (u′,v′) 色度平面上で白色点 (0.19784, 0.46832) 周りに `colorRotation` で回転 → xyY → XYZ → linear sRGB → ガンマ。範囲外は黒。
   - 色覚補正モード (1 第一/2 第二/3 第三色覚): 混同線に直交する方向へ射影。
3. **AxesDrawer** (`axes`, `origin`, `arrow`) — 設定で ON/OFF
   - x赤/y緑/z青の線 (長さ = 0.75·R_max)、原点の点スプライト (origin.raw 32×32 R8)、軸先端の矢印点スプライト (arrow.raw 64×64 R8, 画面上の向きに回転)。MAX ブレンド (glBlendEquation(GL_MAX))、線幅/点サイズは dpi/64。

### テクスチャ・データ
| テクスチャ | 形式 | 内容 |
|---|---|---|
| quadrature | RGBA32F, (order × steps) | `assets/data/{color,mono}-N-L` (big-endian float32 の (node, weight) を (steps+1)×order 個)。隣接2行を zw に詰めて線形補間 |
| radial | RG32F, 1024×1 | 動径の振動 (多項式) 部分、区間 [0, √(R_max²+x_max²)] |
| azimuthal | RG32F, 256×1 | 正規化 Legendre 陪関数 Θ_l^|m|(θ), θ∈[0,π] |

- R_max = `MaximumRadiusTable[n][l]` (eo.a, 例: [12][0]=370.875)。
- `assets/data` 合計 ≈ 4.4MB (156ファイル)。そのまま流用可 (GPL)。

## 3. カメラ・操作 (Camera / OrbitalView)
- 透視投影: distance 初期 70、範囲 [1.5, 1.575·R_max(12,0)]。frustum near=0.1d, far=2d, 横縦比は √aspect で配分。
- 姿勢はクォータニオン。初期姿勢 = Rx(π/2)·Ry(π)·Rz(−3π/4)·R_{(−1,1,0)}(π/6)。
- 1本指ドラッグ: Δ/√(W·H) を半回転単位に → Rx(−πΔy)·Ry(πΔx)·q
- 2本指: ピンチでズーム (距離比)、ひねりで z 軸回転。
- フリック: 慣性回転 (最大 6 半回転/秒、50%/秒の比例減衰 + 1.2/秒の定数減衰)。タッチで停止。
- ダブルタップ: 48 個の軸整列クォータニオンのうち最も近いものへスナップ。
- シングルタップ: (フリック停止でない場合) フルスクリーン解除トグル。

## 4. UI (OrbitalSelector)
- 上部: 軌道名 (例 `4d<sub>±1</sub>`、ℝ時は `2p<sub>x</sub>`, `3d<sub>z²</sub>` など l≤4 まで特別名)。
- 下部: N / l / m の上下ボタン、ℂ⇄ℝ ボタン、カラー⇄モノクロ、再生/一時停止 (時間凍結)。
- 初期値: N=4, l=2, m=1, ℂ, カラー, 再生中。
- 値の連動: l↑で l≥N なら N↑。m が ±l を超えると l↑ (→ 必要なら N↑)。N↓ で l, m を引き下げ。
  上限到達ボタンは黒、制約で連動するボタンは灰色、通常は白。
- メニュー: Fullscreen / About / Settings (Ultra quality, Show axes, Color blind mode) / Feedback (Play Store → Web版では除外) / Help。

## 5. Web 版の技術選定 (案)
- **素の WebGL2 + TypeScript + Vite**、GitHub Pages に静的デプロイ (GitHub Actions)。
  - GLSL ES 3.00 シェーダは WebGL2 でほぼそのまま動く (`#version 300 es`、整数テクスチャ、texelFetch、RGBA16I/R16I レンダーターゲットはすべて WebGL2 コア)。
  - three.js 等は不要 (独自パイプラインそのもの、かつ整数レンダーターゲットが必要)。
  - 依存なしで軽量。描画はオンデマンド (再生中のみ毎フレーム)。
- 入力は Pointer Events で 1本指/2本指/フリック/ダブルタップを再現 + PC 用にマウスホイールズーム。
- 設定は localStorage に保存。
