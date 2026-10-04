// Port of MainActivity / OrbitalView / HelpActivity / SettingsActivity.
import './style.css';
import { Camera } from './camera';
import { aboutHtml, helpHtml } from './docs';
import { resolveLanguage, strings } from './i18n';
import { icon } from './icons';
import { InputHandler } from './input';
import { orbitalEquals, type Orbital } from './math';
import { loadQuadrature, OrbitalRenderer } from './renderer';
import { OrbitalSelector } from './selector';
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
const menuButton = document.createElement('button');
menuButton.className = 'toolbar-button';
menuButton.innerHTML = icon('moreVert');
toolbar.append(title, fullscreenButton, menuButton);

const camera = new Camera();
let renderer: OrbitalRenderer | null = null;

interface Current {
  orbital: Orbital;
  data: Float32Array;
}
let current: Current | null = null;
let wanted: Orbital | null = null;
let pauseTime = 0;

const selector = new OrbitalSelector((o, p) => {
  pauseTime = p;
  wanted = o;
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
tools.append(toolbar, selector.root);
app.append(canvas, tools);

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
  renderer.draw(
    current.orbital, current.data, transform, pauseTime > 0 ? pauseTime : Date.now(), lineWidth(),
  );
  if (current.orbital.color && pauseTime === 0) requestRender();
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

function setFullscreen(f: boolean): void {
  fullScreenMode = f;
  tools.classList.toggle('hidden', f);
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
  listPref(S.prefColorBlind_Title, S.colorBlindOptions, () => settings.colorBlind, (i) => {
    settings.colorBlind = i;
    settingsChanged(false);
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
  buildMenu();
}

// ---------------------------------------------------------------------------
// Start

applyLanguage();
resizeObserver.observe(canvas);
selector.orbitalChanged();
void createRenderer();
