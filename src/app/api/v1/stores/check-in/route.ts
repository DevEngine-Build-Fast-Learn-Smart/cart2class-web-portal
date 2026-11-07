import { NextResponse } from "next/server";
import { readQrToken, requireStudentSession, StudentSessionError, studentSessionHash } from "@/lib/student-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const checkinToken = readQrToken(body?.checkinCode ?? body?.code, "check-in");
    const { supabase, session, sessionToken } = await requireStudentSession(request);
    const { data: credential } = await supabase
      .from("store_checkin_codes")
      .select("store_id,store:stores(id,name,address)")
      .eq("token_hash", studentSessionHash(checkinToken))
      .maybeSingle();
    if (!credential || (body?.expectedStoreId && credential.store_id !== body.expectedStoreId)) {
      return NextResponse.json({ error: "This store sign belongs to a different mission location." }, { status: 409 });
    }
    const { data: checkinId, error: checkinError } = await supabase.rpc("record_store_checkin", {
      p_checkin_token: checkinToken,
      p_student_session_token: sessionToken,
    });
    if (checkinError || !checkinId) {
      return NextResponse.json({ error: "This store sign is invalid, expired, or not available for this student." }, { status: 403 });
    }
    const store = Array.isArray(credential?.store) ? credential.store[0] : credential?.store;
    return NextResponse.json({
      verified: true,
      checkinId,
      store: store ?? null,
      welcomeMessage: store?.name ? `Welcome to ${store.name}! Let’s learn as we shop.` : "Welcome! Let’s learn as we shop.",
      studentSessionExpiresAt: session.expires_at,
    });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Store check-in failed", error);
    return NextResponse.json({ error: "Could not verify that store sign." }, { status: 500 });
  }
}
