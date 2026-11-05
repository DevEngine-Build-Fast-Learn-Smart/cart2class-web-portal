"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";
import { createClient } from "@/lib/supabase/server";

export type DeletionRequestState = { error?: string; success?: string };

export async function submitDeletionRequest(_: DeletionRequestState, formData: FormData): Promise<DeletionRequestState> {
  const supabase = await createClient();
  if (!supabase) return { error: "The service is not configured yet." };
  const { error } = await supabase.rpc("submit_data_deletion_request", {
    p_requester_name: String(formData.get("name") ?? ""),
    p_requester_email: String(formData.get("email") ?? ""),
    p_request_type: String(formData.get("requestType") ?? "other"),
    p_details: String(formData.get("details") ?? "")
  });
  if (error) return { error: error.message };
  return { success: "Your request was received. We will verify your authority before taking action." };
}

export async function savePolicyVersion(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return;
  const documentId = String(formData.get("documentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!documentId || !title || !content) return;
  await access.supabase.from("policy_versions").insert({ document_id: documentId, title, content_markdown: content, created_by: access.profile?.id, status: "draft" });
  revalidatePath("/admin/legal");
}

export async function publishPolicyVersion(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return;
  const versionId = String(formData.get("versionId") ?? "");
  if (!versionId) return;
  await access.supabase.rpc("publish_policy_version", { p_version_id: versionId });
  revalidatePath("/admin/legal");
  revalidatePath("/privacy-policy");
  revalidatePath("/terms-and-conditions");
  revalidatePath("/data-deletion");
  revalidatePath("/child-safety");
  revalidatePath("/acceptable-use");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function updateDeletionRequest(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase || !access.profile) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["received", "verifying", "in_progress", "completed", "declined"].includes(status)) return;
  await access.supabase.from("data_deletion_requests").update({ status, handled_by: access.profile.id, resolution_note: String(formData.get("resolutionNote") ?? "").trim() || null }).eq("id", id);
  revalidatePath("/admin/deletion-requests");
}
