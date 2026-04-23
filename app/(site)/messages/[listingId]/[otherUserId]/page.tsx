import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { avatarUrl } from "@/lib/avatar";
import type { AvatarStyle } from "@/types/database";
import ThreadClient from "./ThreadClient";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ listingId: string; otherUserId: string }>;
}) {
  const { listingId, otherUserId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/messages/${listingId}/${otherUserId}`);

  // Verify the other user exists in profiles
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_seed, avatar_style")
    .eq("id", otherUserId)
    .maybeSingle();

  if (!otherProfile && user.id !== otherUserId) notFound();

  // Fetch listing info
  const [{ data: cardListing }, { data: customListing }] = await Promise.all([
    supabase.from("listings").select("id, user_id, card:cards(name, image_url)").eq("id", listingId).maybeSingle(),
    supabase.from("custom_listings").select("id, user_id, title").eq("id", listingId).maybeSingle(),
  ]);

  const listing = cardListing ?? customListing;
  if (!listing) notFound();

  const listingTitle = cardListing
    ? (cardListing as unknown as { card: { name: string } }).card.name
    : (customListing as { title: string }).title;

  // Fetch thread messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, read_at")
    .eq("listing_id", listingId)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  // Mark incoming messages as read (requires migration 007)
  const unread = (messages ?? []).filter(
    (m) => m.receiver_id === user.id && !m.read_at
  );
  if (unread.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread.map((m) => m.id));
  }

  const otherName = otherProfile?.display_name ?? otherProfile?.username ?? "User";
  const otherSeed = otherProfile?.avatar_seed ?? otherUserId;
  const otherStyle = (otherProfile?.avatar_style ?? "identicon") as AvatarStyle;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-sm font-bold text-black hover:underline shrink-0">
          ←
        </Link>
        <img src={avatarUrl(otherStyle, otherSeed)} alt={otherName}
          className="keep-round w-8 h-8 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-black truncate">{otherName}</p>
          <Link href={`/listings/${listingId}`}
            className="text-xs font-medium text-black hover:underline truncate block">
            {listingTitle}
          </Link>
        </div>
      </div>

      {/* Thread (flex-1 so input sticks to bottom) */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto min-h-0" style={{ height: "calc(100vh - 3.5rem - 57px)" }}>
        <ThreadClient
          initialMessages={(messages ?? []).map((m) => ({
            id: m.id,
            sender_id: m.sender_id,
            content: m.content,
            created_at: m.created_at,
          }))}
          listingId={listingId}
          currentUserId={user.id}
          otherUserId={otherUserId}
          otherUserName={otherName}
        />
      </div>
    </div>
  );
}
