"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AVATAR_STYLES, type AvatarStyle } from "@/types/database";
import { checkProfanity } from "@/lib/moderation";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export async function updateProfile(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const displayName = (formData.get("display_name") as string | null)?.trim() || null;
  const avatarSeed = (formData.get("avatar_seed") as string | null)?.trim() || user.id;
  const avatarStyleRaw = formData.get("avatar_style") as string | null;
  const country = (formData.get("country") as string | null)?.trim() || null;
  const region = (formData.get("region") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const collectrUrl = (formData.get("collectr_url") as string | null)?.trim() || null;
  const facebookUrl = (formData.get("facebook_url") as string | null)?.trim() || null;
  const instagramUrl = (formData.get("instagram_url") as string | null)?.trim() || null;
  const ebayUsername = (formData.get("ebay_username") as string | null)?.trim() || null;
  const discordUsername = (formData.get("discord_username") as string | null)?.trim() || null;
  const tcgplayerUrl = (formData.get("tcgplayer_url") as string | null)?.trim() || null;
  const websiteUrl = (formData.get("website_url") as string | null)?.trim() || null;
  const globalChatEnabled = formData.get("global_chat_enabled") !== "false";

  if (!username) return { error: "Username is required." };
  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–30 characters: letters, numbers, underscore, or hyphen only." };
  }
  if (displayName && displayName.length > 50) {
    return { error: "Display name must be 50 characters or fewer." };
  }
  if (!country) return { error: "Country is required." };
  if (country.length !== 2) return { error: "Invalid country code." };
  if (notes && notes.length > 2000) return { error: "Notes must be 2000 characters or fewer." };
  if (notes) {
    const bioMod = checkProfanity(notes);
    if (!bioMod.ok) return { error: bioMod.reason };
  }
  if (displayName) {
    const dnMod = checkProfanity(displayName);
    if (!dnMod.ok) return { error: dnMod.reason };
  }

  if (!avatarStyleRaw || !AVATAR_STYLES.includes(avatarStyleRaw as AvatarStyle)) {
    return { error: "Invalid avatar style." };
  }
  const avatarStyle = avatarStyleRaw as AvatarStyle;

  // Validate all URL fields — must be http/https or empty
  const urlFields: [string | null, string][] = [
    [collectrUrl, "Collectr URL"],
    [facebookUrl, "Facebook URL"],
    [instagramUrl, "Instagram URL"],
    [tcgplayerUrl, "TCGplayer URL"],
    [websiteUrl, "Website URL"],
  ];
  for (const [url, label] of urlFields) {
    if (!url) continue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { error: `${label} must start with http:// or https://` };
    }
  }

  // Check username uniqueness (excluding this user)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "That username is already taken." };

  // Capture current username before update so we can invalidate old cache
  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const oldUsername = current?.username;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      avatar_seed: avatarSeed,
      avatar_style: avatarStyle,
      country,
      region,
      notes,
      collectr_url: collectrUrl,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      ebay_username: ebayUsername,
      discord_username: discordUsername,
      tcgplayer_url: tcgplayerUrl,
      website_url: websiteUrl,
      global_chat_enabled: globalChatEnabled,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[updateProfile]", updateError.message, updateError.code);
    if (updateError.code === "23505") return { error: "That username is already taken." };
    return { error: "Failed to save profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath(`/u/${username}`);
  revalidatePath(`/u/${username}/collection`);
  if (oldUsername && oldUsername !== username) {
    revalidatePath(`/u/${oldUsername}`);
    revalidatePath(`/u/${oldUsername}/collection`);
  }
}

export async function changePassword(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const newPassword = (formData.get("new_password") as string | null) ?? "";
  const confirm = (formData.get("confirm_password") as string | null) ?? "";

  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };
  if (newPassword !== confirm) return { error: "Passwords don't match." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { ok: true };
}
