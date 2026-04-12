"use client";

import { RawData, Settings, CalorieResult } from "@/lib/types";
import {
  calculateCalories,
  calculateProtein,
} from "@/lib/calculations";

interface CalorieCalculatorProps {
  rawData: RawData;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
}

export default function CalorieCalculator({
  rawData,
  settings,
  onSettingsChange,
}: CalorieCalculatorProps) {
  const result = calculateCalories(
    rawData,
    settings.height,
    settings.age,
    settings.sex,
    settings.phase,
    settings.neatLevel,
    settings.sportCalories,
    settings.goalAmount,
    settings.adaptation
  );

  if (!result) return null;

  const protein = calculateProtein(result.weight, settings.phase);
  const isCut = settings.phase === "cut";

  const dailyTips = [
    `<strong>Pesee fiable</strong> : pese-toi le matin, a jeun, apres les toilettes. Le poids varie de 0.5-1.5 kg dans la journee.`,
    `<strong>Deficit cyclique</strong> : alterne jours a ~${result.safeTarget} kcal (deficit) et jours a ~${Math.round(result.tdee)} kcal (maintenance) pour relancer le metabolisme.`,
    `<strong>Le muscle brule</strong> : chaque kg de muscle consomme ~13 kcal/jour au repos. Plus tu en as, plus ton metabolisme de base remonte.`,
    `<strong>Sommeil & cortisol</strong> : moins de 7h de sommeil augmente le cortisol, qui favorise la retention d'eau et le stockage de graisse.`,
    `<strong>Glycogene</strong> : un repas plus riche en glucides peut ajouter 0.5-1 kg sur la balance le lendemain. Ce n'est pas du gras.`,
    `<strong>Proteines d'abord</strong> : commence chaque repas par les proteines. Elles rassasient plus et preservent le muscle en deficit.`,
    `<strong>Surcharge progressive</strong> : en muscu, augmente les charges regulierement. C'est le signal qui force le corps a construire du muscle.`,
    `<strong>Patience</strong> : une perte de graisse saine = 0.5-1% du poids par semaine max.`,
    `<strong>Eau</strong> : boire 2L/jour aide a reduire la retention d'eau. La deshydratation pousse le corps a stocker.`,
    `<strong>Creatine & balance</strong> : la creatine retient 1-2 kg d'eau dans les muscles. Regarde la graisse % plutot que le poids brut.`,
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );

  function update(partial: Partial<Settings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 max-[900px]:grid-cols-1">
      {/* Settings panel */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#9ca3af] mb-3">
          Parametres & Objectif
        </h2>

        <InputGroup label="Taille (cm)">
          <input
            type="number"
            value={settings.height}
            min={100}
            max={250}
            onChange={(e) => update({ height: +e.target.value })}
            className="input-field"
          />
        </InputGroup>

        <InputGroup label="Age">
          <input
            type="number"
            value={settings.age}
            min={10}
            max={100}
            onChange={(e) => update({ age: +e.target.value })}
            className="input-field"
          />
        </InputGroup>

        <InputGroup label="Sexe">
          <div className="flex gap-2">
            <RadioBtn
              checked={settings.sex === "F"}
              onChange={() => update({ sex: "F" })}
              label="Femme"
            />
            <RadioBtn
              checked={settings.sex === "M"}
              onChange={() => update({ sex: "M" })}
              label="Homme"
            />
          </div>
        </InputGroup>

        <InputGroup label="Phase actuelle">
          <div className="flex gap-2">
            <RadioBtn
              checked={settings.phase === "cut"}
              onChange={() => update({ phase: "cut" })}
              label="Seche"
            />
            <RadioBtn
              checked={settings.phase === "bulk"}
              onChange={() => update({ phase: "bulk" })}
              label="Prise de masse"
            />
          </div>
        </InputGroup>

        <InputGroup label="Niveau d'activite (hors sport)">
          <select
            value={settings.neatLevel}
            onChange={(e) => update({ neatLevel: +e.target.value })}
            className="input-field"
          >
            <option value={1.2}>Sedentaire (bureau, peu de marche)</option>
            <option value={1.3}>Legerement actif (marche 30min/jour)</option>
            <option value={1.4}>Moderement actif (debout/marche 2h+)</option>
            <option value={1.5}>Actif (travail physique leger)</option>
            <option value={1.6}>Tres actif (travail physique intense)</option>
          </select>
        </InputGroup>

        <InputGroup label="Depense sport quotidienne">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={settings.sportCalories}
              min={0}
              max={2000}
              step={10}
              onChange={(e) => update({ sportCalories: +e.target.value })}
              className="input-field"
            />
            <span className="text-xs text-[#9ca3af] whitespace-nowrap">
              kcal / jour
            </span>
          </div>
        </InputGroup>

        <InputGroup
          label={`Objectif hebdomadaire (${
            isCut ? "perte en seche" : "gain en prise de masse"
          })`}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={settings.goalAmount}
              min={0}
              max={2000}
              step={50}
              onChange={(e) => update({ goalAmount: +e.target.value })}
              className="input-field"
            />
            <span className="text-xs text-[#9ca3af] whitespace-nowrap">
              g / semaine
            </span>
          </div>
        </InputGroup>

        <InputGroup label="Adaptation metabolique">
          <div className="flex gap-2">
            <RadioBtn
              checked={settings.adaptation}
              onChange={() => update({ adaptation: true })}
              label="Active"
            />
            <RadioBtn
              checked={!settings.adaptation}
              onChange={() => update({ adaptation: false })}
              label="Desactivee"
            />
          </div>
        </InputGroup>
      </div>

      {/* Results panel */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#1e3a5f] border border-[#3730a3] rounded-xl p-6 text-center">
        <h2 className="text-sm font-semibold text-white mb-2">
          Calories quotidiennes recommandees
        </h2>
        <div className="text-5xl font-extrabold bg-gradient-to-r from-[#818cf8] to-[#60a5fa] bg-clip-text text-transparent">
          {result.safeTarget}
        </div>
        <div className="text-sm text-[#9ca3af] mt-1">kcal / jour</div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-center">
          <FormulaBox
            name="Katch-McArdle (masse maigre)"
            value={
              result.katchBMR
                ? Math.round(result.katchBMR + result.adaptReduction)
                : "N/A"
            }
            active={result.usingKatch}
          />
          <FormulaBox
            name="Mifflin-St Jeor (classique)"
            value={Math.round(result.mifflinBMR)}
            active={!result.usingKatch}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <MiniStat label="BMR retenu" value={Math.round(result.bmr)} />
          <MiniStat label="TDEE total" value={Math.round(result.tdee)} />
          <MiniStat
            label="Deficit/Surplus"
            value={`${result.dailyAdjustment > 0 ? "+" : ""}${Math.round(
              result.dailyAdjustment
            )}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-2 text-center">
          <MiniStat
            label="Adapt. metab."
            value={
              settings.adaptation
                ? `-${Math.round(result.adaptReduction)}`
                : "OFF"
            }
          />
          <MiniStat label="TEF (~10%)" value={`~${result.tefEstimate}`} />
          <MiniStat label="NEAT mult." value={`x${result.neatMult}`} />
        </div>

        <div className="border-t border-white/10 mt-5 pt-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Proteines (g)" value={result.proteinG} />
            <MiniStat label="Glucides (g)" value={result.carbG} />
            <MiniStat label="Lipides (g)" value={result.fatG} />
          </div>
        </div>

        <div className="mt-4 text-sm text-[#9ca3af] text-left">
          <p>
            Objectif ({isCut ? "seche" : "prise de masse"}):{" "}
            <strong className="text-white">
              {isCut ? "perdre" : "prendre"} {settings.goalAmount}g/sem
            </strong>
          </p>
          {result.safeTarget !== result.target && (
            <p className="text-[#fbbf24] mt-1">
              Limite de securite appliquee (minimum {result.safeFloor} kcal)
            </p>
          )}
        </div>
      </div>

      {/* Reminders */}
      <div className="col-span-2 max-[900px]:col-span-1 bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] rounded-xl p-4">
        <div className="mb-3">
          <strong className="text-[#818cf8]">Ton objectif du jour</strong>
          <br />
          <span className="text-sm text-[#9ca3af]">
            <strong className="text-white">{result.safeTarget} kcal</strong> et{" "}
            <strong className="text-white">
              {protein.low}-{protein.high}g de proteines
            </strong>{" "}
            (~{protein.eggs} oeufs). Les proteines brulent ~25% de leurs
            calories a la digestion.
          </span>
        </div>
        {settings.adaptation && result.adaptReduction > 10 && (
          <div className="mb-3">
            <strong className="text-[#818cf8]">Adaptation metabolique</strong>
            <br />
            <span className="text-sm text-[#9ca3af]">
              Ton corps depense ~{Math.round(result.adaptReduction)}{" "}
              kcal/jour de moins que les formules standard. Patience, ne
              descends pas trop bas en calories.
            </span>
          </div>
        )}
        <div>
          <strong className="text-[#818cf8]">Rappel du jour</strong>
          <br />
          <span
            className="text-sm text-[#9ca3af]"
            dangerouslySetInnerHTML={{
              __html: dailyTips[dayOfYear % dailyTips.length],
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InputGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-[#9ca3af] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function RadioBtn({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-4 py-2 rounded-lg text-sm border transition ${
        checked
          ? "border-[#818cf8] text-[#818cf8] bg-[rgba(129,140,248,0.1)]"
          : "border-[#2a2d3a] text-[#9ca3af]"
      }`}
    >
      {label}
    </button>
  );
}

function FormulaBox({
  name,
  value,
  active,
}: {
  name: string;
  value: number | string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        active
          ? "border border-[#818cf8] bg-white/5"
          : "bg-white/5 opacity-70"
      }`}
    >
      <div className="text-[0.65rem] text-[#9ca3af] mb-1">{name}</div>
      <div
        className={`text-xl font-bold ${
          active ? "text-[#34d399]" : "text-[#9ca3af]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-xs text-[#9ca3af]">
      <span className="block text-base text-white font-semibold">{value}</span>
      {label}
    </div>
  );
}
