"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";

const refresh = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));

export async function createMission(formData: FormData) {
  const access = await requireRole("teacher"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("create_teacher_mission", { p_title: String(formData.get("title") ?? ""), p_description: String(formData.get("description") ?? ""), p_grade_min: Number(formData.get("gradeMin")), p_grade_max: Number(formData.get("gradeMax")), p_estimated_minutes: Number(formData.get("minutes")) });
  refresh("/teacher/missions", "/teacher");
}

export async function submitMission(formData: FormData) {
  const access = await requireRole("teacher"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("submit_mission_for_review", { p_mission_id: String(formData.get("missionId") ?? "") });
  refresh("/teacher/missions", "/teacher", "/admin/reviews");
}

export async function reviewMission(formData: FormData) {
  const access = await requireRole("admin"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("review_mission", { p_mission_id: String(formData.get("missionId") ?? ""), p_decision: String(formData.get("decision") ?? ""), p_feedback: String(formData.get("feedback") ?? "") });
  refresh("/admin/reviews", "/admin/missions", "/teacher/missions");
}

export async function publishMission(formData: FormData) {
  const access = await requireRole("admin"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("publish_mission", { p_mission_id: String(formData.get("missionId") ?? "") });
  refresh("/admin/missions", "/teacher/missions");
}

export async function reviewRecording(formData: FormData) {
  const access = await requireRole("teacher"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("review_reading_recording", { p_recording_id: String(formData.get("recordingId") ?? ""), p_feedback: String(formData.get("feedback") ?? ""), p_request_another: formData.get("requestAnother") === "on" });
  refresh("/teacher/recordings", "/parent/recordings", "/teacher");
}

export async function transitionReward(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("transition_reward_goal", { p_reward_goal_id: String(formData.get("rewardId") ?? ""), p_action: String(formData.get("action") ?? "") });
  refresh("/store/rewards", "/store");
}

export async function updateStoreProfile(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("update_own_store_profile", { p_store_id: String(formData.get("storeId") ?? ""), p_contact_email: String(formData.get("contactEmail") ?? ""), p_address: String(formData.get("address") ?? ""), p_business_hours: String(formData.get("businessHours") ?? ""), p_representative_name: String(formData.get("representativeName") ?? "") });
  refresh("/store/profile");
}

export async function saveRewardPreparation(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("save_reward_preparation", { p_reward_goal_id: String(formData.get("rewardId") ?? ""), p_preparation_note: String(formData.get("preparationNote") ?? "") });
  refresh("/store/rewards");
}

export async function markStoreNotificationRead(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  await access.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", String(formData.get("notificationId") ?? ""));
  refresh("/store/notifications", "/store");
}

export async function saveStoreProduct(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  const price = String(formData.get("price") ?? "").trim();
  await access.supabase.rpc("save_store_product_listing", { p_store_id: String(formData.get("storeId") ?? ""), p_listing_id: String(formData.get("listingId") ?? "").trim() || null, p_name: String(formData.get("name") ?? ""), p_barcode: String(formData.get("barcode") ?? ""), p_category: String(formData.get("category") ?? ""), p_description: String(formData.get("description") ?? ""), p_brand: String(formData.get("brand") ?? ""), p_sku: String(formData.get("sku") ?? ""), p_price: price ? Number(price) : null, p_currency: String(formData.get("currency") ?? "USD"), p_package_size: String(formData.get("packageSize") ?? ""), p_weight_text: String(formData.get("weight") ?? ""), p_image_path: String(formData.get("imagePath") ?? ""), p_is_available: formData.get("isAvailable") === "on" });
  refresh("/store/products");
}

export async function archiveStoreProduct(formData: FormData) {
  const access = await requireRole("store"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("archive_store_product_listing", { p_listing_id: String(formData.get("listingId") ?? "") });
  refresh("/store/products");
}

export async function saveTeacherStudent(formData: FormData) {
  const access = await requireRole("teacher"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("save_teacher_student", { p_student_id: String(formData.get("studentId") ?? "").trim() || null, p_class_id: String(formData.get("classId") ?? ""), p_first_name: String(formData.get("firstName") ?? ""), p_last_initial: String(formData.get("lastInitial") ?? ""), p_grade_level: Number(formData.get("gradeLevel")) });
  refresh("/teacher/students", "/teacher/classes", "/teacher");
}

export async function deactivateTeacherStudent(formData: FormData) {
  const access = await requireRole("teacher"); if (access.unavailable || !access.supabase) return;
  await access.supabase.rpc("deactivate_teacher_student", { p_student_id: String(formData.get("studentId") ?? "") });
  refresh("/teacher/students", "/teacher/classes", "/teacher");
}
