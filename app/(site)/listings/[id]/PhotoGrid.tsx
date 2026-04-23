"use client";

import { useState } from "react";

function domain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function PhotoItem({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-medium text-black hover:underline py-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {domain(url)} ↗
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="block aspect-square overflow-hidden border-2 border-black hover:opacity-90 transition-opacity">
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export default function PhotoGrid({ urls, notes }: { urls: string[]; notes: string | null }) {
  if (urls.length === 0) return null;

  const imageUrls = urls.filter((u) => u.startsWith("http://") || u.startsWith("https://"));
  if (imageUrls.length === 0) return null;

  return (
    <div className="border-2 border-black p-5">
      <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">Photos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-1">
        {imageUrls.map((url) => (
          <PhotoItem key={url} url={url} />
        ))}
      </div>
      {notes && <p className="text-xs text-gray-700 mt-2">{notes}</p>}
    </div>
  );
}
