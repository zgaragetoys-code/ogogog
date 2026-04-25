import { createClient } from "@/lib/supabase/server";
import BoardClient from "./BoardClient";
import type { BoardPost } from "./BoardClient";
import type { AvatarStyle } from "@/types/database";

export const metadata = { title: "Community Board | ogogog" };

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type RawPost = {
    id: string;
    user_id: string;
    content: string;
    post_type: string;
    created_at: string;
  };

  type ProfileRow = {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_seed: string | null;
    avatar_style: string | null;
  };

  const { data: rawPosts } = await supabase
    .from("board_posts")
    .select("id, user_id, content, post_type, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const postList = (rawPosts ?? []) as RawPost[];

  // Fetch profiles separately — board_posts.user_id has no direct FK to profiles
  const userIds = [...new Set(postList.map(p => p.user_id))];
  let profileMap = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_seed, avatar_style")
      .in("id", userIds);
    for (const pr of (profileRows ?? []) as ProfileRow[]) {
      profileMap.set(pr.id, pr);
    }
  }

  const posts: BoardPost[] = postList.map(p => {
    const pr = profileMap.get(p.user_id) ?? null;
    return {
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      post_type: p.post_type,
      created_at: p.created_at,
      profile: pr ? { ...pr, avatar_style: pr.avatar_style as AvatarStyle | null } : null,
    };
  });

  let currentUserProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_seed, avatar_style")
      .eq("id", user.id)
      .maybeSingle();
    currentUserProfile = profile;
  }

  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Community Board</h1>
          <p className="text-xs text-gray-700 mt-1">
            Buying in bulk? Looking for a specific card? Post here and the community will see it.
          </p>
        </div>

        <BoardClient
          initialPosts={posts}
          currentUserId={user?.id ?? null}
          currentUserProfile={currentUserProfile ? {
            username: currentUserProfile.username,
            display_name: currentUserProfile.display_name,
            avatar_seed: currentUserProfile.avatar_seed,
            avatar_style: currentUserProfile.avatar_style as AvatarStyle | null,
          } : null}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}
