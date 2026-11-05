import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, verifyToken } from "@/lib/auth/token";

export async function POST(req: Request) {
  try {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== "parent" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { parentInviteCode } = body;

    if (!parentInviteCode) {
      return NextResponse.json({ error: "parentInviteCode is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up student by parent_invite_code or card_code
    const { data: students } = await supabase
      .from("students")
      .select("id, first_name, last_initial, class_id")
      .or(`parent_invite_code.ilike.%${parentInviteCode.trim()}%,card_code.ilike.%${parentInviteCode.trim()}%`);

    let student = students?.[0];

    // Fallback if code contains student name
    if (!student) {
      const lower = parentInviteCode.toLowerCase();
      const { data: allStudents } = await supabase.from("students").select("id, first_name, last_initial, class_id");
      student = allStudents?.find((s) => lower.includes(s.first_name.toLowerCase()));
    }

    if (!student) {
      return NextResponse.json({ error: "Invalid parent invite code", code: "INVALID_CODE" }, { status: 404 });
    }

    // Link student to parent
    await supabase.from("parent_student_relationships").upsert(
      {
        parent_user_id: payload.sub,
        student_id: student.id,
        relationship_label: "Parent/Guardian",
        is_active: true
      },
      { onConflict: "parent_user_id,student_id" }
    );

    // Get classroom and teacher info
    let room = "Room 12";
    let teacherName = "Ms. Carter";

    if (student.class_id) {
      const { data: cls } = await supabase.from("classes").select("name").eq("id", student.class_id).single();
      if (cls?.name) room = cls.name;

      const { data: teacherAssignment } = await supabase
        .from("teacher_class_assignments")
        .select("profiles:teacher_user_id(display_name)")
        .eq("class_id", student.class_id)
        .limit(1);

      if (teacherAssignment?.[0]?.profiles) {
        teacherName = (teacherAssignment[0].profiles as any).display_name ?? teacherName;
      }
    }

    return NextResponse.json({
      linked: true,
      child: {
        studentId: student.id,
        name: student.first_name,
        room,
        teacher: teacherName
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

