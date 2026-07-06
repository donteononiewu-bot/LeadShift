import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/** Looks up the current authenticated user's org_id, or null if signed out. */
export async function getCurrentOrgId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  return data?.org_id ?? null;
}
