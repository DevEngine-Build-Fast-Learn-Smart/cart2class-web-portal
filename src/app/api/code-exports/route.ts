import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  type: z.enum(["student", "mission", "assignment", "store"]),
  // Existing development records use canonical PostgreSQL UUID strings whose
  // version nibble is not always RFC-4122 v1-v5. The database still performs
  // the final UUID cast and authorization check inside the protected RPC.
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid record identifier."),
  expiresAt: z.string().datetime().optional()
});

type Issued = { code_id?: string; credential_id?: string; token: string; expires_at: string | null };

export async function POST(request: Request) {
  const input = requestSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const expiresAt = input.data.expiresAt ?? null;
  const expirationArg = expiresAt ? { p_expires_at: expiresAt } : {};
  let issued: Issued[] | null = null;
  let label = "";
  let subtitle = "";
  if (input.data.type === "student") {
    const [{ data, error }, { data: student }] = await Promise.all([
      supabase.rpc("issue_student_qr", { p_student_id: input.data.id, ...expirationArg }),
      supabase.from("students").select("first_name,last_initial,grade_level").eq("id", input.data.id).single()
    ]);
    if (error || !student) return NextResponse.json({ error: error?.message ?? "Student QR could not be issued." }, { status: 403 });
    issued = data as Issued[]; label = `${student.first_name} ${student.last_initial ?? ""}`.trim(); subtitle = `Student ID card · Grade ${student.grade_level}`;
  } else if (input.data.type === "store") {
    const [{ data, error }, { data: store }] = await Promise.all([
      supabase.rpc("issue_store_checkin_qr", { p_store_id: input.data.id, ...expirationArg }),
      supabase.from("stores").select("name,address").eq("id", input.data.id).single()
    ]);
    if (error || !store) return NextResponse.json({ error: error?.message ?? "Store check-in QR could not be issued." }, { status: 403 });
    issued = data as Issued[]; label = store.name; subtitle = store.address ?? "Store check-in";
  } else {
    const isAssignment = input.data.type === "assignment";
    const [{ data, error }, { data: mission }] = await Promise.all([
      supabase.rpc("issue_mission_qr", { p_mission_id: isAssignment ? null : input.data.id, p_assignment_id: isAssignment ? input.data.id : null, ...expirationArg }),
      isAssignment ? supabase.from("mission_assignments").select("mission:missions(title),class:classes(name,grade_level)").eq("id", input.data.id).single() : supabase.from("missions").select("title,grade_min,grade_max").eq("id", input.data.id).single()
    ]);
    if (error || !mission) return NextResponse.json({ error: error?.message ?? "Mission QR could not be issued." }, { status: 403 });
    issued = data as Issued[];
    const assignment = mission as { mission?: { title?: string } | null; class?: { name?: string; grade_level?: number } | null; title?: string; grade_min?: number; grade_max?: number };
    label = isAssignment ? assignment.mission?.title ?? "Mission assignment" : assignment.title ?? "Mission";
    subtitle = isAssignment ? `${assignment.class?.name ?? "Class assignment"} · Grade ${assignment.class?.grade_level ?? "K-2"}` : `Grades ${assignment.grade_min ?? "K"}-${assignment.grade_max ?? 2}`;
  }
  const result = issued?.[0];
  if (!result?.token) return NextResponse.json({ error: "QR issuance returned no token." }, { status: 500 });
  const recordId = result.code_id ?? result.credential_id;
  const path = input.data.type === "student" ? "student" : input.data.type === "store" ? "check-in" : "mission";
  return NextResponse.json({ payload: `cart2class://${path}/${recordId}?token=${result.token}`, label, subtitle, expiresAt: result.expires_at, reference: recordId });
}
