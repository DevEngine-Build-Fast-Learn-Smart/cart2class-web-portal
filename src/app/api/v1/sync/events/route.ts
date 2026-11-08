import { NextResponse } from "next/server";

import { assignedMission, StudentMissionError } from "@/lib/student-mission";
import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    const event = await request.json();
    if (typeof event?.id !== "string" || !event.id || !["progress", "mission", "recording"].includes(event.kind)) {
      return NextResponse.json({ error: "A valid sync event is required." }, { status: 400 });
    }
    const { supabase, session } = await requireStudentSession(request);
    const payload = event.payload ?? {};
    if (payload.studentId && payload.studentId !== session.student_id) {
      return NextResponse.json({ error: "A student may only sync their own work." }, { status: 403 });
    }
    if (!isUuid(payload.missionId)) return NextResponse.json({ error: "A valid mission is required." }, { status: 400 });
    const { assignment, classId } = await assignedMission(supabase, session.student_id, payload.missionId);
    const { data: existing } = await supabase.from("sync_events_log").select("event_id,student_id").eq("event_id", event.id).maybeSingle();
    if (existing) {
      if (existing.student_id !== session.student_id) return NextResponse.json({ error: "This event is not owned by this student." }, { status: 403 });
      return NextResponse.json({ eventId: event.id, serverAcknowledged: true, duplicate: true });
    }
    const progress = payload.progress ?? {};
    const complete = event.kind === "mission" && progress.complete === true;
    const { data: mission } = await supabase.from("missions").select("stars").eq("id", assignment.mission_id).maybeSingle();
    if (!mission) throw new StudentMissionError("The assigned mission is no longer available.", 404);
    const { error: eventError } = await supabase.from("sync_events_log").insert({ event_id: event.id, student_id: session.student_id, kind: event.kind });
    if (eventError) throw eventError;
    const run = {
      student_id: session.student_id,
      mission_id: assignment.mission_id,
      store_id: payload.storeId ?? null,
      stage: Number.isInteger(progress.stage) ? progress.stage + 1 : 1,
      checked_in: progress.checkedIn === true,
      complete,
      stars_earned: complete ? mission.stars : 0,
      answers_json: typeof progress.answers === "object" && progress.answers ? progress.answers : {},
      products_scanned: Array.isArray(progress.productIds) ? progress.productIds : [],
      recording_seconds: Number.isInteger(progress.recordingSeconds) ? progress.recordingSeconds : null,
      recording_storage_path: typeof payload.storagePath === "string" ? payload.storagePath : null,
      completed_at: complete ? payload.completedAt ?? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { error: runError } = await supabase.from("mission_runs").upsert(run, { onConflict: "student_id,mission_id" });
    if (runError) throw runError;
    if (event.kind !== "recording" && Array.isArray(payload.attempts)) {
      const rows = payload.attempts
        .filter((attempt: unknown) => typeof attempt === "object" && attempt)
        .map((attempt: any) => ({ student_id: session.student_id, mission_id: assignment.mission_id, question_id: String(attempt.questionId), choice: String(attempt.choice), is_correct: attempt.correct === true, attempt_id: String(attempt.attemptId), created_at: attempt.createdAt ?? new Date().toISOString() }));
      if (rows.length) {
        const { error } = await supabase.from("question_attempts").insert(rows);
        if (error) throw error;
      }
    }
    if (complete) {
      const { data: reward } = await supabase.from("reward_goals").select("id,current_stars,target_stars").eq("class_id", classId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (reward) {
        await supabase.from("reward_goals").update({ current_stars: Math.min(reward.current_stars + mission.stars, reward.target_stars) }).eq("id", reward.id);
      }
    }

    // Log student activity / mission completion to audit_logs
    try {
      const { data: stInfo } = await supabase
        .from("students")
        .select("first_name,last_initial,classes(name)")
        .eq("id", session.student_id)
        .maybeSingle();
      const clsName = (stInfo?.classes as any)?.name ?? "Classroom";
      const studentLabel = stInfo ? `${stInfo.first_name} ${stInfo.last_initial ?? ""}`.trim() : "Learner";

      await supabase.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: complete ? "student.mission_completed" : `student.${event.kind}_activity`,
        entity_type: "student",
        entity_id: session.student_id,
        metadata: {
          student_name: studentLabel,
          class_name: clsName,
          mission_id: assignment.mission_id,
          stage: Number.isInteger(progress.stage) ? progress.stage + 1 : 1,
          stars_earned: complete ? mission.stars : 0,
          kind: event.kind,
          products_scanned_count: Array.isArray(progress.productIds) ? progress.productIds.length : 0,
          checked_in: progress.checkedIn === true,
          activity_time: new Date().toISOString()
        },
      });
    } catch (auditErr) {
      console.error("Failed to insert student activity audit log", auditErr);
    }

    return NextResponse.json({ eventId: event.id, serverAcknowledged: true, duplicate: false });
  } catch (error) {
    if (error instanceof StudentSessionError || error instanceof StudentMissionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Student sync failed", error);
    return NextResponse.json({ error: "Could not save this learning work yet." }, { status: 500 });
  }
}
