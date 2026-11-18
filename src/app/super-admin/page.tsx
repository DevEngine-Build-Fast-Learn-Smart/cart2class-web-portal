import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleLoginView } from "@/features/authentication/role-login-view";
import { RoleAccountSwitchView } from "@/features/authentication/role-account-switch-view";
import type { Role } from "@/types/domain";

export const metadata = {
  title: "Super Admin Sign In | Cart2Class A.L.M.A. Portal",
  description: "A.L.M.A. Super Admin & District Governance login",
};

export default async function SuperAdminLoginPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: memberships } = await supabase
        .from("role_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const roles = (memberships ?? []).map((m) => m.role as Role);
      if (roles.includes("admin")) {
        redirect("/admin");
      }
      return (
        <RoleAccountSwitchView
          targetRole="admin"
          currentRoles={roles}
          email={user.email}
        />
      );
    }
  }

  return <RoleLoginView role="admin" />;
}
