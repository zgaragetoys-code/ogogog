import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FALLBACK = (
  <div style={{ width: "100%", height: "100%", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
    <span style={{ color: "#fff", fontSize: 72, fontWeight: 900, letterSpacing: -2 }}>ogogog</span>
  </div>
);

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data } = await supabase
      .from("listings")
      .select("listing_type, price, price_type, condition_type, title, card:cards(name, set_name, image_url)")
      .eq("id", id)
      .maybeSingle();

    const l = data as {
      listing_type: string; price: number | null; price_type: string;
      condition_type: string | null; title: string | null;
      card: { name: string; set_name: string; image_url: string | null } | null;
    } | null;

    const cardName = l?.card?.name ?? l?.title ?? "Listing";
    const setName = l?.card?.set_name ?? "";
    const badge = l?.listing_type === "for_sale" ? "FOR SALE" : "WANTED";
    const price = l?.price_type === "open_to_offers"
      ? "Open to offers"
      : l?.price != null
      ? `$${l.price.toFixed(2)}`
      : "";
    const condition = l?.condition_type ? l.condition_type.toUpperCase() : "";
    const hasImage = !!l?.card?.image_url;

    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#ffffff", fontFamily: "sans-serif", border: "8px solid #000" }}>
        {/* Left: card image (only when available) */}
        {hasImage && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300, borderRight: "4px solid #000", backgroundColor: "#f5f5f5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l!.card!.image_url!} alt="" style={{ maxHeight: 560, maxWidth: 260, objectFit: "contain" }} />
          </div>
        )}
        {/* Right: info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 56px", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 14, fontWeight: 900, letterSpacing: 4, color: "#fff", backgroundColor: "#000", padding: "6px 16px", width: "fit-content" }}>{badge}</div>
          <div style={{ fontSize: hasImage ? 52 : 64, fontWeight: 900, color: "#000", lineHeight: 1.1, marginTop: 8 }}>{cardName}</div>
          {setName && <div style={{ fontSize: 24, color: "#555", fontWeight: 600 }}>{setName}</div>}
          <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
            {price && <div style={{ fontSize: 40, fontWeight: 900, color: "#000" }}>{price}</div>}
            {condition && <div style={{ fontSize: 18, fontWeight: 700, color: "#666", alignSelf: "flex-end", paddingBottom: 6 }}>{condition}</div>}
          </div>
          <div style={{ fontSize: 18, color: "#999", fontWeight: 700, letterSpacing: 2, marginTop: 8 }}>ogogog-marketplace.com</div>
        </div>
      </div>,
      { ...size }
    );
  } catch {
    return new ImageResponse(FALLBACK, { ...size });
  }
}
