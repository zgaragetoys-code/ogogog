import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import type { Profile } from "@/types/database";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/profile");
  const { setup } = await searchParams;

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

  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  return (
    <ProfileClient
      profile={data as Profile | null}
      email={user.email ?? ""}
      isAdmin={isAdmin}
      isNewUser={setup === "1"}
    />
  );
}
