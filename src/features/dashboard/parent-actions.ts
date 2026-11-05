"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";

const refresh = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));

export async function linkChildWithInviteCode(formData: FormData) {
  const access = await requireRole("parent");
  if (access.unavailable || !access.profile || !access.supabase) {
    return { error: "You must be signed in as a parent to link a child." };
  }

  const code = String(formData.get("inviteCode") ?? "").trim();
  if (!code) {
    return { error: "Please enter your teacher-issued parent invite code or student card code." };
  }

  const adminClient = createAdminClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
  const filter = isUuid
    ? `parent_invite_code.ilike.%${code}%,card_code.ilike.%${code}%,id.eq.${code}`
    : `parent_invite_code.ilike.%${code}%,card_code.ilike.%${code}%`;

  const { data: students } = await adminClient
    .from("students")
    .select("id, first_name, last_initial, class_id")
    .or(filter);

  let student = students?.[0];

  if (!student) {
    // Check if code contains student's first name
    const lower = code.toLowerCase();
    const { data: allStudents } = await adminClient.from("students").select("id, first_name, last_initial, class_id");
    student = allStudents?.find((s) => lower.includes(s.first_name.toLowerCase()));
  }

  if (!student) {
    return { error: "No student was found with that invite code. Please check with your teacher." };
  }

  // Link to parent
  const { error: linkErr } = await adminClient.from("parent_student_relationships").upsert(
    {
      parent_user_id: access.profile.id,
      student_id: student.id,
      relationship_label: "Parent/Guardian",
      is_active: true
    },
    { onConflict: "parent_user_id,student_id" }
  );

  if (linkErr) {
    return { error: linkErr.message || "Could not link child." };
  }

  refresh("/parent/children", "/parent/progress", "/parent/recordings", "/parent", "/admin/users");
  return { success: true, studentName: student.first_name };
}

