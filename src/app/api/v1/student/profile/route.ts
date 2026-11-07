import { NextResponse } from "next/server";

import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

export async function GET(request: Request) {
  try {
    const { supabase, session } = await requireStudentSession(request);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id,first_name,last_initial,grade_level,class_id,school_id")
      .eq("id", session.student_id)
      .eq("is_active", true)
      .maybeSingle();
    if (studentError || !student?.class_id) return NextResponse.json({ error: "This student does not have an active class." }, { status: 403 });
    const [{ data: classroom }, { data: school }, { data: teacher }, { data: rewards }, { data: completed }] = await Promise.all([
      supabase.from("classes").select("name").eq("id", student.class_id).eq("is_active", true).maybeSingle(),
      supabase.from("schools").select("name").eq("id", student.school_id).maybeSingle(),
      supabase.from("teacher_class_assignments").select("profiles:teacher_user_id(display_name)").eq("class_id", student.class_id).eq("is_active", true).limit(1),
      supabase.from("reward_goals").select("title,current_stars,target_stars").eq("class_id", student.class_id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
      supabase.from("mission_runs").select("mission:missions(mission_number)").eq("student_id", student.id).eq("complete", true),
    ]);
    if (!classroom) return NextResponse.json({ error: "This student’s class is no longer active." }, { status: 403 });
    const teacherProfile = Array.isArray(teacher?.[0]?.profiles) ? teacher?.[0]?.profiles[0] : teacher?.[0]?.profiles;
    const reward = rewards?.[0];
    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.first_name,
        lastInitial: student.last_initial,
        gradeLevel: student.grade_level,
        classId: student.class_id,
        className: classroom.name,
        schoolName: school?.name ?? null,
        teacherName: teacherProfile?.display_name ?? null,
      },
      classInfo: {
        reward: reward?.title ?? null,
        confirmedStars: reward?.current_stars ?? 0,
        targetStars: reward?.target_stars ?? 0,
        previousMissions: (completed ?? []).flatMap((run) => {
          const mission = Array.isArray(run.mission) ? run.mission[0] : run.mission;
          return typeof mission?.mission_number === "number" ? [mission.mission_number] : [];
        }),
      },
    });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Student profile error", error);
    return NextResponse.json({ error: "Could not load the student profile." }, { status: 500 });
  }
}
