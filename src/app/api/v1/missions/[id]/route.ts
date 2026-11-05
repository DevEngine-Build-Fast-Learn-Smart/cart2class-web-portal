import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    let dbId = id;
    if (id === "fruit-veggie-04") {
      dbId = "00000000-0000-0000-0000-000000000051";
    }

    const { data: mission } = await supabase
      .from("missions")
      .select("*, store:stores(id, name)")
      .or(`id.eq.${dbId},title.ilike.%${id}%`)
      .single();

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const { data: products } = await supabase
      .from("mission_products")
      .select("id, name, barcode, image_asset, price_cents, weight_grams")
      .eq("mission_id", mission.id);

    return NextResponse.json({
      id: mission.id === "00000000-0000-0000-0000-000000000051" ? "fruit-veggie-04" : mission.id,
      number: mission.mission_number || 4,
      title: mission.title,
      description: mission.description,
      minutes: mission.estimated_minutes || 12,
      stars: mission.stars || 5,
      storeId: mission.store?.id || "partner-market-01",
      storeName: mission.store?.name || "Partner Market",
      passage: mission.passage || "Fresh Corn",
      passageDetail: mission.passage_detail || "2 for $1",
      products: products ?? []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

