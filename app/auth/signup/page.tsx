import { signUp } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
          <p className="text-black mt-2 text-sm">Create your free account</p>
        </div>

        <div className="bg-white border-2 border-black p-8">
          {error && (
            <div className="mb-5 px-4 py-3 border-2 border-black bg-black text-white text-sm font-bold">
              {error}
            </div>
          )}

          <form action={signUp} className="space-y-4">
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
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none focus:ring-0"
              />
              <p className="text-xs text-black mt-1">Minimum 8 characters</p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 pt-5 border-t-2 border-black text-center text-sm text-black">
            Already have an account?{" "}
            <a href="/auth/login" className="font-bold text-black hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
