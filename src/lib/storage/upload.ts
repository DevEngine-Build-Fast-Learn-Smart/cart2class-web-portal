import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes

export async function processImageUpload({
  file,
  url,
  folder,
  fileNamePrefix,
}: {
  file?: File | null;
  url?: string | null;
  folder: string;
  fileNamePrefix?: string;
}): Promise<{ url?: string | null; error?: string }> {
  // 1. If local file provided
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      return {
        error: `Selected image exceeds the 5MB limit (${mbSize}MB). Please upload a file smaller than 5MB.`,
      };
    }

    try {
      const adminClient = createAdminClient();
      const buffer = Buffer.from(await file.arrayBuffer());
      const safePrefix = fileNamePrefix ? `${fileNamePrefix}_` : "";
      const safeName = (file.name || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${folder}/${safePrefix}${Date.now()}_${safeName}`;

      const { error: uploadErr } = await adminClient.storage
        .from("mission-assets")
        .upload(storagePath, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        return { error: `Upload failed: ${uploadErr.message}` };
      }

      const { data: pubData } = adminClient.storage
        .from("mission-assets")
        .getPublicUrl(storagePath);

      return { url: pubData?.publicUrl };
    } catch (err: any) {
      console.error("Failed to process image upload:", err);
      return { error: err?.message || "Failed to process image upload." };
    }
  }

  // 2. If web URL provided (including empty string to clear)
  if (typeof url === "string") {
    const cleanUrl = url.trim();
    return { url: cleanUrl || null };
  }

  return {};
}

