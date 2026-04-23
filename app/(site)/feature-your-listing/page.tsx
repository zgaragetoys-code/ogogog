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
          <p className="text-sm text-gray-700 mt-1">Get your card or product seen by more collectors.</p>
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
              Stays featured for the full duration you pay for
            </li>
          </ul>
        </div>

        <div className="border-2 border-black p-6 mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-black mb-4">Pricing</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-black p-5 text-center">
              <p className="text-3xl font-black text-black">$5</p>
              <p className="text-sm text-gray-700 mt-1 font-medium">7 days</p>
            </div>
            <div className="border-2 border-yellow-400 bg-yellow-50 p-5 text-center">
              <p className="text-3xl font-black text-black">$15</p>
              <p className="text-sm text-gray-700 mt-1 font-medium">30 days</p>
              <p className="text-xs font-black text-yellow-700 uppercase tracking-widest mt-1">Best value</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-black p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">How to get featured</h2>
          <p className="text-sm text-gray-700 mb-5">
            Email us with a link to your listing and how long you want it featured. We&apos;ll send payment details. Once confirmed, your listing goes live within 24 hours.
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
