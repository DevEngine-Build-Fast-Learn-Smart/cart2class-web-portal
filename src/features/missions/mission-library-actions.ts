"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleMissionStatus(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  const currentStatus = String(formData.get("currentStatus") ?? "draft").trim();
  const newStatus = currentStatus === "published" ? "draft" : "published";

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("missions")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", missionId);

  if (error) return { error: error.message };

  revalidatePath("/teacher/library");
  revalidatePath("/teacher/missions");
  revalidatePath("/admin/missions");
  return { success: true, status: newStatus };
}

export async function cloneMission(formData: FormData) {
  const access = await requireRole("teacher");
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
      sharing_status: "community",
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
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "").trim();
  const sharingStatus = String(formData.get("sharingStatus") ?? "community").trim();

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

