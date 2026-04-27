import NavBarServer from "@/components/NavBarServer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let needsUsername = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    needsUsername = !profile?.username;
  }

  return (
    <>
      <NavBarServer />
      {needsUsername && (
        <div className="bg-yellow-400 border-b-2 border-black px-4 py-2 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-black">
            Set your username to complete your profile —{" "}
            <Link href="/profile" className="underline hover:no-underline">do it now →</Link>
          </p>
        </div>
      )}
      <div className="flex-1">{children}</div>
      <footer className="border-t-2 border-black mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-700">
          <span>© {new Date().getFullYear()} ogogog — Pokemon TCG Marketplace</span>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="hover:text-black transition-colors">How it works</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <a href="mailto:zgarage.toys@gmail.com" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
