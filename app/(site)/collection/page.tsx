import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CollectionClient from "./CollectionClient";

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/collection");

  const { data } = await supabase
    .from("collection_items")
    .select("id, card_id, quantity, for_sale, condition_type, raw_condition, grading_company, grade, notes, card:cards(name, set_name, card_number, image_url, product_type)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">My collection</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track what you own and mark cards for sale.
            </p>
          </div>
          <Link
            href="/profile"
            className="text-sm font-bold text-black hover:underline"
          >
            ← Profile
          </Link>
        </div>

        <CollectionClient initialItems={(data ?? []) as unknown as Parameters<typeof CollectionClient>[0]["initialItems"]} />
      </main>
    </div>
  );
}
