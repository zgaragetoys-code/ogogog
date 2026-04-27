import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/auth-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextRaw = searchParams.get("next");
  const next = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/browse";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  async function redirectAfterAuth(defaultNext: string) {
    // Send new users (no username) to profile setup instead of the default destination
    if (defaultNext === "/browse") {
      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (authedUser) {
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", authedUser.id).maybeSingle();
        if (!prof?.username) return NextResponse.redirect(`${origin}/profile?setup=1`);
      }
    }
    return NextResponse.redirect(`${origin}${defaultNext}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectAfterAuth(next);
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return redirectAfterAuth(next);
    console.error("[auth/callback] verifyOtp failed:", error.message, "type:", type);
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Verification link is invalid or expired. Try signing in or request a new link.")}`
  );
}
