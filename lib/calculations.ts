import {
  Measurement,
  ProcessedEntry,
  RawData,
  Phase,
  Sex,
  CalorieResult,
  ProteinInfo,
  TrendResult,
} from "./types";

export function processRawData(raw: RawData): ProcessedEntry[] {
  if (!raw?.measurements) return [];

  const byDay: Record<string, ProcessedEntry> = {};
  raw.measurements.forEach((m) => {
    const day = m.date.substring(0, 10);
    if (!byDay[day] || (m.fat && !byDay[day].fat)) {
      byDay[day] = {
        date: m.date,
        dayKey: day,
        weight: m.weight,
        fat: m.fat,
        muscle: m.muscle,
        bone: m.bone,
        water: m.water,
        fatKg: null,
        muscleKg: null,
        lbm: null,
      };
    }
  });

  const entries = Object.values(byDay)
    .filter((m) => m.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  entries.forEach((e) => {
    e.fatKg =
      e.fat && e.weight ? +((e.weight * e.fat) / 100).toFixed(1) : null;
    e.muscleKg =
      e.muscle && e.weight
        ? +((e.weight * e.muscle) / 100).toFixed(1)
        : null;
    e.lbm =
      e.fat && e.weight
        ? +(e.weight * (1 - e.fat / 100)).toFixed(1)
        : null;
  });

  return entries;
}

export function linearTrend(dates: string[], values: number[]): TrendResult {
  const n = dates.length;
  if (n < 2) return { points: values, slopePerDay: 0 };
  const t0 = new Date(dates[0]).getTime();
  const x = dates.map((d) => (new Date(d).getTime() - t0) / 86400000);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    points: x.map((xi) => +(slope * xi + intercept).toFixed(2)),
    slopePerDay: slope,
  };
}

export function formatRate(slopePerDay: number, unit: string): string {
  const perWeek = slopePerDay * 7;
  const perMonth = slopePerDay * 30.44;

  if (unit === "kg") {
    if (Math.abs(perWeek) >= 0.1) {
      const sign = perWeek > 0 ? "+" : "";
      return `${sign}${perWeek.toFixed(1)} kg/sem (${perMonth.toFixed(1)} kg/mois)`;
    }
    const gPerWeek = perWeek * 1000;
    const sign = gPerWeek > 0 ? "+" : "";
    return `${sign}${Math.round(gPerWeek)} g/sem (${perMonth.toFixed(1)} kg/mois)`;
  }

  const sign = perMonth > 0 ? "+" : "";
  return `${sign}${perMonth.toFixed(1)} pts/mois`;
}

export function getProteinRatios(phase: Phase): ProteinInfo {
  if (phase === "cut") {
    return { low: 2.0, high: 2.4, ideal: 2.2, eggs: 0, label: "seche" };
  }
  return { low: 1.6, high: 2.2, ideal: 1.8, eggs: 0, label: "prise de masse" };
}

export function calculateProtein(
  weight: number,
  phase: Phase
): ProteinInfo {
  const r = getProteinRatios(phase);
  const ideal = Math.round(weight * r.ideal);
  return {
    low: Math.round(weight * r.low),
    high: Math.round(weight * r.high),
    ideal,
    eggs: Math.ceil(ideal / 13),
    label: r.label,
  };
}

export function calculateCalories(
  raw: RawData,
  height: number,
  age: number,
  sex: Sex,
  phase: Phase,
  neatMult: number,
  sportCal: number,
  goalAmount: number,
  adaptEnabled: boolean
): CalorieResult | null {
  const entries = raw.measurements
    .filter((m) => m.weight)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (!entries.length) return null;

  const weight = entries[0].weight;

  const withFat = raw.measurements.filter(
    (m) => m.fat && m.fat > 10 && m.fat < 50
  );
  withFat.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestFatPct = withFat.length > 0 ? withFat[0].fat : null;

  let katchBMR: number | null = null;
  if (latestFatPct) {
    const lbm = weight * (1 - latestFatPct / 100);
    katchBMR = 370 + 21.6 * lbm;
  }

  let mifflinBMR: number;
  if (sex === "M") {
    mifflinBMR = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    mifflinBMR = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  let bmr = katchBMR || mifflinBMR;
  const usingKatch = !!katchBMR;

  let adaptReduction = 0;
  if (adaptEnabled) {
    const sorted = raw.measurements
      .filter((m) => m.weight)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    const initialWeight = sorted[0].weight;
    const kgLost = Math.max(0, initialWeight - weight);
    adaptReduction = bmr * 0.01 * kgLost;
    bmr -= adaptReduction;
  }

  const tdee = bmr * neatMult + sportCal;
  const tefEstimate = Math.round(tdee * 0.1);

  let dailyAdjustment = 0;
  if (phase === "cut") {
    dailyAdjustment = -((goalAmount / 1000) * 7700) / 7;
  } else {
    dailyAdjustment = ((goalAmount / 1000) * 7700) / 7;
  }

  const target = Math.round(tdee + dailyAdjustment);
  const safeFloor = sex === "F" ? 1200 : 1500;
  const safeTarget = Math.max(target, safeFloor);

  let pRatio: number, cRatio: number, fRatio: number;
  if (phase === "cut") {
    pRatio = 0.3;
    cRatio = 0.35;
    fRatio = 0.35;
  } else {
    pRatio = 0.25;
    cRatio = 0.45;
    fRatio = 0.3;
  }

  return {
    katchBMR,
    mifflinBMR,
    bmr,
    tdee,
    dailyAdjustment,
    adaptReduction,
    tefEstimate,
    neatMult,
    safeTarget,
    target,
    safeFloor,
    proteinG: Math.round((safeTarget * pRatio) / 4),
    carbG: Math.round((safeTarget * cRatio) / 4),
    fatG: Math.round((safeTarget * fRatio) / 9),
    usingKatch,
    phase,
    weight,
    goalAmount,
  };
}

export function calculateBMI(weight: number, heightCm: number): { value: number; category: string } {
  const h = heightCm / 100;
  const bmi = weight / (h * h);
  let category = "Obesite";
  if (bmi < 18.5) category = "Insuffisance ponderale";
  else if (bmi < 25) category = "Poids normal";
  else if (bmi < 30) category = "Surpoids";
  return { value: +bmi.toFixed(1), category };
}

export function calculateGoalETA(
  entries: ProcessedEntry[],
  goalWeight: number
): { rateGPerWeek: number; etaDate: Date; weeksLeft: number } | null {
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
  const recent = entries.filter((e) => new Date(e.date) >= twoWeeksAgo);
  if (recent.length < 3) return null;

  const dates = recent.map((e) => e.date);
  const weights = recent.map((e) => e.weight);
  const trend = linearTrend(dates, weights);
  const ratePerDay = trend.slopePerDay;

  const currentWeight = entries[entries.length - 1].weight;
  const isLosing = goalWeight < currentWeight;
  const remaining = Math.abs(currentWeight - goalWeight);

  if (isLosing && ratePerDay >= 0) return null;
  if (!isLosing && ratePerDay <= 0) return null;
  if (remaining <= 0) return null;

  const daysLeft = Math.ceil(remaining / Math.abs(ratePerDay));
  const etaDate = new Date(Date.now() + daysLeft * 86400000);
  const gPerWeek = Math.round(Math.abs(ratePerDay * 7 * 1000));

  return { rateGPerWeek: gPerWeek, etaDate, weeksLeft: Math.round(daysLeft / 7) };
}
