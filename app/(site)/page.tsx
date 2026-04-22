import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-black text-sm">
          Listings feed coming soon — auth is working ✓
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-black mb-3">
          Pokemon TCG Marketplace
        </h1>
        <p className="text-black mb-8">
          Buy and sell Pokemon cards with collectors worldwide.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-2.5 border border-gray-300 text-black text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
