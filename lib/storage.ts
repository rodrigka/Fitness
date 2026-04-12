import { RawData, Settings } from "./types";

const KEYS = {
  data: "fitnessData",
  settings: "fitnessDashboardSettings3",
  pin: "fitnessPinHash",
  loadCount: "fitnessLoadCount",
  loadHistory: "fitnessLoadHistory",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  height: 162,
  age: 25,
  sex: "F",
  phase: "cut",
  neatLevel: 1.2,
  sportCalories: 100,
  goalAmount: 200,
  adaptation: true,
  goalWeight: 57,
  pin: "",
};

export function saveData(data: RawData): void {
  try {
    localStorage.setItem(KEYS.data, JSON.stringify(data));
    const count = getLoadCount() + 1;
    localStorage.setItem(KEYS.loadCount, String(count));
    const history = getLoadHistory();
    history.push({ date: new Date().toISOString(), count });
    localStorage.setItem(KEYS.loadHistory, JSON.stringify(history.slice(-50)));
  } catch (e) {
    console.warn("Cannot save data:", e);
  }
}

export function loadData(): RawData | null {
  try {
    const saved = localStorage.getItem(KEYS.data);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function getLoadCount(): number {
  return parseInt(localStorage.getItem(KEYS.loadCount) || "0", 10);
}

export function getLoadHistory(): { date: string; count: number }[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.loadHistory) || "[]");
  } catch {
    return [];
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(KEYS.settings);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "fitness-salt-2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function setPin(pin: string): Promise<void> {
  const hashed = await hashPin(pin);
  localStorage.setItem(KEYS.pin, hashed);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(KEYS.pin);
  if (!stored) return true;
  const hashed = await hashPin(pin);
  return hashed === stored;
}

export function hasPin(): boolean {
  return !!localStorage.getItem(KEYS.pin);
}

export function clearPin(): void {
  localStorage.removeItem(KEYS.pin);
}
