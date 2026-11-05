"use server";
import { redirect } from "next/navigation";
import { loginSchema, resetRequestSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/constants/roles";
import type { Role } from "@/types/domain";

export type AuthState = { error?: string; message?: string };
export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured. Add the public environment variables to continue." };
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "We could not sign you in. Check your email and password." };
  const { data: memberships } = await supabase.from("role_memberships").select("role").eq("user_id", data.user.id).eq("is_active", true);
  const roles = (memberships ?? []).map((m) => m.role as Role);
  if (roles.length === 0) return { error: "Your account has no active portal role. Contact your program administrator." };
  if (roles.length > 1) redirect("/login?choose-role=1");
  redirect(roleHome[roles[0]] as never);
}
export async function logout() { const supabase = await createClient(); await supabase?.auth.signOut(); redirect("/login"); }
export async function requestReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password` });
  return error ? { error: "We could not send a reset link. Try again later." } : { message: "If that email belongs to an account, a reset link is on its way." };
}
