import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Lists only real, administrator-approved featured missions for onboarding. */
export async function GET() {
  try {
    const { data, error } = await createAdminClient()
      .from("missions")
      .select("id,title,description,grade_min,grade_max,estimated_minutes")
      .eq("status", "published")
      .eq("sharing_status", "featured")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ missions: data ?? [] });
  } catch (error) {
    console.error("Featured missions error", error);
    return NextResponse.json({ error: "Could not load featured missions." }, { status: 500 });
  }
}
