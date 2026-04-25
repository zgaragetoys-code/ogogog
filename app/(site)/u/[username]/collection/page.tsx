import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { RAW_CONDITION_LABELS } from "@/types/database";

type CollectionItem = {
  id: string;
  quantity: number;
  for_sale: boolean;
  pinned: boolean;
  condition_type: string | null;
  raw_condition: string | null;
  grading_company: string | null;
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

function conditionLabel(item: CollectionItem): string {
  if (!item.condition_type) return "";
  if (item.condition_type === "raw" && item.raw_condition)
    return RAW_CONDITION_LABELS[item.raw_condition as keyof typeof RAW_CONDITION_LABELS] ?? item.raw_condition;
  if (item.condition_type === "graded" && item.grading_company && item.grade !== null)
    return `${item.grading_company} ${item.grade}`;
  if (item.condition_type === "sealed") return "Sealed";
  return item.condition_type;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `${username}'s Collection — ogogog` };
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!profileData) notFound();

  const { data } = await supabase
    .from("collection_items")
    .select("id, quantity, for_sale, pinned, condition_type, raw_condition, grading_company, grade, notes, card:cards(name, set_name, card_number, image_url, product_type)")
    .eq("user_id", profileData.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const items = (data ?? []) as unknown as CollectionItem[];

  const displayName = profileData.display_name ?? profileData.username ?? "Collector";
  const forSaleCount = items.filter((i) => i.for_sale).length;
  const totalCopies = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/u/${username}`}
              className="text-xs font-black uppercase tracking-widest text-gray-700 hover:text-black transition-colors"
            >
              ← {displayName}
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black mt-1">
              Collection
            </h1>
            {items.length > 0 && (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-700">
                  <span className="font-black text-black">{items.length}</span> unique cards
                </span>
                <span className="text-sm text-gray-700">
                  <span className="font-black text-black">{totalCopies}</span> total copies
                </span>
                {forSaleCount > 0 && (
                  <span className="text-sm text-gray-700">
                    <span className="font-black text-green-700">{forSaleCount}</span> for sale
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-black p-16 text-center">
            <p className="text-black font-bold">No collection items yet.</p>
            <p className="text-sm text-gray-700 mt-1">
              {displayName} hasn&apos;t added any cards to their collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => {
              const cond = conditionLabel(item);
              return (
                <div key={item.id} className="border-2 border-black p-2 flex flex-col gap-1.5 group relative">
                  {/* Card image */}
                  {item.card?.image_url ? (
                    <SafeImage
                      src={item.card.image_url}
                      alt={item.card.name ?? ""}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto"
                      fallback={<div className="w-full aspect-[2.5/3.5] bg-gray-100" />}
                    />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-gray-100" />
                  )}

                  {/* Pinned badge — top-left */}
                  {item.pinned && (
                    <span className="absolute top-2 left-2 bg-amber-400 text-black text-[9px] font-black px-1 py-0.5 leading-none">
                      ★
                    </span>
                  )}

                  {/* For sale badge — top-right */}
                  {item.for_sale && (
                    <span className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-black px-1 py-0.5 leading-none">
                      FS
                    </span>
                  )}


                  {/* Card info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-black leading-tight truncate">{item.card.name}</p>
                    <p className="text-[10px] text-gray-700 truncate">{item.card.set_name} · #{item.card.card_number}{item.quantity > 1 ? ` · ×${item.quantity}` : ""}</p>
                    {cond && (
                      <p className="text-[10px] font-bold text-black mt-0.5">{cond}</p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5 italic">{item.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
