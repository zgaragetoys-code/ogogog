"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/types/database";

const selectCls =
  "text-sm border-2 border-black px-3 py-1.5 bg-white text-black font-medium " +
  "focus:outline-none focus:ring-0 cursor-pointer hover:bg-gray-50 transition-colors";

const inputCls =
  "text-sm border-2 border-black px-3 py-1.5 bg-white text-black font-medium " +
  "focus:outline-none w-24 placeholder:text-gray-400";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
];

export default function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    update("q", q);
  }

  function handlePriceBlur(key: "min" | "max", value: string) {
    const n = parseFloat(value);
    update(key, isNaN(n) || n <= 0 ? "" : String(n));
  }

  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const condition = params.get("condition") ?? "";
  const product = params.get("product") ?? "";
  const sort = params.get("sort") ?? "newest";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const hasFilters = !!(q || type || condition || product || min || max || (sort && sort !== "newest"));

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by card name or set…"
          className="flex-1 px-3 py-2 border-2 border-black text-sm text-black font-medium focus:outline-none placeholder:text-gray-400"
        />
        <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors">
          Search
        </button>
      </form>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => update("type", e.target.value)} className={selectCls} aria-label="Listing type">
          <option value="">All types</option>
          <option value="for_sale">For Sale</option>
          <option value="wanted">Wanted</option>
        </select>

        <select value={condition} onChange={(e) => update("condition", e.target.value)} className={selectCls} aria-label="Condition">
          <option value="">Any condition</option>
          <option value="raw">Raw</option>
          <option value="graded">Graded</option>
          <option value="sealed">Sealed</option>
        </select>

        <select value={product} onChange={(e) => update("product", e.target.value)} className={selectCls} aria-label="Product type">
          <option value="">Any product</option>
          {PRODUCT_TYPES.map((pt) => (
            <option key={pt} value={pt}>{PRODUCT_TYPE_LABELS[pt as ProductType]}</option>
          ))}
        </select>

        {/* Price range */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-black uppercase tracking-widest">$</span>
          <input
            type="number"
            defaultValue={min}
            placeholder="Min"
            min="0"
            step="0.01"
            className={inputCls}
            onBlur={(e) => handlePriceBlur("min", e.target.value)}
            aria-label="Minimum price"
          />
          <span className="text-xs font-bold text-black">–</span>
          <input
            type="number"
            defaultValue={max}
            placeholder="Max"
            min="0"
            step="0.01"
            className={inputCls}
            onBlur={(e) => handlePriceBlur("max", e.target.value)}
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Sort row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-black uppercase tracking-widest">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("sort", opt.value === "newest" ? "" : opt.value)}
            className={`text-xs font-bold px-3 py-1.5 border-2 transition-colors ${
              sort === opt.value
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs font-bold text-black border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors ml-auto"
          >
            ✕ Clear all
          </button>
        )}
      </div>
    </div>
  );
}
