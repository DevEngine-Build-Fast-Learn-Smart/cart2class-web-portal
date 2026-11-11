"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createQuickProductBarcode(formData: FormData) {
  const adminClient = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? 1.0);
  const priceCents = Math.round(priceDollars * 100);
  const packageSize = String(formData.get("packageSize") ?? "1 each").trim();
  const category = String(formData.get("category") ?? "Produce").trim();
  const missionId = String(formData.get("missionId") ?? "").trim() || null;
  const storeId = String(formData.get("storeId") ?? "").trim() || null;

  if (!name || !barcode) {
    return { error: "Both product name and barcode are required." };
  }

  try {
    // 1. Insert or update global product
    let productId: string | null = null;
    const { data: existing } = await adminClient
      .from("products")
      .select("id")
      .eq("barcode", barcode)
      .maybeSingle();

    if (existing) {
      productId = existing.id;
      await adminClient.from("products").update({
        name,
        category,
        price: priceDollars,
        weight_text: packageSize,
        barcode_symbology: "CODE128"
      }).eq("id", productId);
    } else {
      const { data: inserted, error: pErr } = await adminClient
        .from("products")
        .insert({
          name,
          barcode,
          category,
          price: priceDollars,
          weight_text: packageSize,
          data_source: "Quick Barcode Creator",
          barcode_symbology: "CODE128"
        })
        .select("id")
        .single();
      if (pErr) return { error: pErr.message };
      productId = inserted?.id ?? null;
    }

    // 2. Attach to mission if missionId specified or attach to default published mission
    let targetMissionId = missionId;
    if (!targetMissionId) {
      const { data: defaultM } = await adminClient
        .from("missions")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetMissionId = defaultM?.id ?? null;
    }

    if (targetMissionId) {
      const { data: existingMp } = await adminClient
        .from("mission_products")
        .select("id")
        .eq("mission_id", targetMissionId)
        .eq("barcode", barcode)
        .maybeSingle();

      if (!existingMp) {
        const { count } = await adminClient
          .from("mission_products")
          .select("*", { count: "exact", head: true })
          .eq("mission_id", targetMissionId);

        await adminClient.from("mission_products").insert({
          mission_id: targetMissionId,
          product_id: productId,
          name,
          barcode,
          price_cents: priceCents,
          currency: "USD",
          package_size: packageSize,
          weight_grams: 500,
          instructions: `Scan the ${name} barcode label in produce.`,
          order_index: (count || 0) + 1,
          is_available: true
        });
      }
    }

    // 3. Attach to store listing if storeId specified or attach to default active store
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const { data: defaultS } = await adminClient
        .from("stores")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      targetStoreId = defaultS?.id ?? null;
    }

    if (targetStoreId && productId) {
      const { data: existingSpl } = await adminClient
        .from("store_product_listings")
        .select("id")
        .eq("store_id", targetStoreId)
        .eq("product_id", productId)
        .maybeSingle();

      if (!existingSpl) {
        await adminClient.from("store_product_listings").insert({
          store_id: targetStoreId,
          product_id: productId,
          description: `Fresh educational ${name} listing.`,
          price: priceDollars,
          currency: "USD",
          package_size: packageSize,
          is_available: true,
          is_archived: false
        });
      }
    }

    revalidatePath("/admin/barcodes");
    revalidatePath("/teacher/barcodes");
    revalidatePath("/store/barcodes");
    revalidatePath("/admin/missions");
    revalidatePath("/teacher/missions");
    revalidatePath("/store/products");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create product barcode." };
  }
}

export async function deleteProductBarcode(formData: FormData) {
  const adminClient = createAdminClient();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const missionProductId = String(formData.get("missionProductId") ?? "").trim() || null;
  const productId = String(formData.get("productId") ?? "").trim() || null;

  if (!barcode && !missionProductId && !productId) {
    return { error: "No product identifier specified for deletion." };
  }

  try {
    if (missionProductId) {
      await adminClient.from("mission_products").delete().eq("id", missionProductId);
    } else if (barcode) {
      await adminClient.from("mission_products").delete().eq("barcode", barcode);
    }

    if (productId) {
      await adminClient.from("store_product_listings").delete().eq("product_id", productId);
      await adminClient.from("products").delete().eq("id", productId);
    } else if (barcode) {
      const { data: p } = await adminClient.from("products").select("id").eq("barcode", barcode).maybeSingle();
      if (p?.id) {
        await adminClient.from("store_product_listings").delete().eq("product_id", p.id);
        await adminClient.from("products").delete().eq("id", p.id);
      }
    }

    revalidatePath("/admin/barcodes");
    revalidatePath("/teacher/barcodes");
    revalidatePath("/store/barcodes");
    revalidatePath("/admin/missions");
    revalidatePath("/teacher/missions");
    revalidatePath("/store/products");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete barcode." };
  }
}

export async function recordCodeScanAction(formData: FormData) {
  const adminClient = createAdminClient();
  const codeType = String(formData.get("codeType") ?? "").trim();
  const codeId = String(formData.get("codeId") ?? "").trim();
  const codeLabel = String(formData.get("codeLabel") ?? "").trim();

  if (!codeType || !codeId) {
    return { error: "Missing code parameters." };
  }

  try {
    if (codeType === "product") {
      await adminClient.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: "barcode.scanned",
        entity_type: "product_barcode",
        entity_id: codeId,
        metadata: {
          barcode: codeId,
          product_name: codeLabel,
          source: "portal_action_scan",
          scanned_at: new Date().toISOString()
        }
      });
    } else if (codeType === "student") {
      await adminClient.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: "student.login",
        entity_type: "student",
        entity_id: codeId,
        metadata: {
          student_id: codeId,
          student_name: codeLabel,
          method: "qr_card_scan",
          login_time: new Date().toISOString()
        }
      });
    } else if (codeType === "store") {
      const { data: defaultCls } = await adminClient.from("classes").select("id").limit(1).maybeSingle();
      const { data: defaultCode } = await adminClient.from("store_checkin_codes").select("id").eq("store_id", codeId).limit(1).maybeSingle();

      await adminClient.from("store_checkin_events").insert({
        store_id: codeId,
        class_id: defaultCls?.id || "00000000-0000-0000-0000-000000000031",
        checkin_code_id: defaultCode?.id || null
      });
    } else if (codeType === "mission") {
      await adminClient.from("audit_logs").insert({
        organization_id: "00000000-0000-0000-0000-000000000001",
        actor_user_id: null,
        action: "student.mission_activity",
        entity_type: "mission",
        entity_id: codeId,
        metadata: {
          mission_id: codeId,
          mission_title: codeLabel,
          event: "mission_qr_launch",
          timestamp: new Date().toISOString()
        }
      });
    }

    revalidatePath("/admin/barcodes");
    revalidatePath("/teacher/barcodes");
    revalidatePath("/store/barcodes");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to record scan." };
  }
}
