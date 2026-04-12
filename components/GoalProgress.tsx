"use client";

import { ProcessedEntry } from "@/lib/types";
import { calculateGoalETA } from "@/lib/calculations";

interface GoalProgressProps {
  entries: ProcessedEntry[];
  goalWeight: number;
  onGoalWeightChange: (w: number) => void;
}

export default function GoalProgress({
  entries,
  goalWeight,
  onGoalWeightChange,
}: GoalProgressProps) {
  if (!entries.length) return null;

  const latest = entries[entries.length - 1];
  const startWeight = Math.max(...entries.map((e) => e.weight));
  const currentWeight = latest.weight;
  const isLosing = goalWeight < startWeight;

  let progress = 0;
  if (isLosing) {
    const total = startWeight - goalWeight;
    const done = startWeight - currentWeight;
    progress = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
  } else {
    const total = goalWeight - startWeight;
    const done = currentWeight - startWeight;
    progress = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
  }

  const eta = calculateGoalETA(entries, goalWeight);
  const reached = isLosing
    ? currentWeight <= goalWeight
    : currentWeight >= goalWeight;

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-sm font-semibold text-[#9ca3af]">
          Objectif poids
        </h2>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-[#9ca3af]">Cible:</label>
          <input
            type="number"
            value={goalWeight}
            min={30}
            max={200}
            step={0.1}
            onChange={(e) => onGoalWeightChange(parseFloat(e.target.value) || 57)}
            className="w-20 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#818cf8]"
          />
          <span className="text-xs text-[#9ca3af]">kg</span>
        </div>
      </div>

      <div className="relative h-8 bg-[#0f1117] rounded-full overflow-hidden border border-[#2a2d3a]">
        <div
          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3 text-xs font-bold text-white min-w-[40px]"
          style={{
            width: `${progress}%`,
            background:
              progress >= 100
                ? "linear-gradient(90deg, #34d399, #059669)"
                : isLosing
                ? "linear-gradient(90deg, #818cf8, #6366f1)"
                : "linear-gradient(90deg, #fbbf24, #f59e0b)",
          }}
        >
          {progress >= 5 ? `${Math.round(progress)}%` : ""}
        </div>
      </div>

      <div className="flex justify-between mt-2 text-xs text-[#9ca3af]">
        <span>Depart: {startWeight} kg</span>
        <span className="text-[#818cf8] font-semibold">
          Actuel: {currentWeight} kg
        </span>
        <span>Cible: {goalWeight} kg</span>
      </div>

      <div className="mt-3 text-sm text-[#9ca3af] text-center">
        {reached ? (
          <span className="text-[#34d399]">Objectif atteint !</span>
        ) : eta ? (
          <span>
            A ce rythme (
            <strong className="text-white">
              {isLosing ? "-" : "+"}
              {eta.rateGPerWeek}g/sem
            </strong>{" "}
            sur 14j), objectif atteint vers le{" "}
            <strong className="text-white">
              {eta.etaDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>{" "}
            (~{eta.weeksLeft} semaines)
          </span>
        ) : (
          <span>
            Pas assez de donnees sur les 14 derniers jours pour estimer.
          </span>
        )}
      </div>
    </div>
  );
}
