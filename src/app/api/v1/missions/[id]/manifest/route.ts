import { NextResponse } from "next/server";

import { assignedMission, missionPayload, StudentMissionError } from "@/lib/student-mission";
import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, session } = await requireStudentSession(request);
    const { assignment } = await assignedMission(supabase, session.student_id, id);
    const mission = await missionPayload(supabase, assignment);
    if (!mission.assets.length) return NextResponse.json({ error: "This mission has no approved offline assets." }, { status: 409 });
    return NextResponse.json({ missionId: mission.id, versionId: mission.versionId, assets: mission.assets });
  } catch (error) {
    if (error instanceof StudentSessionError || error instanceof StudentMissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load this mission’s offline files." }, { status: 500 });
  }
}
