import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
if (process.env.ALLOW_DEMO_USERS !== "true" || process.env.NODE_ENV === "production") throw new Error("Demo users are restricted to non-production environments. Set ALLOW_DEMO_USERS=true.");

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const organizationId = "00000000-0000-0000-0000-000000000001";
const storeId = "00000000-0000-0000-0000-000000000031";
const students = ["00000000-0000-0000-0000-000000000041", "00000000-0000-0000-0000-000000000042"];
const teacherClassIds = ["00000000-0000-0000-0000-000000000021", "00000000-0000-0000-0000-000000000022"];
const accounts = [
  { email: "parent1@gmail.com", password: "12345678", name: "Morgan Parent", role: "parent" },
  { email: "teacher1@gmail.com", password: "12345678", name: "Taylor Teacher", role: "teacher" },
  { email: "store1@gmail.com", password: "12345678", name: "Green Basket Partner", role: "store" },
  { email: "admin1@gmail.com", password: "12345678", name: "Alex Administrator", role: "admin" }
] as const;

async function ensureUser(account: (typeof accounts)[number]) {
  const listed = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === account.email);
  const result = existing ? await supabase.auth.admin.updateUserById(existing.id, { email_confirm: true, password: account.password }) : await supabase.auth.admin.createUser({ email: account.email, password: account.password, email_confirm: true });
  if (result.error || !result.data.user) throw result.error ?? new Error(`Could not create ${account.email}`);
  const userId = result.data.user.id;
  const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, display_name: account.name, account_status: "active" });
  if (profileError) throw profileError;
  const { error: membershipError } = await supabase.from("role_memberships").upsert({ user_id: userId, organization_id: organizationId, role: account.role, is_active: true }, { onConflict: "user_id,organization_id,role" });
  if (membershipError) throw membershipError;
  if (account.role === "parent") { const { error } = await supabase.from("parent_student_relationships").upsert(students.map((student_id) => ({ parent_user_id: userId, student_id }))); if (error) throw error; }
  if (account.role === "teacher") { const { error } = await supabase.from("teacher_class_assignments").upsert(teacherClassIds.map((class_id) => ({ teacher_user_id: userId, class_id }))); if (error) throw error; }
  if (account.role === "store") { const { error } = await supabase.from("store_memberships").upsert({ user_id: userId, store_id: storeId }); if (error) throw error; }
  return { ...account, userId };
}

async function seedScenario(users: Awaited<ReturnType<typeof ensureUser>>[]) {
  const byRole = Object.fromEntries(users.map((user) => [user.role, user.userId]));
  const missionId = "00000000-0000-0000-0000-000000000051";
  const versionId = "00000000-0000-0000-0000-000000000052";
  const stageIds = ["00000000-0000-0000-0000-000000000061", "00000000-0000-0000-0000-000000000062", "00000000-0000-0000-0000-000000000063", "00000000-0000-0000-0000-000000000064"];
  await supabase.from("missions").upsert({ id: missionId, organization_id: organizationId, creator_user_id: byRole.admin, title: "Market Sounds & Numbers", description: "A synthetic demo mission for the produce aisle.", grade_min: 0, grade_max: 1, estimated_minutes: 12, store_section: "Produce", status: "published", sharing_status: "approved", current_version: 1 });
  await supabase.from("mission_versions").upsert({ id: versionId, mission_id: missionId, version_number: 1, title: "Market Sounds & Numbers", description: "Synthetic pilot content.", learning_objectives: ["Initial sounds", "Counting"], snapshot: { source: "demo" }, created_by: byRole.admin });
  const stageData = ["Phonemic Awareness", "Phonics", "Fluency", "Math"].map((title, index) => ({ id: stageIds[index], mission_version_id: versionId, stage_key: ["phonemic_awareness", "phonics", "fluency", "math"][index], stage_order: index + 1, title, prompt_text: `Demo ${title} prompt` }));
  await supabase.from("mission_stages").upsert(stageData);
  await supabase.from("mission_questions").upsert(stageIds.map((stage_id, index) => ({ id: `00000000-0000-0000-0000-00000000007${index + 1}`, stage_id, question_order: 1, question_type: index === 3 ? "math" : "tap_select", prompt_text: "Synthetic demo question", answer_config: { answer: "demo" }, skill_tags: index === 3 ? ["counting"] : ["phonics"] })));
  await supabase.from("mission_assignments").upsert({ id: "00000000-0000-0000-0000-000000000081", mission_id: missionId, mission_version_id: versionId, class_id: teacherClassIds[0], assigned_by: byRole.teacher, available_at: new Date().toISOString(), status: "available" });
  await supabase.from("mission_attempts").upsert({ id: "00000000-0000-0000-0000-000000000091", client_event_id: "00000000-0000-0000-0000-000000000092", student_id: students[0], assignment_id: "00000000-0000-0000-0000-000000000081", mission_version_id: versionId, status: "completed", completed_at: new Date().toISOString(), completion_seconds: 682, stars_earned: 3 });
  await supabase.from("reading_recordings").upsert({ id: "00000000-0000-0000-0000-000000000093", student_id: students[0], attempt_id: "00000000-0000-0000-0000-000000000091", stage_id: stageIds[2], storage_path: "placeholders/demo-reading-recording-not-uploaded.webm", upload_status: "pending", review_status: "pending" });
  await supabase.from("reward_goals").upsert({ id: "00000000-0000-0000-0000-000000000101", class_id: teacherClassIds[0], store_id: storeId, title: "Fresh Fruit Celebration", description: "Synthetic demo reward", target_stars: 20, current_stars: 12, status: "active" });
  await supabase.from("product_data_sources").upsert({ id: "00000000-0000-0000-0000-000000000131", name: "Cart2Class educational demo catalog", source_type: "admin_managed", is_active: true });
  await supabase.from("products").upsert({ id: "00000000-0000-0000-0000-000000000132", barcode: "C2CAPPLE001", barcode_symbology: "CODE128", name: "Demo Apple", category: "Produce", data_source: "Cart2Class educational demo catalog" });
  await supabase.from("product_barcodes").upsert({ barcode: "C2CAPPLE001", product_id: "00000000-0000-0000-0000-000000000132", data_source_id: "00000000-0000-0000-0000-000000000131" });
  await supabase.from("store_product_listings").upsert({ store_id: storeId, product_id: "00000000-0000-0000-0000-000000000132", description: "Synthetic demo listing for the Cart2Class product-management workflow.", price: 1.99, currency: "USD", package_size: "1 each", is_available: true }, { onConflict: "store_id,product_id" });
  await supabase.from("store_checkin_codes").upsert({ id: "00000000-0000-0000-0000-000000000111", store_id: storeId, token_hash: "demo-rotate-before-use", is_active: true, created_by: byRole.admin });
  await supabase.from("notifications").upsert([{ id: "00000000-0000-0000-0000-000000000121", recipient_user_id: byRole.parent, type: "mission_available", title: "A new mission is ready", body: "Market Sounds & Numbers is ready for your learner." }, { id: "00000000-0000-0000-0000-000000000122", recipient_user_id: byRole.teacher, type: "reading_review", title: "Reading review available", body: "A synthetic recording placeholder is ready for review." }]);
}

Promise.all(accounts.map(ensureUser)).then(async (users) => { await seedScenario(users); console.log(`Verified demo accounts and synthetic scenario: ${users.map((user) => user.email).join(", ")}`); }).catch((error) => { console.error(error); process.exitCode = 1; });
