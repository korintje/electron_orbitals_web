// Port of MainActivity / OrbitalView / HelpActivity / SettingsActivity.
import './style.css';
import { Camera } from './camera';
import { aboutHtml, helpHtml } from './docs';
import { resolveLanguage, strings } from './i18n';
import { icon } from './icons';
import { EDU, infoHtml } from './edu';
import { InputHandler } from './input';
import { Legend } from './legend';
import {
  maximumDensity, maximumRadius, orbitalEquals, RadialFunction, type Orbital,
} from './math';
import { brightnessScale } from './physics';
import {
  loadQuadrature, OrbitalRenderer, type SectionParams, type ViewParams,
} from './renderer';
import { OrbitalSelector, orbitalNameHtml } from './selector';
import { loadSettings, saveSettings, type Language } from './settings';

const BASE = import.meta.env.BASE_URL;
const settings = loadSettings();
let lang = resolveLanguage(settings.language);
let S = strings(lang);

const app = document.getElementById('app')!;

// ---------------------------------------------------------------------------
// Main screen

const canvas = document.createElement('canvas');
canvas.id = 'orbital-view';
const tools = document.createElement('div');
tools.id = 'orbital-tools';
const toolbar = document.createElement('header');
toolbar.className = 'toolbar';
const title = document.createElement('h1');
const fullscreenButton = document.createElement('button');
fullscreenButton.className = 'toolbar-button';
fullscreenButton.innerHTML = icon('fullscreen');
const infoButton = document.createElement('button');
infoButton.className = 'toolbar-button';
infoButton.innerHTML = icon('info');
const menuButton = document.createElement('button');
menuButton.className = 'toolbar-button';
menuButton.innerHTML = icon('moreVert');
toolbar.append(title, infoButton, fullscreenButton, menuButton);

const camera = new Camera();
let renderer: OrbitalRenderer | null = null;

interface Current {
  orbital: Orbital;
  data: Float32Array;
}
let current: Current | null = null;
let wanted: Orbital | null = null;
let pauseTime = 0;

const legend = new Legend();

const selector = new OrbitalSelector((o, p) => {
  pauseTime = p;
  wanted = o;
  selector.setMaximumRadius(maximumRadius(o.n, o.l));
  updateEdu(o);
  if (current && orbitalEquals(current.orbital, o)) {
    requestRender();
    return;
  }
  loadQuadrature(o).then(
    (data) => {
      if (wanted && orbitalEquals(wanted, o)) {
        current = { orbital: o, data };
        requestRender();
      }
    },
    (e) => console.error(e),
  );
});
// Web addition: buttons to view along the x, y and z axes
const viewButtons = document.createElement('div');
viewButtons.className = 'view-buttons';
const viewLabel = document.createElement('span');
viewLabel.className = 'view-label';
viewButtons.append(viewLabel);
const axisButtons = (['x', 'y', 'z'] as const).map((name, axis) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `view-button axis-${name}`;
  b.textContent = name;
  b.addEventListener('click', () => {
    // First tap: x right/z up for the y view (textbook xz figures), y right/z up for the
    // x view, x right/y up for the z view. Tapping again shows the opposite side.
    const first: 1 | -1 = axis === 1 ? -1 : 1;
    const cur = camera.currentAxisView();
    const sign: 1 | -1 = cur && cur[0] === axis && cur[1] === first ? (-first as 1 | -1) : first;
    camera.viewFromAxis(axis as 0 | 1 | 2, sign);
    requestRender();
  });
  viewButtons.append(b);
  return b;
});

// Web addition: sidebar used on wide screens (PC); see applyLayout()
const sidebar = document.createElement('aside');
sidebar.className = 'sidebar hidden';
const sidebarTitle = document.createElement('h1');
sidebarTitle.className = 'sidebar-title';
sidebar.append(sidebarTitle);

tools.append(toolbar, legend.root, viewButtons, selector.root);
app.append(canvas, tools, sidebar);

// ---------------------------------------------------------------------------
// Rendering (GLSurfaceView with RENDERMODE_WHEN_DIRTY / CONTINUOUSLY)

