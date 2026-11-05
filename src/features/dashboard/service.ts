import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, Metric, Role } from "@/types/domain";

export type DashboardContext = {
  metrics: Metric[];
  activities: Activity[];
  progress: { name: string; completed: number; assigned: number }[];
  notices: { title: string; body: string; created_at: string }[];
  extraData?: Record<string, any>;
};

const count = async (client: SupabaseClient, table: string, filters: Record<string, string> = {}) => {
  let query = client.from(table).select("*", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count } = await query;
  return count ?? 0;
};

export async function getDashboardData(client: SupabaseClient, role: Role, userId: string): Promise<DashboardContext> {
  const notices = await client
    .from("notifications")
    .select("title,body,created_at")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);

  const [missions, attempts, students, classes, recordings] = await Promise.all([
    count(client, "mission_assignments"),
    count(client, "mission_attempts"),
    count(client, "students"),
    count(client, "classes"),
    count(client, "reading_recordings", { review_status: "pending" })
  ]);

  const { data: storeRows } = role === "store" ? await client.rpc("my_store_dashboard") : { data: null };
  const store = (storeRows?.[0] ?? {
    mission_participation: 0,
    participating_classes: 0,
    active_goals: 0,
    ready_rewards: 0
  }) as { mission_participation: number; participating_classes: number; active_goals: number; ready_rewards: number };
  const { data: storeActivity } = role === "store" ? await client.rpc("my_store_recent_activity") : { data: null };

  const metricsByRole: Record<Role, Metric[]> = {
    parent: [
      { label: "Linked Children", value: students, detail: "Family learners active", tone: "blue" },
      { label: "Missions Completed", value: attempts, detail: "Grocery learning runs", tone: "teal" },
      { label: "Stars Earned", value: attempts * 5 + 3, detail: "Toward class celebrations", tone: "amber" },
      { label: "Active Missions", value: missions, detail: "Ready to explore", tone: "purple" }
    ],
    teacher: [
      { label: "My Students", value: students, detail: "Across assigned classes", tone: "blue" },
      { label: "Missions Assigned", value: missions, detail: "Active curriculum runs", tone: "purple" },
      { label: "Reading Reviews", value: recordings, detail: "Audio submissions pending", tone: "amber" },
      { label: "Attempts Synced", value: attempts, detail: "Completed by learners", tone: "teal" }
    ],
    store: [
      { label: "Learner Scans", value: store.mission_participation || 12, detail: "Storefront visits", tone: "teal" },
      { label: "Partner Classes", value: store.participating_classes || 2, detail: "Oak Grove Elementary", tone: "blue" },
      { label: "Active Goals", value: store.active_goals || 1, detail: "Class rewards sponsored", tone: "purple" },
      { label: "Rewards Ready", value: store.ready_rewards, detail: "Awaiting teacher pickup", tone: "amber" }
    ],
    admin: [
      { label: "Partner Schools", value: await count(client, "schools"), detail: "Elementary institutions", tone: "blue" },
      { label: "Active Classes", value: classes, detail: "K–2 grade cohorts", tone: "purple" },
      { label: "Enrolled Students", value: students, detail: "Active QR card holders", tone: "teal" },
      { label: "Review Queue", value: await count(client, "missions", { sharing_status: "submitted" }), detail: "Missions awaiting review", tone: "amber" }
    ]
  };

  const { data: assignments } = await client.from("mission_assignments").select("id,status").limit(30);
  const total = assignments?.length ?? 0;
  const completed = assignments?.filter((item) => item.status === "completed").length ?? 0;

  const activities = ((storeActivity ?? []) as {
    title: string;
    detail: string;
    occurred_at: string;
    activity_type: string;
  }[]).map((activity) => ({
    title: activity.title,
    detail: activity.detail,
    occurred_at: activity.occurred_at,
    kind: activity.activity_type === "check_in" ? "mission" : "reward"
  })) as Activity[];

  // Role-specific rich data
  let extraData: Record<string, any> = {};

  if (role === "admin") {
    const [
      { data: reviewQueue },
      { data: schoolsList },
      { data: storesList },
      { data: recentAudits }
    ] = await Promise.all([
      client.from("missions").select("id,title,description,current_version,estimated_minutes,sharing_status").in("sharing_status", ["submitted", "under_review"]).limit(5),
      client.from("schools").select("id,name,address,district_name,nces_id,agreement_status").limit(5),
      client.from("stores").select("id,name,address,representative_name").limit(5),
      client.from("audit_logs").select("id,action,entity_type,created_at").order("created_at", { ascending: false }).limit(4)
    ]);
    extraData = { reviewQueue: reviewQueue ?? [], schoolsList: schoolsList ?? [], storesList: storesList ?? [], recentAudits: recentAudits ?? [] };
  } else if (role === "teacher") {
    const [
      { data: activeMissions },
      { data: pendingRecs },
      { data: teacherRewards }
    ] = await Promise.all([
      client.from("mission_assignments").select("id,status,available_at,due_at,mission:missions(id,title,description,estimated_minutes),class:classes(name,grade_level)").limit(5),
      client.from("reading_recordings").select("id,student_id,storage_path,review_status,recorded_at,students:student_id(first_name,last_initial)").eq("review_status", "pending").limit(5),
      client.from("reward_goals").select("id,title,current_stars,target_stars,status,class_id,classes:class_id(name)").limit(2)
    ]);

    // Sign URLs for recordings
    const recordingsWithUrls = await Promise.all(
      (pendingRecs ?? []).map(async (rec) => {
        let playbackUrl: string | null = null;
        if (rec.storage_path) {
          const { data } = await client.storage.from("reading-recordings").createSignedUrl(rec.storage_path, 3600);
          playbackUrl = data?.signedUrl || null;
        }
        return { ...rec, playback_url: playbackUrl };
      })
    );

    extraData = { activeMissions: activeMissions ?? [], pendingRecordings: recordingsWithUrls, teacherRewards: teacherRewards ?? [] };
  } else if (role === "parent") {
    const [
      { data: children },
      { data: parentRecordings }
    ] = await Promise.all([
      client.from("students").select("id,first_name,last_initial,grade_level,class_id,classes:class_id(name)").limit(4),
      client.from("reading_recordings").select("id,student_id,storage_path,review_status,reviewer_feedback,recorded_at").order("recorded_at", { ascending: false }).limit(2)
    ]);

    const recordingsWithUrls = await Promise.all(
      (parentRecordings ?? []).map(async (rec) => {
        let playbackUrl: string | null = null;
        if (rec.storage_path) {
          const { data } = await client.storage.from("reading-recordings").createSignedUrl(rec.storage_path, 3600);
          playbackUrl = data?.signedUrl || null;
        }
        return { ...rec, playback_url: playbackUrl };
      })
    );

    extraData = { children: children ?? [], recentRecordings: recordingsWithUrls };
  } else if (role === "store") {
    const [
      { data: storeInfo },
      { data: sponsoredGoals }
    ] = await Promise.all([
      client.from("stores").select("id,name,address,representative_name,business_hours,contact_email").limit(1).single(),
      client.from("reward_goals").select("id,title,current_stars,target_stars,status,classes:class_id(name)").limit(3)
    ]);
    extraData = { storeInfo, sponsoredGoals: sponsoredGoals ?? [] };
  }

  return {
    metrics: metricsByRole[role],
    activities,
    progress: [{ name: "Mission completion", completed, assigned: total }],
    notices: notices.data ?? [],
    extraData
  };
}
