"use client";

import { useState } from "react";
import { School, Calendar, Plus, Trophy, CheckCircle2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BulkQrSheetButton } from "@/components/shared/code-export";
import { assignMissionToClass } from "./mission-builder-actions";

type Row = Record<string, any>;

export function TeacherClassesView({
  classes,
  students,
  missions,
  stores,
  assignments,
  rewardGoals
}: {
  classes: Row[];
  students: Row[];
  missions: Row[];
  stores: Row[];
  assignments: Row[];
  rewardGoals: Row[];
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || "");
  const [notification, setNotification] = useState<string | null>(null);

  return (
    <main className="page-shell space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Teacher portal</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">Assigned Classes & Mission Deployment</h1>
          <p className="mt-2 text-sm text-muted">
            Manage your classroom rosters, deploy weekly grocery missions, and track reward progress.
          </p>
        </div>
        <Button onClick={() => setShowAssignModal(!showAssignModal)} className="bg-navy text-white font-bold">
          <Plus className="mr-2 h-4 w-4" /> Assign Mission to Class
        </Button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 p-4 text-sm font-bold text-teal-800">
          <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Assign Mission Modal */}
      {showAssignModal && (
        <form
          action={async (fd) => {
            const res = await assignMissionToClass(fd);
            if (res?.error) alert(res.error);
            else {
              setShowAssignModal(false);
              setNotification("Mission successfully assigned to class! Students will receive it on check-in.");
            }
          }}
          className="panel p-6 border-2 border-brand/30 bg-blue-50/20 max-w-2xl"
        >
          <h3 className="text-lg font-extrabold text-navy">Assign Mission to Classroom</h3>
          <p className="text-xs text-muted mb-4">
            Select an approved published mission and schedule its availability window.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">
              Select Mission
              <select required name="missionId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                <option value="">Choose published mission...</option>
                {missions.filter((m) => m.status === "published" || m.sharing_status === "approved").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} (Grades {m.grade_min}–{m.grade_max})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Classroom
              <select
                required
                name="classId"
                defaultValue={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Grade {c.grade_level})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Associated Grocery Store
              <select name="storeId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                <option value="">Select partner store...</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Opening Date & Time
              <input
                type="datetime-local"
                name="opensAt"
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              Expiry Date & Time
              <input
                type="datetime-local"
                name="expiresAt"
                defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16)}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <Button type="submit" className="bg-navy text-white font-bold">Assign Mission</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Classroom Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        {classes.map((c) => {
          const classStudents = students.filter((s) => s.class_id === c.id);
          const classAssignments = assignments.filter((a) => a.class_id === c.id);
          const activeAssignment = classAssignments[0];
          const classReward = rewardGoals.find((rg) => rg.class_id === c.id);

          return (
            <article key={c.id} className="panel p-6 space-y-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <Badge tone="purple">Grade {c.grade_level}</Badge>
                  <h2 className="mt-2 text-2xl font-black text-navy">{c.name}</h2>
                  <p className="text-xs text-muted">{c.school_year} · {classStudents.length} enrolled learners</p>
                </div>
                <BulkQrSheetButton
                  type="student"
                  label="Print Class QR Sheet"
                  targets={classStudents.map((st) => ({
                    id: st.id,
                    label: `${st.first_name} ${st.last_initial ?? ""}`.trim(),
                    subtitle: `${c.name} · Grade ${st.grade_level}`
                  }))}
                />
              </div>

              {/* Reward Goal Progress */}
              <div className="panel bg-slate-50 p-4 rounded-xl border space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" /> Reward Goal: {classReward?.title || c.reward_title || "Pizza party"}
                  </span>
                  <span className="font-extrabold text-ink">
                    {c.confirmed_stars ?? classReward?.current_stars ?? 0} / {c.target_stars ?? classReward?.target_stars ?? 100} ★
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-brand h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((c.confirmed_stars ?? classReward?.current_stars ?? 0) / (c.target_stars ?? classReward?.target_stars ?? 100)) * 100)
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Active Mission */}
              <div className="pt-2 border-t">
                <p className="text-xs font-bold text-muted uppercase">Active Mission Assignment</p>
                {activeAssignment ? (
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="font-extrabold text-brand">{activeAssignment.mission?.title || "Fruit & Veggie Hunt"}</span>
                    <Badge tone="green">Active</Badge>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted">No mission assigned yet. Tap &ldquo;Assign Mission to Class&rdquo; above.</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
