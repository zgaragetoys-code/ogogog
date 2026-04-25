"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CardSearch from "@/components/CardSearch";
import CollectionImport from "./CollectionImport";
import { addToCollection, removeFromCollection, updateCollectionItem, togglePinned } from "./actions";
import {
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  type Card,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
} from "@/types/database";

type CollectionItem = {
  id: string;
  card_id: string;
  quantity: number;
  for_sale: boolean;
  pinned: boolean;
  condition_type: ConditionType | null;
  raw_condition: RawCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  notes: string | null;
  card: {
    name: string;
    set_name: string;
    card_number: string;
    image_url: string | null;
    product_type: string;
  };
};

type Props = { initialItems: CollectionItem[] };

const inputCls = "w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none";
const labelCls = "block text-xs font-black text-black mb-1 uppercase tracking-widest";

function conditionLabel(item: CollectionItem): string {
  if (!item.condition_type) return "";
  if (item.condition_type === "raw" && item.raw_condition) return RAW_CONDITION_LABELS[item.raw_condition];
  if (item.condition_type === "graded" && item.grading_company && item.grade !== null) return `${item.grading_company} ${item.grade}`;
  if (item.condition_type === "sealed") return "Sealed";
  return item.condition_type;
}

export default function CollectionClient({ initialItems }: Props) {
  const [items, setItems] = useState<CollectionItem[]>(initialItems);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addKey, setAddKey] = useState(0);

  // Add form state
  const [conditionType, setConditionType] = useState<ConditionType>("raw");
  const [rawCondition, setRawCondition] = useState<RawCondition | "">("");
  const [sealedCondition, setSealedCondition] = useState<SealedCondition | "">("");
  const [gradingCompany, setGradingCompany] = useState<GradingCompany | "">("");
  const [grade, setGrade] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const cardIsSealed = selectedCard ? SEALED_PRODUCT_TYPES.has(selectedCard.product_type) : false;
  const gradeChoices = gradingCompany ? GRADE_OPTIONS[gradingCompany] : [];

  function resetForm() {
    setConditionType("raw");
    setRawCondition("");
    setSealedCondition("");
    setGradingCompany("");
    setGrade("");
    setQuantity(1);
    setNotes("");
    setFormError("");
    setSelectedCard(null);
    setAddKey((k) => k + 1);
  }

  function handleCardSelect(card: Card | null) {
    setSelectedCard(card);
    setFormError("");
    if (card && !SEALED_PRODUCT_TYPES.has(card.product_type) && conditionType === "sealed") {
      setConditionType("raw");
    }
  }

  function handleAdd() {
    if (!selectedCard) return;
    if (conditionType === "raw" && !rawCondition) { setFormError("Please select a condition grade."); return; }
    if (conditionType === "graded" && (!gradingCompany || !grade)) { setFormError("Please select grading company and grade."); return; }
    setFormError("");

    const existing = items.find((i) => i.card_id === selectedCard.id);
    const newQty = existing ? existing.quantity + quantity : quantity;
    const cardSnapshot = selectedCard;

    startTransition(async () => {
      const result = await addToCollection(cardSnapshot.id, newQty, {
        condition_type: conditionType || null,
        raw_condition: conditionType === "raw" ? (rawCondition || null) : null,
        grading_company: conditionType === "graded" ? (gradingCompany || null) : null,
        grade: conditionType === "graded" && grade ? parseFloat(grade) : null,
        notes: notes.trim() || null,
      });

      if ("error" in result) {
        setFormError(result.error);
        return;
      }

      if (existing) {
        setItems((prev) =>
          prev.map((i) => i.card_id === cardSnapshot.id ? { ...i, quantity: newQty } : i)
        );
      } else {
        // Use the real DB id returned by the server action — NOT a client-generated UUID.
        // A fake UUID here would break subsequent remove/update calls.
        setItems((prev) => [{
          id: result.id,
          card_id: cardSnapshot.id,
          quantity: newQty,
          for_sale: false,
          pinned: false,
          condition_type: conditionType,
          raw_condition: conditionType === "raw" ? (rawCondition || null) : null,
          grading_company: conditionType === "graded" ? (gradingCompany || null) : null,
          grade: conditionType === "graded" && grade ? parseFloat(grade) : null,
          notes: notes.trim() || null,
          card: {
            name: cardSnapshot.name,
            set_name: cardSnapshot.set_name,
            card_number: cardSnapshot.card_number,
            image_url: cardSnapshot.image_url,
            product_type: cardSnapshot.product_type,
          },
        }, ...prev]);
      }
      resetForm();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      const result = await removeFromCollection(itemId);
      if (result?.error) return;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    });
  }

  function handleToggleForSale(item: CollectionItem) {
    startTransition(async () => {
      const result = await updateCollectionItem(item.id, { for_sale: !item.for_sale });
      if (result?.error) return;
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, for_sale: !i.for_sale } : i));
    });
  }

  function handleQuantityChange(item: CollectionItem, qty: number) {
    if (qty < 1) return;
    startTransition(async () => {
      const result = await updateCollectionItem(item.id, { quantity: qty });
      if (result?.error) return;
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: qty } : i));
    });
  }

  function handleTogglePinned(item: CollectionItem) {
    startTransition(async () => {
      const result = await togglePinned(item.id, !item.pinned, pinnedCount);
      if (result?.error) { setFormError(result.error); return; }
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, pinned: !i.pinned } : i));
    });
  }

  function handleImported(count: number) {
    if (count > 0) router.refresh();
  }

  const forSaleCount = items.filter((i) => i.for_sale).length;
  const totalCopies = items.reduce((s, i) => s + i.quantity, 0);
  const pinnedCount = items.filter((i) => i.pinned).length;

  return (
    <div className="space-y-6">

      {/* CSV import */}
      <CollectionImport onImported={handleImported} />

      {/* Add card panel */}
      <div className="border-2 border-black p-5 space-y-5">
        <h2 className="text-xs font-black text-black uppercase tracking-widest">Add a card</h2>

        <div>
          <label className={labelCls}>Search card</label>
          <CardSearch key={addKey} onSelect={handleCardSelect} />
        </div>

        {selectedCard && (
          <>
            {/* Card preview */}
            <div className="flex gap-4 items-start border-2 border-black p-4 bg-gray-50">
              {selectedCard.image_url && (
                <img src={selectedCard.image_url} alt={selectedCard.name} className="w-16 h-auto shrink-0" />
              )}
              <div>
                <p className="font-black text-black">{selectedCard.name}</p>
                <p className="text-sm text-gray-700">{selectedCard.set_name} · #{selectedCard.card_number}</p>
              </div>
            </div>

            {/* Condition type */}
            <div>
              <label className={labelCls}>Condition type</label>
              <div className="flex gap-2">
                {(["raw", "graded", ...(cardIsSealed ? ["sealed"] : [])] as ConditionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setConditionType(t); setRawCondition(""); setSealedCondition(""); setGradingCompany(""); setGrade(""); }}
                    className={`px-4 py-2 text-sm font-bold border-2 transition-colors ${
                      conditionType === t ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition detail */}
            {conditionType === "raw" && (
              <div>
                <label htmlFor="raw_cond" className={labelCls}>Condition grade</label>
                <select id="raw_cond" value={rawCondition} onChange={(e) => setRawCondition(e.target.value as RawCondition)} className={inputCls}>
                  <option value="">Select grade…</option>
                  {RAW_CONDITIONS.map((c) => <option key={c} value={c}>{RAW_CONDITION_LABELS[c]}</option>)}
                </select>
              </div>
            )}

            {conditionType === "sealed" && (
              <div>
                <label htmlFor="sealed_cond" className={labelCls}>Sealed condition</label>
                <select id="sealed_cond" value={sealedCondition} onChange={(e) => setSealedCondition(e.target.value as SealedCondition)} className={inputCls}>
                  <option value="">Select condition…</option>
                  {SEALED_CONDITIONS.map((c) => <option key={c} value={c}>{SEALED_CONDITION_LABELS[c]}</option>)}
                </select>
              </div>
            )}

            {conditionType === "graded" && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="grading_co" className={labelCls}>Grading company</label>
                  <select id="grading_co" value={gradingCompany} onChange={(e) => { setGradingCompany(e.target.value as GradingCompany); setGrade(""); }} className={inputCls}>
                    <option value="">Select company…</option>
                    {GRADING_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {gradingCompany && (
                  <div>
                    <label htmlFor="grade_val" className={labelCls}>Grade</label>
                    <select id="grade_val" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
                      <option value="">Select grade…</option>
                      {gradeChoices.map((g) => <option key={g} value={String(g)}>{g}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className={labelCls}>Quantity</label>
              <div className="flex items-center border-2 border-black w-fit">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 transition-colors">−</button>
                <span className="px-5 py-2 text-sm font-bold text-black border-x-2 border-black min-w-[3rem] text-center">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 transition-colors">+</button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="coll_notes" className={labelCls}>Notes <span className="font-normal normal-case tracking-normal">(optional)</span></label>
              <input id="coll_notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. From Evolving Skies ETB, slight crease on back"
                className={inputCls} />
            </div>

            {formError && <p className="text-sm text-red-600 font-bold">{formError}</p>}

            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={isPending}
                className="flex-1 py-2.5 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                {isPending ? "Adding…" : "Add to collection"}
              </button>
              <button onClick={resetForm} type="button"
                className="px-4 py-2.5 border-2 border-black text-sm font-bold text-black hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="flex items-center gap-5 text-sm">
          <span><span className="font-black text-black">{items.length}</span> <span className="text-gray-700">unique cards</span></span>
          <span><span className="font-black text-black">{totalCopies}</span> <span className="text-gray-700">total copies</span></span>
          {forSaleCount > 0 && (
            <span><span className="font-black text-black">{forSaleCount}</span> <span className="text-gray-700">for sale</span></span>
          )}
        </div>
      )}

      {/* Collection grid */}
      {items.length === 0 ? (
        <div className="border-2 border-black p-16 text-center">
          <p className="text-black font-bold mb-1">Your collection is empty</p>
          <p className="text-sm text-gray-700">Search for a card above to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => {
            const cond = conditionLabel(item);
            return (
              <div key={item.id} className="border-2 border-black p-3 flex flex-col gap-2">
                {item.card.image_url ? (
                  <img src={item.card.image_url} alt={item.card.name} referrerPolicy="no-referrer" className="w-full h-auto" />
                ) : (
                  <div className="w-full aspect-[2.5/3.5] bg-gray-100" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-black leading-tight truncate">{item.card.name}</p>
                  <p className="text-[11px] text-gray-700 truncate">{item.card.set_name} · #{item.card.card_number}</p>
                  {cond && <p className="text-[11px] font-bold text-black mt-0.5">{cond}</p>}
                  {item.notes && <p className="text-[10px] text-gray-700 truncate mt-0.5">{item.notes}</p>}
                </div>

                {/* Quantity control */}
                <div className="flex items-center border-2 border-black">
                  <button onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    disabled={isPending || item.quantity <= 1}
                    className="px-2 py-0.5 text-xs font-bold text-black hover:bg-gray-100 disabled:opacity-30">−</button>
                  <span className="flex-1 py-0.5 text-xs font-bold text-black border-x-2 border-black text-center">{item.quantity}×</span>
                  <button onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    disabled={isPending}
                    className="px-2 py-0.5 text-xs font-bold text-black hover:bg-gray-100 disabled:opacity-30">+</button>
                </div>

                {/* For sale toggle */}
                <button onClick={() => handleToggleForSale(item)} disabled={isPending}
                  className={`w-full text-xs py-1.5 font-black uppercase tracking-widest transition-colors border-2 ${
                    item.for_sale
                      ? "bg-black text-white border-black hover:bg-zinc-800"
                      : "bg-white text-black border-black hover:bg-gray-100"
                  }`}>
                  {item.for_sale ? "✓ For sale" : "Not for sale"}
                </button>

                {/* Pin to profile */}
                <button
                  onClick={() => handleTogglePinned(item)}
                  disabled={isPending || (!item.pinned && pinnedCount >= 6)}
                  className={`w-full text-xs py-1.5 font-black uppercase tracking-widest transition-colors border-2 disabled:opacity-40 ${
                    item.pinned
                      ? "bg-amber-400 text-black border-amber-400 hover:bg-amber-300"
                      : "bg-white text-black border-black hover:bg-gray-100"
                  }`}
                >
                  {item.pinned ? `★ Profile (${pinnedCount}/6)` : `Display this (${pinnedCount}/6)`}
                </button>

                {/* Create listing shortcut */}
                <Link
                  href={`/listings/new?card_id=${item.card_id}&from=collection`}
                  className="w-full text-xs py-1.5 font-black uppercase tracking-widest text-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors block"
                >
                  List this →
                </Link>

                {/* Remove */}
                <button onClick={() => handleRemove(item.id)} disabled={isPending}
                  className="w-full text-xs py-1 font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors border-2 border-red-600">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
