import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toggleFeatured } from "./actions";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const [{ data: cardListings }, { data: customListings }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, status, is_featured, featured_until, card:cards(name, image_url)")
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false }),
    supabase
      .from("custom_listings")
      .select("id, status, is_featured, featured_until, title")
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false }),
  ]);

  const now = new Date().toISOString();

  type CardRow = { id: string; status: string; is_featured: boolean; featured_until: string | null; card: { name: string; image_url: string | null } };
  type CustomRow = { id: string; status: string; is_featured: boolean; featured_until: string | null; title: string };

  const allItems = [
    ...((cardListings ?? []) as unknown as CardRow[]).map(r => ({
      id: r.id, title: r.card.name, image: r.card.image_url,
      isFeatured: r.is_featured, featuredUntil: r.featured_until, isCustom: false, status: r.status,
    })),
    ...((customListings ?? []) as CustomRow[]).map(r => ({
      id: r.id, title: r.title, image: null,
      isFeatured: r.is_featured, featuredUntil: r.featured_until, isCustom: true, status: r.status,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-1">Admin — Featured listings</h1>
        <p className="text-sm text-gray-500 mb-6">Toggle featured status and set expiry dates.</p>

        {allItems.length === 0 ? (
          <p className="text-sm text-gray-500">No active listings.</p>
        ) : (
          <div className="space-y-3">
            {allItems.map((item) => {
              const isActiveFeatured = item.isFeatured &&
                (!item.featuredUntil || item.featuredUntil > now);
              const expiryValue = item.featuredUntil
                ? new Date(item.featuredUntil).toISOString().slice(0, 10)
                : "";

              return (
                <div key={item.id}
                  className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${
                    isActiveFeatured ? "border-amber-300 bg-amber-50" : "border-gray-200"
                  }`}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-auto rounded shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 rounded shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.isCustom && (
                        <span className="text-xs text-gray-500 border border-gray-200 rounded px-1.5">Custom</span>
                      )}
                      {isActiveFeatured && (
                        <span className="text-xs text-amber-700 font-medium">✦ Featured</span>
                      )}
                      {item.featuredUntil && (
                        <span className="text-xs text-gray-400">
                          until {new Date(item.featuredUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <form className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <input
                      type="date"
                      name="until"
                      defaultValue={expiryValue}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isActiveFeatured ? (
                      <button
                        formAction={async (fd) => {
                          "use server";
                          await toggleFeatured(item.id, item.isCustom, false, null);
                        }}
                        className="text-sm px-3 py-1.5 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        formAction={async (fd) => {
                          "use server";
                          const until = fd.get("until") as string | null;
                          await toggleFeatured(item.id, item.isCustom, true, until || null);
                        }}
                        className="text-sm px-3 py-1.5 bg-amber-400 text-amber-900 font-medium rounded-lg hover:bg-amber-500 transition-colors"
                      >
                        ✦ Feature
                      </button>
                    )}
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
