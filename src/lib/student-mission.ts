import type { SupabaseClient } from "@supabase/supabase-js";

export class StudentMissionError extends Error {
  constructor(message: string, readonly status = 403) {
    super(message);
  }
}

type Assignment = { id: string; mission_id: string; mission_version_id: string; available_at: string | null; due_at: string | null; status: string };
const isAvailableNow = (assignment: Assignment, now = new Date()) => assignment.status === "available" && (!assignment.available_at || new Date(assignment.available_at) <= now) && (!assignment.due_at || new Date(assignment.due_at) >= now);
const isUpcoming = (assignment: Assignment, now = new Date()) => (assignment.status === "available" || assignment.status === "scheduled") && (!!assignment.available_at && new Date(assignment.available_at) > now) && (!assignment.due_at || new Date(assignment.due_at) >= now);

export async function assignedMission(supabase: SupabaseClient, studentId: string, missionId?: string) {
  const { data: student, error: studentError } = await supabase.from("students").select("class_id").eq("id", studentId).eq("is_active", true).maybeSingle();
  if (studentError || !student?.class_id) throw new StudentMissionError("No active classroom is available for this student.");
  const { data: assignments, error: assignmentError } = await supabase.from("mission_assignments").select("id,mission_id,mission_version_id,available_at,due_at,status").eq("class_id", student.class_id).order("created_at", { ascending: false });
  if (assignmentError) throw new StudentMissionError("Could not load classroom assignments.", 500);
  
  // Check student-specific mission assignments
  const { data: studentAssignments } = await supabase
    .from("mission_student_assignments")
    .select("mission_id, student_id");

  const isAllowedForStudent = (candidate: Assignment) => {
    const restrictions = (studentAssignments ?? []).filter(sa => sa.mission_id === candidate.mission_id);
    if (restrictions.length === 0) return true;
    return restrictions.some(sa => sa.student_id === studentId);
  };

  // 1. First check for an assignment that is active right now and assigned to student
  let assignment = (assignments as Assignment[] | null)?.find((candidate) => (!missionId || candidate.mission_id === missionId) && isAvailableNow(candidate) && isAllowedForStudent(candidate));

  // 2. If no active assignment is found, check for an upcoming scheduled assignment
  if (!assignment) {
    assignment = (assignments as Assignment[] | null)?.find((candidate) => (!missionId || candidate.mission_id === missionId) && isUpcoming(candidate) && isAllowedForStudent(candidate));
  }

  if (!assignment) throw new StudentMissionError("This mission is not assigned or available to this student.", 404);
  return { assignment, classId: student.class_id };
}

export async function missionPayload(supabase: SupabaseClient, assignment: Assignment) {
  const { data: mission, error: missionError } = await supabase.from("missions").select("id,title,description,estimated_minutes,mission_number,stars,store_id,opens_at,expires_at,passage,passage_detail,status,sharing_status").eq("id", assignment.mission_id).eq("status", "published").in("sharing_status", ["approved", "featured"]).maybeSingle();
  if (missionError || !mission) throw new StudentMissionError("This mission is no longer published.", 404);
  if (!mission.store_id) throw new StudentMissionError("This mission does not have an approved store location.", 409);
  const [{ data: store }, { data: products }, { data: assets }, { data: stages }] = await Promise.all([
    supabase.from("stores").select("id,name").eq("id", mission.store_id).eq("is_active", true).maybeSingle(),
    supabase.from("mission_products").select("id,name,barcode,image_asset,price_cents,weight_grams,order_index").eq("mission_id", mission.id).eq("is_available", true).order("order_index"),
    supabase.from("mission_assets").select("asset_path,cdn_url,sha256_hash,size_bytes,content_type").eq("mission_id", mission.id),
    supabase.from("mission_stages").select("id,stage_key,stage_order,passage_text").eq("mission_version_id", assignment.mission_version_id).order("stage_order"),
  ]);
  if (!store) throw new StudentMissionError("This mission’s store is not active.", 409);
  if (!products?.length || !stages || stages.length !== 4) throw new StudentMissionError("This mission is not fully configured yet.", 409);
  const assetByPath = new Map((assets ?? []).map((asset) => [asset.asset_path, asset]));
  const { data: questions } = await supabase.from("mission_questions").select("id,stage_id,question_order,prompt_text,spoken_prompt,hint_text,question_kind,answer_config").in("stage_id", stages.map((stage) => stage.id)).order("question_order");
  const stageByKey = new Map(stages.map((stage) => [stage.stage_key, stage]));
  const phonemic = stageByKey.get("phonemic_awareness");
  const mathStage = stageByKey.get("math");
  const fluency = stageByKey.get("fluency");
  if (!phonemic || !mathStage || !fluency) throw new StudentMissionError("This mission is missing required learning stages.", 409);
  const forStage = (stageId: string) => (questions ?? []).filter((question) => question.stage_id === stageId);
  const sounds = forStage(phonemic.id).map((question) => {
    const config = (question.answer_config ?? {}) as { correct?: string; options?: string[]; optionImages?: Record<string, string> };
    if (!config.correct || !Array.isArray(config.options) || config.options.length < 2) throw new StudentMissionError("A sound question is not fully configured.", 409);
    return {
      id: question.id,
      prompt: question.prompt_text,
      spoken: question.spoken_prompt ?? question.prompt_text,
      correct: config.correct,
      hint: question.hint_text ?? "Listen carefully and try again.",
      options: config.options,
      optionImages: config.optionImages ?? {}
    };
  });
  const math = forStage(mathStage.id).map((question) => ({ id: question.id, prompt: question.prompt_text, kind: question.question_kind }));
  const passageText = fluency.passage_text || mission.passage;
  if (!sounds.length || !math.length || !passageText) throw new StudentMissionError("This mission is missing required learning content.", 409);
  return {
    id: mission.id, assignmentId: assignment.id, versionId: assignment.mission_version_id, number: mission.mission_number, title: mission.title, description: mission.description, minutes: mission.estimated_minutes, stars: mission.stars,
    storeId: store.id, storeName: store.name, opensAt: assignment.available_at ?? mission.opens_at, expiresAt: assignment.due_at ?? mission.expires_at, passage: passageText, passageDetail: mission.passage_detail ?? "",
    products: products.map((product) => ({ id: product.id, name: product.name, barcode: product.barcode, image: product.image_asset ? assetByPath.get(product.image_asset)?.cdn_url ?? product.image_asset : null, priceCents: product.price_cents, weightGrams: product.weight_grams })),
    sounds, math,
    assets: (assets ?? []).map((asset) => ({ path: asset.asset_path, url: asset.cdn_url, sha256: asset.sha256_hash, sizeBytes: Number(asset.size_bytes), contentType: asset.content_type })),
  };
}

