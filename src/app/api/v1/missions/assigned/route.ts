import { NextResponse } from "next/server";

import { assignedMission, missionPayload, assignedMissionsList, studentPastMissions, StudentMissionError } from "@/lib/student-mission";
import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

export async function GET(request: Request) {
  try {
    const { supabase, session } = await requireStudentSession(request);
    const { assignment } = await assignedMission(supabase, session.student_id);
    const [missionData, allAssigned, pastMissions] = await Promise.all([
      missionPayload(supabase, assignment),
      assignedMissionsList(supabase, session.student_id),
      studentPastMissions(supabase, session.student_id),
    ]);
    return NextResponse.json({
      status: "assigned",
      mission: missionData,
      assignedMissions: allAssigned,
      previousMissions: pastMissions,
    });
  } catch (error) {
    if (error instanceof StudentSessionError || error instanceof StudentMissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Assigned mission error", error);
    return NextResponse.json({ error: "Could not load the assigned mission." }, { status: 500 });
  }
}
