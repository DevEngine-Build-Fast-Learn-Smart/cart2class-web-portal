"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const refresh = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));

export async function createNewMission(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const gradeMin = Number(formData.get("gradeMin") ?? 0);
  const gradeMax = Number(formData.get("gradeMax") ?? 2);
  const estimatedMinutes = Number(formData.get("estimatedMinutes") ?? 12);
  const stars = Number(formData.get("stars") ?? 5);
  const opensAt = String(formData.get("opensAt") ?? "").trim();
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();
  const classIds = formData.getAll("classIds").map(String).filter(Boolean);
  let coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim();
  const coverFile = formData.get("coverFile") as File | null;

  if (!title) return { error: "Mission title is required." };

  const adminClient = createAdminClient();

  // Handle uploaded cover image if provided
  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > 5 * 1024 * 1024) {
      return { error: "Cover image must be less than 5MB." };
    }
    try {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const fileName = `cover_${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storagePath = `covers/${fileName}`;
      const { error: uploadErr } = await adminClient.storage
        .from("mission-assets")
        .upload(storagePath, buffer, { contentType: coverFile.type || "image/png", upsert: true });

      if (!uploadErr) {
        const { data: pubUrl } = adminClient.storage.from("mission-assets").getPublicUrl(storagePath);
        if (pubUrl?.publicUrl) coverImageUrl = pubUrl.publicUrl;
      } else {
        coverImageUrl = `data:${coverFile.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
    } catch (_) {}
  }

  // Determine highest current mission number to increment
  const { data: maxMission } = await adminClient
    .from("missions")
    .select("mission_number")
    .order("mission_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextMissionNumber = (maxMission?.mission_number ?? 4) + 1;

  // Resolve storeId: if not selected, default to the first active store
  let resolvedStoreId: string | null = storeId || null;
  if (!resolvedStoreId) {
    const { data: defaultStore } = await adminClient
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    resolvedStoreId = defaultStore?.id ?? null;
  }

  // Get organization id (from profile or first organization)
  const { data: org } = await adminClient.from("organizations").select("id").limit(1).maybeSingle();
  const orgId = org?.id || "00000000-0000-0000-0000-000000000001";

  // Determine initial status based on role and submission preference
  // Teachers MUST submit for admin review; only after admin approval does it become published & active for students.
  const isAdmin = access.memberships.some((m) => m.role === "admin");
  const isTeacher = !isAdmin;
  const submitImmediately = formData.get("submitForReview") === "true" || formData.get("submitForReview") === "on";

  let initialStatus: "draft" | "published" = "draft";
  let initialSharingStatus: string = "draft";

  if (!isTeacher) {
    // Admin directly creating can publish immediately or draft
    initialStatus = "published";
    initialSharingStatus = "approved";
  } else {
    // Teacher creating: must be reviewed by admin before publishing
    initialStatus = "draft";
    initialSharingStatus = submitImmediately ? "submitted" : "draft";
  }

  // 1. Insert into missions table
  const { data: newMission, error: missionErr } = await adminClient
    .from("missions")
    .insert({
      organization_id: orgId,
      creator_user_id: access.profile.id,
      title,
      description: description || "Interactive grocery discovery mission",
      grade_min: Math.max(0, Math.min(2, gradeMin)),
      grade_max: Math.max(gradeMin, Math.min(2, gradeMax)),
      estimated_minutes: Math.max(1, Math.min(60, estimatedMinutes)),
      stars: Math.max(1, stars),
      store_id: resolvedStoreId,
      cover_image: coverImageUrl || null,
      status: initialStatus,
      sharing_status: initialSharingStatus,
      mission_number: nextMissionNumber,
      current_version: 1,
      opens_at: opensAt ? new Date(opensAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      passage: title,
      passage_detail: description || `Welcome to ${title}!`
    })
    .select("*")
    .single();

  if (missionErr || !newMission) {
    return { error: missionErr?.message || "Failed to create mission." };
  }

  // 2. Insert into mission_versions table
  const { data: newVersion, error: verErr } = await adminClient
    .from("mission_versions")
    .insert({
      mission_id: newMission.id,
      version_number: 1,
      title: newMission.title,
      description: newMission.description,
      learning_objectives: ["Phonemic awareness", "Product barcode scanning", "Oral reading fluency", "Grocery math"],
      created_by: access.profile.id,
      snapshot: {}
    })
    .select("*")
    .single();

  if (verErr || !newVersion) {
    return { error: verErr?.message || "Failed to create mission version." };
  }

  // 3. Insert the 4 standard learning stages
  const stageDefs = [
    {
      mission_version_id: newVersion.id,
      stage_key: "phonemic_awareness",
      stage_order: 1,
      title: "Stage 1: Phonemic Awareness & Sounds",
      prompt_text: "Listen and find the sound.",
      recording_enabled: false,
      duration_seconds: 60
    },
    {
      mission_version_id: newVersion.id,
      stage_key: "phonics",
      stage_order: 2,
      title: "Stage 2: Grocery Products & Barcodes",
      prompt_text: "Find and scan the items.",
      recording_enabled: false,
      duration_seconds: 120
    },
    {
      mission_version_id: newVersion.id,
      stage_key: "fluency",
      stage_order: 3,
      title: title,
      prompt_text: "Read the passage aloud.",
      passage_text: description || `Welcome to the grocery store! Look for fresh and healthy foods. Each item helps you grow strong and learn new words.`,
      instructions: "Read aloud clearly into your device microphone.",
      recording_enabled: true,
      duration_seconds: 45
    },
    {
      mission_version_id: newVersion.id,
      stage_key: "math",
      stage_order: 4,
      title: "Stage 4: Grocery Mathematics",
      prompt_text: "Compare prices and quantities.",
      recording_enabled: false,
      duration_seconds: 60
    }
  ];

  const { data: createdStages, error: stagesErr } = await adminClient
    .from("mission_stages")
    .insert(stageDefs)
    .select("*");

  if (stagesErr || !createdStages) {
    return { error: stagesErr?.message || "Failed to create mission stages." };
  }

  const stageByKey = new Map(createdStages.map((s) => [s.stage_key, s.id]));

  // 4. Seed starter sound question
  const stage1Id = stageByKey.get("phonemic_awareness");
  if (stage1Id) {
    await adminClient.from("mission_questions").insert({
      stage_id: stage1Id,
      question_order: 1,
      question_type: "picture_choice",
      prompt_text: "Which one starts with /a/?",
      spoken_prompt: "Which word begins with the sound ah?",
      hint_text: "Listen: ah, ah, apple.",
      answer_config: {
        correct: "apple",
        options: ["apple", "banana", "carrot", "corn"],
        optionImages: {
          apple: "/assets/images/apple.svg",
          banana: "/assets/images/banana.svg",
          carrot: "/assets/images/carrot.svg",
          corn: "/assets/images/corn.svg"
        }
      },
      skill_tags: ["phonemic_awareness"]
    });
  }

  // 5. Seed starter product
  await adminClient.from("mission_products").insert({
    mission_id: newMission.id,
    name: "Fresh Apples",
    description: "Crisp sweet red apples in produce",
    barcode: "C2CAPPLE001",
    image_asset: "assets/images/apple.svg",
    price_cents: 149,
    currency: "USD",
    weight_grams: 400,
    package_size: "1 lb bag",
    instructions: "Find fresh apples in the produce section and scan the barcode label.",
    order_index: 1,
    is_available: true
  });

  // 6. Seed starter math question
  const stage4Id = stageByKey.get("math");
  if (stage4Id) {
    await adminClient.from("mission_questions").insert({
      stage_id: stage4Id,
      question_order: 1,
      question_type: "math",
      question_kind: "priceLess",
      prompt_text: "Which item costs less?",
      spoken_prompt: "Which grocery item costs less?",
      hint_text: "Compare the prices.",
      answer_config: {
        correct: "corn ($0.89)",
        options: ["corn ($0.89)", "apples ($1.49)"]
      },
      skill_tags: ["math", "priceLess"]
    });
  }

  // 7. Assign mission to selected classrooms
  if (classIds.length > 0) {
    const assignmentRows = classIds.map((cId) => ({
      mission_id: newMission.id,
      mission_version_id: newVersion.id,
      class_id: cId,
      assigned_by: access.profile.id,
      available_at: opensAt ? new Date(opensAt).toISOString() : new Date().toISOString(),
      due_at: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      status: "available"
    }));

    await adminClient.from("mission_assignments").insert(assignmentRows);
  }

  refresh("/teacher/missions", "/admin/missions", "/teacher/library", "/admin/library", "/teacher/classes", `/teacher/missions?id=${newMission.id}`);
  return { success: true, missionId: newMission.id };
}

export async function saveStage1Question(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const spoken = String(formData.get("spoken") ?? "").trim();
  const hint = String(formData.get("hint") ?? "").trim();
  const correct = String(formData.get("correct") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const optionImagesRaw = String(formData.get("optionImagesJson") ?? "").trim();

  let optionImages: Record<string, string> = {};
  if (optionImagesRaw) {
    try {
      optionImages = JSON.parse(optionImagesRaw);
    } catch (_) {}
  }

  if (!prompt || !correct) return { error: "Prompt and correct answer are required." };

  const options = optionsRaw ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [correct];
  if (!options.includes(correct)) options.unshift(correct);

  const adminClient = createAdminClient();

  if (questionId) {
    await adminClient.from("mission_questions").update({
      prompt_text: prompt,
      spoken_prompt: spoken,
      hint_text: hint,
      answer_config: { correct, options, optionImages },
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
      answer_config: { correct, options, optionImages },
      skill_tags: ["phonemic_awareness"]
    });
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`, "/admin/missions");
  return { success: true };
}

export async function deleteStage1Question(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const questionId = String(formData.get("questionId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_questions").delete().eq("id", questionId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function saveStage2Product(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const missionId = String(formData.get("missionId") ?? "");
  const productId = String(formData.get("productId") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  let imageAsset = String(formData.get("imageAsset") ?? "assets/images/corn.svg").trim();
  const priceDollars = Number(formData.get("price") ?? 1.0);
  const priceCents = Math.round(priceDollars * 100);
  const weightGrams = Number(formData.get("weightGrams") ?? 500);
  const packageSize = String(formData.get("packageSize") ?? "1 each").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!name || !barcode) return { error: "Product name and barcode are required." };

  const adminClient = createAdminClient();

  // Handle uploaded product file if provided
  const productFile = formData.get("productFile") as File | null;
  if (productFile && productFile.size > 0) {
    if (productFile.size > 5 * 1024 * 1024) {
      return { error: "Product picture must be less than 5MB." };
    }
    try {
      const buffer = Buffer.from(await productFile.arrayBuffer());
      const fileName = `${Date.now()}_${productFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storagePath = `products/${missionId || "general"}/${fileName}`;
      const { error: uploadErr } = await adminClient.storage
        .from("mission-assets")
        .upload(storagePath, buffer, { contentType: productFile.type || "image/png", upsert: true });

      if (!uploadErr) {
        const { data: pubUrl } = adminClient.storage.from("mission-assets").getPublicUrl(storagePath);
        if (pubUrl?.publicUrl) imageAsset = pubUrl.publicUrl;
      } else {
        // Fallback to base64 data URI so image is always preserved
        imageAsset = `data:${productFile.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
    } catch (_) {
      try {
        const buffer = Buffer.from(await productFile.arrayBuffer());
        imageAsset = `data:${productFile.type || "image/png"};base64,${buffer.toString("base64")}`;
      } catch (_) {}
    }
  }

  let savedProduct: any = null;
  if (productId) {
    const { data } = await adminClient.from("mission_products").update({
      name,
      description,
      barcode,
      image_asset: imageAsset,
      price_cents: priceCents,
      weight_grams: weightGrams,
      package_size: packageSize,
      instructions,
      updated_at: new Date().toISOString()
    }).eq("id", productId).select("*").single();
    savedProduct = data;
  } else {
    const { count } = await adminClient.from("mission_products").select("*", { count: "exact", head: true }).eq("mission_id", missionId);
    const { data } = await adminClient.from("mission_products").insert({
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
    }).select("*").single();
    savedProduct = data;
  }

  // Also sync with global products catalog
  try {
    const { data: globalProd } = await adminClient.from("products").select("id").eq("barcode", barcode).maybeSingle();
    let globalProdId = globalProd?.id;
    if (!globalProdId) {
      const { data: newP } = await adminClient.from("products").insert({
        barcode,
        name,
        category: "Produce",
        price: priceDollars,
        weight_text: `${weightGrams}g`,
        data_source: "Mission Builder",
        barcode_symbology: "CODE128"
      }).select("id").maybeSingle();
      globalProdId = newP?.id;
    }
    if (globalProdId && savedProduct?.id) {
      await adminClient.from("mission_products").update({ product_id: globalProdId }).eq("id", savedProduct.id);
    }
  } catch (_) {}

  refresh("/teacher/missions", `/teacher/missions/${missionId}`, `/admin/missions`, `/store/products`);
  return { success: true, product: savedProduct };
}

export async function deleteStage2Product(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const productId = String(formData.get("productId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_products").delete().eq("id", productId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function saveStage3Reading(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
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
  const access = await requireAnyRole(["teacher", "admin"]);
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
  const optionImagesRaw = String(formData.get("optionImagesJson") ?? "").trim();

  let optionImages: Record<string, string> = {};
  if (optionImagesRaw) {
    try {
      optionImages = JSON.parse(optionImagesRaw);
    } catch (_) {}
  }

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
      answer_config: { correct, options, optionImages },
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
      answer_config: { correct, options, optionImages },
      skill_tags: ["math", kind]
    });
  }

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function deleteStage4Math(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const questionId = String(formData.get("questionId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");

  const adminClient = createAdminClient();
  await adminClient.from("mission_questions").delete().eq("id", questionId);

  refresh("/teacher/missions", `/teacher/missions/${missionId}`);
  return { success: true };
}

export async function assignMissionToClass(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
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
  const access = await requireAnyRole(["teacher", "admin"]);
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

export async function uploadOptionImage(formData: FormData) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  const missionId = String(formData.get("missionId") ?? "general");

  if (!file || file.size === 0) return { error: "No file provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storagePath = `options/${missionId}/${fileName}`;

  const adminClient = createAdminClient();
  const { error: uploadErr } = await adminClient.storage
    .from("mission-assets")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadErr) return { error: uploadErr.message };

  const { data: pubUrl } = adminClient.storage.from("mission-assets").getPublicUrl(storagePath);
  const cdnUrl = pubUrl.publicUrl;

  await adminClient.from("mission_assets").insert({
    mission_id: missionId === "general" ? null : missionId,
    stage_key: "options",
    asset_path: cdnUrl,
    cdn_url: cdnUrl,
    sha256_hash: sha256,
    size_bytes: file.size,
    content_type: file.type,
    file_name: file.name
  });

  return { success: true, url: cdnUrl };
}

export async function resetClassroomLeaderboard(classId: string) {
  const access = await requireAnyRole(["teacher", "admin"]);
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };
  if (!classId) return { error: "Classroom ID is required." };

  const adminClient = createAdminClient();

  // 1. Get all students in this class
  const { data: students } = await adminClient
    .from("students")
    .select("id")
    .eq("class_id", classId);

  const studentIds = (students ?? []).map((s) => s.id);

  if (studentIds.length > 0) {
    // 2. Clear mission attempts for these students
    await adminClient
      .from("mission_attempts")
      .delete()
      .in("student_id", studentIds);

    // 3. Clear mission runs for these students
    await adminClient
      .from("mission_runs")
      .delete()
      .in("student_id", studentIds);
  }

  // 4. Reset class confirmed stars
  await adminClient
    .from("classes")
    .update({ confirmed_stars: 0, updated_at: new Date().toISOString() })
    .eq("id", classId);

  // 5. Reset reward goals current stars
  await adminClient
    .from("reward_goals")
    .update({ current_stars: 0, updated_at: new Date().toISOString() })
    .eq("class_id", classId);

  // 6. Audit log entry
  try {
    await adminClient.from("audit_logs").insert({
      organization_id: "00000000-0000-0000-0000-000000000001",
      actor_user_id: access.profile.id,
      action: "classroom.reset_leaderboard",
      entity_type: "class",
      entity_id: classId,
      metadata: {
        teacher_name: access.profile.display_name,
        students_affected: studentIds.length,
        reset_at: new Date().toISOString()
      }
    });
  } catch (_) {}

  refresh("/teacher/classes", "/teacher", "/parent/leaderboard", "/parent/progress");
  return { success: true };
}


