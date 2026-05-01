"use client";

import { useState, useEffect, useCallback } from "react";
import { RawData, ProcessedEntry, Settings } from "@/lib/types";
import { processRawData } from "@/lib/calculations";
import { loadData, loadSettings, saveSettings, saveData, hasPin } from "@/lib/storage";
import PinLock from "@/components/PinLock";
import Header from "@/components/Header";
import KPICards from "@/components/KPICards";
import GoalProgress from "@/components/GoalProgress";
import Charts from "@/components/Charts";
import CalorieCalculator from "@/components/CalorieCalculator";
import HistoryTable from "@/components/HistoryTable";

export default function Home() {
  const [locked, setLocked] = useState(true);
  const [ready, setReady] = useState(false);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [entries, setEntries] = useState<ProcessedEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatusState] = useState({ text: "Aucune donnee", isError: false });

  useEffect(() => {
    const pinExists = hasPin();
    if (!pinExists) setLocked(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (locked) return;
    const s = loadSettings();
    setSettings(s);
    const saved = loadData();
    if (saved) {
      setRawData(saved);
      setEntries(processRawData(saved));
      setStatusState({ text: "Donnees chargees (sauvegarde locale)", isError: false });
    } else {
      setStatusState({ text: "Aucune donnee — charge un fichier JSON", isError: false });
    }
  }, [locked]);

  const handleDataLoaded = useCallback((data: RawData) => {
    setRawData(data);
    setEntries(processRawData(data));
  }, []);

  const setStatus = useCallback((text: string, isError: boolean) => {
    setStatusState({ text, isError });
  }, []);

  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const handleGoalWeightChange = useCallback(
    (w: number) => {
      if (settings) {
        const updated = { ...settings, goalWeight: w };
        setSettings(updated);
        saveSettings(updated);
      }
    },
    [settings]
  );

  // Drag-and-drop
  useEffect(() => {
    function onDragOver(e: DragEvent) { e.preventDefault(); }
    async function onDrop(e: DragEvent) {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file?.name.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text);
        saveData(data);
        handleDataLoaded(data);
        setStatus(`Charge: ${file.name}`, false);
      }
    }
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [handleDataLoaded, setStatus]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Fitness Dashboard</h1>
          <p className="text-[#9ca3af] text-sm">Chargement...</p>
        </div>
      </div>
    );
  }
  if (locked) return <PinLock onUnlock={() => setLocked(false)} />;
  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Fitness Dashboard</h1>
          <p className="text-[#9ca3af] text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-[430px]:p-2.5 safe-area">
      <Header
        status={status.text}
        isError={status.isError}
        onDataLoaded={handleDataLoaded}
        setStatus={setStatus}
      />

      <KPICards
        entries={entries}
        phase={settings.phase}
        height={settings.height}
      />

      <GoalProgress
        entries={entries}
        goalWeight={settings.goalWeight}
        onGoalWeightChange={handleGoalWeightChange}
      />

      <Charts entries={entries} />

      {rawData && (
        <CalorieCalculator
          rawData={rawData}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      <HistoryTable entries={entries} />
    </div>
  );
}
