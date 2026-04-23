"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
}

export default function SafeImage({ src, alt, className, fallback, referrerPolicy }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      onError={() => setFailed(true)}
    />
  );
}