let frameRequested = false;

function requestRender(): void {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(drawFrame);
}

function lineWidth(): number {
  // densityDpi / 64 on Android; a CSS px is 1/160 inch in Android terms
  return Math.max(Math.round((160 * window.devicePixelRatio) / 64), 1);
}

function drawFrame(): void {
  frameRequested = false;
  if (!renderer || !current || renderer.isContextLost) return;
  if (camera.continueFling()) requestRender();
  const transform = camera.computeShaderTransform(renderer.aspectRatio);
  const millis = pauseTime > 0 ? pauseTime : Date.now();
  const section = sectionParams(current.orbital);
  if (section) selector.setPlaneLabel(planeLabel(section));
  const view = viewParams(current.orbital);
  renderer.draw(current.orbital, current.data, transform, millis, lineWidth(), section, view);
  legend.tick(millis);
  if (current.orbital.color && pauseTime === 0) requestRender();
}

// ---------------------------------------------------------------------------
// Web addition: cross-section view

const maxDensityCache = new Map<string, number>();

/** Reference orbital (2p_z) of the common brightness scale */
const REFERENCE_ORBITAL: Orbital = { n: 2, l: 1, m: 0, real: true, color: true };

function maxDensity(o: Orbital): number {
  const key = `${o.n},${o.l},${o.m},${o.real}`;
  let rho = maxDensityCache.get(key);
  if (rho === undefined) {
    rho = maximumDensity(o);
    maxDensityCache.set(key, rho);
  }
  return rho;
}

/** Brightness constant k of the section view: intensity = 1 − exp(−k|ψ|²) */
function sectionK(o: Orbital): number {
  // Default: the densest point (of this orbital, or of 2p_z for the common scale)
  // reaches 1 − e⁻¹⁰
  const ref = selector.commonScale ? REFERENCE_ORBITAL : o;
  return Math.pow(10, selector.gain + 1) / maxDensity(ref);
}

/** Brightness constant b of the projection view: intensity = 1 − exp(−b ∫|ψ|² ds) */
function projectionB(o: Orbital): number {
  // Original app: R_max²/2 of the orbital shown
  const ref = selector.commonScale ? REFERENCE_ORBITAL : o;
  return Math.fround(Math.pow(10, selector.gain) * brightnessScale(ref));
}

function viewParams(o: Orbital): ViewParams {
  return { brightness: projectionB(o) };
}

function sectionParams(o: Orbital): SectionParams | null {
  if (!selector.section) return null;
  const c = new RadialFunction(1, o.n, o.l).constantFactors;
  const normal = camera.viewDirection();
  // Sign chosen so that the slider value equals the coordinate along the dominant axis
  // (e.g. x = d for the yz plane), whichever side the camera is on.
  const k = [0, 1, 2].reduce((a, i) => (Math.abs(normal[i]) > Math.abs(normal[a]) ? i : a), 0);
  return {
    normal,
    offset: selector.sectionOffset * maximumRadius(o.n, o.l) * Math.sign(normal[k]),
    densityScale: sectionK(o) * c * c,
  };
}

function signed(x: number): string {
  return (Math.abs(x) < 0.05 ? 0 : x).toFixed(1).replace('-', '−');
}

function planeLabel(p: SectionParams): string {
  const T = EDU[lang];
  const names = ['yz', 'zx', 'xy'];
  const coords = ['x', 'y', 'z'];
  for (let i = 0; i < 3; ++i)
    if (Math.abs(p.normal[i]) > 0.9999)
      return T.planeAxis(names[i], `${coords[i]} = ${signed(p.offset * Math.sign(p.normal[i]))} a₀`);
  return T.planeScreen(signed(selector.sectionOffset * maximumRadius(wanted!.n, wanted!.l)));
}

let pixelWidth = 1;
let pixelHeight = 1;

function applySize(): void {
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  renderer?.resize(pixelWidth, pixelHeight);
  requestRender();
}

