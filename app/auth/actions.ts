"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/confirm-email?type=signup");
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string | null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}${nextParam}`);
  }

  const safePath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/featured";
  redirect(safePath);
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const next = formData.get("next") as string | null;

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/featured";
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/auth/login?mode=magic&error=${encodeURIComponent(error.message)}${nextParam}`);
  }

  redirect("/auth/confirm-email?type=magic-link");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/featured");
}
