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

    // Verify user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Check teacher or admin role
    const { data: memberships } = await supabase
      .from("role_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true);

    const roles = (memberships ?? []).map((m) => m.role);
    if (!roles.includes("teacher") && !roles.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized: not school staff" }, { status: 403 });
    }

    // Get teacher name and class
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const { data: assignments } = await supabase
      .from("teacher_class_assignments")
      .select("class_id, classes:class_id(id, name)")
      .eq("teacher_user_id", userId)
      .limit(1);

    const classId = assignments?.[0]?.class_id || "cls_room12";
    const room = (assignments?.[0]?.classes as any)?.name || "Room 12";

    const accessToken = signToken({
      sub: userId,
      role: roles.includes("teacher") ? "teacher" : "admin",
      classId,
      name: profile?.display_name || "Teacher"
    });

    return NextResponse.json({
      accessToken,
      teacher: {
        id: userId,
        name: profile?.display_name || "Ms. Carter",
        classId,
        room
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

