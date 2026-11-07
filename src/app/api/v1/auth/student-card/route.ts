import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readQrToken, StudentSessionError, studentSessionHash } from "@/lib/student-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentQrToken = readQrToken(body?.cardCode, "student");
    const supabase = createAdminClient();
    const { data: started, error: startError } = await supabase.rpc("start_student_device_session", {
      p_student_qr_token: studentQrToken,
    });
    const deviceSession = started?.[0];
    if (startError || !deviceSession?.session_token) {
      return NextResponse.json({ error: "This student card is invalid, expired, or has been revoked." }, { status: 401 });
    }
    const { data: session, error: sessionError } = await supabase
      .from("student_device_sessions")
      .select("student_id")
      .eq("session_token_hash", studentSessionHash(deviceSession.session_token))
      .maybeSingle();
    if (sessionError || !session) throw new Error("Created student session could not be resolved.");
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id,first_name,last_initial,grade_level,class_id,classes(name,schools(name))")
      .eq("id", session.student_id)
      .eq("is_active", true)
      .maybeSingle();
    if (studentError || !student) return NextResponse.json({ error: "This student account is not active." }, { status: 403 });
    const classInfo = (Array.isArray(student.classes) ? student.classes[0] : student.classes) as {
      name?: string;
      schools?: { name?: string } | { name?: string }[] | null;
    } | null;
    const school = Array.isArray(classInfo?.schools) ? classInfo?.schools[0] : classInfo?.schools;
    return NextResponse.json({
      sessionToken: deviceSession.session_token,
      expiresAt: deviceSession.expires_at,
      student: {
        id: student.id,
        firstName: student.first_name,
        lastInitial: student.last_initial,
        gradeLevel: student.grade_level,
        classId: student.class_id,
        className: classInfo?.name ?? null,
        schoolName: school?.name ?? null,
      },
    });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Student card authentication failed", error);
    return NextResponse.json({ error: "Could not sign in with that student card." }, { status: 500 });
  }
}

