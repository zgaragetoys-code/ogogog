import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { avatarUrl } from "@/lib/avatar";
import type { AvatarStyle } from "@/types/database";
import NewConversation from "./NewConversation";

type Message = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Thread = {
  key: string;
  href: string;
  listingId: string | null;
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
  isDirect: boolean;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/messages");

  const [
    { data: allMessages },
    { data: listingsForSearch },
    { data: allProfiles },
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select("id, user_id, listing_type, price, title, card:cards!card_id(name)")
      .eq("status", "active")
      .neq("user_id", user.id),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_seed, avatar_style"),
  ]);

  // Build thread map
  const threadMap = new Map<string, Thread>();
  for (const msg of (allMessages ?? []) as Message[]) {
    const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const isDirect = msg.listing_id === null;
    const key = isDirect ? `direct__${otherUserId}` : `${msg.listing_id}__${otherUserId}`;
    const href = isDirect ? `/messages/direct/${otherUserId}` : `/messages/${msg.listing_id}/${otherUserId}`;

    if (!threadMap.has(key)) {
      threadMap.set(key, {
        key,
        href,
        listingId: msg.listing_id,
        otherUserId,
        lastMessage: msg,
        unreadCount: 0,
        isDirect,
      });
    }
    if (msg.receiver_id === user.id && !msg.read_at) {
      threadMap.get(key)!.unreadCount++;
    }
  }

  const threads = [...threadMap.values()];

  // Resolve listing titles for non-direct threads
  const listingIds = [...new Set(threads.filter(t => !t.isDirect && t.listingId).map(t => t.listingId as string))];
  const listingMap = new Map<string, { title: string }>();
  if (listingIds.length > 0) {
    const { data: tl } = await supabase
      .from("listings")
      .select("id, title, card:cards(name)")
      .in("id", listingIds);
    for (const l of (tl ?? []) as unknown as { id: string; title: string | null; card: { name: string } | null }[]) {
      listingMap.set(l.id, { title: l.card?.name ?? l.title ?? "Listing" });
    }
  }

  type ProfileRow = { id: string; username: string | null; display_name: string | null; avatar_seed: string | null; avatar_style: AvatarStyle | null };
  const profileMap = new Map<string, ProfileRow>(
    ((allProfiles ?? []) as ProfileRow[]).map(p => [p.id, p])
  );

  // Build searchable users for NewConversation
  type ListingSearchRow = { id: string; user_id: string; listing_type: string; price: number | null; title: string | null; card: { name: string } | null };

  const listingsByOtherUser = new Map<string, { id: string; title: string; listing_type: string; price: number | null; status: string }[]>();
  for (const l of (listingsForSearch ?? []) as unknown as ListingSearchRow[]) {
    const arr = listingsByOtherUser.get(l.user_id) ?? [];
    arr.push({ id: l.id, title: l.card?.name ?? l.title ?? "(untitled)", listing_type: l.listing_type, price: l.price, status: "active" });
    listingsByOtherUser.set(l.user_id, arr);
  }

  const searchableUsers = ((allProfiles ?? []) as ProfileRow[])
    .filter(p => p.id !== user.id && (p.username || p.display_name))
    .map(p => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_seed: p.avatar_seed,
      avatar_style: (p.avatar_style ?? "identicon") as AvatarStyle,
      listings: listingsByOtherUser.get(p.id) ?? [],
    }));

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">Messages</h1>

        {/* Global chat — community channel, separate from private threads */}
        <Link href="/chat" className="flex items-center gap-4 p-4 mb-8 border-2 border-black hover:bg-black hover:text-white transition-colors group">
          <div className="w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center shrink-0 text-lg">💬</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-black group-hover:text-white uppercase tracking-tight">Global Chat</p>
            <p className="text-xs text-gray-700 group-hover:text-gray-300 mt-0.5">Community channel — everyone is here</p>
          </div>
          <svg className="w-4 h-4 text-black group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <NewConversation users={searchableUsers} />

        {threads.length === 0 ? (
          <div className="border-2 border-black p-12 text-center">
            <p className="text-black font-bold mb-1">No messages yet</p>
            <p className="text-sm text-gray-700">Use the search above to start a conversation.</p>
          </div>
        ) : (
          <div className="border-t-2 border-b-2 border-black">
            {threads.map((thread) => {
              const profile = profileMap.get(thread.otherUserId);
              const name = profile?.display_name ?? profile?.username ?? "User";
              const seed = profile?.avatar_seed ?? thread.otherUserId;
              const style = (profile?.avatar_style ?? "identicon") as AvatarStyle;
              const listingTitle = thread.isDirect ? null : (listingMap.get(thread.listingId!)?.title ?? "Listing");
              return (
                <div key={thread.key} className="flex items-center border-b-2 border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                  <Link href={thread.href} className="flex items-center gap-3 p-4 flex-1 min-w-0">
                    <img src={avatarUrl(style, seed)} alt={name} className="keep-round w-10 h-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-black truncate">{name}</p>
                        {thread.isDirect && (
                          <span className="text-[10px] font-black border border-black px-1.5 py-0.5 uppercase shrink-0">Chat</span>
                        )}
                        {thread.unreadCount > 0 && (
                          <span className="keep-round bg-black text-white text-xs font-black px-1.5 py-0.5 shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      {listingTitle && (
                        <p className="text-xs font-medium text-gray-700 truncate">Re: {listingTitle}</p>
                      )}
                      <p className="text-xs text-gray-700 truncate mt-0.5">{thread.lastMessage.content}</p>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-2 px-4 shrink-0">
                    <span className="text-xs font-bold text-gray-700">{timeAgo(thread.lastMessage.created_at)}</span>
                    {thread.listingId && (
                      <Link
                        href={`/listings/${thread.listingId}`}
                        className="text-[10px] font-black uppercase tracking-widest border border-black px-2 py-0.5 hover:bg-black hover:text-white transition-colors"
                      >
                        View listing
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
