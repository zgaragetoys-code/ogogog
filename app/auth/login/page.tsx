import { signInWithPassword, signInWithMagicLink } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string; next?: string }>;
}) {
  const { error, mode, next } = await searchParams;
  const isMagicLink = mode === "magic";

  return (
    <div className="min-h-screen bg-gray-50 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-stretch">
            <a href="/" className="font-black text-black text-4xl tracking-tight uppercase">
              ogogog
            </a>
            <div className="flex justify-between text-[0.55rem] font-black text-black uppercase">
              {"marketplace".split("").map((char, i) => (
                <span key={i}>{char}</span>
              ))}
            </div>
          </div>
          <p className="text-black mt-2 text-sm">
            {isMagicLink ? "We'll email you a sign-in link" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-white border-2 border-black p-8">
          {error && (
            <div className="mb-5 px-4 py-3 border-2 border-black bg-black text-white text-sm font-bold">
              {error}
            </div>
          )}

          {!isMagicLink ? (
            <form action={signInWithPassword} className="space-y-4">
              <input type="hidden" name="next" value={next ?? ""} />
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-black mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none focus:ring-0"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-black mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Sign in
              </button>
            </form>
          ) : (
            <form action={signInWithMagicLink} className="space-y-4">
              <input type="hidden" name="next" value={next ?? ""} />
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-black mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Email me a sign-in link
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t-2 border-black space-y-2 text-center text-sm">
            {!isMagicLink ? (
              <p>
                <a href={`/auth/login?mode=magic${next ? `&next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-black hover:underline">
                  Forgot password? Email me a sign-in link
                </a>
              </p>
            ) : (
              <p>
                <a href={`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-black hover:underline">
                  Sign in with password instead
                </a>
              </p>
            )}
            <p className="text-black">
              No account?{" "}
              <a href="/auth/signup" className="font-bold text-black hover:underline">
                Create one free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
