"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole, requireRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleMissionStatus(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  const currentStatus = String(formData.get("currentStatus") ?? "draft").trim();
  const newStatus = currentStatus === "published" ? "draft" : "published";

  const adminClient = createAdminClient();
  const isAdmin = access.memberships.some((m) => m.role === "admin");

  if (newStatus === "published" && !isAdmin) {
    const { data: m } = await adminClient
      .from("missions")
      .select("sharing_status")
      .eq("id", missionId)
      .single();

    if (m && m.sharing_status !== "approved" && m.sharing_status !== "featured") {
      return {
        error: "This mission must be approved by an administrator before it can be published to student tablets."
      };
    }
  }

  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newStatus === "published" && isAdmin) {
    updatePayload.sharing_status = "approved";
  }

  const { error } = await adminClient
    .from("missions")
    .update(updatePayload)
    .eq("id", missionId);

  if (error) return { error: error.message };

  if (newStatus === "published" && isAdmin) {
    await adminClient.from("mission_reviews").insert({
      mission_id: missionId,
      reviewer_user_id: access.profile.id,
      decision: "approved",
      feedback: "Approved and published for students"
    });
  }

  revalidatePath("/teacher/library");
  revalidatePath("/teacher/missions");
  revalidatePath("/admin/missions");
  revalidatePath("/admin/library");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { success: true, status: newStatus };
}

/** Permanently removes a mission and its dependent learning records. Admin only. */
export async function deleteMission(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  if (!missionId) return { error: "Mission ID is required." };

  const adminClient = createAdminClient();
  const { data: mission } = await adminClient
    .from("missions")
    .select("id,title")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) return { error: "Mission not found or it has already been deleted." };

  // Mission attempts reference both assignments and versions without a cascade.
  // Remove their responses first so a real deletion cannot leave orphaned data.
  const [{ data: versions }, { data: assignments }, { data: assets }] = await Promise.all([
    adminClient.from("mission_versions").select("id").eq("mission_id", missionId),
    adminClient.from("mission_assignments").select("id").eq("mission_id", missionId),
    adminClient
      .from("mission_assets")
      .select("storage_bucket,storage_path")
      .eq("mission_id", missionId),
  ]);
  const versionIds = (versions ?? []).map((version) => version.id);
  const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);
  let attemptQuery = adminClient.from("mission_attempts").select("id");
  if (versionIds.length) attemptQuery = attemptQuery.in("mission_version_id", versionIds);
  else if (assignmentIds.length) attemptQuery = attemptQuery.in("assignment_id", assignmentIds);
  const { data: attempts, error: attemptsReadError } = await attemptQuery;
  if (attemptsReadError) return { error: attemptsReadError.message };

  const attemptIds = (attempts ?? []).map((attempt) => attempt.id);
  if (attemptIds.length) {
    const { error: responseError } = await adminClient
      .from("mission_responses")
      .delete()
      .in("attempt_id", attemptIds);
    if (responseError) return { error: responseError.message };

    const { error: attemptError } = await adminClient
      .from("mission_attempts")
      .delete()
      .in("id", attemptIds);
    if (attemptError) return { error: attemptError.message };
  }

  if (assignmentIds.length) {
    const { error: assignmentError } = await adminClient
      .from("mission_assignments")
      .delete()
      .in("id", assignmentIds);
    if (assignmentError) return { error: assignmentError.message };
  }

  const { error: missionError } = await adminClient
    .from("missions")
    .delete()
    .eq("id", missionId);
  if (missionError) return { error: missionError.message };

  // The database cascade removes the mission_assets rows. Remove their storage
  // objects separately only after the database deletion succeeds.
  const assetsByBucket = new Map<string, string[]>();
  for (const asset of assets ?? []) {
    if (!asset.storage_path) continue;
    const bucket = asset.storage_bucket || "mission-assets";
    assetsByBucket.set(bucket, [...(assetsByBucket.get(bucket) ?? []), asset.storage_path]);
  }
  await Promise.all(
    [...assetsByBucket.entries()].map(([bucket, paths]) =>
      adminClient.storage.from(bucket).remove(paths),
    ),
  );

  await adminClient.from("audit_logs").insert({
    actor_user_id: access.profile.id,
    action: "mission.deleted",
    entity_type: "mission",
    entity_id: missionId,
    metadata: { title: mission.title },
  });

  revalidatePath("/admin/library");
  revalidatePath("/admin/missions");
  revalidatePath("/admin/barcodes");
  revalidatePath("/teacher/library");
  revalidatePath("/teacher/missions");
  return { success: true };
}

