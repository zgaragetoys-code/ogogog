"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/types/database";

const selectCls =
  "text-sm border-2 border-black px-3 py-1.5 bg-white text-black font-medium " +
  "focus:outline-none focus:ring-0 cursor-pointer hover:bg-gray-50 transition-colors";

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

  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const condition = params.get("condition") ?? "";
  const product = params.get("product") ?? "";
  const hasFilters = !!(q || type || condition || product);

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search cards by name…"
          className="flex-1 px-3 py-2 border-2 border-black text-sm text-black font-medium focus:outline-none placeholder:text-gray-400"
        />
        <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors">
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => update("type", e.target.value)} className={selectCls} aria-label="Listing type">
          <option value="">All listings</option>
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

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm font-bold text-black border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
