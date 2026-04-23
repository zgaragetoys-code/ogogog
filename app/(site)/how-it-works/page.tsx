import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | ogogog",
  description: "ogogog is a peer-to-peer Pokemon TCG marketplace. List your cards, find what you're looking for, and deal directly with other collectors.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-2">How it works</h1>
        <p className="text-sm text-gray-500 mb-10">
          ogogog is a peer-to-peer Pokemon TCG marketplace. No platform fees. No middlemen.
        </p>

        <div className="space-y-5">

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">1. Browse listings</h2>
            <p className="text-sm text-black leading-relaxed">
              Anyone can browse the public feed — no account needed. Filter by listing type (For Sale / Wanted),
              condition (raw, graded, sealed), or product type. Search for specific cards by name.
            </p>
            <Link href="/browse" className="inline-block mt-4 text-sm font-bold text-black border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              Browse now →
            </Link>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">2. Create a listing</h2>
            <p className="text-sm text-black leading-relaxed">
              Sign up free and post a listing in minutes. List any Pokemon TCG card or sealed product
              for sale, or post a &ldquo;Wanted&rdquo; listing to let collectors know what you&apos;re looking for.
              Set your price, add condition details, and link to photos from Imgur, Google Drive, or anywhere online.
            </p>
            <Link href="/listings/new" className="inline-block mt-4 text-sm font-bold text-black border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              Create a listing →
            </Link>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">3. Message the seller</h2>
            <p className="text-sm text-black leading-relaxed">
              Found something you want? Message the seller directly through the listing. Negotiate,
              ask questions, and agree on a deal — all through the built-in messaging. Each conversation
              is tied to a specific listing so nothing gets mixed up.
            </p>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">4. Pay via PayPal G&S</h2>
            <p className="text-sm text-black leading-relaxed">
              ogogog does not process payments. Once you agree on a deal, payment happens directly
              between buyer and seller. We strongly recommend <strong>PayPal Goods &amp; Services</strong> for
              buyer protection — never Friends &amp; Family with strangers.
            </p>
            <div className="mt-4 border-l-4 border-black pl-4">
              <p className="text-xs font-black uppercase tracking-widest text-black mb-1">Stay safe</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Always use PayPal G&S, never F&F. Ask for tracking. Deal with sellers who have a history on the site.
                Never send payment before agreeing on all terms.
              </p>
            </div>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">5. Mark as sold</h2>
            <p className="text-sm text-black leading-relaxed">
              Once a deal is done, the seller marks the listing as sold. Sold listings are kept for
              reference but removed from the active feed.
            </p>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">Featured listings</h2>
            <p className="text-sm text-black leading-relaxed">
              Want more eyes on your listing? Featured listings appear prominently in the browse feed.
              Email us with your listing URL to get featured.
            </p>
            <Link href="/feature-your-listing" className="inline-block mt-4 text-sm font-bold text-black border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              Feature your listing →
            </Link>
          </section>

        </div>

        <div className="mt-10 text-center">
          <Link href="/auth/signup" className="inline-block bg-black text-white text-sm font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">
            Get started free →
          </Link>
        </div>
      </main>
    </div>
  );
}
