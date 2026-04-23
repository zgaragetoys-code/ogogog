"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BrowseRealtimeRefresher() {
  const router = useRouter();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("browse-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "listings" }, () => setHasNew(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function refresh() {
    setHasNew(false);
    router.refresh();
  }

  return (
    <>
      {/* Static refresh button — always in the header row */}
      <button
        onClick={refresh}
        className="text-xs font-bold text-gray-700 border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
      >
        ↻ Refresh
      </button>

      {/* Floating "new listings" toast — doesn't affect layout */}
      {hasNew && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black text-white px-5 py-3 border-2 border-black shadow-[4px_4px_0px_0px_#555] text-sm font-bold whitespace-nowrap">
          <span>New listings available</span>
          <button onClick={refresh} className="underline hover:no-underline text-sm">
            Load now
          </button>
        </div>
      )}
    </>
  );
}
