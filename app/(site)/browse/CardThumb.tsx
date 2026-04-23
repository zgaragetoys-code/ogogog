"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  cover?: boolean;
}

export default function CardThumb({ src, alt, cover }: Props) {
  const [failed, setFailed] = useState(false);

  if (cover) {
    if (failed) return (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center p-2">
        <span className="text-[10px] text-gray-700 text-center leading-tight line-clamp-4">{alt}</span>
      </div>
    );
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  if (failed) return (
    <div className="w-20 h-28 bg-gray-200 flex items-center justify-center p-1">
      <span className="text-[10px] text-gray-700 text-center leading-tight line-clamp-4">{alt}</span>
    </div>
  );
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className="h-full w-auto object-contain"
      onError={() => setFailed(true)}
    />
  );
}
