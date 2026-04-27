"use client";

import { useRef, useState, useTransition } from "react";
import { lookupCardsByName, bulkImportCollection } from "./import-actions";

// ── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Column name resolution ────────────────────────────────────────────────────

const NAME_COLS   = ["name", "card name", "card_name", "cardname", "card", "pokemon", "title"];
const SET_COLS    = ["set", "set name", "set_name", "setname", "expansion", "series", "set_code", "setcode"];
const NUMBER_COLS = ["number", "card number", "card_number", "no", "no.", "collector number", "collector_number", "#", "id"];
const QTY_COLS    = ["quantity", "qty", "count", "copies", "amount", "owned", "have"];

function findCol(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  return null;
}

// ── Match result type ─────────────────────────────────────────────────────────

type MatchedRow = {
  csvName: string;
  csvSet: string;
  quantity: number;
  candidates: { id: string; name: string; set_name: string; card_number: string; image_url: string | null }[];
  selectedId: string | null;
};

type Props = {
  onImported: (count: number) => void;
};

export default function CollectionImport({ onImported }: Props) {
  const [step, setStep] = useState<"idle" | "parsing" | "preview" | "importing" | "done">("idle");
  const [rows, setRows] = useState<MatchedRow[]>([]);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("parsing");
    setError("");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) { setError("CSV appears empty or invalid."); setStep("idle"); return; }

        const headers = Object.keys(parsed[0]);
        const nameCol = findCol(headers, NAME_COLS);
        if (!nameCol) { setError(`Could not find a card name column. Headers found: ${headers.join(", ")}`); setStep("idle"); return; }

        const setCol = findCol(headers, SET_COLS);
        const qtyCol = findCol(headers, QTY_COLS);

        // Collect unique card names for bulk lookup
        const uniqueNames = [...new Set(parsed.map(r => r[nameCol]).filter(Boolean))];

        startTransition(async () => {
          const dbCards = await lookupCardsByName(uniqueNames);

          // Group db cards by lowercase name
          const byName = new Map<string, typeof dbCards>();
          for (const c of dbCards) {
            const key = c.name.toLowerCase();
            if (!byName.has(key)) byName.set(key, []);
            byName.get(key)!.push(c);
          }

          const matchedRows: MatchedRow[] = parsed
            .filter(r => r[nameCol])
            .map(r => {
              const csvName = r[nameCol];
              const csvSet  = setCol ? (r[setCol] ?? "") : "";
              const qty     = qtyCol ? (parseInt(r[qtyCol]) || 1) : 1;
              const candidates = byName.get(csvName.toLowerCase()) ?? [];

              // Auto-select: if only one candidate, pick it; if set column present, prefer matching set
              let selectedId: string | null = null;
              if (candidates.length === 1) {
                selectedId = candidates[0].id;
              } else if (candidates.length > 1 && csvSet) {
                const setMatch = candidates.find(c =>
                  c.set_name.toLowerCase().includes(csvSet.toLowerCase()) ||
                  csvSet.toLowerCase().includes(c.set_name.toLowerCase())
                );
                selectedId = setMatch?.id ?? candidates[0].id;
              } else if (candidates.length > 1) {
                selectedId = candidates[0].id;
              }

              return { csvName, csvSet, quantity: qty, candidates, selectedId };
            });

          setRows(matchedRows);
          const initSelections: Record<number, string> = {};
          matchedRows.forEach((r, i) => { if (r.selectedId) initSelections[i] = r.selectedId; });
          setSelections(initSelections);
          setStep("preview");
        });
      } catch {
        setError("Failed to parse CSV. Make sure it is a valid CSV file.");
        setStep("idle");
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    const toImport = rows
      .map((r, i) => ({ card_id: selections[i], quantity: r.quantity }))
      .filter(r => r.card_id) as { card_id: string; quantity: number }[];

    setStep("importing");
    startTransition(async () => {
      const result = await bulkImportCollection(toImport);
      if ("error" in result && result.error) {
        setError(result.error);
        setStep("idle");
        return;
      }
      setStep("done");
      onImported(result.count);
    });
  }

  const matched  = rows.filter((_, i) => selections[i]).length;
  const total    = rows.length;
  const unmatched = total - matched;

  if (step === "idle") {
    return (
      <div className="bg-white border-2 border-black p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-semibold text-black">Import from CSV</p>
            <p className="text-xs text-gray-700 mt-0.5">
              Export your Collectr collection as CSV, then upload it here.
            </p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 border-2 border-black text-sm font-bold text-black hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Choose CSV file
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFile}
          />
        </label>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  if (step === "parsing") {
    return (
      <div className="bg-white border-2 border-black p-5 text-sm text-gray-700">
        Parsing CSV and matching cards…
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="bg-white border-2 border-black p-5 flex items-center justify-between">
        <p className="text-sm text-green-800 font-medium">Import complete — {matched} cards added.</p>
        <button
          onClick={() => { setStep("idle"); setRows([]); setSelections({}); if (fileRef.current) fileRef.current.value = ""; }}
          className="text-xs text-green-700 hover:underline"
        >
          Import another file
        </button>
      </div>
    );
  }

  // Preview step
  return (
    <div className="bg-white border-2 border-black overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-black flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black">Review import</p>
          <p className="text-xs text-gray-700 mt-0.5">
            {matched}/{total} cards matched.{unmatched > 0 && ` ${unmatched} not found in database — these will be skipped.`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setStep("idle"); setRows([]); if (fileRef.current) fileRef.current.value = ""; }}
            className="text-sm px-3 py-1.5 border-2 border-black hover:bg-gray-100 text-black font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isPending || matched === 0}
            className="text-sm px-4 py-1.5 bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
          >
            {step === "importing" ? "Importing…" : `Import ${matched} cards`}
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {rows.map((row, i) => {
          const selected = selections[i];
          const card = row.candidates.find(c => c.id === selected);
          return (
            <div key={i} className={`px-5 py-3 flex items-center gap-3 text-sm ${!selected ? "bg-red-50" : ""}`}>
              {card?.image_url ? (
                <img src={card.image_url} alt="" referrerPolicy="no-referrer" className="w-8 h-auto rounded shrink-0" />
              ) : (
                <div className="w-8 h-11 bg-gray-100 rounded shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-black truncate">{row.csvName}</p>
                {row.csvSet && <p className="text-xs text-gray-700 truncate">{row.csvSet}</p>}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs text-gray-700">×{row.quantity}</span>

                {row.candidates.length === 0 ? (
                  <span className="text-xs text-red-500">Not found</span>
                ) : row.candidates.length === 1 ? (
                  <span className="text-xs text-green-700 truncate max-w-[140px]">
                    {card?.set_name} #{card?.card_number}
                  </span>
                ) : (
                  <select
                    value={selected ?? ""}
                    onChange={e => setSelections(prev => ({ ...prev, [i]: e.target.value }))}
                    className="text-xs border-2 border-black px-1.5 py-1 max-w-[180px] focus:outline-none"
                  >
                    <option value="">— pick version —</option>
                    {row.candidates.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.set_name} #{c.card_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
