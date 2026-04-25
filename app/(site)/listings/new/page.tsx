import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ListingFormSwitcher from "./ListingFormSwitcher";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ card_id?: string; from?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/listings/new");

  const { card_id, from } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black">Create a listing</h1>
          {from === "collection" && (
            <Link href="/collection" className="text-sm font-bold text-black hover:underline">
              ← Back to collection
            </Link>
          )}
        </div>
        <ListingFormSwitcher initialCardId={card_id} />
      </main>
    </div>
  );
}
