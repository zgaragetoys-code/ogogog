import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTabs from "./AdminTabs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-2 border-black bg-red-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 pt-2">
            <span className="text-white font-black text-xs uppercase tracking-widest mr-3 pb-2 opacity-70">⚡ Admin</span>
            <AdminTabs />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
