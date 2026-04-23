import { createAdminClient } from "@/lib/supabase/server";
import {
  deleteUserListing,
  cancelUserListing,
  deleteUserAccount,
} from "./actions";

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const [
    { data: { users: authUsers } },
    { data: profiles },
    { data: listings },
    { data: collections },
    { data: messages },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id, username, display_name, avatar_style, avatar_seed, created_at"),
    admin.from("listings").select("id, user_id, status, listing_type, price, created_at, title, card:cards!card_id(name)"),
    admin.from("collection_items").select("id, user_id, created_at"),
    admin.from("messages").select("id, sender_id, created_at"),
  ]);

  type AuthUser = { id: string; email?: string; created_at: string; last_sign_in_at?: string };
  type Profile = { id: string; username: string | null; display_name: string | null; avatar_style: string | null; avatar_seed: string | null; created_at: string };
  type ListingRow = { id: string; user_id: string; status: string; listing_type: string; price: number | null; created_at: string; title: string | null; card: { name: string } | null };
  type CollectionRow = { id: string; user_id: string; created_at: string };
  type MessageRow = { id: string; sender_id: string; created_at: string };

  const profileMap = new Map<string, Profile>(
    ((profiles ?? []) as Profile[]).map(p => [p.id, p])
  );

  const listingsByUser = new Map<string, ListingRow[]>();
  ((listings ?? []) as unknown as ListingRow[]).forEach(l => {
    const arr = listingsByUser.get(l.user_id) ?? [];
    arr.push(l);
    listingsByUser.set(l.user_id, arr);
  });

  const collectionCountByUser = new Map<string, number>();
  ((collections ?? []) as CollectionRow[]).forEach(c => {
    collectionCountByUser.set(c.user_id, (collectionCountByUser.get(c.user_id) ?? 0) + 1);
  });

  const lastMessageByUser = new Map<string, string>();
  ((messages ?? []) as MessageRow[]).forEach(m => {
    const prev = lastMessageByUser.get(m.sender_id);
    if (!prev || m.created_at > prev) lastMessageByUser.set(m.sender_id, m.created_at);
  });

  const users = ((authUsers ?? []) as AuthUser[]).map(u => {
    const profile = profileMap.get(u.id);
    const userListings = listingsByUser.get(u.id) ?? [];
    const lastListing = userListings.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at;
    const lastMsg = lastMessageByUser.get(u.id);
    const lastActivity = [lastListing, lastMsg, u.last_sign_in_at].filter(Boolean).sort((a, b) => b!.localeCompare(a!)).at(0) ?? u.created_at;

    return {
      id: u.id,
      email: u.email ?? "",
      signedUpAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      lastActivity,
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      listings: userListings,
      collectionCount: collectionCountByUser.get(u.id) ?? 0,
    };
  }).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  const statusBadge: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    sold: "bg-blue-100 text-blue-600",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-black text-black uppercase tracking-tight">Users</h1>
        <p className="text-xs text-gray-700 mt-1">{users.length} accounts · sorted by recent activity</p>
      </div>

      <div className="space-y-6">
        {users.map(u => {
          const label = u.displayName ?? u.username ?? u.email;
          const allListings = u.listings
            .map(l => ({
              ...l,
              isCustom: !l.card,
              displayTitle: l.card?.name ?? l.title ?? "(untitled)",
            }))
            .sort((a, b) => b.created_at.localeCompare(a.created_at));

          return (
            <div key={u.id} className="border-2 border-black">
              {/* User header */}
              <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 border-b-2 border-black">
                <div>
                  <p className="font-black text-sm text-black">{label}</p>
                  <p className="text-xs text-gray-700">{u.email}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-700">
                    <span>{allListings.length} listing{allListings.length !== 1 ? "s" : ""}</span>
                    <span>{u.collectionCount} in collection</span>
                    <span>joined {new Date(u.signedUpAt).toLocaleDateString()}</span>
                    {u.lastSignIn && <span>last login {new Date(u.lastSignIn).toLocaleDateString()}</span>}
                  </div>
                </div>
                <form>
                  <button
                    formAction={async () => {
                      "use server";
                      await deleteUserAccount(u.id);
                    }}
                    className="text-xs px-2 py-1 bg-red-600 text-white font-black hover:bg-red-700 transition-colors uppercase"
                  >
                    Delete account
                  </button>
                </form>
              </div>

              {/* Listings */}
              {allListings.length === 0 ? (
                <p className="text-xs text-gray-700 px-4 py-3">No listings.</p>
              ) : (
                <div className="divide-y divide-black/10">
                  {allListings.map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">{l.displayTitle}</p>
                        <div className="flex gap-2 items-center mt-0.5">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase ${statusBadge[l.status] ?? "bg-gray-100"}`}>
                            {l.status}
                          </span>
                          {l.isCustom && (
                            <span className="text-[10px] font-black border border-black px-1.5 py-0.5 uppercase">Custom</span>
                          )}
                          <span className="text-xs text-gray-700">
                            {l.listing_type === "for_sale" ? "For Sale" : "Wanted"}
                            {l.price != null && ` · $${Number(l.price).toFixed(2)}`}
                            {" · "}{new Date(l.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {(l.status === "active" || l.status === "pending") && (
                          <form>
                            <button
                              formAction={async () => {
                                "use server";
                                await cancelUserListing(l.id);
                              }}
                              className="text-xs px-2 py-1 border-2 border-red-500 text-red-600 font-bold hover:bg-red-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                        <form>
                          <button
                            formAction={async () => {
                              "use server";
                              await deleteUserListing(l.id);
                            }}
                            className="text-xs px-2 py-1 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
