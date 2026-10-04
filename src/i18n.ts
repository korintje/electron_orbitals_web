import type { Language } from './settings';

const en = {
  appName: 'Electron Orbitals',
  apology: 'Electron Orbitals doesn’t work with this device.',
  apologySubtext: 'WebGL 2.0 is required.',
  menuFullscreen: 'Fullscreen',
  menuAbout: 'About',
  menuSettings: 'Settings',
  menuHelp: 'Help',
  moreOptions: 'More options',
  back: 'Back',
  up: 'Up',
  down: 'Down',
  realComplex: 'Real / complex orbitals',
  colormono: 'Colour (phase or sign) / black and white',
  pause: 'Pause',
  prefUltraQuality_Title: 'Ultra quality rendering',
  prefUltraQuality_Summary: 'Slow on older devices',
  prefAxes_Title: 'Show axes',
  prefAxes_Summary: 'Red x-axis, green y-axis, blue z-axis',
  prefColorBlind_Title: 'Color blind mode',
  colorBlindOptions: [
    'Normal colors',
    'Protanopia (red-blind)',
    'Deuteranopia (green-blind)',
    'Tritanopia (blue-blind)',
  ],
  prefLanguage_Title: 'Language',
  languageOptions: { auto: 'Automatic', en: 'English', ja: '日本語' },
  loading: 'Loading…',
};

type Strings = typeof en;

const ja: Strings = {
  appName: 'Electron Orbitals',
  apology: 'このデバイスでは Electron Orbitals を利用できません。',
  apologySubtext: 'WebGL 2.0 が必要です。',
  menuFullscreen: '全画面表示',
  menuAbout: 'このアプリについて',
  menuSettings: '設定',
  menuHelp: 'ヘルプ',
  moreOptions: 'その他のオプション',
  back: '戻る',
  up: '上げる',
  down: '下げる',
  realComplex: '実軌道 / 複素軌道',
  colormono: '色あり(位相・符号)/ 白黒',
  pause: '一時停止',
  prefUltraQuality_Title: '最高画質で描画',
  prefUltraQuality_Summary: '古い端末では動作が遅くなります',
  prefAxes_Title: '座標軸を表示',
  prefAxes_Summary: '赤: x 軸、緑: y 軸、青: z 軸',
  prefColorBlind_Title: '色覚補正モード',
  colorBlindOptions: [
    '通常の色',
    'P 型 (1 型 / 赤)',
    'D 型 (2 型 / 緑)',
    'T 型 (3 型 / 青)',
  ],
  prefLanguage_Title: '言語',
  languageOptions: { auto: '自動', en: 'English', ja: '日本語' },
  loading: '読み込み中…',
};

export function resolveLanguage(l: Language): 'en' | 'ja' {
  if (l !== 'auto') return l;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((x) => x?.toLowerCase().startsWith('ja')) ? 'ja' : 'en';
}

export function strings(lang: 'en' | 'ja'): Strings {
  return lang === 'ja' ? ja : en;
}
