import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { Topbar } from "@/components/nav/topbar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, role, org_id, organizations(name)")
    .eq("id", user.id)
    .single();

  const orgName =
    (profile?.organizations as unknown as { name: string } | null)?.name ??
    "Your organization";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar orgName={orgName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          fullName={profile?.full_name ?? null}
          email={profile?.email ?? user.email ?? ""}
          role={profile?.role ?? "member"}
        />
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
