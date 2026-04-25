import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";
import type { ChatMessage } from "./ChatClient";
import type { AvatarStyle } from "@/types/database";

export const metadata = { title: "Global Chat | ogogog" };

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/chat");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("global_chat_enabled, username, display_name, avatar_seed, avatar_style")
    .eq("id", user.id)
    .maybeSingle();

  const chatEnabled = profileData?.global_chat_enabled ?? true;
  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  // Admin client bypasses RLS to read bot messages (bot UUIDs ≠ auth.users UUIDs)
  const admin = createAdminClient();
  const { data: rawMessages } = await admin
    .from("global_chat_messages")
    .select("id, user_id, bot_id, content, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  const rawMsgs = rawMessages ?? [];

  // Batch-resolve profiles and bot identities separately
  const realUserIds = [...new Set(rawMsgs.filter(m => !m.bot_id).map(m => m.user_id as string))];
  const botIds = [...new Set(rawMsgs.filter(m => m.bot_id).map(m => m.bot_id as string))];

  type ProfileRow = { id: string; username: string | null; display_name: string | null; avatar_seed: string | null; avatar_style: string | null };
  const [profilesRes, botsRes] = await Promise.all([
    realUserIds.length > 0
      ? admin.from("profiles").select("id, username, display_name, avatar_seed, avatar_style").in("id", realUserIds)
      : { data: [] as ProfileRow[] },
    botIds.length > 0
      ? admin.from("bots").select("id, username, display_name, avatar_seed, avatar_style").in("id", botIds)
      : { data: [] as ProfileRow[] },
  ]);

  const profileMap = new Map((profilesRes.data as ProfileRow[]).map(p => [p.id, p]));
  const botMap = new Map((botsRes.data as ProfileRow[]).map(b => [b.id, b]));

  const msgs: ChatMessage[] = rawMsgs
    .map(m => {
      const src = m.bot_id ? (botMap.get(m.bot_id) ?? null) : (profileMap.get(m.user_id) ?? null);
      return {
        id: m.id,
        user_id: m.user_id,
        bot_id: (m.bot_id as string | null) ?? null,
        is_bot: !!m.bot_id,
        content: m.content,
        created_at: m.created_at,
        profile: src
          ? { username: src.username, display_name: src.display_name, avatar_seed: src.avatar_seed, avatar_style: src.avatar_style as AvatarStyle | null }
          : null,
      };
    })
    .reverse();

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2 border-b-2 border-black pb-4">
          Global Chat
        </h1>
        <p className="text-xs text-gray-700 mb-4">
          Everyone on ogogog is here. Be respectful. 10-second cooldown between messages.
        </p>
        <ChatClient
          initialMessages={msgs}
          currentUserId={user.id}
          currentUserProfile={{
            username: profileData?.username ?? null,
            display_name: profileData?.display_name ?? null,
            avatar_seed: profileData?.avatar_seed ?? user.id,
            avatar_style: (profileData?.avatar_style ?? "identicon") as AvatarStyle,
          }}
          chatEnabled={chatEnabled}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}
