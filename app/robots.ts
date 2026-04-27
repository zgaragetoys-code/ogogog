import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ogogog-marketplace.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/profile", "/listings/mine", "/bookmarks", "/collection", "/messages"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
