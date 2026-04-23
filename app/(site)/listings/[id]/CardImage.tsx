"use client";

import { useState } from "react";

export default function CardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div className="w-28 h-40 bg-gray-200 flex items-center justify-center p-2">
      <span className="text-xs text-gray-700 text-center leading-tight">{alt}</span>
    </div>
  );
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className="w-28 h-auto"
      onError={() => setFailed(true)}
    />
  );
}
