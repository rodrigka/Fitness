export interface Measurement {
  date: string;
  weight: number;
  fat: number | null;
  muscle: number | null;
  bone: number | null;
  water: number | null;
  calories: number | null;
  height: number | null;
}

export interface ProcessedEntry {
  date: string;
  dayKey: string;
  weight: number;
  fat: number | null;
  muscle: number | null;
  bone: number | null;
  water: number | null;
  fatKg: number | null;
  muscleKg: number | null;
  lbm: number | null;
}

export interface RawData {
  measurements: Measurement[];
}

export type Phase = "cut" | "bulk";
export type Sex = "M" | "F";

export interface Settings {
  height: number;
  age: number;
  sex: Sex;
  phase: Phase;
  neatLevel: number;
  sportCalories: number;
  goalAmount: number;
  adaptation: boolean;
  goalWeight: number;
  pin: string;
}

export interface CalorieResult {
  katchBMR: number | null;
  mifflinBMR: number;
  bmr: number;
  tdee: number;
  dailyAdjustment: number;
  adaptReduction: number;
  tefEstimate: number;
  neatMult: number;
  safeTarget: number;
  target: number;
  safeFloor: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  usingKatch: boolean;
  phase: Phase;
  weight: number;
  goalAmount: number;
}

export interface ProteinInfo {
  low: number;
  high: number;
  ideal: number;
  eggs: number;
  label: string;
}

export interface TrendResult {
  points: number[];
  slopePerDay: number;
}
