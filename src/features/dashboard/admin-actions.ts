"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions/access";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const refresh = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));

export async function createPortalUser(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "parent") as "parent" | "teacher" | "store" | "admin";
  const classId = String(formData.get("classId") ?? "").trim() || null;
  const storeId = String(formData.get("storeId") ?? "").trim() || null;
  const studentId = String(formData.get("studentId") ?? "").trim() || null;

  if (!email || !password || !displayName) {
    return { error: "Email, password, and display name are required." };
  }

  const adminClient = createAdminClient();

  // 1. Get or create organization
  const { data: orgs } = await adminClient.from("organizations").select("id").limit(1);
  const orgId = orgs?.[0]?.id || "00000000-0000-0000-0000-000000000001";

  // 2. Create user in Supabase auth
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authErr || !authData.user) {
    return { error: authErr?.message || "Failed to create user in Auth." };
  }

  const userId = authData.user.id;

  // 3. Upsert profile
  await adminClient.from("profiles").upsert({
    id: userId,
    display_name: displayName,
    account_status: "active"
  });

  // 4. Upsert role membership
  await adminClient.from("role_memberships").upsert({
    user_id: userId,
    organization_id: orgId,
    role,
    is_active: true
  }, { onConflict: "user_id,organization_id,role" });

  // 5. Apply role-specific links
  if (role === "teacher" && classId) {
    await adminClient.from("teacher_class_assignments").upsert({
      teacher_user_id: userId,
      class_id: classId,
      is_active: true
    }, { onConflict: "teacher_user_id,class_id" });
  }

  if (role === "store" && storeId) {
    await adminClient.from("store_memberships").upsert({
      user_id: userId,
      store_id: storeId,
      is_active: true
    }, { onConflict: "user_id,store_id" });
  }

  if (role === "parent" && studentId) {
    await adminClient.from("parent_student_relationships").upsert({
      parent_user_id: userId,
      student_id: studentId,
      relationship_label: "Parent/Guardian",
      is_active: true
    }, { onConflict: "parent_user_id,student_id" });
  }

  refresh("/admin/users", "/admin");
  return { success: true };
}

