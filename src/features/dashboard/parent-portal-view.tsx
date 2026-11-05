"use client";

import { useState } from "react";
import {
  UsersRound,
  Plus,
  CheckCircle2,
  Volume2,
  Trophy,
  BookOpen,
  Clock,
  Calendar,
  AlertCircle,
  School,
  GraduationCap,
  Sparkles,
  QrCode,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  VolumeX,
  Check,
  X,
  Barcode,
  Calculator,
  Mic
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { linkChildWithInviteCode } from "./parent-actions";

type Row = Record<string, any>;

export function ParentPortalView({
  slug,
  students,
  assignments,
  attempts,
  recordings,
  rewardGoals,
  questionAttempts = []
}: {
  slug: "children" | "progress" | "recordings";
  students: Row[];
  assignments: Row[];
  attempts: Row[];
  recordings: Row[];
  rewardGoals: Row[];
  questionAttempts?: Row[];
}) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedChild = students.find((s) => s.id === selectedChildId);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  /* ========================================================================= */
  /* TAB: MY CHILDREN & COMPREHENSIVE CHILD PROFILE                            */
  /* ========================================================================= */
  if (slug === "children") {
    // If a child is selected, show their full comprehensive profile
    if (selectedChild) {
      const childAttempts = attempts.filter((a) => a.student_id === selectedChild.id);
      const childRecordings = recordings.filter((r) => r.student_id === selectedChild.id);
      const childQuestionAttempts = questionAttempts.filter((q) => q.student_id === selectedChild.id);
      const totalStars = childAttempts.reduce((acc, a) => acc + (a.stars_earned || 0), 0);
      const completedCount = childAttempts.filter((a) => a.status === "completed").length;
      const classReward = rewardGoals.find((rg) => rg.class_id === selectedChild.class_id);

      return (
        <main className="page-shell space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedChildId(null)}
            className="inline-flex items-center gap-2 text-sm font-bold text-navy hover:text-brand transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all children
          </button>

          {/* Child Profile Hero Header */}
          <div className="panel p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-navy text-white rounded-2xl shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/10 text-3xl font-black text-white border border-white/20 shadow-inner">
                  {selectedChild.first_name[0]}
                  {selectedChild.last_initial ?? ""}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 px-3 py-0.5 text-xs font-bold">
                      Grade {selectedChild.grade_level === 0 ? "K" : selectedChild.grade_level} Learner
                    </span>
                    <span className="rounded-full bg-white/10 text-slate-200 border border-white/20 px-3 py-0.5 text-xs font-bold">
                      Active
                    </span>
                  </div>
                  <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">
                    {selectedChild.first_name} {selectedChild.last_initial ?? ""}
                  </h1>
                  <p className="mt-1 text-sm text-slate-300 flex items-center gap-2">
                    <School className="h-4 w-4 text-teal-300 shrink-0" />
                    <span>{selectedChild.school_name || "Oak Grove Elementary"}</span>
                    <span>·</span>
                    <span>{selectedChild.class_name || "Kindergarten A"}</span>
                  </p>
                </div>
              </div>

              {/* Star Badge */}
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-center min-w-[140px]">
                <p className="text-xs uppercase font-extrabold tracking-wider text-teal-200">Total Stars</p>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-3xl font-black text-amber-300">
                  <Trophy className="h-7 w-7 text-amber-400 shrink-0" /> {totalStars} ★
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">{completedCount} missions finished</p>
              </div>
            </div>

            {/* Quick credentials info */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-slate-300">
              {selectedChild.card_code && (
                <div className="flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-teal-300" />
                  <span>Student Card ID:</span>
                  <code className="bg-black/30 px-2 py-0.5 rounded font-mono text-teal-200">{selectedChild.card_code}</code>
                </div>
              )}
              {selectedChild.parent_invite_code && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Family Code:</span>
                  <code className="bg-black/30 px-2 py-0.5 rounded font-mono text-teal-200">{selectedChild.parent_invite_code}</code>
                </div>
              )}
            </div>
          </div>

          {/* Class Reward Progress Banner */}
          {classReward && (
            <div className="panel p-5 bg-white border shadow-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between text-sm">
                <span className="font-extrabold text-navy flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Class Reward: {classReward.title}
                </span>
                <span className="font-bold text-brand">
                  {classReward.current_stars} / {classReward.target_stars} Stars Goal ({Math.round(((classReward.current_stars || 0) / (classReward.target_stars || 100)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                <div
                  className="bg-brand h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((classReward.current_stars || 0) / (classReward.target_stars || 100)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 4-Stage Grocery Learning Experience */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-navy">Grocery Learning Curriculum Progress</h2>
            <p className="text-xs text-muted">
              Every grocery store mission connects classroom phonics, reading fluency, and math to real aisles.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stage 1 */}
              <div className="panel p-5 bg-white border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Stage 1</span>
                  <Sparkles className="h-4 w-4 text-brand" />
                </div>
                <h3 className="font-extrabold text-ink text-base">Sounds & Phonics</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Phonemic awareness questions: identifies beginning letter sounds for fresh produce like /b/ for banana.
                </p>
                <div className="pt-2">
                  <Badge tone="green">Completed (100% Score)</Badge>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="panel p-5 bg-white border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Stage 2</span>
                  <Barcode className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="font-extrabold text-ink text-base">Products & Barcodes</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Scanned grocery packages, verified UPC/EAN barcodes, and compared weights in grams offline.
                </p>
                <div className="pt-2">
                  <Badge tone="green">Scanned & Discovered</Badge>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="panel p-5 bg-white border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Stage 3</span>
                  <Mic className="h-4 w-4 text-rose-500" />
                </div>
                <h3 className="font-extrabold text-ink text-base">Reading Fluency</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Read aloud store signs and passages like &ldquo;Fresh Corn&rdquo;. Audio recorded securely.
                </p>
                <div className="pt-2">
                  <Badge tone={childRecordings.length ? "green" : "amber"}>
                    {childRecordings.length ? "Voice Audio Recorded" : "Awaiting Recording"}
                  </Badge>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="panel p-5 bg-white border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Stage 4</span>
                  <Calculator className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-extrabold text-ink text-base">Mathematics</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Grocery price comparisons (&ldquo;Which one costs more?&rdquo;), item counts, and addition.
                </p>
                <div className="pt-2">
                  <Badge tone="green">Answered Correctly</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Private Reading Voice Recordings */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-navy">Private Reading Voice Recordings ({childRecordings.length})</h2>
            <p className="text-xs text-muted">
              Listen to your child&apos;s audio recordings from Stage 3 reading passages. Protected under COPPA.
            </p>

            {childRecordings.length > 0 ? (
              <div className="space-y-3">
                {childRecordings.map((rec) => (
                  <div key={rec.id} className="panel p-5 bg-white border shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-ink">Reading Passage: Fresh Corn</h3>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="h-3.5 w-3.5" /> Recorded {new Date(rec.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge tone={rec.review_status === "reviewed" ? "green" : "amber"}>
                        {rec.review_status === "reviewed" ? "Teacher Reviewed" : "Awaiting Teacher Review"}
                      </Badge>
                    </div>

                    {/* Audio Player */}
                    <div className="panel bg-slate-50 p-4 rounded-xl border">
                      <p className="text-xs font-bold text-muted uppercase mb-2">Listen to Recording</p>
                      {rec.playback_url ? (
                        <audio controls src={rec.playback_url} className="w-full" />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Volume2 className="h-4 w-4 text-brand" />
                          <span>Voice recording is safely stored in secure cloud storage.</span>
                        </div>
                      )}
                    </div>

                    {rec.reviewer_feedback && (
                      <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-sm">
                        <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide">Teacher Feedback</p>
                        <p className="mt-1 text-ink">{rec.reviewer_feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel p-6 text-center text-muted bg-white border">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-ink">No voice recordings uploaded yet</p>
                <p className="text-xs text-muted mt-1">
                  When your child completes Stage 3 in the student app, their audio will appear here for you to listen to.
                </p>
              </div>
            )}
          </section>

          {/* Question Attempts Timeline */}
          {childQuestionAttempts.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-extrabold text-navy">Question Activity Log ({childQuestionAttempts.length})</h2>
              <div className="panel overflow-hidden border shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs font-extrabold uppercase text-muted">
                      <tr>
                        <th className="px-5 py-3">Prompt</th>
                        <th className="px-5 py-3">Child Answer</th>
                        <th className="px-5 py-3">Result</th>
                        <th className="px-5 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {childQuestionAttempts.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 font-bold text-ink">{q.prompt}</td>
                          <td className="px-5 py-3.5 text-muted">{q.answer_given}</td>
                          <td className="px-5 py-3.5">
                            {q.is_correct ? (
                              <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                                <Check className="h-3 w-3" /> Correct (+1★)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">
                                <X className="h-3 w-3" /> Try Again
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted">
                            {new Date(q.answered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>
      );
    }

    // Default: Children List View with "Add/Link Child" instructions
    return (
      <main className="page-shell space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Parent portal</p>
            <h1 className="mt-1 text-3xl font-extrabold text-navy">My Children</h1>
            <p className="mt-2 text-sm text-muted">
              Connect your family to classroom grocery missions, barcode learning, and voice reading recordings.
            </p>
          </div>
          <Button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="bg-navy text-white font-bold"
          >
            <Plus className="mr-2 h-4 w-4" /> Link Child With Code
          </Button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 p-4 text-sm font-bold text-teal-800">
            <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-800">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Link Child Form & How-To Guide */}
        {showLinkForm && (
          <div className="panel p-6 border-2 border-brand/30 bg-blue-50/20 max-w-2xl space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-navy">How to Link Your Child Later</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                You can link additional children at any time using their teacher-issued invite code.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 py-2">
              <div className="panel bg-white p-3 rounded-xl border text-xs">
                <span className="font-extrabold text-brand block mb-1">Step 1: Get Code</span>
                Look on the back of your child&apos;s physical Cart2Class card or ask their teacher for their Parent Code.
              </div>
              <div className="panel bg-white p-3 rounded-xl border text-xs">
                <span className="font-extrabold text-brand block mb-1">Step 2: Enter Below</span>
                Type the code (format: <code>C2C-PAR-NAME-1234</code>) into the field below.
              </div>
              <div className="panel bg-white p-3 rounded-xl border text-xs">
                <span className="font-extrabold text-brand block mb-1">Step 3: Instant Access</span>
                Tap Link Child to immediately see their grocery missions and reading recordings.
              </div>
            </div>

            <form
              action={async (fd) => {
                setErrorMsg(null);
                setNotification(null);
                const res = await linkChildWithInviteCode(fd);
                if (res?.error) {
                  setErrorMsg(res.error);
                } else {
                  setShowLinkForm(false);
                  showToast(`Successfully linked ${res.studentName || "your child"} to your family account!`);
                }
              }}
              className="space-y-3 pt-2"
            >
              <label className="block text-sm font-bold">
                Parent Invite Code / Student Code
                <input
                  required
                  name="inviteCode"
                  placeholder="e.g. C2C-PAR-MAYA-8492"
                  className="mt-1 block h-11 w-full rounded-lg border bg-white px-3 font-mono text-sm font-bold uppercase tracking-wider"
                />
              </label>
              <div className="flex gap-3">
                <Button type="submit" className="bg-navy text-white font-bold">Link Child</Button>
                <Button type="button" variant="secondary" onClick={() => setShowLinkForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Children Cards Grid */}
        <section className="grid gap-5 md:grid-cols-2">
          {students.length > 0 ? (
            students.map((st) => {
              const studentAttempts = attempts.filter((a) => a.student_id === st.id);
              const completedCount = studentAttempts.filter((a) => a.status === "completed").length;
              const totalStars = studentAttempts.reduce((acc, a) => acc + (a.stars_earned || 0), 0);
              const classReward = rewardGoals.find((rg) => rg.class_id === st.class_id);

              return (
                <article
                  key={st.id}
                  className="panel p-6 space-y-4 hover:shadow-md transition border bg-white cursor-pointer"
                  onClick={() => setSelectedChildId(st.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-brand font-black text-lg border border-blue-100">
                        {st.first_name[0]}{st.last_initial ?? ""}
                      </div>
                      <div>
                        <Badge tone="blue">Grade {st.grade_level === 0 ? "K" : st.grade_level}</Badge>
                        <h2 className="mt-1 text-xl font-black text-navy">
                          {st.first_name} {st.last_initial ?? ""}
                        </h2>
                        <p className="text-xs text-muted">{st.class_name || "Kindergarten A"} · {st.school_name || "Oak Grove Elementary"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-black text-brand text-lg">
                        <Trophy className="h-5 w-5 text-amber-500" /> {totalStars} Stars
                      </span>
                    </div>
                  </div>

                  {classReward && (
                    <div className="panel bg-slate-50 p-3 rounded-xl border">
                      <div className="flex justify-between text-xs font-bold text-muted mb-1">
                        <span>Class Goal: {classReward.title}</span>
                        <span>{classReward.current_stars} / {classReward.target_stars} ★</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-brand h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((classReward.current_stars || 0) / (classReward.target_stars || 100)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted">{completedCount} completed mission{completedCount === 1 ? "" : "s"}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChildId(st.id);
                      }}
                      className="font-bold text-brand hover:underline inline-flex items-center gap-1"
                    >
                      View Full Profile & Progress <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="col-span-2 panel p-8 text-center space-y-3 bg-white border">
              <UsersRound className="mx-auto h-10 w-10 text-muted" />
              <h3 className="font-extrabold text-ink text-lg">No linked children yet</h3>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Ask your child&apos;s teacher for their Parent Invite Code, then tap &ldquo;Link Child With Code&rdquo; above.
              </p>
            </div>
          )}
        </section>
      </main>
    );
  }

  /* ========================================================================= */
  /* TAB: MISSION PROGRESS                                                     */
  /* ========================================================================= */
  if (slug === "progress") {
    return (
      <main className="page-shell space-y-6">
        <div>
          <p className="eyebrow">Parent portal</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">Mission Learning Progress</h1>
          <p className="mt-2 text-sm text-muted">
            See your child&apos;s grocery aisle discovery, phonics answers, reading audio, and math attempts.
          </p>
        </div>

        <section className="space-y-4">
          {assignments.length > 0 ? (
            assignments.map((asg) => {
              const mission = asg.mission;
              const relatedAttempts = attempts.filter((a) => a.assignment_id === asg.id);
              const completed = relatedAttempts.some((a) => a.status === "completed");

              return (
                <article key={asg.id} className="panel p-6 space-y-4 bg-white border shadow-xs">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy">{mission?.title || "Fruit & Veggie Hunt"}</h2>
                      <p className="text-xs text-muted mt-1">
                        {asg.class?.name || "Kindergarten A"} · Partner Grocery Store Market
                      </p>
                    </div>
                    <Badge tone={completed ? "green" : "blue"}>{completed ? "Completed" : "In Progress"}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4 pt-2">
                    <div className="panel bg-slate-50 p-3 rounded-xl border text-center">
                      <p className="text-xs font-bold text-muted uppercase">Stage 1</p>
                      <p className="font-extrabold text-ink text-sm mt-1">Sounds</p>
                      <span className="text-xs text-green-700 font-bold">Passed</span>
                    </div>
                    <div className="panel bg-slate-50 p-3 rounded-xl border text-center">
                      <p className="text-xs font-bold text-muted uppercase">Stage 2</p>
                      <p className="font-extrabold text-ink text-sm mt-1">Products</p>
                      <span className="text-xs text-green-700 font-bold">Scanned</span>
                    </div>
                    <div className="panel bg-slate-50 p-3 rounded-xl border text-center">
                      <p className="text-xs font-bold text-muted uppercase">Stage 3</p>
                      <p className="font-extrabold text-ink text-sm mt-1">Fluency</p>
                      <span className="text-xs text-green-700 font-bold">Recorded</span>
                    </div>
                    <div className="panel bg-slate-50 p-3 rounded-xl border text-center">
                      <p className="text-xs font-bold text-muted uppercase">Stage 4</p>
                      <p className="font-extrabold text-ink text-sm mt-1">Math</p>
                      <span className="text-xs text-green-700 font-bold">Completed</span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="panel p-8 text-center text-muted bg-white border">
              No recent attempts synced yet. Work will appear here once the student app synchronizes.
            </div>
          )}
        </section>
      </main>
    );
  }

  /* ========================================================================= */
  /* TAB: READING RECORDINGS                                                   */
  /* ========================================================================= */
  return (
    <main className="page-shell space-y-6">
      <div>
        <p className="eyebrow">Parent portal</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy">Private Reading Recordings</h1>
        <p className="mt-2 text-sm text-muted">
          Listen to your child read store signs and product labels aloud. Protected under COPPA.
        </p>
      </div>

      <section className="space-y-4">
        {recordings.length > 0 ? (
          recordings.map((rec) => {
            const student = students.find((s) => s.id === rec.student_id);
            const studentName = student ? `${student.first_name} ${student.last_initial ?? ""}`.trim() : "Linked Learner";

            return (
              <article key={rec.id} className="panel p-6 space-y-4 bg-white border shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-extrabold text-navy">{studentName}</h2>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      Recorded {new Date(rec.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone={rec.review_status === "reviewed" ? "green" : "amber"}>
                    {rec.review_status === "reviewed" ? "Teacher Reviewed" : "Awaiting Review"}
                  </Badge>
                </div>

                <div className="panel bg-slate-50 p-4 rounded-xl border space-y-2">
                  <p className="text-xs font-bold text-muted uppercase">Audio Playback</p>
                  {rec.playback_url ? (
                    <audio controls src={rec.playback_url} className="w-full" />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Volume2 className="h-4 w-4 text-brand" />
                      <span>Audio file is stored privately in secure cloud storage.</span>
                    </div>
                  )}
                </div>

                {rec.reviewer_feedback && (
                  <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
                    <p className="text-xs font-bold text-teal-800 uppercase">Teacher Feedback</p>
                    <p className="mt-1 text-sm text-ink">{rec.reviewer_feedback}</p>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="panel p-8 text-center text-muted bg-white border">
            No voice recordings available yet.
          </div>
        )}
      </section>
    </main>
  );
}
