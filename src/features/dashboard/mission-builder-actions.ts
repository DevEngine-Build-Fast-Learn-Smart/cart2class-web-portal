"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const refresh = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));

export async function saveStage1Question(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const spoken = String(formData.get("spoken") ?? "").trim();
  const hint = String(formData.get("hint") ?? "").trim();
  const correct = String(formData.get("correct") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();

  if (!prompt || !correct) return { error: "Prompt and correct answer are required." };

  const options = optionsRaw ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [correct];
  if (!options.includes(correct)) options.unshift(correct);

  const adminClient = createAdminClient();

  if (questionId) {
    await adminClient.from("mission_questions").update({
      prompt_text: prompt,
      spoken_prompt: spoken,
      hint_text: hint,
      answer_config: { correct, options },
      skill_tags: ["phonemic_awareness"]
    }).eq("id", questionId);
  } else {
    const { count } = await adminClient.from("mission_questions").select("*", { count: "exact", head: true }).eq("stage_id", stageId);
    await adminClient.from("mission_questions").insert({
      stage_id: stageId,
      question_order: (count || 0) + 1,
      question_type: "picture_choice",
      prompt_text: prompt,
      spoken_prompt: spoken,
      hint_text: hint,
      answer_config: { correct, options },
      skill_tags: ["phonemic_awareness"]
    });
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`, "/admin/missions");
  return { success: true };
}

export async function deleteStage1Question(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const questionId = String(formData.get("questionId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_questions").delete().eq("id", questionId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function saveStage2Product(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const productId = String(formData.get("productId") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const imageAsset = String(formData.get("imageAsset") ?? "assets/images/corn.svg").trim();
  const priceDollars = Number(formData.get("price") ?? 1.0);
  const priceCents = Math.round(priceDollars * 100);
  const weightGrams = Number(formData.get("weightGrams") ?? 500);
  const packageSize = String(formData.get("packageSize") ?? "1 each").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!name || !barcode) return { error: "Product name and barcode are required." };

  const adminClient = createAdminClient();

  if (productId) {
    await adminClient.from("mission_products").update({
      name,
      description,
      barcode,
      image_asset: imageAsset,
      price_cents: priceCents,
      weight_grams: weightGrams,
      package_size: packageSize,
      instructions,
      updated_at: new Date().toISOString()
    }).eq("id", productId);
  } else {
    const { count } = await adminClient.from("mission_products").select("*", { count: "exact", head: true }).eq("mission_id", missionId);
    await adminClient.from("mission_products").insert({
      mission_id: missionId,
      name,
      description,
      barcode,
      image_asset: imageAsset,
      price_cents: priceCents,
      currency: "USD",
      weight_grams: weightGrams,
      package_size: packageSize,
      instructions,
      order_index: (count || 0) + 1,
      is_available: true
    });
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function deleteStage2Product(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const productId = String(formData.get("productId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_products").delete().eq("id", productId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function saveStage3Reading(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const passageTitle = String(formData.get("passageTitle") ?? "").trim();
  const passageDetail = String(formData.get("passageDetail") ?? "").trim();
  const passageText = String(formData.get("passageText") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const durationSeconds = Number(formData.get("durationSeconds") ?? 30);
  const recordingEnabled = formData.get("recordingEnabled") === "on";

  if (!passageTitle || !passageText) return { error: "Passage title and complete passage text are required." };

  const adminClient = createAdminClient();

  // Update mission table passage metadata
  await adminClient.from("missions").update({
    passage: passageTitle,
    passage_detail: passageDetail,
    updated_at: new Date().toISOString()
  }).eq("id", missionId);

  // Update mission_stages
  if (stageId) {
    await adminClient.from("mission_stages").update({
      title: passageTitle,
      passage_text: passageText,
      instructions,
      duration_seconds: durationSeconds,
      recording_enabled: recordingEnabled
    }).eq("id", stageId);
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function saveStage4Math(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const spoken = String(formData.get("spoken") ?? "").trim();
  const kind = String(formData.get("kind") ?? "priceMore").trim();
  const correct = String(formData.get("correct") ?? "").trim();
  const hint = String(formData.get("hint") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();

  if (!prompt || !correct) return { error: "Prompt and correct answer are required." };

  const options = optionsRaw ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [correct];
  if (!options.includes(correct)) options.unshift(correct);

  const adminClient = createAdminClient();

  if (questionId) {
    await adminClient.from("mission_questions").update({
      prompt_text: prompt,
      spoken_prompt: spoken,
      question_kind: kind,
      hint_text: hint,
      answer_config: { correct, options },
      skill_tags: ["math", kind]
    }).eq("id", questionId);
  } else {
    const { count } = await adminClient.from("mission_questions").select("*", { count: "exact", head: true }).eq("stage_id", stageId);
    await adminClient.from("mission_questions").insert({
      stage_id: stageId,
      question_order: (count || 0) + 1,
      question_type: "math",
      question_kind: kind,
      prompt_text: prompt,
      spoken_prompt: spoken,
      hint_text: hint,
      answer_config: { correct, options },
      skill_tags: ["math", kind]
    });
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function deleteStage4Math(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const questionId = String(formData.get("questionId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_questions").delete().eq("id", questionId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function assignMissionToClass(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const storeId = String(formData.get("storeId") ?? "");
  const opensAt = String(formData.get("opensAt") ?? "");
  const expiresAt = String(formData.get("expiresAt") ?? "");

  if (!missionId || !classId) return { error: "Mission and Class are required." };

  const adminClient = createAdminClient();

  // Get current mission version
  const { data: ver } = await adminClient.from("mission_versions").select("id").eq("mission_id", missionId).order("version_number", { ascending: false }).limit(1).single();
  const versionId = ver?.id || "00000000-0000-0000-0000-000000000052";

  // Upsert assignment
  await adminClient.from("mission_assignments").insert({
    mission_id: missionId,
    mission_version_id: versionId,
    class_id: classId,
    assigned_by: access.profile.id,
    available_at: opensAt ? new Date(opensAt).toISOString() : new Date().toISOString(),
    due_at: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
    status: "available"
  });

  if (storeId) {
    await adminClient.from("missions").update({ store_id: storeId }).eq("id", missionId);
  }

  refresh("/teacher/classes", "/teacher/missions", "/teacher");
  return { success: true };
}

export async function uploadMissionAsset(formData: FormData) {
  const access = await requireRole("teacher");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const stageKey = String(formData.get("stageKey") ?? "general");
  const file = formData.get("file") as File | null;

  if (!file) return { error: "No file provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storagePath = `missions/${missionId || "general"}/${fileName}`;

  const adminClient = createAdminClient();

  // Upload to Supabase storage bucket mission-assets
  const { data: uploadRes, error: uploadErr } = await adminClient.storage
    .from("mission-assets")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadErr) {
    return { error: uploadErr.message };
  }

  const { data: pubUrl } = adminClient.storage.from("mission-assets").getPublicUrl(storagePath);
  const cdnUrl = pubUrl.publicUrl;

  // Insert into mission_assets table
  await adminClient.from("mission_assets").insert({
    mission_id: missionId || null,
    stage_key: stageKey,
    asset_path: `assets/${file.type.startsWith("image") ? "images" : "audio"}/${file.name}`,
    cdn_url: cdnUrl,
    sha256_hash: sha256,
    size_bytes: file.size,
    content_type: file.type,
    file_name: file.name
  });

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true, url: cdnUrl, sha256 };
}

