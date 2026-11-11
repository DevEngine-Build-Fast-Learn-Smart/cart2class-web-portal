import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome, roleLoginUrls } from "@/lib/constants/roles";
import type { Membership, Profile, Role } from "@/types/domain";

export async function requireAnyRole(allowed: Role[]) {
  const supabase = await createClient();
  if (!supabase) return { unavailable: true as const, profile: null, memberships: [] as Membership[] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (allowed.length === 1 && roleLoginUrls[allowed[0]]) {
      redirect(roleLoginUrls[allowed[0]] as never);
    }
    redirect("/login");
  }
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("role_memberships").select("role,organization_id,is_active").eq("user_id", user.id).eq("is_active", true)
  ]);
  const typedProfile: Profile | null = profile
    ? {
        id: profile.id,
        display_name: profile.display_name,
        account_status: profile.account_status,
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
        email: user.email || null
      }
    : null;
  const typedMemberships = (memberships ?? []) as Membership[];
  if (!typedProfile || typedProfile.account_status !== "active") redirect("/unauthorized?reason=disabled");
  if (!typedMemberships.some((membership) => allowed.includes(membership.role))) {
    const fallback = typedMemberships[0]?.role;
    if (fallback) redirect(roleHome[fallback] as never);
    redirect("/unauthorized");
  }
  return { unavailable: false as const, profile: typedProfile, memberships: typedMemberships, supabase };
}

export async function requireRole(expected: Role) {
  return requireAnyRole([expected]);
}
