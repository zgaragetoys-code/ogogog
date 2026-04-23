import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import NavBar from "./NavBar";
import type { AvatarStyle } from "@/types/database";

export default async function NavBarServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <NavBar user={null} unreadCount={0} />;

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_seed, avatar_style")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null),
  ]);

  const seed = profile?.avatar_seed ?? user.id;
  const style = (profile?.avatar_style ?? "identicon") as AvatarStyle;

  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  return (
    <NavBar
      user={{
        email: user.email ?? "",
        displayName: profile?.display_name ?? null,
        username: profile?.username ?? null,
        avatarUrl: avatarUrl(style, seed),
      }}
      unreadCount={unreadCount ?? 0}
      isAdmin={isAdmin}
    />
  );
}
