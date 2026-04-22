import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewListingClient from "./NewListingClient";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/listings/new");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">Create a listing</h1>
        <NewListingClient />
      </main>
    </div>
  );
}
