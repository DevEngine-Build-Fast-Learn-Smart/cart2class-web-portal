import { NextResponse } from "next/server";

import { assignedMission, missionPayload, StudentMissionError } from "@/lib/student-mission";
import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, session } = await requireStudentSession(request);
    const { assignment } = await assignedMission(supabase, session.student_id, id);
    return NextResponse.json(await missionPayload(supabase, assignment));
  } catch (error) {
    if (error instanceof StudentSessionError || error instanceof StudentMissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load this mission." }, { status: 500 });
  }
}
