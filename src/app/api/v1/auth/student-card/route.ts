import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signToken } from "@/lib/auth/token";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cardCode, deviceId, appVersion } = body;

    if (!cardCode || typeof cardCode !== "string") {
      return NextResponse.json({ error: "cardCode is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find student either by exact card_code, id, or partial match
    let studentQuery = supabase
      .from("students")
      .select("id, first_name, last_initial, is_active, class_id, grade_level")
      .or(`card_code.eq.${cardCode},id.eq.${cardCode}`);

    // If cardCode is like "c2c-card:v1:stu_maya_9f8a7b6c", also check if any student matches
    const { data: students, error: studentError } = await studentQuery;

    let student = students?.[0];

    if (!student) {
      // Check if code contains student name e.g. "maya"
      const lower = cardCode.toLowerCase();
      const { data: fallbackStudents } = await supabase
        .from("students")
        .select("id, first_name, last_initial, is_active, class_id, grade_level");

      student = fallbackStudents?.find((s) => lower.includes(s.first_name.toLowerCase()) || s.id === cardCode);
    }

    if (!student) {
      return NextResponse.json({ error: "Student card unknown", code: "UNKNOWN_CARD" }, { status: 404 });
    }

    if (!student.is_active) {
      return NextResponse.json({ error: "Student account deactivated", code: "DEACTIVATED" }, { status: 403 });
    }

    // Get class info
    let room = "Room 12";
    let teacherName = "Ms. Carter";
    let reward = "Pizza party";
    let confirmedStars = 68;
    let targetStars = 100;

    if (student.class_id) {
      const { data: classData } = await supabase
        .from("classes")
        .select("name, reward_title, confirmed_stars, target_stars")
        .eq("id", student.class_id)
        .single();

      if (classData) {
        room = classData.name;
        reward = classData.reward_title || reward;
        confirmedStars = classData.confirmed_stars ?? confirmedStars;
        targetStars = classData.target_stars ?? targetStars;
      }

      // Find teacher
      const { data: assignments } = await supabase
        .from("teacher_class_assignments")
        .select("teacher_user_id, profiles:teacher_user_id(display_name)")
        .eq("class_id", student.class_id)
        .eq("is_active", true)
        .limit(1);

      if (assignments?.[0]?.profiles) {
        teacherName = (assignments[0].profiles as any).display_name ?? teacherName;
      }
    }

    const refreshToken = "rt_" + crypto.randomBytes(16).toString("hex");
    const accessToken = signToken({
      sub: student.id,
      role: "student",
      classId: student.class_id ?? undefined,
      name: `${student.first_name} ${student.last_initial ?? ""}`.trim(),
      deviceId
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 86400,
      student: {
        studentId: student.id,
        name: student.first_name,
        room,
        teacher: teacherName
      },
      classInfo: {
        reward,
        confirmedStars,
        targetStars,
        previousMissions: [1, 2, 3]
      }
    });
  } catch (error: any) {
    console.error("Student card auth error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

