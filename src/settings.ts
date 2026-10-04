// Port of AppPreferences: persisted in localStorage instead of SharedPreferences.

export type Language = 'auto' | 'en' | 'ja';

export interface Settings {
  ultraQuality: boolean;
  showAxes: boolean;
  colorBlind: number; // 0 normal, 1 protanopia, 2 deuteranopia, 3 tritanopia
  language: Language;
  showLegend: boolean; // web addition
}

const KEY = 'electron-orbitals-settings';

const DEFAULTS: Settings = { ultraQuality: false, showAxes: true, colorBlind: 0, language: 'auto',
  showLegend: true };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // Storage unavailable: use defaults
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable: settings last for this session only
  }
}
