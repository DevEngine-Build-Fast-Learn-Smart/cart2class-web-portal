import { NextResponse } from "next/server";

import { requireStudentSession, StudentSessionError } from "@/lib/student-session";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid recording." }, { status: 400 });
    const { supabase, session } = await requireStudentSession(request);
    const { data: recording } = await supabase.from("reading_recordings").select("id").eq("id", id).eq("student_id", session.student_id).eq("upload_status", "pending").maybeSingle();
    if (!recording) return NextResponse.json({ error: "This private recording is not available." }, { status: 404 });
    const { error } = await supabase.from("reading_recordings").update({ upload_status: "uploaded" }).eq("id", id).eq("student_id", session.student_id);
    if (error) throw error;
    return NextResponse.json({ confirmed: true, recordingId: id, reviewStatus: "pending" });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not confirm this private recording." }, { status: 500 });
  }
}