const resizeObserver = new ResizeObserver((entries) => {
  const e = entries[0];
  const dpr = window.devicePixelRatio;
  const box = e.devicePixelContentBoxSize?.[0];
  pixelWidth = Math.max(1, box ? box.inlineSize : Math.round(e.contentRect.width * dpr));
  pixelHeight = Math.max(1, box ? box.blockSize : Math.round(e.contentRect.height * dpr));
  applySize();
});

async function loadRaw(name: string): Promise<Uint8Array> {
  const r = await fetch(`${BASE}textures/${name}`);
  if (!r.ok) throw new Error('Error opening asset: ' + name);
  return new Uint8Array(await r.arrayBuffer());
}

const texturesPromise = Promise.all([loadRaw('arrow.raw'), loadRaw('origin.raw')]).then(
  ([arrow, origin]) => ({ arrow, origin }),
);

async function createRenderer(): Promise<void> {
  const textures = await texturesPromise;
  try {
    renderer = new OrbitalRenderer(canvas, settings, textures);
  } catch (e) {
    console.error(e);
    showError();
    return;
  }
  renderer.resize(pixelWidth, pixelHeight);
  requestRender();
}

canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  renderer = null;
});
canvas.addEventListener('webglcontextrestored', () => void createRenderer());

function showError(): void {
  app.innerHTML = `<div class="error-screen">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
    <p class="apology">${S.apology}</p><p>${S.apologySubtext}</p></div>`;
}

// ---------------------------------------------------------------------------
// Fullscreen

let fullScreenMode = false;

// ---------------------------------------------------------------------------
// Web addition: separate layouts for wide screens (sidebar) and phones (overlay)

const wideQuery = window.matchMedia('(min-width: 900px) and (min-height: 520px)');
let wide = false;

function applyLayout(): void {
  wide = wideQuery.matches;
  app.classList.toggle('wide', wide);
  sidebar.classList.toggle('hidden', !wide);
  if (wide) {
    selector.placePanels(sidebar);
    sidebar.append(viewButtons, legend.root);
  } else {
    selector.placePanels(null);
    tools.insertBefore(legend.root, selector.root);
    tools.insertBefore(viewButtons, selector.root);
  }
  legend.setLarge(wide);
}

wideQuery.addEventListener('change', applyLayout);

function setFullscreen(f: boolean): void {
  fullScreenMode = f;
  tools.classList.toggle('hidden', f);
  app.classList.toggle('fullscreen', f);
  if (f) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

document.addEventListener('fullscreenchange', () => {
  // Leaving browser fullscreen (e.g. Esc) also brings the controls back
  if (!document.fullscreenElement && fullScreenMode) setFullscreen(false);
});

new InputHandler(canvas, camera, requestRender, () => setFullscreen(false));
fullscreenButton.addEventListener('click', () => setFullscreen(true));

// ---------------------------------------------------------------------------
// Overflow menu

const menu = document.createElement('div');
menu.className = 'popup-menu hidden';
app.append(menu);

function closeMenu(): void {
  menu.classList.add('hidden');
}

function buildMenu(): void {
  menu.innerHTML = '';
  const items: [string, () => void][] = [
    [EDU[lang].menuInfo, () => toggleInfo(true)],
    [S.menuAbout, () => openAux(S.menuAbout, aboutHtml(lang), 'doc')],
    [S.menuSettings, () => openSettings()],
    [S.menuHelp, () => openAux(S.menuHelp, helpHtml(lang), 'doc')],
  ];
  for (const [label, action] of items) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => {
      closeMenu();
      action();
    });
    menu.append(b);
  }
}

menuButton.addEventListener('click', (e) => {
  e.stopPropagation();
  menu.classList.toggle('hidden');
});
document.addEventListener('pointerdown', (e) => {
  if (!menu.contains(e.target as Node) && e.target !== menuButton) closeMenu();
});

// ---------------------------------------------------------------------------
// Auxiliary pages (HelpActivity, SettingsActivity)

