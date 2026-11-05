import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: missions } = await supabase
      .from("missions")
      .select("id, title")
      .eq("status", "published")
      .limit(10);

    const demos = (missions ?? []).map((m) => ({
      id: m.id === "00000000-0000-0000-0000-000000000051" ? "fruit-veggie-04" : m.id,
      title: m.title
    }));

    if (!demos.some((d) => d.id === "fruit-veggie-04")) {
      demos.unshift({ id: "fruit-veggie-04", title: "Fruit & Veggie Hunt" });
    }
    if (!demos.some((d) => d.title.includes("Rainbow"))) {
      demos.push({ id: "rainbow-06", title: "Rainbow Shopping" });
    }

    return NextResponse.json({ demos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

