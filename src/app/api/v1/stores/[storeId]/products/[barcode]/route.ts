import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; barcode: string }> }
) {
  try {
    const { storeId, barcode } = await params;
    const supabase = createAdminClient();

    // 1. First check mission_products for this barcode
    const { data: missionProd } = await supabase
      .from("mission_products")
      .select("id, name, barcode, image_asset, price_cents, weight_grams")
      .eq("barcode", barcode)
      .limit(1);

    // Record scan event in audit_logs for live usage counter telemetry
    try {
      await supabase.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: "barcode.scanned",
        entity_type: "product_barcode",
        entity_id: barcode,
        metadata: {
          barcode,
          store_id: storeId,
          product_name: missionProd?.[0]?.name ?? barcode,
          scanned_at: new Date().toISOString()
        }
      });
    } catch (_) {}

    if (missionProd?.[0]) {
      const p = missionProd[0];
      return NextResponse.json({
        id: p.name || p.id,
        name: p.name,
        barcode: p.barcode,
        image: p.image_asset || "assets/images/corn.svg",
        priceCents: p.price_cents,
        weightGrams: p.weight_grams
      });
    }

    // 2. Next check products / store_product_listings
    const { data: globalProd } = await supabase
      .from("products")
      .select("id, name, barcode, price, weight_text")
      .eq("barcode", barcode)
      .limit(1);

    if (globalProd?.[0]) {
      const p = globalProd[0];
      return NextResponse.json({
        id: p.name.toLowerCase().replace(/\s+/g, "-"),
        name: p.name,
        barcode: p.barcode,
        image: "assets/images/corn.svg",
        priceCents: p.price ? Math.round(Number(p.price) * 100) : 100,
        weightGrams: 500
      });
    }

    // Fallback if looking up known corn or apple demo
    if (barcode === "012345678905") {
      return NextResponse.json({
        id: "corn",
        name: "corn",
        barcode: "012345678905",
        image: "assets/images/corn.svg",
        priceCents: 100,
        weightGrams: 500
      });
    }

    return NextResponse.json({ error: "Product not found for barcode", barcode }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