const aux = document.createElement('section');
aux.className = 'aux hidden';
const auxToolbar = document.createElement('header');
auxToolbar.className = 'toolbar aux-toolbar';
const auxBack = document.createElement('button');
auxBack.className = 'toolbar-button';
auxBack.innerHTML = icon('back');
const auxTitle = document.createElement('h1');
auxToolbar.append(auxBack, auxTitle);
const auxContent = document.createElement('div');
auxContent.className = 'aux-content';
aux.append(auxToolbar, auxContent);
app.append(aux);

let auxOpen = false;

function openAux(t: string, html: string | HTMLElement, cls: string): void {
  auxTitle.textContent = t;
  auxContent.className = 'aux-content ' + cls;
  if (typeof html === 'string') auxContent.innerHTML = html;
  else auxContent.replaceChildren(html);
  auxContent.scrollTop = 0;
  aux.classList.remove('hidden');
  if (!auxOpen) {
    auxOpen = true;
    history.pushState({ aux: true }, '');
  }
}

function closeAux(): void {
  aux.classList.add('hidden');
  closeDialog();
  auxOpen = false;
}

auxBack.addEventListener('click', () => history.back());
window.addEventListener('popstate', () => {
  if (auxOpen) closeAux();
});

// Dialog for list preferences
const dialogOverlay = document.createElement('div');
dialogOverlay.className = 'dialog-overlay hidden';
app.append(dialogOverlay);

function closeDialog(): void {
  dialogOverlay.classList.add('hidden');
}

dialogOverlay.addEventListener('click', (e) => {
  if (e.target === dialogOverlay) closeDialog();
});

function openListDialog(
  t: string, options: string[], selected: number, onSelect: (i: number) => void,
): void {
  dialogOverlay.innerHTML = '';
  const d = document.createElement('div');
  d.className = 'dialog';
  const h = document.createElement('h2');
  h.textContent = t;
  d.append(h);
  options.forEach((label, i) => {
    const row = document.createElement('label');
    row.className = 'radio-row';
    const r = document.createElement('input');
    r.type = 'radio';
    r.name = 'list-dialog';
    r.checked = i === selected;
    r.addEventListener('change', () => {
      onSelect(i);
      closeDialog();
    });
    row.append(r, document.createTextNode(label));
    d.append(row);
  });
  dialogOverlay.append(d);
  dialogOverlay.classList.remove('hidden');
}

function settingsChanged(resize: boolean): void {
  saveSettings(settings);
  if (resize) renderer?.resize(pixelWidth, pixelHeight);
  requestRender();
}

function openSettings(): void {
  const list = document.createElement('div');
  list.className = 'pref-list';

  const switchPref = (t: string, summary: string, get: () => boolean, set: (v: boolean) => void) => {
    const row = document.createElement('label');
    row.className = 'pref';
    row.innerHTML = `<div class="pref-text"><div class="pref-title"></div>
      <div class="pref-summary"></div></div>`;
    row.querySelector('.pref-title')!.textContent = t;
    row.querySelector('.pref-summary')!.textContent = summary;
    const sw = document.createElement('input');
    sw.type = 'checkbox';
    sw.className = 'switch';
    sw.checked = get();
    sw.addEventListener('change', () => set(sw.checked));
    row.append(sw);
    list.append(row);
  };

  const listPref = (
    t: string, options: string[], get: () => number, set: (i: number) => void,
  ) => {
    const row = document.createElement('button');
    row.className = 'pref';
    row.innerHTML = `<div class="pref-text"><div class="pref-title"></div>
      <div class="pref-summary"></div></div>`;
    row.querySelector('.pref-title')!.textContent = t;
    const summary = row.querySelector('.pref-summary')!;
    summary.textContent = options[get()];
    row.addEventListener('click', () =>
      openListDialog(t, options, get(), (i) => {
        set(i);
        summary.textContent = options[get()];
      }),
    );
    list.append(row);
  };

  switchPref(S.prefUltraQuality_Title, S.prefUltraQuality_Summary, () => settings.ultraQuality,
    (v) => {
      settings.ultraQuality = v;
      settingsChanged(true);
    });
  switchPref(S.prefAxes_Title, S.prefAxes_Summary, () => settings.showAxes, (v) => {
    settings.showAxes = v;
    settingsChanged(false);
  });
  switchPref(EDU[lang].prefLegend_Title, EDU[lang].prefLegend_Summary, () => settings.showLegend,
    (v) => {
      settings.showLegend = v;
      saveSettings(settings);
      if (wanted) updateEdu(wanted);
    });
  listPref(S.prefColorBlind_Title, S.colorBlindOptions, () => settings.colorBlind, (i) => {
    settings.colorBlind = i;
    settingsChanged(false);
    if (wanted) updateEdu(wanted);
  });
  const langs: Language[] = ['auto', 'en', 'ja'];
  listPref(S.prefLanguage_Title, langs.map((l) => S.languageOptions[l]),
    () => langs.indexOf(settings.language), (i) => {
      settings.language = langs[i];
      saveSettings(settings);
      applyLanguage();
      openSettings(); // rebuild in the new language
    });
  openAux(S.menuSettings, list, 'settings');
}

