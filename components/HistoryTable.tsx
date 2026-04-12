"use client";

import { useState, useMemo } from "react";
import { ProcessedEntry } from "@/lib/types";

interface HistoryTableProps {
  entries: ProcessedEntry[];
}

type SortCol = "date" | "weight" | "fat" | "muscle" | "bone" | "water" | "fatKg" | "muscleKg" | "lbm";

export default function HistoryTable({ entries }: HistoryTableProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [metricFilter, setMetricFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = entries.filter((e) => {
      const day = e.dayKey;
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      if (metricFilter === "complete" && (!e.fat || !e.muscle)) return false;
      if (metricFilter === "weight-only" && e.fat) return false;
      return true;
    });

    result.sort((a, b) => {
      let va: number, vb: number;
      if (sortCol === "date") {
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
      } else {
        va = (a[sortCol] as number) ?? -Infinity;
        vb = (b[sortCol] as number) ?? -Infinity;
      }
      return sortAsc ? va - vb : vb - va;
    });

    return result;
  }, [entries, dateFrom, dateTo, metricFilter, sortCol, sortAsc]);

  const totalPages = rowsPerPage === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / (rowsPerPage || filtered.length)));
  const currentPage = Math.min(page, totalPages);
  const perPage = rowsPerPage === 0 ? filtered.length : rowsPerPage;
  const pageEntries = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(col === "date" ? false : true);
    }
  }

  function exportCSV() {
    const headers = ["Date", "Poids", "Graisse%", "Muscle%", "Os%", "Eau%", "Graisse_kg", "Muscle_kg", "Masse_maigre_kg"];
    const rows = filtered.map((e) => [
      e.date.substring(0, 10), e.weight, e.fat || "", e.muscle || "",
      e.bone || "", e.water || "", e.fatKg || "", e.muscleKg || "", e.lbm || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function exportAppleHealth() {
    const headers = ["Date", "Weight (kg)", "Body Fat Percentage (%)", "Lean Body Mass (kg)"];
    const rows = filtered.filter((e) => e.weight).map((e) => {
      const d = new Date(e.date);
      return [d.toISOString().replace("T", " ").substring(0, 19), e.weight, e.fat || "", e.lbm || ""];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `apple-health-import-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const arrow = (col: SortCol) => (sortCol === col ? (sortAsc ? " ↑" : " ↓") : "");

  if (!entries.length) return null;

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-sm font-semibold text-[#9ca3af]">
          Historique complet
        </h2>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input-field-sm" />
          <span className="text-xs text-[#9ca3af]">a</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input-field-sm" />
          <select value={metricFilter} onChange={(e) => { setMetricFilter(e.target.value); setPage(1); }} className="input-field-sm">
            <option value="all">Toutes les mesures</option>
            <option value="complete">Composition complete</option>
            <option value="weight-only">Poids uniquement</option>
          </select>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(+e.target.value); setPage(1); }} className="input-field-sm">
            <option value={20}>20 lignes</option>
            <option value={50}>50 lignes</option>
            <option value={100}>100 lignes</option>
            <option value={0}>Tout afficher</option>
          </select>
          <button onClick={exportCSV} className="btn-outline-sm">Exporter CSV</button>
          <button onClick={exportAppleHealth} className="btn-outline-sm !border-[rgba(52,211,153,0.4)] !text-[#34d399]">
            Exporter Apple Sante
          </button>
        </div>
      </div>

      <div className="text-xs text-[#9ca3af] mb-2">
        {filtered.length} mesures sur {entries.length} total
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr>
              {(
                [
                  ["date", "Date"],
                  ["weight", "Poids"],
                  ["fat", "Graisse %"],
                  ["muscle", "Muscle %"],
                  ["bone", "Os %"],
                  ["water", "Eau %"],
                  ["fatKg", "Graisse kg"],
                  ["muscleKg", "Muscle kg"],
                  ["lbm", "Masse maigre"],
                ] as [SortCol, string][]
              ).map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="text-left px-3 py-2.5 text-[#9ca3af] border-b border-[#2a2d3a] font-medium cursor-pointer hover:text-[#818cf8] whitespace-nowrap select-none"
                >
                  {label}
                  <span className="text-[0.65rem] ml-1">{arrow(col)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageEntries.map((e, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 border-b border-[#2a2d3a]">
                  {new Date(e.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5 border-b border-[#2a2d3a] font-bold">
                  {e.weight} kg
                </td>
                <Cell value={e.fat} unit="%" />
                <Cell value={e.muscle} unit="%" />
                <Cell value={e.bone} unit="%" />
                <Cell value={e.water} unit="%" />
                <Cell value={e.fatKg} unit=" kg" />
                <Cell value={e.muscleKg} unit=" kg" />
                <Cell value={e.lbm} unit=" kg" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <PageBtn onClick={() => setPage(1)} disabled={currentPage === 1}>
            &laquo;
          </PageBtn>
          <PageBtn onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
            &lsaquo;
          </PageBtn>
          <span className="text-xs text-[#9ca3af]">
            Page {currentPage} / {totalPages}
          </span>
          <PageBtn onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
            &rsaquo;
          </PageBtn>
          <PageBtn onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>
            &raquo;
          </PageBtn>
        </div>
      )}
    </div>
  );
}

function Cell({ value, unit }: { value: number | null; unit: string }) {
  return (
    <td className="px-3 py-2.5 border-b border-[#2a2d3a]">
      {value != null ? (
        `${value}${unit}`
      ) : (
        <span className="text-[#2a2d3a]">-</span>
      )}
    </td>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 bg-[#0f1117] border border-[#2a2d3a] rounded-md text-white text-xs cursor-pointer hover:border-[#818cf8] disabled:opacity-30 disabled:cursor-default"
    >
      {children}
    </button>
  );
}
