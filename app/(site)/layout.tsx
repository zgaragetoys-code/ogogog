import NavBarServer from "@/components/NavBarServer";
import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBarServer />
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
