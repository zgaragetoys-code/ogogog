import { createClient } from "@/lib/supabase/server";
import { signOut } from "./auth/actions";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
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
              className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-900">Pokemon TCG Marketplace</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-black hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-black text-sm">
          Listings feed coming soon — auth is working ✓
        </p>
      </main>
    </div>
  );
}
