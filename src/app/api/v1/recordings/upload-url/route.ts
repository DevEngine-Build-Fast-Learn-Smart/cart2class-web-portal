import { NextResponse } from "next/server";
import crypto from "crypto";

import { assignedMission, StudentMissionError } from "@/lib/student-mission";
import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isUuid(body?.missionId) || !["m4a", "wav"].includes(body?.fileExtension) || !["audio/m4a", "audio/wav", "audio/x-wav"].includes(body?.contentType)) {
      return NextResponse.json({ error: "A valid mission audio upload request is required." }, { status: 400 });
    }
    const { supabase, session } = await requireStudentSession(request);
    const { assignment } = await assignedMission(supabase, session.student_id, body.missionId);
    const { data: stage } = await supabase.from("mission_stages").select("id").eq("mission_version_id", assignment.mission_version_id).eq("stage_key", "fluency").maybeSingle();
    if (!stage) return NextResponse.json({ error: "This mission has no approved reading stage." }, { status: 409 });
    const path = `${session.student_id}/${crypto.randomUUID()}.${body.fileExtension}`;
    const { data: recording, error: insertError } = await supabase.from("reading_recordings").insert({ student_id: session.student_id, stage_id: stage.id, storage_path: path, upload_status: "pending", review_status: "pending" }).select("id,storage_path").single();
    if (insertError || !recording) throw insertError ?? new Error("Could not create recording.");
    const { data: signed, error: signedError } = await supabase.storage.from("reading-recordings").createSignedUploadUrl(path);
    if (signedError || !signed?.signedUrl) {
      await supabase.from("reading_recordings").delete().eq("id", recording.id);
      throw signedError ?? new Error("Could not prepare recording upload.");
    }
    return NextResponse.json({ recordingId: recording.id, uploadUrl: signed.signedUrl, storagePath: recording.storage_path, expiresInSeconds: 3600 });
  } catch (error) {
    if (error instanceof StudentSessionError || error instanceof StudentMissionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Recording upload URL error", error);
    return NextResponse.json({ error: "Could not prepare this private recording." }, { status: 500 });
  }
}
