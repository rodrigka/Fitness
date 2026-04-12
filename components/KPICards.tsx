"use client";

import { ProcessedEntry, Phase } from "@/lib/types";
import { calculateProtein, calculateBMI } from "@/lib/calculations";

interface KPICardsProps {
  entries: ProcessedEntry[];
  phase: Phase;
  height: number;
}

function ChangeIndicator({
  diff,
  unit,
  lowerIsBetter,
}: {
  diff: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  const sign = diff > 0 ? "+" : "";
  const good = lowerIsBetter ? diff <= 0 : diff >= 0;
  const color =
    diff === 0
      ? "text-[#9ca3af]"
      : good
      ? "text-[#34d399]"
      : "text-[#f87171]";
  return (
    <div className={`text-xs mt-1 ${color}`}>
      {sign}
      {diff.toFixed(1)} {unit}
    </div>
  );
}

export default function KPICards({ entries, phase, height }: KPICardsProps) {
  if (!entries.length) return null;

  const latest = entries[entries.length - 1];
  const prev = entries.length > 1 ? entries[entries.length - 2] : null;

  const withFat = entries.filter((e) => e.fat);
  const latestFat = withFat[withFat.length - 1];
  const prevFat = withFat.length > 1 ? withFat[withFat.length - 2] : null;

  const withMuscle = entries.filter((e) => e.muscle);
  const latestMuscle = withMuscle[withMuscle.length - 1];
  const prevMuscle =
    withMuscle.length > 1 ? withMuscle[withMuscle.length - 2] : null;

  const withWater = entries.filter((e) => e.water);
  const latestWater = withWater[withWater.length - 1];
  const prevWater =
    withWater.length > 1 ? withWater[withWater.length - 2] : null;

  const withLBM = entries.filter((e) => e.lbm);
  const latestLBM = withLBM[withLBM.length - 1];
  const prevLBM = withLBM.length > 1 ? withLBM[withLBM.length - 2] : null;

  const bmi = calculateBMI(latest.weight, height);
  const maxWeight = Math.max(...entries.map((e) => e.weight));
  const totalDiff = latest.weight - maxWeight;
  const protein = calculateProtein(latest.weight, phase);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6 max-[900px]:grid-cols-2 max-[430px]:grid-cols-2 max-[430px]:gap-2.5">
      <Card label="Poids actuel">
        <Value value={latest.weight} unit="kg" />
        {prev && (
          <ChangeIndicator
            diff={latest.weight - prev.weight}
            unit="kg"
            lowerIsBetter
          />
        )}
      </Card>

      <Card label="Masse grasse">
        <Value value={latestFat?.fat ?? null} unit="%" />
        {prevFat && latestFat && (
          <ChangeIndicator
            diff={latestFat.fat! - prevFat.fat!}
            unit="%"
            lowerIsBetter
          />
        )}
      </Card>

      <Card label="Masse musculaire">
        <Value value={latestMuscle?.muscle ?? null} unit="%" />
        {prevMuscle && latestMuscle && (
          <ChangeIndicator
            diff={latestMuscle.muscle! - prevMuscle.muscle!}
            unit="%"
            lowerIsBetter={false}
          />
        )}
      </Card>

      <Card label="Hydratation">
        <Value value={latestWater?.water ?? null} unit="%" />
        {prevWater && latestWater && (
          <ChangeIndicator
            diff={latestWater.water! - prevWater.water!}
            unit="%"
            lowerIsBetter={false}
          />
        )}
      </Card>

      <Card label="IMC">
        <div className="text-3xl font-bold text-white">{bmi.value}</div>
        <div className="text-xs mt-1 text-[#9ca3af]">{bmi.category}</div>
      </Card>

      <Card label="Perte totale">
        <div className="text-3xl font-bold text-white">
          {totalDiff > 0 ? "+" : ""}
          {totalDiff.toFixed(1)}
          <span className="text-base text-[#9ca3af] font-normal"> kg</span>
        </div>
        <div
          className={`text-xs mt-1 ${
            totalDiff <= 0 ? "text-[#34d399]" : "text-[#f87171]"
          }`}
        >
          depuis le max de {maxWeight} kg
        </div>
      </Card>

      <Card label="Masse maigre">
        <Value value={latestLBM?.lbm ?? null} unit="kg" />
        {prevLBM && latestLBM && (
          <ChangeIndicator
            diff={latestLBM.lbm! - prevLBM.lbm!}
            unit="kg"
            lowerIsBetter={false}
          />
        )}
      </Card>

      <Card
        label="Proteines / jour"
        className="border-[rgba(251,191,36,0.3)] bg-gradient-to-br from-[#1a1d27] to-[rgba(251,191,36,0.05)]"
      >
        <div className="text-3xl font-bold text-white">
          {protein.ideal}
          <span className="text-base text-[#9ca3af] font-normal"> g</span>
        </div>
        <div className="text-xs mt-1 text-[#9ca3af]">
          {protein.low} - {protein.high} g ({getProteinRatios(phase).low} -{" "}
          {getProteinRatios(phase).high} g/kg, {protein.label})
        </div>
        <div className="text-xs mt-0.5 text-[#9ca3af]">
          ~{protein.eggs} oeufs/jour (~13g prot/oeuf)
        </div>
      </Card>
    </div>
  );
}

function getProteinRatios(phase: Phase) {
  if (phase === "cut") return { low: 2.0, high: 2.4 };
  return { low: 1.6, high: 2.2 };
}

function Card({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 max-[430px]:p-3 ${className}`}
    >
      <div className="text-xs text-[#9ca3af] mb-1">{label}</div>
      {children}
    </div>
  );
}

function Value({ value, unit }: { value: number | null; unit: string }) {
  return (
    <div className="text-3xl font-bold text-white max-[430px]:text-xl">
      {value ?? "--"}
      <span className="text-base text-[#9ca3af] font-normal max-[430px]:text-xs">
        {" "}
        {unit}
      </span>
    </div>
  );
}
