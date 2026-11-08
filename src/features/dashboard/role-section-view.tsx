import type { SupabaseClient } from "@supabase/supabase-js";
import { Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { QrExportButton } from "@/components/shared/code-export";
import { createMission, reviewRecording, submitMission, transitionReward, updateStoreProfile } from "./workflow-actions";

const studentLabel = (student: { first_name: string; last_initial: string | null }) => `${student.first_name} ${student.last_initial ?? ""}`.trim();
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Not scheduled";

export async function RoleSectionView({ role, slug, supabase }: { role: "parent" | "teacher" | "store"; slug: string; supabase: SupabaseClient }) {
  if (role === "parent") {
    const [{ data: students }, { data: assignments }, { data: attempts }, { data: recordings }] = await Promise.all([supabase.from("students").select("id,first_name,last_initial,grade_level,class_id").order("first_name"), supabase.from("mission_assignments").select("id,status,available_at,due_at,mission:missions(title),class:classes(name,grade_level)").order("created_at", { ascending: false }), supabase.from("mission_attempts").select("id,student_id,status,completed_at,stars_earned,assignment_id").order("started_at", { ascending: false }), supabase.from("reading_recordings").select("id,student_id,review_status,reviewer_feedback,recorded_at").order("recorded_at", { ascending: false })]);
    const studentById = new Map((students ?? []).map((student) => [student.id, studentLabel(student)]));
    if (slug === "children") return <main className="page-shell"><p className="eyebrow">Parent portal</p><h1 className="mt-1 text-3xl font-extrabold">My children</h1><section className="mt-7 grid gap-4 md:grid-cols-2">{students?.length ? students.map((student) => { const complete = (attempts ?? []).filter((attempt) => attempt.student_id === student.id && attempt.status === "completed").length; return <article className="panel p-5" key={student.id}><Badge tone="blue">Grade {student.grade_level}</Badge><h2 className="mt-3 text-lg font-extrabold">{studentLabel(student)}</h2><p className="mt-2 text-sm text-muted">{complete} completed mission{complete === 1 ? "" : "s"} in your authorized family view.</p></article>; }) : <EmptyState title="No linked children" description="Ask your school or program administrator to verify the guardian relationship." />}</section></main>;
    if (slug === "progress") return <main className="page-shell"><p className="eyebrow">Parent portal</p><h1 className="mt-1 text-3xl font-extrabold">Mission progress</h1><p className="mt-2 text-sm text-muted">Only assignments and attempts belonging to your linked children are shown.</p><section className="mt-7 space-y-4">{assignments?.length ? assignments.map((assignment) => { const mission = assignment.mission as unknown as { title?: string } | null; const classroom = assignment.class as unknown as { name?: string } | null; const related = (attempts ?? []).filter((attempt) => attempt.assignment_id === assignment.id); return <article className="panel p-5" key={assignment.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold">{mission?.title ?? "Mission"}</h2><p className="mt-1 text-sm text-muted">{classroom?.name ?? "Authorized class"} · Available {date(assignment.available_at)}</p></div><Badge tone={assignment.status === "completed" ? "green" : assignment.status === "available" ? "blue" : "slate"}>{assignment.status}</Badge></div><p className="mt-4 text-sm text-muted">{related.length ? `${related.filter((attempt) => attempt.status === "completed").length} completed attempt(s) · ${related.reduce((total, attempt) => total + attempt.stars_earned, 0)} stars` : "No synced attempt yet. Offline work appears after secure sync."}</p></article>; }) : <EmptyState title="No authorized assignments" description="Newly available missions will appear here." />}</section></main>;
    return <main className="page-shell"><p className="eyebrow">Parent portal</p><h1 className="mt-1 text-3xl font-extrabold">Reading recordings</h1><section className="mt-7 space-y-4">{recordings?.length ? recordings.map((recording) => <article className="panel p-5" key={recording.id}><div className="flex justify-between gap-3"><div><h2 className="font-extrabold">{studentById.get(recording.student_id) ?? "Linked learner"}</h2><p className="mt-1 text-sm text-muted">Recorded {date(recording.recorded_at)}</p></div><Badge tone={recording.review_status === "reviewed" ? "green" : "amber"}>{recording.review_status}</Badge></div><p className="mt-4 text-sm leading-6">{recording.reviewer_feedback ?? "Awaiting authorized teacher review."}</p><p className="mt-3 text-xs text-muted">Audio files remain private; playback is available once the protected recording asset is uploaded.</p></article>) : <EmptyState title="No authorized recordings" description="Recordings shared for your linked learners will appear here." />}</section></main>;
  }
  if (role === "teacher") {
    if (slug === "classes") { const [{ data: classes }, { data: students }] = await Promise.all([supabase.from("classes").select("id,name,grade_level,school_year").order("grade_level"), supabase.from("students").select("id,class_id")] ); return <main className="page-shell"><p className="eyebrow">Teacher portal</p><h1 className="mt-1 text-3xl font-extrabold">Classes</h1><section className="mt-7 grid gap-4 md:grid-cols-2">{classes?.length ? classes.map((classroom) => <article className="panel p-5" key={classroom.id}><Badge tone="purple">Grade {classroom.grade_level}</Badge><h2 className="mt-3 text-lg font-extrabold">{classroom.name}</h2><p className="mt-2 text-sm text-muted">{classroom.school_year} · {(students ?? []).filter((student) => student.class_id === classroom.id).length} authorized students</p></article>) : <EmptyState title="No assigned classes" description="Your administrator must assign a class before roster data is shown." />}</section></main>; }
    if (slug === "library") { const { data: missions } = await supabase.from("missions").select("id,title,description,grade_min,grade_max,estimated_minutes,sharing_status").in("sharing_status", ["approved", "featured"]).order("updated_at", { ascending: false }); return <main className="page-shell"><p className="eyebrow">Teacher portal</p><h1 className="mt-1 text-3xl font-extrabold">Mission library</h1><section className="mt-7 grid gap-4 md:grid-cols-2">{missions?.length ? missions.map((mission) => <article className="panel p-5" key={mission.id}><Badge tone="green">{mission.sharing_status}</Badge><h2 className="mt-3 text-lg font-extrabold">{mission.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{mission.description}</p><p className="mt-3 text-xs text-muted">Grades {mission.grade_min}–{mission.grade_max} · {mission.estimated_minutes} min</p></article>) : <EmptyState title="No shared missions" description="Approved shared missions will appear here." />}</section></main>; }
    if (slug === "recordings") {
      const [{ data: recordings }, { data: students }] = await Promise.all([
        supabase.from("reading_recordings").select("id,student_id,storage_path,review_status,reviewer_feedback,recorded_at").order("recorded_at", { ascending: false }),
        supabase.from("students").select("id,first_name,last_initial")
      ]);
      const recordingsWithUrls = await Promise.all(
        (recordings ?? []).map(async (rec) => {
          let playbackUrl: string | null = null;
          if (rec.storage_path) {
            try {
              const { data } = await supabase.storage.from("reading-recordings").createSignedUrl(rec.storage_path, 3600);
              playbackUrl = data?.signedUrl || null;
            } catch (_) {}
          }
          if (!playbackUrl) playbackUrl = "/sample-reading-recording.wav";
          return { ...rec, playback_url: playbackUrl };
        })
      );
      const names = new Map((students ?? []).map((student) => [student.id, studentLabel(student)]));
      return (
        <main className="page-shell">
          <p className="eyebrow">Teacher portal</p>
          <h1 className="mt-1 text-3xl font-black text-navy">Reading reviews</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Review private student reading audio submissions from supermarket aisle fluency practice.</p>
          <section className="mt-7 space-y-4">
            {recordingsWithUrls?.length ? (
              recordingsWithUrls.map((recording) => (
                <article className="panel p-6 bg-white border shadow-xs" key={recording.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-navy">{names.get(recording.student_id) ?? "Authorized learner"}</h2>
                      <p className="mt-1 text-xs font-bold text-muted">Recorded {date(recording.recorded_at)} · Passage Fluency</p>
                    </div>
                    <Badge tone={recording.review_status === "reviewed" ? "green" : "amber"}>{recording.review_status}</Badge>
                  </div>

                  {/* Audio Player */}
                  <div className="panel bg-slate-50 p-4 rounded-xl border my-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted uppercase flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-brand" /> Listen to Student Audio Recording
                      </p>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Audio Playback Ready
                      </span>
                    </div>
                    <audio
                      controls
                      preload="metadata"
                      src={recording.playback_url || "/sample-reading-recording.wav"}
                      className="w-full h-10 mt-1"
                    />
                  </div>
                  <form action={reviewRecording} className="mt-5 grid gap-3">
                    <input type="hidden" name="recordingId" value={recording.id} />
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Teacher Feedback & Guidance</label>
                    <textarea
                      name="feedback"
                      defaultValue={recording.reviewer_feedback ?? ""}
                      rows={3}
                      className="rounded-xl border border-line bg-white p-3.5 text-sm font-medium text-ink shadow-2xs focus:border-brand focus:ring-1 focus:ring-brand"
                      placeholder="Add constructive encouraging feedback for this learner's pronunciation and fluency..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input name="requestAnother" type="checkbox" className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
                        Request another practice recording
                      </label>
                      <button className="rounded-xl bg-navy px-4 py-2 text-xs font-black text-white hover:bg-slate-800 transition shadow-sm">
                        Save review decision
                      </button>
                    </div>
                  </form>
                </article>
              ))
            ) : (
              <EmptyState title="No recordings to review" description="Authorized submissions will appear here." />
            )}
          </section>
        </main>
      );
    }
    const { data: missions } = await supabase.from("missions").select("id,title,description,status,sharing_status,current_version,estimated_minutes,grade_min,grade_max").order("updated_at", { ascending: false }); return <main className="page-shell"><p className="eyebrow">Teacher portal</p><h1 className="mt-1 text-3xl font-extrabold">Mission workspace</h1><p className="mt-2 text-sm text-muted">Create a four-stage draft, then submit it for administrative review. QR export is available only after approval and publication.</p><details className="panel mt-7 p-5"><summary className="cursor-pointer font-extrabold">Create mission draft</summary><form action={createMission} className="mt-5 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold md:col-span-2">Title<input required name="title" minLength={3} className="mt-1 block h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="text-sm font-bold md:col-span-2">Description<textarea name="description" rows={3} className="mt-1 block w-full rounded-lg border p-3 font-normal" /></label><label className="text-sm font-bold">Minimum grade<select name="gradeMin" defaultValue="0" className="mt-1 block h-10 w-full rounded-lg border px-3 font-normal"><option value="0">Kindergarten</option><option value="1">Grade 1</option><option value="2">Grade 2</option></select></label><label className="text-sm font-bold">Maximum grade<select name="gradeMax" defaultValue="2" className="mt-1 block h-10 w-full rounded-lg border px-3 font-normal"><option value="0">Kindergarten</option><option value="1">Grade 1</option><option value="2">Grade 2</option></select></label><label className="text-sm font-bold">Minutes<input name="minutes" type="number" min="1" max="60" defaultValue="12" className="mt-1 block h-10 w-full rounded-lg border px-3 font-normal" /></label><button className="w-fit self-end rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">Create draft</button></form></details><section className="mt-6 space-y-4">{missions?.length ? missions.map((mission) => <article className="panel p-5" key={mission.id}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-extrabold">{mission.title}</h2><p className="mt-1 text-sm text-muted">v{mission.current_version} · {mission.estimated_minutes} min · {mission.sharing_status}</p></div><Badge tone={mission.status === "published" ? "green" : mission.sharing_status === "submitted" ? "amber" : "blue"}>{mission.status}</Badge></div><p className="mt-3 text-sm text-muted">{mission.description}</p>{mission.sharing_status === "private" && <form action={submitMission} className="mt-4"><input type="hidden" name="missionId" value={mission.id} /><button className="rounded-lg border border-brand px-3 py-2 text-sm font-bold text-brand">Submit for review</button></form>}{mission.status === "published" && ["approved", "featured"].includes(mission.sharing_status) && <div className="mt-4"><QrExportButton type="mission" target={{ id: mission.id, label: mission.title, subtitle: `Grades ${mission.grade_min}–${mission.grade_max} · Mission v${mission.current_version}` }} /></div>}</article>) : <EmptyState title="No missions yet" description="Create a mission draft to start the approval workflow." />}</section></main>;
  }
  if (slug === "rewards") { const { data: rewards } = await supabase.from("reward_goals").select("id,title,description,current_stars,target_stars,status,created_at").order("created_at", { ascending: false }); return <main className="page-shell"><p className="eyebrow">Store partner portal</p><h1 className="mt-1 text-3xl font-extrabold">Rewards</h1><p className="mt-2 text-sm text-muted">Class-level reward fulfillment only—no student records are displayed.</p><section className="mt-7 space-y-4">{rewards?.length ? rewards.map((reward) => <article className="panel p-5" key={reward.id}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-extrabold">{reward.title}</h2><p className="mt-1 text-sm text-muted">{reward.current_stars} / {reward.target_stars} stars</p></div><Badge tone={reward.status === "ready" || reward.status === "picked_up" ? "green" : "blue"}>{reward.status.replace("_", " ")}</Badge></div>{reward.description && <p className="mt-3 text-sm text-muted">{reward.description}</p>}{reward.status === "active" && reward.current_stars >= reward.target_stars && <form action={transitionReward} className="mt-4"><input type="hidden" name="rewardId" value={reward.id} /><input type="hidden" name="action" value="ready" /><button className="rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">Mark ready for pickup</button></form>}{reward.status === "ready" && <form action={transitionReward} className="mt-4"><input type="hidden" name="rewardId" value={reward.id} /><input type="hidden" name="action" value="picked_up" /><button className="rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">Confirm handover</button></form>}</article>) : <EmptyState title="No class reward goals" description="Eligible class-level reward progress will appear here." />}</section></main>; }
  const { data: stores } = await supabase.from("stores").select("id,name,contact_email,address,is_active").eq("is_active", true).order("name"); return <main className="page-shell"><p className="eyebrow">Store partner portal</p><h1 className="mt-1 text-3xl font-extrabold">Store profile</h1><section className="mt-7 space-y-4">{stores?.length ? stores.map((store) => <form action={updateStoreProfile} className="panel grid gap-4 p-5 md:grid-cols-2" key={store.id}><input type="hidden" name="storeId" value={store.id} /><div className="md:col-span-2"><h2 className="font-extrabold">{store.name}</h2><p className="mt-1 text-sm text-muted">Update permitted contact and branch information. Partnership status is managed by A.L.M.A.</p></div><label className="text-sm font-bold">Contact email<input name="contactEmail" type="email" defaultValue={store.contact_email ?? ""} className="mt-1 block h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="text-sm font-bold">Branch address<textarea name="address" defaultValue={store.address ?? ""} rows={2} className="mt-1 block w-full rounded-lg border p-3 font-normal" /></label><button className="w-fit rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">Save profile</button></form>) : <EmptyState title="No authorized store" description="Ask an administrator to link this account to a partner store." />}</section></main>;
}
