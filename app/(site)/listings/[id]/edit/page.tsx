import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EditListingClient from "./EditListingClient";
import type { Listing, Card } from "@/types/database";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/listings/${id}/edit`);

  const { data: rawListing } = await supabase
    .from("listings")
    .select("*, card:cards(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rawListing) notFound();

  const listing = rawListing as unknown as Listing & { card?: Card | null };
  if (listing.status !== "active") redirect(`/listings/${id}`);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Edit listing</h1>
          <Link href={`/listings/${id}`} className="text-sm font-bold text-black hover:underline">
            ← Back
          </Link>
        </div>

        <EditListingClient listingId={id} listing={listing} />
      </main>
    </div>
  );
}
