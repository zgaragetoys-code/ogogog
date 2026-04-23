"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Card } from "@/types/database";

interface CardSearchProps {
  // null = user cleared the selection
  onSelect: (card: Card | null) => void;
}

export default function CardSearch({ onSelect }: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<Card | null>(null);

  const supabase = useRef(createClient()).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      const { data } = await supabase
        .from("cards")
        .select("*")
        .ilike("name", `%${trimmed}%`)
        .order("set_code", { ascending: false }) // newest sets first
        .limit(8);

      setResults(data ?? []);
      setDropdownOpen(true);
      setIsSearching(false);
    },
    [supabase]
  );

  // Debounce: wait 300ms after the user stops typing before querying
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Close dropdown when user clicks anywhere outside the component
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleSelect(card: Card) {
    setSelected(card);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
    onSelect(card);
  }

  function handleClear() {
    setSelected(null);
    onSelect(null);
  }

  // ── Locked state: a card has been chosen ─────────────────────
  if (selected) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border-2 border-blue-500 rounded-xl">
        {selected.image_url ? (
          <img
            src={selected.image_url}
            alt={selected.name}
            referrerPolicy="no-referrer"
            className="w-14 h-auto rounded shadow-sm shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-gray-100 rounded shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-black truncate">{selected.name}</p>
          <p className="text-sm text-black">{selected.set_name}</p>
          <p className="text-xs text-black">
            #{selected.card_number}
            {selected.rarity ? ` · ${selected.rarity}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 text-sm text-blue-600 hover:underline"
        >
          Change card
        </button>
      </div>
    );
  }

  // ── Search state ──────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by card name — e.g. Charizard, Pikachu..."
          autoComplete="off"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-black placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isSearching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-black">
            Searching…
          </span>
        )}
      </div>

      {/* Results dropdown */}
      {dropdownOpen && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.length > 0 ? (
            results.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(card)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-auto rounded shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 rounded shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black truncate">
                      {card.name}
                    </p>
                    <p className="text-xs text-black">
                      {card.set_name} · #{card.card_number}
                    </p>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-black">
              No cards found for &ldquo;{query}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
