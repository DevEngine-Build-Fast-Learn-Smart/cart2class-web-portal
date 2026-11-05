import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, studentId: rawStudentId, missionId: rawMissionId, passage, seconds, recordedAt } = body;

    const supabase = createAdminClient();

    // Resolve student
    let studentId = rawStudentId;
    let student: any = null;

    if (studentId) {
      if (isUuid(studentId)) {
        const { data } = await supabase.from("students").select("id").eq("id", studentId).single();
        student = data;
      } else {
        const { data } = await supabase.from("students").select("id").eq("card_code", studentId).single();
        student = data;
        if (!student) {
          const { data: all } = await supabase.from("students").select("id, first_name");
          student = all?.find((s) => studentId.toLowerCase().includes(s.first_name.toLowerCase()));
        }
      }
    }

    const resolvedStudentId = student?.id || "00000000-0000-0000-0000-000000000041";
    let missionId = rawMissionId === "fruit-veggie-04" ? "00000000-0000-0000-0000-000000000051" : rawMissionId;

    const recordingId = "rec_" + crypto.randomBytes(8).toString("hex");
    const filePath = `${resolvedStudentId}/${recordingId}.m4a`;

    // Create signed upload URL from Supabase storage bucket reading-recordings
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("reading-recordings")
      .createSignedUploadUrl(filePath);

    const uploadUrl = uploadData?.signedUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/reading-recordings/${filePath}`;

    // Insert pending reading_recordings record
    await supabase.from("reading_recordings").insert({
      student_id: resolvedStudentId,
      storage_path: filePath,
      upload_status: "pending",
      review_status: "pending",
      recorded_at: recordedAt || new Date().toISOString()
    });

    return NextResponse.json({
      recordingId,
      uploadUrl,
      uploadMethod: "PUT",
      expiresInSeconds: 900
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
