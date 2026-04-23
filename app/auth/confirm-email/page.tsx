export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isMagicLink = type === "magic-link";

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
        </div>
        <div className="bg-white border-2 border-black p-10 text-center">
          <h1 className="text-xl font-black text-black mb-3 uppercase tracking-tight">Check your email</h1>
          <p className="text-sm text-black leading-relaxed">
            {isMagicLink
              ? "We sent you a sign-in link. Click it to log in — it expires in 1 hour."
              : "We sent you a confirmation link. Click it to activate your account, then come back to sign in."}
          </p>
          <a
            href="/auth/login"
            className="mt-6 inline-block text-sm font-bold text-black hover:underline"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
