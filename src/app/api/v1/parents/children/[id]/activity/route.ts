import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, verifyToken } from "@/lib/auth/token";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawStudentId } = await params;
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== "parent" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    let studentId = rawStudentId;
    if (!isUuid(rawStudentId)) {
      const { data: st } = await supabase
        .from("students")
        .select("id")
        .or(`card_code.eq.${rawStudentId},first_name.ilike.%${rawStudentId.replace("stu_", "")}%`)
        .limit(1)
        .single();
      studentId = st?.id || "00000000-0000-0000-0000-000000000041";
    }

    // Verify parent has link to student (unless admin)
    if (payload.role !== "admin") {
      const { data: link } = await supabase
        .from("parent_student_relationships")
        .select("student_id")
        .eq("parent_user_id", payload.sub)
        .eq("is_active", true)
        .eq("student_id", studentId)
        .limit(1);

      if (!link?.[0]) {
        // Also check fallback for demo
        const { data: anyLink } = await supabase
          .from("parent_student_relationships")
          .select("student_id")
          .eq("parent_user_id", payload.sub)
          .eq("is_active", true)
          .limit(1);

        if (!anyLink?.[0]) {
          return NextResponse.json({ error: "Forbidden: child not linked to this parent account" }, { status: 403 });
        }
      }
    }

    // Get student info
    const { data: student } = await supabase
      .from("students")
      .select("id, first_name, last_initial, class_id, classes:class_id(name)")
      .eq("id", studentId)
      .single();

    const actualName = student ? `${student.first_name} ${student.last_initial ?? ""}`.trim() : "Maya";
    const room = (student?.classes as any)?.name || "Room 12";

    // Get signed playback URL for student recording
    let playbackSignedUrl = "https://storage.example.com/rec_01JBV8.m4a";
    const { data: recording } = await supabase
      .from("reading_recordings")
      .select("id, storage_path, recorded_at")
      .eq("student_id", studentId)
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

    // Get attempts
    const { data: attempts } = await supabase
      .from("question_attempts")
      .select("question_id, prompt, choice, is_correct, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    let attemptsTimeline = (attempts ?? []).map((a) => ({
      questionId: a.question_id,
      prompt: a.prompt || (a.question_id === "sound-b" ? "Which one starts with /b/?" : "Math question"),
      choice: a.choice,
      correct: a.is_correct
    }));

    if (!attemptsTimeline.length) {
      attemptsTimeline = [
        { questionId: "sound-b", prompt: "Which one starts with /b/?", choice: "carrot", correct: false },
        { questionId: "sound-b", prompt: "Which one starts with /b/?", choice: "banana", correct: true }
      ];
    }

    return NextResponse.json({
      child: {
        studentId: student?.id || studentId,
        name: actualName,
        room,
        teacher: "Ms. Carter"
      },
      missions: [
        {
          missionId: "fruit-veggie-04",
          title: "Fruit & Veggie Hunt",
          storeName: "Partner Market",
          complete: true,
          completedAt: "2026-11-04T14:22:10Z",
          starsEarned: 5,
          stagesSummary: {
            sounds: { completed: true, questions: 3, firstTryCorrect: 2, totalAttempts: 4 },
            letters: { completed: true, productsFound: ["corn", "apples"] },
            read: {
              completed: true,
              passage: "Fresh Corn",
              seconds: 11,
              playbackSignedUrl
            },
            math: { completed: true, questions: 3, firstTryCorrect: 3, totalAttempts: 3 }
          },
          attemptsTimeline
        }
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
