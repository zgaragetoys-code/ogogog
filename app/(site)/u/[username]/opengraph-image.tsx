import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_seed, country, created_at")
    .eq("username", username)
    .maybeSingle();

  const { count: listingCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile?.id ?? "")
    .eq("status", "active");

  const displayName = profile?.display_name ?? profile?.username ?? username;
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#ffffff", fontFamily: "sans-serif", border: "8px solid #000" }}>
      {/* Left black panel */}
      <div style={{ width: 320, backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", backgroundColor: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, color: "#fff" }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
      {/* Right: info */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 64px", justifyContent: "center", gap: 20 }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#000", lineHeight: 1 }}>{displayName}</div>
        <div style={{ fontSize: 24, color: "#777", fontWeight: 600 }}>@{username}</div>
        <div style={{ display: "flex", gap: 32, marginTop: 24 }}>
          {(listingCount ?? 0) > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#000" }}>{listingCount}</div>
              <div style={{ fontSize: 14, color: "#888", fontWeight: 700, letterSpacing: 2 }}>ACTIVE LISTINGS</div>
            </div>
          )}
          {memberYear && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#000" }}>{memberYear}</div>
              <div style={{ fontSize: 14, color: "#888", fontWeight: 700, letterSpacing: 2 }}>MEMBER SINCE</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 18, color: "#bbb", fontWeight: 700, letterSpacing: 2, marginTop: 16 }}>ogogog-marketplace.com</div>
      </div>
    </div>,
    { ...size }
  );
}
