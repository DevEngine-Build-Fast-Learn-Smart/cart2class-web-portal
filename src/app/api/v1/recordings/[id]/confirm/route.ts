import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { eventId, sha256 } = body;

    const supabase = createAdminClient();

    // Mark recording as uploaded
    if (isUuid(id)) {
      await supabase
        .from("reading_recordings")
        .update({ upload_status: "uploaded" })
        .eq("id", id);
    } else {
      await supabase
        .from("reading_recordings")
        .update({ upload_status: "uploaded" })
        .ilike("storage_path", `%${id}%`);
    }

    return NextResponse.json({
      eventId: eventId || id,
      serverAcknowledged: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
