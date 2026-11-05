import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signToken } from "@/lib/auth/token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Authenticate parent
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Check parent role
    const { data: memberships } = await supabase
      .from("role_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true);

    const roles = (memberships ?? []).map((m) => m.role);
    if (!roles.includes("parent") && !roles.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized: not a parent account" }, { status: 403 });
    }

    // Get linked children
    const { data: links } = await supabase
      .from("parent_student_relationships")
      .select("student_id")
      .eq("parent_user_id", userId)
      .eq("is_active", true);

    const childIds = (links ?? []).map((l) => l.student_id);

    // Get profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const parentName = profile?.display_name || "Morgan Parent";

    const accessToken = signToken({
      sub: userId,
      role: "parent",
      name: parentName
    });

    return NextResponse.json({
      accessToken,
      parent: {
        parentId: userId,
        name: parentName,
        childIds
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

