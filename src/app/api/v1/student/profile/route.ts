import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, verifyToken } from "@/lib/auth/token";

export async function GET(req: Request) {
  try {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const supabase = createAdminClient();
    let studentId = payload.sub;

    const { data: student } = await supabase
      .from("students")
      .select("id, first_name, last_initial, class_id")
      .eq("id", studentId)
      .single();

    let name = student?.first_name || payload.name || "Student";
    let room = "Room 12";
    let teacherName = "Ms. Carter";
    let reward = "Pizza party";
    let confirmedStars = 68;
    let targetStars = 100;

    const classId = student?.class_id || payload.classId;
    if (classId) {
      const { data: classData } = await supabase
        .from("classes")
        .select("name, reward_title, confirmed_stars, target_stars")
        .eq("id", classId)
        .single();

      if (classData) {
        room = classData.name;
        reward = classData.reward_title || reward;
        confirmedStars = classData.confirmed_stars ?? confirmedStars;
        targetStars = classData.target_stars ?? targetStars;
      }

      const { data: assignments } = await supabase
        .from("teacher_class_assignments")
        .select("profiles:teacher_user_id(display_name)")
        .eq("class_id", classId)
        .limit(1);

      if (assignments?.[0]?.profiles) {
        teacherName = (assignments[0].profiles as any).display_name ?? teacherName;
      }
    }

    return NextResponse.json({
      studentId: student?.id || studentId,
      name,
      room,
      teacher: teacherName,
      reward,
      confirmedStars,
      targetStars,
      previousMissions: [1, 2, 3]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

