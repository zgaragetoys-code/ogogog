import { createAdminClient } from "@/lib/supabase/server";
import { bulkToggleBots } from "./actions";
import BotTickButton from "./BotTickButton";
import BotRow from "./BotRow";
import { BulkButton } from "./BulkButton";

export const metadata = { title: "Bot Manager | Admin" };

const PAGE_SIZE = 50;

export default async function AdminBotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = q?.trim() ?? "";
  const admin = createAdminClient();

  let query = admin
    .from("bots")
    .select("id, username, display_name, personality, chat_enabled, posting_enabled, last_active_at, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("username", `%${search}%`);
  }

  const { data: bots, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Stats
  const [{ count: chatOn }, { count: postingOn }, { count: total }] = await Promise.all([
    admin.from("bots").select("*", { count: "exact", head: true }).eq("chat_enabled", true),
    admin.from("bots").select("*", { count: "exact", head: true }).eq("posting_enabled", true),
    admin.from("bots").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">🤖 Bot Manager</h1>
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">Admin</span>
        </div>
        <p className="text-xs text-gray-700 mt-1">
          {total ?? 0} bots total · {chatOn ?? 0} chat-active · {postingOn ?? 0} posting-active
        </p>
      </div>

      {/* Bulk controls */}
      <div className="border-2 border-black p-4 mb-6 bg-gray-50">
        <p className="text-xs font-black text-black uppercase tracking-wide mb-3">Bulk Controls</p>

        {/* Chat controls */}
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-700 mb-2">Chat</p>
          <div className="flex flex-wrap gap-2">
            <form>
              <BulkButton variant="solid" formAction={bulkToggleBots.bind(null, "chat_enabled", true, undefined)}>
                Enable All
              </BulkButton>
            </form>
            <form>
              <BulkButton formAction={bulkToggleBots.bind(null, "chat_enabled", false, undefined)}>
                Disable All
              </BulkButton>
            </form>
            {[50, 100, 150, 200].map((n) => (
              <form key={n}>
                <BulkButton formAction={bulkToggleBots.bind(null, "chat_enabled", true, n)}>
                  Enable {n}
                </BulkButton>
              </form>
            ))}
          </div>
        </div>

        {/* Posting controls */}
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-700 mb-2">Posting (Feed Activity)</p>
          <div className="flex flex-wrap gap-2">
            <form>
              <BulkButton variant="solid" formAction={bulkToggleBots.bind(null, "posting_enabled", true, undefined)}>
                Enable All
              </BulkButton>
            </form>
            <form>
              <BulkButton formAction={bulkToggleBots.bind(null, "posting_enabled", false, undefined)}>
                Disable All
              </BulkButton>
            </form>
            {[50, 100, 150, 200].map((n) => (
              <form key={n}>
                <BulkButton formAction={bulkToggleBots.bind(null, "posting_enabled", true, n)}>
                  Enable {n}
                </BulkButton>
              </form>
            ))}
          </div>
        </div>

        {/* Manual tick */}
        <div className="border-t-2 border-black/20 pt-3 mt-3">
          <p className="text-xs font-bold text-gray-700 mb-2">Manual Tick (fire chat messages now)</p>
          <BotTickButton />
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search bots by username…"
          className="flex-1 text-sm border-2 border-black px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          Search
        </button>
        {search && (
          <a
            href="/admin/bots"
            className="px-4 py-2 border-2 border-black text-sm font-bold hover:bg-black hover:text-white transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      {/* Bot list */}
      <div className="border-2 border-black divide-y-2 divide-black">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wide">
          <span>Bot</span>
          <span className="w-20 text-center">Personality</span>
          <span className="w-16 text-center">Chat</span>
          <span className="w-16 text-center">Posting</span>
        </div>

        {(bots ?? []).map((bot) => (
          <BotRow key={bot.id} bot={bot} />
        ))}

        {(!bots || bots.length === 0) && (
          <div className="px-4 py-12 text-center text-sm text-gray-700">
            {search ? `No bots matching "${search}"` : "No bots found. Run npm run seed:bots to create them."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-700">
            Page {page} of {totalPages} · {count ?? 0} bots
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/bots?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="text-xs px-3 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
              >
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/bots?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="text-xs px-3 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
