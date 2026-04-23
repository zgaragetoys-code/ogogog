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
    .select("id, card_id, quantity, for_sale, card:cards(name, set_name, card_number, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">My collection</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track what you own and mark cards for sale.
            </p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Profile
          </Link>
        </div>

        <CollectionClient initialItems={(data ?? []) as unknown as Parameters<typeof CollectionClient>[0]["initialItems"]} />
      </main>
    </div>
  );
}
