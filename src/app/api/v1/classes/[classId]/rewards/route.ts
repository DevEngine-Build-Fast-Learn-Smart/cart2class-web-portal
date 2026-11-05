import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const supabase = createAdminClient();

    let reward = "Pizza party";
    let confirmedStars = 73;
    let targetStars = 100;
    let updatedAt = new Date().toISOString();

    const { data: classData } = await supabase
      .from("classes")
      .select("id, reward_title, confirmed_stars, target_stars, updated_at")
      .eq("id", classId)
      .single();

    if (classData) {
      reward = classData.reward_title || reward;
      confirmedStars = classData.confirmed_stars ?? confirmedStars;
      targetStars = classData.target_stars ?? targetStars;
      updatedAt = classData.updated_at || updatedAt;
    }

    return NextResponse.json({
      classId,
      reward,
      confirmedStars,
      targetStars,
      previousMissions: [1, 2, 3, 4],
      updatedAt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

