# Electron Orbitals (Web)

A web port of the Android app **Electron Orbitals** by Brian Johnson
([source](https://github.com/bjthinks/android-orbital-explorer), GPL-3.0).
It shows hydrogen atom orbitals with complex phase colouring and time evolution, rendered on the GPU
with WebGL 2. It works on desktop and mobile browsers.

https://korintje.github.io/electron_orbitals_web/

## Development

```sh
npm install
npm run dev      # dev server
npm run build    # production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(set *Settings → Pages → Source* to **GitHub Actions**).

## Structure

| Path | Origin |
|---|---|
| `src/shaders/*.vert/.frag` | Original app's GLSL ES 3.00 shaders, unchanged (`axes_line.vert` is new: WebGL has no wide lines) |
| `public/data/` | Original precomputed Gaussian quadrature tables |
| `public/textures/` | Original axis arrow / origin sprites |
| `src/math.ts`, `src/camera.ts`, `src/renderer.ts` | Ports of the Java math, camera and render stages |
| `src/input.ts`, `src/selector.ts`, `src/main.ts` | Touch/mouse handling, orbital selector and app shell |
| `analysis/ANALYSIS.md` | Notes from analysing the original app |

## License

GPL-3.0, same as the original app. See [LICENSE](LICENSE).
