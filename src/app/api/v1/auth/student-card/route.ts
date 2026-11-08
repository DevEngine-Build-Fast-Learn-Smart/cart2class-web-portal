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

    // Log student login to audit_logs for administrator compliance & visibility
    try {
      await supabase.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: "student.login",
        entity_type: "student",
        entity_id: student.id,
        metadata: {
          student_name: `${student.first_name} ${student.last_initial ?? ""}`.trim(),
          grade_level: student.grade_level,
          class_name: classInfo?.name ?? null,
          school_name: school?.name ?? null,
          device_token_prefix: deviceSession.session_token.slice(0, 8),
          method: "student_qr_card",
          login_time: new Date().toISOString()
        },
      });
    } catch (auditErr) {
      console.error("Failed to insert student login audit log", auditErr);
    }

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

