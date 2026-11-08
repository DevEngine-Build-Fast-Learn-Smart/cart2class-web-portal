"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { School, Calendar, Plus, Trophy, CheckCircle2, QrCode, RotateCcw, AlertTriangle, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BulkQrSheetButton } from "@/components/shared/code-export";
import { assignMissionToClass, resetClassroomLeaderboard } from "./mission-builder-actions";

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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [classList, setClassList] = useState<Row[]>(classes);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || "");
  const [notification, setNotification] = useState<string | null>(null);
  const [confirmResetClass, setConfirmResetClass] = useState<{ id: string; name: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setClassList(classes);
  }, [classes]);

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
        {classList.map((c) => {
          const classStudents = students.filter((s) => s.class_id === c.id);
          const classAssignments = assignments.filter((a) => a.class_id === c.id);
          const activeAssignment = classAssignments[0];
          const classReward = rewardGoals.find((rg) => rg.class_id === c.id);

          return (
            <article key={c.id} className="panel p-6 space-y-4 hover:shadow-md transition bg-white border">
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

              {/* Leaderboard & Participants Reset Action */}
              <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Users className="h-4 w-4 text-brand" />
                  <span className="font-medium">Participant & Leaderboard Controls</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmResetClass({ id: c.id, name: c.name })}
                  className="h-8 px-3 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition shadow-2xs"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Leaderboard & Participants
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Confirmation Modal for Resetting Leaderboard & Participants */}
      {mounted && confirmResetClass && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="panel max-w-md w-full p-6 space-y-4 bg-white rounded-2xl border shadow-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy">Reset Leaderboard & Participants?</h3>
                <p className="text-xs text-muted font-bold">{confirmResetClass.name}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              This will reset all student mission attempts, star counts, and classroom reward progress for{" "}
              <strong className="text-navy">{confirmResetClass.name}</strong> back to <span className="font-bold text-rose-600">0</span> so learners can begin a brand-new grocery adventure cycle.
            </p>

            <div className="panel bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium">
              Note: Student accounts and login cards remain active and unchanged. Only mission participation scores and star totals are cleared.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isResetting}
                onClick={() => setConfirmResetClass(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    const res = await resetClassroomLeaderboard(confirmResetClass.id);
                    if (res?.error) {
                      alert(res.error);
                    } else {
                      setClassList((prev) =>
                        prev.map((item) =>
                          item.id === confirmResetClass.id ? { ...item, confirmed_stars: 0 } : item
                        )
                      );
                      setNotification(
                        `Leaderboard and participant progress for ${confirmResetClass.name} have been reset successfully!`
                      );
                      setConfirmResetClass(null);
                      router.refresh();
                    }
                  } catch (err: any) {
                    alert(err.message || "Failed to reset leaderboard.");
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  "Yes, Reset Leaderboard"
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
