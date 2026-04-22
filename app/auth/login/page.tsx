import { signInWithPassword, signInWithMagicLink } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;
  const isMagicLink = mode === "magic";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Pokemon TCG Marketplace</h1>
          <p className="text-black mt-2 text-sm">
            {isMagicLink ? "We'll email you a sign-in link" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isMagicLink ? (
            <form action={signInWithPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign in
              </button>
            </form>
          ) : (
            <form action={signInWithMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Email me a sign-in link
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-center text-sm">
            {!isMagicLink ? (
              <p>
                <a href="/auth/login?mode=magic" className="text-blue-600 hover:underline">
                  Forgot your password? Email me a sign-in link
                </a>
              </p>
            ) : (
              <p>
                <a href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in with password instead
                </a>
              </p>
            )}
            <p className="text-black">
              No account?{" "}
              <a href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                Create one free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
