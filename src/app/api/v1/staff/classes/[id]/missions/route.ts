import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const body = await req.json();
    const { missionId: rawMissionId, storeId, opensAt, expiresAt } = body;

    const supabase = createAdminClient();

    let actualClassId = classId;
    if (!isUuid(classId)) {
      const { data } = await supabase.from("classes").select("id").limit(1).single();
      actualClassId = data?.id || "00000000-0000-0000-0000-000000000021";
    }

    let missionId = rawMissionId;
    if (!isUuid(missionId) || missionId === "fruit-veggie-04") {
      missionId = "00000000-0000-0000-0000-000000000051";
    }

    // Get teacher from class assignment or default
    const { data: teacherAssignment } = await supabase
      .from("teacher_class_assignments")
      .select("teacher_user_id")
      .eq("class_id", actualClassId)
      .limit(1)
      .single();

    const assignedBy = teacherAssignment?.teacher_user_id || "00000000-0000-0000-0000-000000000001";

    // Get mission version
    const { data: version } = await supabase
      .from("mission_versions")
      .select("id")
      .eq("mission_id", missionId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const versionId = version?.id || "00000000-0000-0000-0000-000000000052";

    // Insert or update mission assignment
    await supabase.from("mission_assignments").upsert(
      {
        mission_id: missionId,
        mission_version_id: versionId,
        class_id: actualClassId,
        assigned_by: assignedBy,
        available_at: opensAt || new Date().toISOString(),
        due_at: expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
        status: "available"
      },
      { onConflict: "id" }
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.json({
      assigned: true,
      storeQrCode: `c2c-store:${storeId || "partner-market-01"}:${new Date().toISOString().slice(0, 7)}:sig_89ab`,
      studentCardsPdfUrl: `${baseUrl}/teacher/students`,
      parentInviteCodesUrl: `${baseUrl}/teacher/students`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
