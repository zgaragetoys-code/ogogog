import { createClient } from "@/lib/supabase/server";
import NavBar from "./NavBar";

export default async function NavBarServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <NavBar user={user ? { email: user.email ?? "" } : null} />;
}
