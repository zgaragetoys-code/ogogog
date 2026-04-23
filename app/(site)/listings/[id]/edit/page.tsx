import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EditCardListingClient from "./EditCardListingClient";
import EditCustomListingClient from "./EditCustomListingClient";
import type { ListingWithCard, CustomListing } from "@/types/database";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/listings/${id}/edit`);

  const [{ data: cardListing }, { data: customListing }] = await Promise.all([
    supabase.from("listings").select("*, card:cards(*)").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("custom_listings").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
  ]);

  if (!cardListing && !customListing) notFound();

  const isCustom = !cardListing;

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Edit listing</h1>
          <Link href={`/listings/${id}`} className="text-sm font-bold text-black hover:underline">
            ← Back
          </Link>
        </div>

        {isCustom ? (
          <EditCustomListingClient
            listingId={id}
            listing={customListing as unknown as CustomListing}
          />
        ) : (
          <EditCardListingClient
            listingId={id}
            listing={cardListing as unknown as ListingWithCard}
          />
        )}
      </main>
    </div>
  );
}
