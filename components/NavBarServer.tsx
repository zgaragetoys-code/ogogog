import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import NavBar from "./NavBar";
import type { AvatarStyle } from "@/types/database";

export default async function NavBarServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <NavBar user={null} />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_seed, avatar_style")
    .eq("id", user.id)
    .maybeSingle();

  const seed = profile?.avatar_seed ?? user.id;
  const style = (profile?.avatar_style ?? "identicon") as AvatarStyle;

  return (
    <NavBar
      user={{
        email: user.email ?? "",
        displayName: profile?.display_name ?? null,
        username: profile?.username ?? null,
        avatarUrl: avatarUrl(style, seed),
      }}
    />
  );
}