// ---------------------------------------------------------------------------
// Web addition: "About this orbital" panel and legend

const infoPanel = document.createElement('aside');
infoPanel.className = 'info-panel hidden';
const infoHeader = document.createElement('header');
infoHeader.className = 'info-header';
const infoTitle = document.createElement('h2');
const infoClose = document.createElement('button');
infoClose.className = 'toolbar-button';
infoClose.innerHTML = icon('close');
infoHeader.append(infoTitle, infoClose);
const infoBody = document.createElement('div');
infoBody.className = 'info-body';
infoPanel.append(infoHeader, infoBody);
app.append(infoPanel);

function toggleInfo(open = infoPanel.classList.contains('hidden')): void {
  infoPanel.classList.toggle('hidden', !open);
  app.classList.toggle('info-open', open);
  if (open && wanted) updateEdu(wanted);
}

infoButton.addEventListener('click', () => toggleInfo());
infoClose.addEventListener('click', () => toggleInfo(false));

function updateEdu(o: Orbital): void {
  legend.root.classList.toggle('hidden', !settings.showLegend);
  legend.update(o, settings.colorBlind, lang, selector.section,
    selector.section ? sectionK(o) : projectionB(o), selector.commonScale);
  legend.tick(pauseTime > 0 ? pauseTime : Date.now());
  if (!infoPanel.classList.contains('hidden')) {
    infoTitle.textContent = EDU[lang].menuInfo;
    infoBody.innerHTML = infoHtml(o, orbitalNameHtml({ qN: o.n, qL: o.l, qM: o.m, real: o.real }), lang);
  }
}

// ---------------------------------------------------------------------------
// Language

function applyLanguage(): void {
  lang = resolveLanguage(settings.language);
  S = strings(lang);
  document.documentElement.lang = lang;
  title.textContent = S.appName;
  fullscreenButton.setAttribute('aria-label', S.menuFullscreen);
  fullscreenButton.title = S.menuFullscreen;
  menuButton.setAttribute('aria-label', S.moreOptions);
  menuButton.title = S.moreOptions;
  auxBack.setAttribute('aria-label', S.back);
  selector.setLanguage(lang);
  infoButton.setAttribute('aria-label', EDU[lang].menuInfo);
  infoButton.title = EDU[lang].menuInfo;
  infoClose.setAttribute('aria-label', S.back);
  buildMenu();
  sidebarTitle.textContent = S.appName;
  viewLabel.textContent = EDU[lang].viewpoint;
  axisButtons.forEach((b, i) => (b.title = EDU[lang].viewFrom('xyz'[i])));
  if (wanted) updateEdu(wanted);
}

// ---------------------------------------------------------------------------
// Start

applyLayout();
applyLanguage();
resizeObserver.observe(canvas);
selector.orbitalChanged();
// Wide screens with room to spare: show "About this orbital" docked on the right from the start
if (wide && window.matchMedia('(min-width: 1200px)').matches) toggleInfo(true);
void createRenderer();
