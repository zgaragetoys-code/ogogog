import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center border-2 border-black p-10 max-w-sm w-full">
        <p className="text-6xl font-black text-black mb-2">404</p>
        <p className="text-sm font-bold text-black uppercase tracking-widest mb-6">Page not found</p>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/featured"
          className="inline-block bg-black text-white text-sm font-bold px-6 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          ← Back to listings
        </Link>
      </div>
    </div>
  );
}
