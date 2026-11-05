import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey);

async function seed() {
  console.log("Seeding student codes and full mission data...");

  // Update students with card codes and invite codes
  const { data: students } = await supabase.from("students").select("id,first_name,last_initial").order("first_name");
  if (students && students.length >= 2) {
    await supabase.from("students").update({
      first_name: "Maya",
      last_initial: "C",
      parent_invite_code: "C2C-PAR-MAYA-8492",
      card_code: "c2c-card:v1:stu_maya_9f8a7b6c"
    }).eq("id", students[0].id);

    await supabase.from("students").update({
      first_name: "Jordan",
      last_initial: "M",
      parent_invite_code: "C2C-PAR-JORDAN-3914",
      card_code: "c2c-card:v1:stu_jordan_4a2c1f8e"
    }).eq("id", students[1].id);

    console.log("Updated students with codes.");
  }

  // Update class rewards
  const { data: classes } = await supabase.from("classes").select("id").limit(2);
  if (classes && classes.length > 0) {
    await supabase.from("classes").update({
      reward_title: "Pizza party",
      confirmed_stars: 73,
      target_stars: 100
    }).eq("id", classes[0].id);
  }

  // Get store and admin/teacher
  const { data: stores } = await supabase.from("stores").select("id,name").limit(1);
  const storeId = stores?.[0]?.id ?? "00000000-0000-0000-0000-000000000031";

  const { data: adminProfiles } = await supabase.from("profiles").select("id").limit(1);
  const creatorId = adminProfiles?.[0]?.id;

  const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
  const orgId = orgs?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

  // Upsert the full fruit-veggie-04 mission
  const missionId = "00000000-0000-0000-0000-000000000051";
  const versionId = "00000000-0000-0000-0000-000000000052";

  await supabase.from("missions").upsert({
    id: missionId,
    organization_id: orgId,
    creator_user_id: creatorId,
    title: "Fruit & Veggie Hunt",
    description: "A little shopping. A lot of discovery!",
    mission_number: 4,
    stars: 5,
    estimated_minutes: 12,
    grade_min: 0,
    grade_max: 2,
    store_id: storeId,
    store_section: "Produce",
    status: "published",
    sharing_status: "approved",
    current_version: 1,
    passage: "Fresh Corn",
    passage_detail: "2 for $1",
    instructions: "Find items in the produce aisle, read the sign, and solve price math puzzles!",
    opens_at: new Date(Date.now() - 86400000).toISOString(),
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString()
  });

  await supabase.from("mission_versions").upsert({
    id: versionId,
    mission_id: missionId,
    version_number: 1,
    title: "Fruit & Veggie Hunt",
    description: "A little shopping. A lot of discovery!",
    learning_objectives: ["Initial sounds (/b/)", "Produce barcode scanning", "Fluency reading", "Price comparison math"],
    created_by: creatorId
  });

  // Stages
  const stage1Id = "00000000-0000-0000-0000-000000000061";
  const stage2Id = "00000000-0000-0000-0000-000000000062";
  const stage3Id = "00000000-0000-0000-0000-000000000063";
  const stage4Id = "00000000-0000-0000-0000-000000000064";

  await supabase.from("mission_stages").upsert([
    {
      id: stage1Id,
      mission_version_id: versionId,
      stage_key: "phonemic_awareness",
      stage_order: 1,
      title: "Sounds",
      prompt_text: "Which one starts with /b/?"
    },
    {
      id: stage2Id,
      mission_version_id: versionId,
      stage_key: "phonics",
      stage_order: 2,
      title: "Letters & Products",
      prompt_text: "Scan the barcode on the produce."
    },
    {
      id: stage3Id,
      mission_version_id: versionId,
      stage_key: "fluency",
      stage_order: 3,
      title: "Reading & Fluency",
      prompt_text: "Read the sign aloud.",
      passage_text: "Fresh sweet corn is in aisle 1. It has soft yellow kernels and green silk. Look for ears with bright green husks!",
      instructions: "Read the sign aloud and tap the microphone when you are ready to record.",
      recording_enabled: true,
      duration_seconds: 30
    },
    {
      id: stage4Id,
      mission_version_id: versionId,
      stage_key: "math",
      stage_order: 4,
      title: "Mathematics",
      prompt_text: "Which one costs more?"
    }
  ]);

  // Stage 1 Questions (Sounds)
  const q1Id = "00000000-0000-0000-0000-000000000071";
  await supabase.from("mission_questions").upsert({
    id: q1Id,
    stage_id: stage1Id,
    question_order: 1,
    question_type: "picture_choice",
    prompt_text: "Which one starts with /b/?",
    spoken_prompt: "Which word begins with the sound buh?",
    hint_text: "Listen: buh, buh, banana.",
    answer_config: {
      correct: "banana",
      options: ["banana", "apple", "carrot", "milk"]
    },
    skill_tags: ["phonemic_awareness", "sound-b"]
  });

  // Stage 2 Products
  await supabase.from("mission_products").delete().eq("mission_id", missionId);
  await supabase.from("mission_products").insert([
    {
      mission_id: missionId,
      name: "corn",
      description: "Fresh Sweet Corn",
      barcode: "012345678905",
      image_asset: "assets/images/corn.svg",
      price_cents: 100,
      currency: "USD",
      weight_grams: 500,
      package_size: "2 for $1",
      instructions: "Scan the barcode on the corn label or sign.",
      order_index: 1,
      is_available: true
    },
    {
      mission_id: missionId,
      name: "apples",
      description: "Crisp Red Apples",
      barcode: "C2CAPPLE001",
      image_asset: "assets/images/apple.svg",
      price_cents: 199,
      currency: "USD",
      weight_grams: 300,
      package_size: "1 each",
      instructions: "Scan the barcode sticker on the apple.",
      order_index: 2,
      is_available: true
    }
  ]);

  // Stage 4 Math Questions
  const q4Id = "00000000-0000-0000-0000-000000000074";
  await supabase.from("mission_questions").upsert({
    id: q4Id,
    stage_id: stage4Id,
    question_order: 1,
    question_type: "math",
    question_kind: "priceMore",
    prompt_text: "Which one costs more?",
    spoken_prompt: "Which item costs more money?",
    hint_text: "Check the price tag.",
    answer_config: {
      correct: "apples",
      options: ["apples", "corn"]
    },
    skill_tags: ["math", "price_comparison"]
  });

  // Assets
  await supabase.from("mission_assets").delete().eq("mission_id", missionId);
  const sampleCornHash = crypto.createHash("sha256").update("corn-image-asset-data").digest("hex");
  const sampleAudioHash = crypto.createHash("sha256").update("audio-sound-b-data").digest("hex");

  await supabase.from("mission_assets").insert([
    {
      mission_id: missionId,
      stage_key: "phonics",
      asset_path: "assets/images/corn.svg",
      cdn_url: `${url}/storage/v1/object/public/mission-assets/demo/corn.svg`,
      sha256_hash: sampleCornHash,
      size_bytes: 14200,
      content_type: "image/svg+xml",
      file_name: "corn.svg"
    },
    {
      mission_id: missionId,
      stage_key: "phonemic_awareness",
      asset_path: "assets/audio/sound-b.m4a",
      cdn_url: `${url}/storage/v1/object/public/mission-assets/demo/sound-b.m4a`,
      sha256_hash: sampleAudioHash,
      size_bytes: 48200,
      content_type: "audio/mp4",
      file_name: "sound-b.m4a"
    }
  ]);

  console.log("Seeding completed successfully!");
}

seed().catch(console.error);

