import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { avatarUrl } from "@/lib/avatar";
import type { AvatarStyle } from "@/types/database";

type Message = {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Thread = {
  listingId: string;
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
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

  const { data: allMessages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const threadMap = new Map<string, Thread>();
  for (const msg of (allMessages ?? []) as Message[]) {
    const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const key = `${msg.listing_id}__${otherUserId}`;
    if (!threadMap.has(key)) {
      threadMap.set(key, { listingId: msg.listing_id, otherUserId, lastMessage: msg, unreadCount: 0 });
    }
    if (msg.receiver_id === user.id && !msg.read_at) {
      threadMap.get(key)!.unreadCount++;
    }
  }

  const threads = [...threadMap.values()];

  if (threads.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">Messages</h1>
          <div className="border-2 border-black p-12 text-center">
            <p className="text-black font-bold mb-1">No messages yet</p>
            <p className="text-sm text-gray-500">When you contact a seller, conversations appear here.</p>
          </div>
        </main>
      </div>
    );
  }

  const listingIds = [...new Set(threads.map(t => t.listingId))];
  const [{ data: cardListings }, { data: customListings }] = await Promise.all([
    supabase.from("listings").select("id, card:cards(name, image_url)").in("id", listingIds),
    supabase.from("custom_listings").select("id, title").in("id", listingIds),
  ]);

  const listingMap = new Map<string, { title: string }>();
  for (const l of (cardListings ?? []) as unknown as { id: string; card: { name: string } }[]) {
    listingMap.set(l.id, { title: l.card.name });
  }
  for (const l of (customListings ?? []) as { id: string; title: string }[]) {
    listingMap.set(l.id, { title: l.title });
  }

  const otherUserIds = [...new Set(threads.map(t => t.otherUserId))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_seed, avatar_style")
    .in("id", otherUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; username: string | null; display_name: string | null; avatar_seed: string | null; avatar_style: string | null }) => [p.id, p])
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">Messages</h1>
        <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
          {threads.map((thread) => {
            const listing = listingMap.get(thread.listingId);
            const profile = profileMap.get(thread.otherUserId);
            const name = profile?.display_name ?? profile?.username ?? "User";
            const seed = profile?.avatar_seed ?? thread.otherUserId;
            const style = (profile?.avatar_style ?? "identicon") as AvatarStyle;
            return (
              <Link
                key={`${thread.listingId}_${thread.otherUserId}`}
                href={`/messages/${thread.listingId}/${thread.otherUserId}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <img src={avatarUrl(style, seed)} alt={name} className="keep-round w-10 h-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-black truncate">{name}</p>
                    {thread.unreadCount > 0 && (
                      <span className="keep-round bg-black text-white text-xs font-black px-1.5 py-0.5 shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  {listing && <p className="text-xs font-medium text-gray-500 truncate">{listing.title}</p>}
                  <p className="text-xs text-gray-400 truncate mt-0.5">{thread.lastMessage.content}</p>
                </div>
                <span className="text-xs font-bold text-gray-400 shrink-0">{timeAgo(thread.lastMessage.created_at)}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
