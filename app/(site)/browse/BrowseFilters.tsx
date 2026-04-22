"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/types/database";

const selectCls =
  "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-black " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";

export default function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const type = params.get("type") ?? "";
  const condition = params.get("condition") ?? "";
  const product = params.get("product") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => update("type", e.target.value)}
        className={selectCls}
        aria-label="Listing type"
      >
        <option value="">All listings</option>
        <option value="for_sale">For Sale</option>
        <option value="wanted">Wanted</option>
      </select>

      <select
        value={condition}
        onChange={(e) => update("condition", e.target.value)}
        className={selectCls}
        aria-label="Condition"
      >
        <option value="">Any condition</option>
        <option value="raw">Raw</option>
        <option value="graded">Graded</option>
        <option value="sealed">Sealed</option>
      </select>

      <select
        value={product}
        onChange={(e) => update("product", e.target.value)}
        className={selectCls}
        aria-label="Product type"
      >
        <option value="">Any product</option>
        {PRODUCT_TYPES.map((pt) => (
          <option key={pt} value={pt}>
            {PRODUCT_TYPE_LABELS[pt as ProductType]}
          </option>
        ))}
      </select>

      {(type || condition || product) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-blue-600 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
