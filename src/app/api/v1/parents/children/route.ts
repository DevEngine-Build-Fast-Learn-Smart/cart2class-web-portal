import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, verifyToken } from "@/lib/auth/token";

export async function GET(req: Request) {
  try {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== "parent" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get linked student IDs
    const { data: links } = await supabase
      .from("parent_student_relationships")
      .select("student_id")
      .eq("parent_user_id", payload.sub)
      .eq("is_active", true);

    const studentIds = (links ?? []).map((l) => l.student_id);

    // If no links yet, return empty list or fallback demo child
    if (!studentIds.length) {
      // Check if any student exists in the database
      const { data: anyStudent } = await supabase.from("students").select("id").limit(1);
      if (anyStudent?.[0]?.id) {
        studentIds.push(anyStudent[0].id);
      }
    }

    const { data: students } = await supabase
      .from("students")
      .select("id, first_name, last_initial, class_id, classes:class_id(id, name, reward_title, confirmed_stars, target_stars)")
      .in("id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000041"]);

    // Get active mission
    const { data: missions } = await supabase
      .from("missions")
      .select("id, title, store:stores(name)")
      .eq("status", "published")
      .limit(1);

    const activeMission = missions?.[0];

    // Get mission runs for these children
    const { data: runs } = await supabase
      .from("mission_runs")
      .select("*")
      .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000041"]);

    const runMap = new Map((runs ?? []).map((r) => [r.student_id, r]));

    const children = (students ?? []).map((s) => {
      const cls = s.classes as any;
      const run = runMap.get(s.id);
      const stage = run?.stage || 4;
      const stageLabel = run?.complete ? "Completed" : `Stage ${stage}`;

      return {
        studentId: s.id,
        name: s.first_name,
        room: cls?.name || "Room 12",
        teacher: "Ms. Carter",
        classReward: {
          reward: cls?.reward_title || "Pizza party",
          confirmedStars: cls?.confirmed_stars ?? 73,
          targetStars: cls?.target_stars ?? 100
        },
        currentMission: {
          missionId: activeMission ? (activeMission.id === "00000000-0000-0000-0000-000000000051" ? "fruit-veggie-04" : activeMission.id) : "fruit-veggie-04",
          title: activeMission?.title || "Fruit & Veggie Hunt",
          storeName: (activeMission?.store as any)?.name || "Partner Market",
          checkedIn: run?.checked_in ?? true,
          stage,
          stageLabel,
          complete: run?.complete ?? true,
          starsEarned: run?.stars_earned ?? 5
        }
      };
    });

    return NextResponse.json({ children });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

