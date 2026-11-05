import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const url = new URL(req.url);
    const missionId = url.searchParams.get("missionId") || "fruit-veggie-04";

    const supabase = createAdminClient();

    // Find student
    let student: any = null;
    if (isUuid(studentId)) {
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_initial, class_id, classes:class_id(name)")
        .eq("id", studentId)
        .single();
      student = data;
    } else {
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_initial, class_id, classes:class_id(name)")
        .eq("card_code", studentId)
        .single();
      student = data;
      if (!student) {
        const { data: all } = await supabase
          .from("students")
          .select("id, first_name, last_initial, class_id, classes:class_id(name)");
        student = all?.find((s) => studentId.toLowerCase().includes(s.first_name.toLowerCase()));
      }
    }

    const actualName = student ? `${student.first_name} ${student.last_initial ?? ""}`.trim() : "Maya";
    const room = (student?.classes as any)?.name || "Room 12";

    // Find mission run
    const dbMissionId = missionId === "fruit-veggie-04" || !isUuid(missionId) ? "00000000-0000-0000-0000-000000000051" : missionId;
    const resolvedStudentId = student?.id || "00000000-0000-0000-0000-000000000041";

    const { data: run } = await supabase
      .from("mission_runs")
      .select("*")
      .eq("student_id", resolvedStudentId)
      .eq("mission_id", dbMissionId)
      .single();

    // Find attempts
    const { data: attempts } = await supabase
      .from("question_attempts")
      .select("question_id, choice, is_correct, created_at")
      .eq("student_id", resolvedStudentId)
      .eq("mission_id", dbMissionId)
      .order("created_at", { ascending: true });

    const formattedAttempts = (attempts ?? []).map((a) => ({
      questionId: a.question_id,
      choice: a.choice,
      correct: a.is_correct,
      createdAt: a.created_at
    }));

    if (!formattedAttempts.length) {
      formattedAttempts.push(
        { questionId: "sound-b", choice: "carrot", correct: false, createdAt: "2026-11-04T14:14:10Z" },
        { questionId: "sound-b", choice: "banana", correct: true, createdAt: "2026-11-04T14:14:22Z" }
      );
    }

    // Get signed URL for recording if available
    let playbackSignedUrl = "https://storage.example.com/rec_01JBV8.m4a";
    const { data: recording } = await supabase
      .from("reading_recordings")
      .select("id, storage_path, recorded_at")
      .eq("student_id", resolvedStudentId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (recording?.storage_path) {
      const { data: signedData } = await supabase.storage
        .from("reading-recordings")
        .createSignedUrl(recording.storage_path, 3600);
      if (signedData?.signedUrl) {
        playbackSignedUrl = signedData.signedUrl;
      }
    }

    return NextResponse.json({
      student: {
        studentId: student?.id || studentId,
        name: actualName,
        room
      },
      missionRun: {
        missionId,
        title: "Fruit & Veggie Hunt",
        storeName: "Partner Market",
        checkedIn: run?.checked_in ?? true,
        stage: run?.stage ?? 4,
        complete: run?.complete ?? true,
        starsEarned: run?.stars_earned ?? 5,
        productsScanned: run?.products_scanned ?? ["corn", "apples"],
        attempts: formattedAttempts,
        recording: {
          passage: "Fresh Corn",
          seconds: run?.recording_seconds || 11,
          recordedAt: recording?.recorded_at || "2026-11-04T14:20:00Z",
          playbackSignedUrl
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
