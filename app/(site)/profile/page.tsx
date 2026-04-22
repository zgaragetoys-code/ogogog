import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import type { Profile } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/profile");

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Row missing — create it (handles users who signed up before the trigger was in place)
  if (!data) {
    await supabase.from("profiles").upsert({ id: user.id });
    const refetch = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    data = refetch.data;
  }

  // Fallback: if the row still can't be fetched (e.g. migration 005 not yet applied),
  // render with a minimal stub so the page doesn't crash.
  const profile: Profile = (data as Profile) ?? {
    id: user.id,
    username: null,
    display_name: null,
    avatar_seed: user.id,
    avatar_style: "identicon",
    country: null,
    region: null,
    notes: null,
    collectr_url: null,
    facebook_url: null,
    instagram_url: null,
    ebay_username: null,
    discord_username: null,
    tcgplayer_url: null,
    website_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <ProfileClient profile={profile} email={user.email ?? ""} />;
}
