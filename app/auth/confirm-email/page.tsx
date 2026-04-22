export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isMagicLink = type === "magic-link";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-black text-sm leading-relaxed">
            {isMagicLink
              ? "We sent you a sign-in link. Click it to log in — it expires in 1 hour."
              : "We sent you a confirmation link. Click it to activate your account, then come back to sign in."}
          </p>
          <a
            href="/auth/login"
            className="mt-6 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
