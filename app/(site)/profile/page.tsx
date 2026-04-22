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

  // Pass null if still missing — ProfileClient renders safely with EMPTY_PROFILE fallback
  return (
    <ProfileClient
      profile={data as Profile | null}
      email={user.email ?? ""}
    />
  );
}
