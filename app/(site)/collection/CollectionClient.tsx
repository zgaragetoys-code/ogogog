"use client";

import { useState, useTransition } from "react";
import CardSearch from "@/components/CardSearch";
import { addToCollection, removeFromCollection, updateCollectionItem } from "./actions";
import type { Card } from "@/types/database";

type CollectionItem = {
  id: string;
  card_id: string;
  quantity: number;
  for_sale: boolean;
  card: {
    name: string;
    set_name: string;
    card_number: string;
    image_url: string | null;
  };
};

type Props = { initialItems: CollectionItem[] };

export default function CollectionClient({ initialItems }: Props) {
  const [items, setItems] = useState<CollectionItem[]>(initialItems);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [addKey, setAddKey] = useState(0); // forces CardSearch remount after add

  function handleAdd() {
    if (!selectedCard) return;
    const existing = items.find(i => i.card_id === selectedCard.id);
    const newQty = existing ? existing.quantity + addQty : addQty;

    startTransition(async () => {
      await addToCollection(selectedCard.id, newQty);
      if (existing) {
        setItems(prev =>
          prev.map(i => i.card_id === selectedCard.id ? { ...i, quantity: newQty } : i)
        );
      } else {
        setItems(prev => [{
          id: crypto.randomUUID(),
          card_id: selectedCard.id,
          quantity: newQty,
          for_sale: false,
          card: {
            name: selectedCard.name,
            set_name: selectedCard.set_name,
            card_number: selectedCard.card_number,
            image_url: selectedCard.image_url,
          },
        }, ...prev]);
      }
      setSelectedCard(null);
      setAddQty(1);
      setAddKey(k => k + 1);
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeFromCollection(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    });
  }

  function handleToggleForSale(item: CollectionItem) {
    startTransition(async () => {
      await updateCollectionItem(item.id, { for_sale: !item.for_sale });
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, for_sale: !i.for_sale } : i)
      );
    });
  }

  function handleQuantityChange(item: CollectionItem, qty: number) {
    if (qty < 1) return;
    startTransition(async () => {
      await updateCollectionItem(item.id, { quantity: qty });
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, quantity: qty } : i)
      );
    });
  }

  const forSaleCount = items.filter(i => i.for_sale).length;

  return (
    <div className="space-y-6">

      {/* Add card panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Add a card</h2>
        <CardSearch key={addKey} onSelect={setSelectedCard} />

        {selectedCard && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-black">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAddQty(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm"
                >−</button>
                <span className="px-3 py-1.5 text-sm text-black min-w-[2rem] text-center">{addQty}</span>
                <button
                  type="button"
                  onClick={() => setAddQty(q => q + 1)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm"
                >+</button>
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Adding…" : "Add to collection"}
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      {items.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><span className="font-semibold text-black">{items.length}</span> unique cards</span>
          <span><span className="font-semibold text-black">{items.reduce((s, i) => s + i.quantity, 0)}</span> total copies</span>
          {forSaleCount > 0 && (
            <span><span className="font-semibold text-green-700">{forSaleCount}</span> for sale</span>
          )}
        </div>
      )}

      {/* Collection grid */}
      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-black font-medium mb-1">Your collection is empty</p>
          <p className="text-sm text-gray-500">Search for a card above to start adding.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-3 flex flex-col gap-2 ${
                item.for_sale ? "border-green-300" : "border-gray-200"
              }`}
            >
              {item.card.image_url ? (
                <img
                  src={item.card.image_url}
                  alt={item.card.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="w-full aspect-[2.5/3.5] bg-gray-100 rounded" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black leading-tight truncate">{item.card.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.card.set_name} · #{item.card.card_number}</p>
              </div>

              {/* Quantity control */}
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    disabled={isPending || item.quantity <= 1}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >−</button>
                  <span className="px-2 py-0.5 text-xs text-black">{item.quantity}×</span>
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    disabled={isPending}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >+</button>
                </div>
              </div>

              {/* For sale toggle */}
              <button
                onClick={() => handleToggleForSale(item)}
                disabled={isPending}
                className={`w-full text-xs py-1 rounded-lg font-medium transition-colors ${
                  item.for_sale
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.for_sale ? "✓ For sale" : "Not for sale"}
              </button>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="w-full text-xs py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
