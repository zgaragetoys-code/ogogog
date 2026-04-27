import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service — ogogog" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/browse" className="text-xs font-bold uppercase tracking-widest text-gray-700 hover:text-black mb-8 inline-block">← Browse</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-700 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm text-black leading-relaxed">
          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">1. What ogogog is</h2>
            <p>ogogog is a classifieds-style marketplace where collectors can list Pokemon TCG cards and sealed products for sale or as wanted listings. We connect buyers and sellers — we do not process payments, hold funds, or take a cut of any transaction.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">2. Payments happen off-platform</h2>
            <p>All transactions are settled directly between buyers and sellers, typically via PayPal Goods &amp; Services or another method agreed upon privately. ogogog has no involvement in or liability for any payment disputes, chargebacks, or fraud between users.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">3. Your responsibilities</h2>
            <p>By using ogogog you agree to: list only items you own and have the right to sell; describe items accurately including condition; not post spam, duplicate listings, or prohibited content; not use automated tools to scrape or abuse the platform.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">4. No guarantees</h2>
            <p>ogogog is provided as-is. We do not verify the identity of users, the accuracy of listings, or the authenticity of cards. Use your own judgement before transacting. We are not responsible for scams, lost packages, or disputes between users.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">5. Content</h2>
            <p>You own content you post. By posting you grant ogogog a license to display it on the platform. We may remove any content that violates these terms or that we deem harmful to the community.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">6. Account termination</h2>
            <p>We reserve the right to suspend or delete accounts that violate these terms, post fraudulent listings, or harm other users — at our sole discretion.</p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-3">7. Changes</h2>
            <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
          </section>

          <p className="text-gray-500 text-xs pt-4 border-t border-gray-200">Questions? Email <a href="mailto:zgarage.toys@gmail.com" className="underline">zgarage.toys@gmail.com</a></p>
        </div>
      </main>
    </div>
  );
}
