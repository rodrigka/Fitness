"use client";

import { RawData } from "@/lib/types";
import { saveData, getLoadCount } from "@/lib/storage";

interface HeaderProps {
  status: string;
  isError: boolean;
  onDataLoaded: (data: RawData) => void;
  setStatus: (text: string, isError: boolean) => void;
}

export default function Header({
  status,
  isError,
  onDataLoaded,
  setStatus,
}: HeaderProps) {
  const loadCount = typeof window !== "undefined" ? getLoadCount() : 0;

  async function loadFile() {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          startIn: "documents",
        });
        let latestFile: File | null = null;
        let latestTime = 0;

        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            const file = await entry.getFile();
            if (file.lastModified > latestTime) {
              latestTime = file.lastModified;
              latestFile = file;
            }
          }
        }

        if (!latestFile) throw new Error("Aucun fichier JSON trouve");
        const text = await latestFile.text();
        const data = JSON.parse(text);
        saveData(data);
        onDataLoaded(data);
        setStatus(`Charge: ${latestFile.name}`, false);
      } else {
        loadViaInput();
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setStatus("Chargement annule", true);
      } else {
        loadViaInput();
      }
    }
  }

  function loadViaInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        saveData(data);
        onDataLoaded(data);
        setStatus(`Charge: ${file.name}`, false);
      } catch (err: any) {
        setStatus("Erreur: " + err.message, true);
      }
    };
    input.click();
  }

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Fitness Dashboard</h1>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            isError
              ? "bg-[#3a1e1e] text-[#f87171]"
              : "bg-[#1e3a2f] text-[#34d399]"
          }`}
        >
          {status}
        </span>
        {loadCount > 0 && (
          <span className="text-xs text-[#9ca3af]">
            {loadCount} chargement{loadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <button
        onClick={loadFile}
        className="px-5 py-2.5 bg-[#818cf8] text-white font-semibold rounded-lg hover:brightness-110 transition"
      >
        Charger les donnees
      </button>
    </div>
  );
}