export async function cloneMission(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const sourceMissionId = String(formData.get("missionId") ?? "").trim();
  if (!sourceMissionId) return { error: "Mission ID is required" };

  const adminClient = createAdminClient();

  // Fetch source mission
  const { data: sourceMission } = await adminClient
    .from("missions")
    .select("*")
    .eq("id", sourceMissionId)
    .single();

  if (!sourceMission) return { error: "Source mission not found" };

  // Create cloned mission
  const { data: newMission, error: cloneError } = await adminClient
    .from("missions")
    .insert({
      title: `${sourceMission.title} (Copy)`,
      description: sourceMission.description,
      grade_min: sourceMission.grade_min,
      grade_max: sourceMission.grade_max,
      estimated_minutes: sourceMission.estimated_minutes,
      stars: sourceMission.stars,
      status: "draft",
      sharing_status: "private",
      passage: sourceMission.passage,
      passage_detail: sourceMission.passage_detail,
      store_id: sourceMission.store_id
    })
    .select("id")
    .single();

  if (cloneError || !newMission) return { error: cloneError?.message || "Failed to clone mission" };

  // Create version 1 for new mission
  const { data: newVersion } = await adminClient
    .from("mission_versions")
    .insert({
      mission_id: newMission.id,
      version_number: 1,
      changelog: "Cloned from shared mission library"
    })
    .select("id")
    .single();

  // Clone stages & questions if source has version
  const { data: sourceVersions } = await adminClient
    .from("mission_versions")
    .select("id")
    .eq("mission_id", sourceMissionId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (sourceVersions?.[0]?.id && newVersion?.id) {
    const { data: stages } = await adminClient
      .from("mission_stages")
      .select("*")
      .eq("mission_version_id", sourceVersions[0].id)
      .order("stage_order");

    for (const stage of stages ?? []) {
      const { data: newStage } = await adminClient
        .from("mission_stages")
        .insert({
          mission_version_id: newVersion.id,
          stage_order: stage.stage_order,
          stage_type: stage.stage_type,
          title: stage.title,
          passage_text: stage.passage_text,
          instructions: stage.instructions,
          duration_seconds: stage.duration_seconds,
          recording_enabled: stage.recording_enabled
        })
        .select("id")
        .single();

      if (newStage?.id) {
        const { data: questions } = await adminClient
          .from("mission_questions")
          .select("*")
          .eq("stage_id", stage.id)
          .order("question_order");

        if (questions && questions.length > 0) {
          await adminClient.from("mission_questions").insert(
            questions.map((q) => ({
              stage_id: newStage.id,
              question_order: q.question_order,
              question_type: q.question_type,
              question_kind: q.question_kind,
              prompt_text: q.prompt_text,
              spoken_prompt: q.spoken_prompt,
              hint_text: q.hint_text,
              answer_config: q.answer_config,
              skill_tags: q.skill_tags
            }))
          );
        }
      }
    }
  }

  // Clone products
  const { data: products } = await adminClient
    .from("mission_products")
    .select("*")
    .eq("mission_id", sourceMissionId);

  if (products && products.length > 0) {
    await adminClient.from("mission_products").insert(
      products.map((p) => ({
        mission_id: newMission.id,
        name: p.name,
        description: p.description,
        barcode: p.barcode,
        image_asset: p.image_asset,
        price_cents: p.price_cents,
        currency: p.currency || "USD",
        weight_grams: p.weight_grams,
        package_size: p.package_size,
        instructions: p.instructions,
        order_index: p.order_index,
        is_available: p.is_available
      }))
    );
  }

  revalidatePath("/teacher/library");
  revalidatePath("/teacher/missions");
  return { success: true, newMissionId: newMission.id };
}

export async function updateMissionSharing(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  const sharingStatus = String(formData.get("sharingStatus") ?? "private").trim();

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("missions")
    .update({
      sharing_status: sharingStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", missionId);

  if (error) return { error: error.message };

  revalidatePath("/teacher/library");
  revalidatePath("/teacher/missions");
  return { success: true };
}

export async function updateMissionStudentAccess(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  const allStudents = formData.get("allStudents") === "true";
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);

  if (!missionId) return { error: "Mission ID is required." };

  const adminClient = createAdminClient();

  // 1. Clear existing student assignments for this mission
  await adminClient.from("mission_student_assignments").delete().eq("mission_id", missionId);

  // 2. If specific students selected (not allStudents), insert records
  if (!allStudents && studentIds.length > 0) {
    const rows = studentIds.map((sId) => ({
      mission_id: missionId,
      student_id: sId,
      assigned_by: access.profile.id
    }));
    const { error: insertErr } = await adminClient.from("mission_student_assignments").insert(rows);
    if (insertErr) return { error: insertErr.message };

    // Also ensure classrooms of those students have a mission_assignment row
    const { data: students } = await adminClient.from("students").select("class_id").in("id", studentIds);
    const classIds = Array.from(new Set((students ?? []).map((s) => s.class_id).filter(Boolean)));
    
    // Get latest mission version
    const { data: latestVersion } = await adminClient
      .from("mission_versions")
      .select("id")
      .eq("mission_id", missionId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion && classIds.length > 0) {
      for (const cId of classIds) {
        const { data: existing } = await adminClient
          .from("mission_assignments")
          .select("id")
          .eq("mission_id", missionId)
          .eq("class_id", cId)
          .maybeSingle();

        if (!existing) {
          await adminClient.from("mission_assignments").insert({
            mission_id: missionId,
            mission_version_id: latestVersion.id,
            class_id: cId,
            assigned_by: access.profile.id,
            status: "available",
            available_at: new Date().toISOString()
          });
        }
      }
    }
  }

  revalidatePath("/teacher/library");
  revalidatePath("/admin/library");
  revalidatePath("/teacher/missions");
  revalidatePath("/admin/missions");

  return { success: true, count: allStudents ? "all" : studentIds.length };
}

