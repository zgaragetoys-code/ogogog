import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ogogog-marketplace.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("profiles")
      .select("username, updated_at")
      .not("username", "is", null)
      .limit(2000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/browse`, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE}/featured`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/feature-your-listing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/board`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.7 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${BASE}/listings/${l.id}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const profilePages: MetadataRoute.Sitemap = (profiles ?? [])
    .filter((p) => p.username)
    .map((p) => ({
      url: `${BASE}/u/${p.username}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticPages, ...listingPages, ...profilePages];
}
