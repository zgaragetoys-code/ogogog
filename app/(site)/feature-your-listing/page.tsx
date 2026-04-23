import Link from "next/link";

const CONTACT_EMAIL = "contact@ogogog.com";

export default function FeatureYourListingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <span className="text-4xl">✦</span>
          <h1 className="text-3xl font-bold text-black mt-3 mb-2">Feature your listing</h1>
          <p className="text-gray-500">Get your card or product seen by more collectors.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 space-y-4">
          <h2 className="text-base font-semibold text-black">What you get</h2>
          <ul className="space-y-2 text-sm text-black">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✦</span>
              Your listing appears at the top of the browse feed with an amber badge
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✦</span>
              Shown on the dedicated <Link href="/featured" className="text-blue-600 hover:underline">Featured</Link> page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✦</span>
              Stays featured for the full duration you pay for
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-black mb-3">Pricing</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-black">$5</p>
              <p className="text-sm text-gray-500 mt-1">7 days</p>
            </div>
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-black">$15</p>
              <p className="text-sm text-gray-500 mt-1">30 days</p>
              <p className="text-xs text-amber-700 mt-1 font-medium">Best value</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3">
          <h2 className="text-base font-semibold text-black">How to get featured</h2>
          <p className="text-sm text-gray-500">
            Email us with a link to your listing, how long you want it featured, and we&apos;ll send payment details. Once payment is confirmed, your listing goes live within 24 hours.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Feature my listing`}
            className="inline-block bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors mt-2"
          >
            Email to get featured
          </a>
          <p className="text-xs text-gray-400">{CONTACT_EMAIL}</p>
        </div>
      </main>
    </div>
  );
}
