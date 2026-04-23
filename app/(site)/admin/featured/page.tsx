import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toggleFeatured } from "./actions";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const [{ data: cardListings }, { data: customListings }] = await Promise.all([
    supabase.from("listings").select("id, status, is_featured, featured_until, card:cards(name, image_url)").in("status", ["active", "pending"]).order("created_at", { ascending: false }),
    supabase.from("custom_listings").select("id, status, is_featured, featured_until, title").in("status", ["active", "pending"]).order("created_at", { ascending: false }),
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
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Admin — Featured</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Toggle featured status and set expiry dates.</p>
        </div>

        {allItems.length === 0 ? (
          <div className="border-2 border-black p-12 text-center">
            <p className="text-sm font-bold text-gray-500">No active listings.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
            {allItems.map((item) => {
              const isActiveFeatured = item.isFeatured && (!item.featuredUntil || item.featuredUntil > now);
              const expiryValue = item.featuredUntil ? new Date(item.featuredUntil).toISOString().slice(0, 10) : "";

              return (
                <div key={item.id} className={`flex items-center gap-4 p-4 ${isActiveFeatured ? "bg-yellow-50" : "bg-white"}`}>
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-auto shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-200 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.isCustom && (
                        <span className="text-[10px] font-black border border-black px-1.5 uppercase">Custom</span>
                      )}
                      {isActiveFeatured && (
                        <span className="text-[10px] font-black bg-yellow-400 text-black px-1.5 uppercase">✦ Featured</span>
                      )}
                      {item.featuredUntil && (
                        <span className="text-xs text-gray-400">until {new Date(item.featuredUntil).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <form className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <input
                      type="date"
                      name="until"
                      defaultValue={expiryValue}
                      className="text-sm border-2 border-black px-2 py-1 focus:outline-none focus:ring-0"
                    />
                    {isActiveFeatured ? (
                      <button
                        formAction={async () => {
                          "use server";
                          await toggleFeatured(item.id, item.isCustom, false, null);
                        }}
                        className="text-sm px-3 py-1.5 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
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
                        className="text-sm px-3 py-1.5 bg-yellow-400 text-black font-black hover:bg-yellow-500 transition-colors"
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
