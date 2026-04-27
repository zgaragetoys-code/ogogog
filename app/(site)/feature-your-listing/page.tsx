import Link from "next/link";

const CONTACT_EMAIL = "zgarage.toys@gmail.com";

export default function FeatureYourListingPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-2">
            <span className="text-yellow-400">✦</span> Feature your listing
          </h1>
          <p className="text-sm text-gray-700 mt-1">Get your card or product seen by more collectors — free.</p>
        </div>

        <div className="border-2 border-black p-6 mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-black mb-4">What you get</h2>
          <ul className="space-y-2.5 text-sm text-black">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-black mt-0.5">✦</span>
              Your listing appears throughout the browse feed with a yellow badge
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-black mt-0.5">✦</span>
              Shown on the dedicated <Link href="/featured" className="font-bold underline hover:no-underline">Featured</Link> page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-black mt-0.5">✦</span>
              Completely free — no charge, no catch
            </li>
          </ul>
        </div>

        <div className="border-2 border-black p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">How to get featured</h2>
          <p className="text-sm text-gray-700 mb-5">
            Email us with a link to your listing. We&apos;ll get it featured within 24 hours.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Feature my listing`}
            className="block w-full text-center bg-black text-white text-sm font-bold px-6 py-3 hover:bg-zinc-800 transition-colors"
          >
            Email to get featured
          </a>
          <p className="text-xs text-gray-700 text-center mt-3">{CONTACT_EMAIL}</p>
        </div>
      </main>
    </div>
  );
}
