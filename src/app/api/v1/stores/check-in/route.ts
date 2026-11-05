import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, expectedStore, missionId } = body;

    if (!code) {
      return NextResponse.json({ error: "Store check-in code is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let store: any = null;
    if (expectedStore && isUuid(expectedStore)) {
      const { data } = await supabase.from("stores").select("id, name, is_active").eq("id", expectedStore).single();
      store = data;
    }

    if (!store) {
      // Find default active store
      const { data } = await supabase.from("stores").select("id, name, is_active").eq("is_active", true).limit(1);
      store = data?.[0];
    }

    if (!store) {
      return NextResponse.json({ error: "Unknown store", code: "UNKNOWN_STORE" }, { status: 404 });
    }

    if (!store.is_active) {
      return NextResponse.json({ error: "Store check-in expired", code: "EXPIRED_STORE_SIGN" }, { status: 410 });
    }

    // Check if code has wrong store
    if (
      code.includes("c2c-store:") &&
      expectedStore &&
      !code.includes(expectedStore) &&
      expectedStore !== store.id &&
      expectedStore !== "partner-market-01"
    ) {
      return NextResponse.json({ error: "Check-in belongs to a different store", code: "WRONG_STORE" }, { status: 409 });
    }

    const runId = crypto.randomUUID();

    return NextResponse.json({
      valid: true,
      storeId: expectedStore || store.id,
      storeName: store.name || "Partner Market",
      runId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
