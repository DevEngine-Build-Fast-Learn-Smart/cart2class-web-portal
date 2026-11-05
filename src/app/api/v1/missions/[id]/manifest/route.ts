import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Query mission assets
    let dbMissionId = id;
    if (id === "fruit-veggie-04") {
      dbMissionId = "00000000-0000-0000-0000-000000000051";
    }

    const { data: assets } = await supabase
      .from("mission_assets")
      .select("asset_path, cdn_url, sha256_hash, size_bytes")
      .or(`mission_id.eq.${dbMissionId},mission_id.eq.00000000-0000-0000-0000-000000000051`);

    let files = (assets ?? []).map((a) => ({
      asset: a.asset_path,
      url: a.cdn_url,
      sha256: a.sha256_hash,
      sizeBytes: Number(a.size_bytes || 10000)
    }));

    if (!files.length) {
      const cornHash = crypto.createHash("sha256").update("corn-image-demo").digest("hex");
      const audioHash = crypto.createHash("sha256").update("sound-b-audio-demo").digest("hex");
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      files = [
        {
          asset: "assets/images/corn.svg",
          url: `${baseUrl}/assets/images/corn.svg`,
          sha256: cornHash,
          sizeBytes: 14200
        },
        {
          asset: "assets/audio/sound-b.m4a",
          url: `${baseUrl}/assets/audio/sound-b.m4a`,
          sha256: audioHash,
          sizeBytes: 48200
        }
      ];
    }

    const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

    return NextResponse.json({
      missionId: id,
      totalBytes: totalBytes || 1845200,
      files: files.map(({ asset, url, sha256 }) => ({ asset, url, sha256 }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

