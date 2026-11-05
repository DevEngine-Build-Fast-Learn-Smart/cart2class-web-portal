import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, verifyToken } from "@/lib/auth/token";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryStudentId = url.searchParams.get("studentId");

    const token = extractBearerToken(req.headers.get("Authorization"));
    let studentId = queryStudentId;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        studentId = studentId || payload.sub;
      }
    }

    const supabase = createAdminClient();

    // Find student
    let student: any = null;
    if (studentId) {
      const { data } = await supabase
        .from("students")
        .select("id, class_id")
        .or(`id.eq.${studentId},card_code.eq.${studentId}`)
        .single();
      student = data;
    }

    // Find mission assignment for class, or fallback to latest published mission
    let assignment: any = null;
    if (student?.class_id) {
      const { data } = await supabase
        .from("mission_assignments")
        .select("id, mission_id, available_at, due_at, status")
        .eq("class_id", student.class_id)
        .order("created_at", { ascending: false })
        .limit(1);
      assignment = data?.[0];
    }

    // Get mission: either from assignment or published mission
    let missionQuery = supabase
      .from("missions")
      .select("*, store:stores(id, name)")
      .order("updated_at", { ascending: false });

    if (assignment?.mission_id) {
      missionQuery = missionQuery.eq("id", assignment.mission_id);
    } else {
      missionQuery = missionQuery.eq("status", "published");
    }

    const { data: missions } = await missionQuery.limit(1);
    const mission = missions?.[0];

    if (!mission) {
      return NextResponse.json({ status: "empty", mission: null });
    }

    const now = new Date();
    const opensAt = assignment?.available_at || mission.opens_at || new Date(Date.now() - 86400000).toISOString();
    const expiresAt = assignment?.due_at || mission.expires_at || new Date(Date.now() + 14 * 86400000).toISOString();

    if (new Date(opensAt) > now) {
      return NextResponse.json({ status: "locked", mission: null });
    }
    if (new Date(expiresAt) < now) {
      return NextResponse.json({ status: "expired", mission: null });
    }

    // Load products
    const { data: products } = await supabase
      .from("mission_products")
      .select("id, name, barcode, image_asset, price_cents, weight_grams")
      .eq("mission_id", mission.id)
      .order("order_index");

    const formattedProducts = (products ?? []).map((p) => ({
      id: p.name || p.id,
      name: p.name,
      barcode: p.barcode,
      image: p.image_asset || "assets/images/corn.svg",
      priceCents: p.price_cents,
      weightGrams: p.weight_grams
    }));

    // Load stages & questions
    const { data: versions } = await supabase
      .from("mission_versions")
      .select("id")
      .eq("mission_id", mission.id)
      .eq("version_number", mission.current_version || 1)
      .limit(1);

    const versionId = versions?.[0]?.id;

    let sounds: any[] = [];
    let math: any[] = [];
    let passage = mission.passage || "Fresh Corn";
    let passageDetail = mission.passage_detail || "2 for $1";

    if (versionId) {
      const { data: stages } = await supabase
        .from("mission_stages")
        .select("id, stage_key, passage_text")
        .eq("mission_version_id", versionId);

      const stageMap = new Map((stages ?? []).map((s) => [s.stage_key, s]));

      const stage1 = stageMap.get("phonemic_awareness");
      if (stage1) {
        const { data: q1 } = await supabase
          .from("mission_questions")
          .select("id, prompt_text, spoken_prompt, hint_text, answer_config")
          .eq("stage_id", stage1.id)
          .order("question_order");

        sounds = (q1 ?? []).map((q, idx) => {
          const cfg = (q.answer_config as any) || {};
          return {
            id: `sound-${idx + 1}`,
            prompt: q.prompt_text || "Which one starts with /b/?",
            spoken: q.spoken_prompt || "Which word begins with the sound buh?",
            correct: cfg.correct || "banana",
            hint: q.hint_text || "Listen: buh, buh, banana.",
            options: cfg.options || ["banana", "apple", "carrot", "milk"]
          };
        });
      }

      const stage3 = stageMap.get("fluency");
      if (stage3 && stage3.passage_text) {
        passage = stage3.passage_text;
      }

      const stage4 = stageMap.get("math");
      if (stage4) {
        const { data: q4 } = await supabase
          .from("mission_questions")
          .select("id, prompt_text, spoken_prompt, question_kind, hint_text, answer_config")
          .eq("stage_id", stage4.id)
          .order("question_order");

        math = (q4 ?? []).map((q, idx) => ({
          id: `math-${idx + 1}`,
          prompt: q.prompt_text || "Which one costs more?",
          kind: q.question_kind || "priceMore"
        }));
      }
    }

    // Default sounds and math if empty
    if (!sounds.length) {
      sounds = [
        {
          id: "sound-b",
          prompt: "Which one starts with /b/?",
          spoken: "Which word begins with the sound buh?",
          correct: "banana",
          hint: "Listen: buh, buh, banana.",
          options: ["banana", "apple", "carrot", "milk"]
        }
      ];
    }
    if (!math.length) {
      math = [{ id: "math-more", prompt: "Which one costs more?", kind: "priceMore" }];
    }
    if (!formattedProducts.length) {
      formattedProducts.push({
        id: "corn",
        name: "corn",
        barcode: "012345678905",
        image: "assets/images/corn.svg",
        priceCents: 100,
        weightGrams: 500
      });
    }

    const images = Array.from(new Set(formattedProducts.map((p) => p.image).concat(["assets/images/corn.svg"])));
    const recordedAudio = ["assets/audio/sound-b.m4a"];

    return NextResponse.json({
      status: "assigned",
      mission: {
        id: mission.id === "00000000-0000-0000-0000-000000000051" ? "fruit-veggie-04" : mission.id,
        number: mission.mission_number || 4,
        title: mission.title,
        description: mission.description,
        minutes: mission.estimated_minutes || 12,
        stars: mission.stars || 5,
        storeId: mission.store?.id || "partner-market-01",
        storeName: mission.store?.name || "Partner Market",
        opensAt,
        expiresAt,
        nextOpensAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        nextTitle: "Bakery Words",
        nextNumber: (mission.mission_number || 4) + 1,
        passage,
        passageDetail,
        products: formattedProducts,
        sounds,
        math,
        images,
        recordedAudio
      }
    });
  } catch (error: any) {
    console.error("Assigned mission error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

