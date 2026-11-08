"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateMyProfile(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Authentication service unavailable" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to update your profile" };

  const displayName = String(formData.get("displayName") ?? "").trim();
  let avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const avatarFile = formData.get("avatarFile") as File | null;

  if (!displayName) {
    return { error: "Display name cannot be empty." };
  }

  // 5MB max check
  if (avatarFile && avatarFile.size > 5 * 1024 * 1024) {
    return { error: "Profile picture exceeds the 5MB limit. Please choose a smaller file." };
  }

  const adminClient = createAdminClient();

  // If local file uploaded, upload to Supabase storage
  if (avatarFile && avatarFile.size > 0) {
    try {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const fileName = `${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storagePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadErr } = await adminClient.storage
        .from("mission-assets")
        .upload(storagePath, buffer, {
          contentType: avatarFile.type,
          upsert: true
        });

      if (!uploadErr) {
        const { data: pubUrl } = adminClient.storage.from("mission-assets").getPublicUrl(storagePath);
        if (pubUrl?.publicUrl) {
          avatarUrl = pubUrl.publicUrl;
        }
      }
    } catch (err) {
      console.error("Failed to upload avatar file", err);
    }
  }

  // Update public.profiles
  try {
    const updatePayload: Record<string, any> = {
      display_name: displayName,
      updated_at: new Date().toISOString()
    };
    if (avatarUrl) {
      updatePayload.avatar_url = avatarUrl;
    }

    const { error: profErr } = await adminClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    // If avatar_url column doesn't exist yet in remote schema, update only display_name
    if (profErr && profErr.message.includes("avatar_url")) {
      await adminClient
        .from("profiles")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
    }
  } catch (err) {
    console.error("Profile update error", err);
  }

  // Always update Supabase Auth user_metadata
  try {
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: displayName,
        display_name: displayName,
        avatar_url: avatarUrl || user.user_metadata?.avatar_url || null
      }
    });
  } catch (err) {
    console.error("Auth metadata update error", err);
  }

  revalidatePath("/", "layout");
  return { success: true, displayName, avatarUrl };
}