export async function updatePortalUser(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const userId = String(formData.get("userId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const status = String(formData.get("accountStatus") ?? "active") as "active" | "disabled";
  const newPassword = String(formData.get("newPassword") ?? "").trim();

  const adminClient = createAdminClient();

  if (displayName || status) {
    await adminClient.from("profiles").update({
      display_name: displayName,
      account_status: status,
      updated_at: new Date().toISOString()
    }).eq("id", userId);

    await adminClient.from("role_memberships").update({
      is_active: status === "active"
    }).eq("user_id", userId);
  }

  if (newPassword) {
    await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
  }

  refresh("/admin/users", "/admin");
  return { success: true };
}

export async function deletePortalUser(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const userId = String(formData.get("userId") ?? "");
  const adminClient = createAdminClient();

  // Deactivate memberships and delete auth user
  await adminClient.from("role_memberships").update({ is_active: false }).eq("user_id", userId);
  await adminClient.from("profiles").update({ account_status: "disabled" }).eq("id", userId);
  await adminClient.auth.admin.deleteUser(userId);

  refresh("/admin/users", "/admin");
  return { success: true };
}

export async function createAdminStudent(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastInitial = String(formData.get("lastInitial") ?? "").trim().toUpperCase() || null;
  const gradeLevel = Number(formData.get("gradeLevel") ?? 0);
  const classId = String(formData.get("classId") ?? "").trim();

  if (!firstName || !classId) {
    return { error: "First name and class are required." };
  }

  const adminClient = createAdminClient();

  // Get school and org from class
  const { data: cls } = await adminClient.from("classes").select("school_id, schools:school_id(organization_id)").eq("id", classId).single();
  const schoolId = cls?.school_id;
  const orgId = (cls?.schools as any)?.organization_id || "00000000-0000-0000-0000-000000000001";

  const randomSuffix = crypto.randomBytes(3).toString("hex");
  const randomPin = Math.floor(1000 + Math.random() * 9000);
  const cleanName = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const cardCode = `c2c-card:v1:stu_${cleanName}_${randomSuffix}`;
  const parentInviteCode = `C2C-PAR-${cleanName.toUpperCase()}-${randomPin}`;

  const { data: newStudent, error: stuErr } = await adminClient.from("students").insert({
    organization_id: orgId,
    school_id: schoolId,
    class_id: classId,
    first_name: firstName,
    last_initial: lastInitial,
    grade_level: gradeLevel,
    card_code: cardCode,
    parent_invite_code: parentInviteCode,
    is_active: true
  }).select("id").single();

  if (stuErr || !newStudent) {
    return { error: stuErr?.message || "Failed to create student record." };
  }

  // Create student QR credential
  const tokenHash = crypto.createHash("sha256").update(cardCode).digest("hex");
  await adminClient.from("student_qr_credentials").insert({
    student_id: newStudent.id,
    token_hash: tokenHash,
    is_active: true
  });

  refresh("/admin/users", "/admin/schools", "/teacher/students", "/admin");
  return { success: true };
}

export async function deleteAdminStudent(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const studentId = String(formData.get("studentId") ?? "");
  const adminClient = createAdminClient();

  await adminClient.from("students").update({ is_active: false }).eq("id", studentId);
  await adminClient.from("student_qr_credentials").update({ is_active: false }).eq("student_id", studentId);

  refresh("/admin/users", "/teacher/students", "/admin");
  return { success: true };
}

export async function createSchool(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const districtName = String(formData.get("districtName") ?? "").trim();
  const ncesId = String(formData.get("ncesId") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zipCode = String(formData.get("zipCode") ?? "").trim();
  const principalName = String(formData.get("principalName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const agreementStatus = String(formData.get("agreementStatus") ?? "verified").trim();

  if (!name) return { error: "School name is required." };

  const adminClient = createAdminClient();
  const { data: orgs } = await adminClient.from("organizations").select("id").limit(1);
  const orgId = orgs?.[0]?.id || "00000000-0000-0000-0000-000000000001";

  const { error } = await adminClient.from("schools").insert({
    organization_id: orgId,
    name,
    district_name: districtName || null,
    nces_id: ncesId || null,
    address,
    city: city || null,
    state: state || null,
    zip_code: zipCode || null,
    principal_name: principalName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    agreement_status: agreementStatus,
    is_active: true
  });

  if (error) return { error: error.message };

  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function createClass(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const schoolId = String(formData.get("schoolId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = Number(formData.get("gradeLevel") ?? 0);
  const schoolYear = String(formData.get("schoolYear") ?? "2026-2027").trim();
  const rewardTitle = String(formData.get("rewardTitle") ?? "Pizza party").trim();
  const targetStars = Number(formData.get("targetStars") ?? 100);

  if (!schoolId || !name) return { error: "School and class name are required." };

  const adminClient = createAdminClient();
  await adminClient.from("classes").insert({
    school_id: schoolId,
    name,
    grade_level: gradeLevel,
    school_year: schoolYear,
    reward_title: rewardTitle,
    confirmed_stars: 0,
    target_stars: targetStars,
    is_active: true
  });

  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function createStore(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const businessHours = String(formData.get("businessHours") ?? "").trim();
  const representativeName = String(formData.get("representativeName") ?? "").trim();

  if (!name) return { error: "Store name is required." };

  const adminClient = createAdminClient();
  const { data: orgs } = await adminClient.from("organizations").select("id").limit(1);
  const orgId = orgs?.[0]?.id || "00000000-0000-0000-0000-000000000001";

  const { data: newStore, error: storeErr } = await adminClient.from("stores").insert({
    organization_id: orgId,
    name,
    contact_email: contactEmail,
    address,
    business_hours: businessHours,
    representative_name: representativeName,
    is_active: true
  }).select("id").single();

  if (newStore) {
    // Generate check-in code
    const tokenHash = crypto.randomBytes(16).toString("hex");
    await adminClient.from("store_checkin_codes").insert({
      store_id: newStore.id,
      token_hash: tokenHash,
      is_active: true
    });
  }

  refresh("/admin/stores", "/admin");
  return { success: true };
}

export async function rotateStoreCheckinCode(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const storeId = String(formData.get("storeId") ?? "");
  const adminClient = createAdminClient();

  // Deactivate old codes
  await adminClient.from("store_checkin_codes").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("store_id", storeId);

  // Generate new active code
  const tokenHash = "c2c-store-" + crypto.randomBytes(8).toString("hex");
  await adminClient.from("store_checkin_codes").insert({
    store_id: storeId,
    token_hash: tokenHash,
    is_active: true
  });

  refresh("/admin/stores", "/store/check-in", "/admin");
  return { success: true };
}

export async function updateSchool(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const schoolId = String(formData.get("schoolId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const districtName = String(formData.get("districtName") ?? "").trim();
  const ncesId = String(formData.get("ncesId") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zipCode = String(formData.get("zipCode") ?? "").trim();
  const principalName = String(formData.get("principalName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const agreementStatus = String(formData.get("agreementStatus") ?? "verified").trim();
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!schoolId || !name) return { error: "School ID and name are required." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("schools").update({
    name,
    district_name: districtName || null,
    nces_id: ncesId || null,
    address,
    city: city || null,
    state: state || null,
    zip_code: zipCode || null,
    principal_name: principalName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    agreement_status: agreementStatus,
    is_active: isActive
  }).eq("id", schoolId);

  if (error) return { error: error.message };
  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function deleteSchool(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const schoolId = String(formData.get("schoolId") ?? "").trim();
  if (!schoolId) return { error: "School ID is required." };

  const adminClient = createAdminClient();
  await adminClient.from("schools").update({ is_active: false }).eq("id", schoolId);
  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function updateClass(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const classId = String(formData.get("classId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = Number(formData.get("gradeLevel") ?? 0);
  const schoolYear = String(formData.get("schoolYear") ?? "2026-2027").trim();
  const rewardTitle = String(formData.get("rewardTitle") ?? "Pizza party").trim();
  const targetStars = Number(formData.get("targetStars") ?? 100);
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!classId || !name) return { error: "Classroom ID and name are required." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("classes").update({
    name,
    grade_level: gradeLevel,
    school_year: schoolYear,
    reward_title: rewardTitle,
    target_stars: targetStars,
    is_active: isActive
  }).eq("id", classId);

  if (error) return { error: error.message };
  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function deleteClass(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const classId = String(formData.get("classId") ?? "").trim();
  if (!classId) return { error: "Classroom ID is required." };

  const adminClient = createAdminClient();
  await adminClient.from("classes").update({ is_active: false }).eq("id", classId);
  refresh("/admin/schools", "/admin");
  return { success: true };
}

export async function updateStore(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const storeId = String(formData.get("storeId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const businessHours = String(formData.get("businessHours") ?? "").trim();
  const representativeName = String(formData.get("representativeName") ?? "").trim();
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!storeId || !name) return { error: "Store ID and name are required." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("stores").update({
    name,
    contact_email: contactEmail,
    address,
    business_hours: businessHours,
    representative_name: representativeName,
    is_active: isActive
  }).eq("id", storeId);

  if (error) return { error: error.message };
  refresh("/admin/stores", "/admin");
  return { success: true };
}

export async function deleteStore(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const storeId = String(formData.get("storeId") ?? "").trim();
  if (!storeId) return { error: "Store ID is required." };

  const adminClient = createAdminClient();
  await adminClient.from("stores").update({ is_active: false }).eq("id", storeId);
  refresh("/admin/stores", "/admin");
  return { success: true };
}

export async function updateAdminStudent(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const studentId = String(formData.get("studentId") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastInitial = String(formData.get("lastInitial") ?? "").trim().toUpperCase() || null;
  const gradeLevel = Number(formData.get("gradeLevel") ?? 0);
  const classId = String(formData.get("classId") ?? "").trim();

  if (!studentId || !firstName || !classId) {
    return { error: "Student ID, first name, and class are required." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("students").update({
    first_name: firstName,
    last_initial: lastInitial,
    grade_level: gradeLevel,
    class_id: classId
  }).eq("id", studentId);

  if (error) return { error: error.message };
  refresh("/admin/users", "/teacher/students", "/admin");
  return { success: true };
}

export async function linkStudentToParent(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const studentId = String(formData.get("studentId") ?? "").trim();
  const parentUserId = String(formData.get("parentUserId") ?? "").trim();

  if (!studentId || !parentUserId) {
    return { error: "Student and parent user are required." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("parent_student_relationships").upsert(
    {
      student_id: studentId,
      parent_user_id: parentUserId,
      relationship_label: "Parent/Guardian",
      is_active: true
    },
    { onConflict: "parent_user_id,student_id" }
  );

  if (error) return { error: error.message };
  refresh("/admin/users", "/parent/children", "/parent", "/admin");
  return { success: true };
}

export async function unlinkStudentFromParent(formData: FormData) {
  const access = await requireRole("admin");
  if (access.unavailable || !access.supabase) return { error: "Unauthorized" };

  const studentId = String(formData.get("studentId") ?? "").trim();
  const parentUserId = String(formData.get("parentUserId") ?? "").trim();

  if (!studentId || !parentUserId) {
    return { error: "Student and parent user are required." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("parent_student_relationships").delete().match({
    student_id: studentId,
    parent_user_id: parentUserId
  });

  if (error) return { error: error.message };
  refresh("/admin/users", "/parent/children", "/parent", "/admin");
  return { success: true };
}