export async function assignedMissionsList(supabase: SupabaseClient, studentId: string) {
  const { data: student } = await supabase.from("students").select("class_id").eq("id", studentId).eq("is_active", true).maybeSingle();
  if (!student?.class_id) return [];

  const { data: assignments } = await supabase
    .from("mission_assignments")
    .select("id, mission_id, mission_version_id, available_at, due_at, status")
    .eq("class_id", student.class_id)
    .order("created_at", { ascending: false });

  if (!assignments || assignments.length === 0) return [];

  const { data: studentAssignments } = await supabase
    .from("mission_student_assignments")
    .select("mission_id, student_id");

  const allowedAssignments = (assignments as Assignment[]).filter((candidate) => {
    const restrictions = (studentAssignments ?? []).filter((sa) => sa.mission_id === candidate.mission_id);
    if (restrictions.length === 0) return true;
    return restrictions.some((sa) => sa.student_id === studentId);
  });

  if (allowedAssignments.length === 0) return [];

  const missionIds = allowedAssignments.map((a) => a.mission_id);
  const { data: missions } = await supabase
    .from("missions")
    .select("id, title, description, mission_number, stars, estimated_minutes, opens_at, expires_at, store_id, stores(name)")
    .in("id", missionIds)
    .eq("status", "published")
    .in("sharing_status", ["approved", "featured"]);

  const missionMap = new Map((missions ?? []).map((m: any) => [m.id, m]));
  const now = new Date();

  return allowedAssignments.map((assignment) => {
    const mission = missionMap.get(assignment.mission_id);
    if (!mission) return null;
    const store = Array.isArray(mission.stores) ? mission.stores[0] : mission.stores;
    const opensAt = assignment.available_at ?? mission.opens_at;
    const expiresAt = assignment.due_at ?? mission.expires_at;
    const isAvail = assignment.status === "available" && (!opensAt || new Date(opensAt) <= now) && (!expiresAt || new Date(expiresAt) >= now);
    const isSched = (assignment.status === "available" || assignment.status === "scheduled") && (!!opensAt && new Date(opensAt) > now);

    return {
      id: mission.id,
      number: mission.mission_number,
      title: mission.title,
      description: mission.description,
      minutes: mission.estimated_minutes,
      stars: mission.stars,
      opensAt,
      expiresAt,
      isAvailable: isAvail,
      isScheduled: isSched,
      storeName: store?.name ?? "",
    };
  }).filter(Boolean);
}

export async function studentPastMissions(supabase: SupabaseClient, studentId: string) {
  const { data: runs } = await supabase
    .from("mission_runs")
    .select("id, mission_id, stars_earned, completed_at, complete, stage, missions(id, mission_number, title, description, stars)")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false });

  const pastList: any[] = [];
  for (const run of runs ?? []) {
    const m = Array.isArray(run.missions) ? run.missions[0] : (run.missions as any);
    if (m && (run.complete || (run.stars_earned && run.stars_earned > 0) || run.stage >= 4)) {
      pastList.push({
        id: run.mission_id,
        number: m.mission_number,
        title: m.title,
        starsEarned: run.stars_earned || m.stars || 5,
        completedAt: run.completed_at || (run as any).updated_at || new Date().toISOString(),
        description: m.description,
      });
    }
  }
  return pastList;
}
