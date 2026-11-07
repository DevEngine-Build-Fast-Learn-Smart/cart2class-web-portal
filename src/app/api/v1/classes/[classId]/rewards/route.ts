import { NextResponse } from "next/server";

import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const { supabase, session } = await requireStudentSession(request);
    const { data: student } = await supabase.from("students").select("class_id").eq("id", session.student_id).maybeSingle();
    if (!student?.class_id || student.class_id !== classId) return NextResponse.json({ error: "This classroom is not available to this student." }, { status: 403 });
    const [{ data: classroom }, { data: goal }] = await Promise.all([
      supabase.from("classes").select("id,name").eq("id", classId).eq("is_active", true).maybeSingle(),
      supabase.from("reward_goals").select("title,current_stars,target_stars,status").eq("class_id", classId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!classroom || !goal) return NextResponse.json({ error: "No active class reward is available." }, { status: 404 });
    return NextResponse.json({ classId, className: classroom.name, reward: goal.title, confirmedStars: goal.current_stars, targetStars: goal.target_stars });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not load classroom rewards." }, { status: 500 });
  }
}
