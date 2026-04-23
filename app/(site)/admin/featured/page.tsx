import { createAdminClient } from "@/lib/supabase/server";
import { toggleFeatured, cancelAnyListing, deleteAnyListing } from "./actions";

export default async function AdminFeaturedPage() {
  const admin = createAdminClient();

  const [{ data: listingsData }, { data: allProfiles }] = await Promise.all([
    admin
      .from("listings")
      .select("id, status, is_featured, featured_until, created_at, user_id, listing_type, price, title, card:cards!card_id(name, image_url)")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, username, display_name"),
  ]);

  const now = new Date().toISOString();

  type ListingRow = {
    id: string; status: string; is_featured: boolean; featured_until: string | null;
    created_at: string; user_id: string; listing_type: string; price: number | null;
    title: string | null;
    card: { name: string; image_url: string | null } | null;
  };
  type ProfileRow = { id: string; username: string | null; display_name: string | null };

  const profileMap = new Map<string, ProfileRow>(
    ((allProfiles ?? []) as ProfileRow[]).map(p => [p.id, p])
  );

  const allItems = ((listingsData ?? []) as unknown as ListingRow[]).map(r => ({
    id: r.id,
    title: r.card?.name ?? r.title ?? "(untitled)",
    image: r.card?.image_url ?? null,
    isFeatured: r.is_featured,
    featuredUntil: r.featured_until,
    isCustom: !r.card,
    status: r.status,
    listingType: r.listing_type,
    price: r.price,
    userId: r.user_id,
    createdAt: r.created_at,
  }));

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    sold: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-700",
  };

  const totalActive = allItems.filter(i => i.status === "active").length;
  const totalFeatured = allItems.filter(i => i.isFeatured && (!i.featuredUntil || i.featuredUntil > now)).length;

  return (
    <div>
      <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">⚡ Admin Panel</h1>
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">Full access</span>
          </div>
          <p className="text-xs text-gray-700 mt-1">
            {allItems.length} total listings · {totalActive} active · {totalFeatured} featured
          </p>
        </div>

        {allItems.length === 0 ? (
          <div className="border-2 border-black p-12 text-center">
            <p className="text-sm font-bold text-gray-700">No listings yet.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
            {allItems.map((item) => {
              const isActiveFeatured = item.isFeatured && (!item.featuredUntil || item.featuredUntil > now);
              const expiryValue = item.featuredUntil ? new Date(item.featuredUntil).toISOString().slice(0, 10) : "";
              const profile = profileMap.get(item.userId);
              const ownerLabel = profile?.display_name ?? profile?.username ?? item.userId.slice(0, 8) + "…";

              return (
                <div key={item.id} className={`p-4 ${isActiveFeatured ? "bg-yellow-50" : item.status === "cancelled" || item.status === "sold" ? "bg-gray-50 opacity-60" : "bg-white"}`}>
                  <div className="flex items-start gap-4">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-10 h-auto shrink-0 mt-0.5" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-14 bg-gray-200 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-black truncate">{item.title}</p>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase ${statusColor[item.status] ?? "bg-gray-100"}`}>
                          {item.status}
                        </span>
                        {item.isCustom && (
                          <span className="text-[10px] font-black border border-black px-1.5 py-0.5 uppercase">Custom</span>
                        )}
                        {isActiveFeatured && (
                          <span className="text-[10px] font-black bg-yellow-400 text-black px-1.5 py-0.5 uppercase">✦ Featured</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5">
                        by <span className="font-semibold text-black">{ownerLabel}</span>
                        {" · "}{item.listingType === "for_sale" ? "For Sale" : "Wanted"}
                        {item.price != null && ` · $${Number(item.price).toFixed(2)}`}
                        {" · "}{new Date(item.createdAt).toLocaleDateString()}
                        {item.featuredUntil && ` · featured until ${new Date(item.featuredUntil).toLocaleDateString()}`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Feature toggle */}
                      {item.status === "active" && (
                        <form className="flex items-center gap-2">
                          <input
                            type="date"
                            name="until"
                            defaultValue={expiryValue}
                            className="text-xs border-2 border-black px-2 py-1 focus:outline-none w-32"
                          />
                          {isActiveFeatured ? (
                            <button
                              formAction={async () => {
                                "use server";
                                await toggleFeatured(item.id, false, null);
                              }}
                              className="text-xs px-2 py-1.5 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
                            >
                              Unfeature
                            </button>
                          ) : (
                            <button
                              formAction={async (fd) => {
                                "use server";
                                const until = fd.get("until") as string | null;
                                await toggleFeatured(item.id, true, until || null);
                              }}
                              className="text-xs px-2 py-1.5 bg-yellow-400 text-black font-black hover:bg-yellow-500 transition-colors"
                            >
                              ✦ Feature
                            </button>
                          )}
                        </form>
                      )}

                      {/* Cancel listing */}
                      {(item.status === "active" || item.status === "pending") && (
                        <form>
                          <button
                            formAction={async () => {
                              "use server";
                              await cancelAnyListing(item.id);
                            }}
                            className="text-xs px-2 py-1.5 border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      )}

                      {/* Hard delete */}
                      <form>
                        <button
                          formAction={async () => {
                            "use server";
                            await deleteAnyListing(item.id);
                          }}
                          className="text-xs px-2 py-1.5 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
