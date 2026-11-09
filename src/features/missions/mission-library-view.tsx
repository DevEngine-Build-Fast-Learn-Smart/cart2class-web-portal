"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LibraryBig,
  Search,
  Filter,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  UsersRound,
  Users,
  Trophy,
  Copy,
  Edit3,
  Eye,
  Power,
  X,
  Star,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  CheckCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleMissionStatus, cloneMission } from "./mission-library-actions";
import { submitMission } from "@/features/dashboard/workflow-actions";
import { CreateMissionModal } from "./create-mission-modal";
import { ManageStudentAccessModal } from "./manage-student-access-modal";

type Row = Record<string, any>;

export function MissionLibraryView({
  missions = [],
  attempts = [],
  assignments = [],
  students = [],
  studentAssignments = [],
  classes = [],
  stores = [],
  reviews = [],
  role = "teacher"
}: {
  missions: Row[];
  attempts: Row[];
  assignments: Row[];
  students: Row[];
  studentAssignments?: Row[];
  classes: Row[];
  stores: Row[];
  reviews?: Row[];
  role: "teacher" | "admin";
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sharingFilter, setSharingFilter] = useState("all");
  const [selectedMissionForResults, setSelectedMissionForResults] = useState<Row | null>(null);
  const [selectedMissionForAccess, setSelectedMissionForAccess] = useState<Row | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const storeMap = new Map(stores.map((s) => [s.id, s.name]));

  // Pre-calculate participation metrics per mission
  const missionMetrics = new Map<string, {
    totalAttempts: number;
    completedCount: number;
    totalStars: number;
    completionRate: number;
    participants: Row[];
  }>();

  for (const m of missions) {
    const relatedAssignments = assignments.filter((asg) => asg.mission_id === m.id);
    const assignmentIds = new Set(relatedAssignments.map((asg) => asg.id));
    const relatedAttempts = attempts.filter((att) => assignmentIds.has(att.assignment_id) || att.mission_id === m.id);

    const completed = relatedAttempts.filter((a) => a.status === "completed");
    const totalStars = completed.reduce((sum, a) => sum + (a.stars_earned || m.stars || 5), 0);
    const rate = relatedAttempts.length > 0 ? Math.round((completed.length / relatedAttempts.length) * 100) : 0;

    missionMetrics.set(m.id, {
      totalAttempts: relatedAttempts.length,
      completedCount: completed.length,
      totalStars,
      completionRate: rate,
      participants: relatedAttempts.map((att) => {
        const student = studentMap.get(att.student_id);
        const className = student?.class_id ? classMap.get(student.class_id) : "Oak Grove Class";
        return {
          ...att,
          student_name: student ? `${student.first_name} ${student.last_initial ?? ""}`.trim() : "Enrolled Learner",
          class_name: className || "Oak Grove Elementary",
          grade_level: student?.grade_level ?? m.grade_min ?? 0
        };
      })
    });
  }

  // Filter missions
  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade =
      gradeFilter === "all" ||
      (gradeFilter === "0" && m.grade_min <= 0 && m.grade_max >= 0) ||
      (gradeFilter === "1" && m.grade_min <= 1 && m.grade_max >= 1) ||
      (gradeFilter === "2" && m.grade_min <= 2 && m.grade_max >= 2);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.status === "published") ||
      (statusFilter === "draft" && m.status !== "published");

    const matchesSharing =
      sharingFilter === "all" ||
      (sharingFilter === "featured" && m.sharing_status === "featured") ||
      (sharingFilter === "approved" && m.sharing_status === "approved") ||
      (sharingFilter === "submitted" && m.sharing_status === "submitted") ||
      (sharingFilter === "rejected" && m.sharing_status === "rejected") ||
      (sharingFilter === "private" && (m.sharing_status === "private" || m.sharing_status === "draft" || !m.sharing_status));

    return matchesSearch && matchesGrade && matchesStatus && matchesSharing;
  });

  // Global KPI calculations
  const totalMissions = missions.length;
  const activeMissions = missions.filter((m) => m.status === "published").length;
  const totalCompletedAttempts = attempts.filter((a) => a.status === "completed").length;
  const totalStarsEarned = attempts.reduce((acc, a) => acc + (a.stars_earned || 0), 0);

  return (
    <main className="page-shell space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-teal-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-6">
        <div>
          <p className="eyebrow">{role === "admin" ? "A.L.M.A. Administration" : "Teacher Workspace"}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">Shared Mission Library</h1>
          <p className="mt-2 text-sm text-muted max-w-2xl">
            Explore standards-aligned K–2 grocery discovery missions. Edit questions with rich option pictures, toggle live status, inspect student participation, and clone missions for your classroom.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CreateMissionModal
            role={role}
            stores={stores}
            classes={classes}
            students={students}
            triggerText="Create New Mission"
            triggerClassName="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 shadow-sm"
          />
          <Link href={`/${role}/missions`}>
            <Button variant="secondary" className="border-line text-navy hover:bg-slate-100 font-bold h-11 px-5">
              Open Mission Builder
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-brand">
              <LibraryBig className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Total Missions</p>
              <p className="text-2xl font-black text-navy">{totalMissions}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Active in Stores</p>
              <p className="text-2xl font-black text-navy">{activeMissions}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Student Completions</p>
              <p className="text-2xl font-black text-navy">{totalCompletedAttempts}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Class Stars Awarded</p>
              <p className="text-2xl font-black text-navy">{totalStarsEarned}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="panel p-4 bg-white border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by mission title or target produce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-slate-50 pl-10 pr-4 text-sm font-medium transition focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted">Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 rounded-xl border border-line bg-slate-50 px-3 text-xs font-bold text-ink focus:border-brand focus:outline-none"
            >
              <option value="all">All Grades (K–2)</option>
              <option value="0">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-line bg-slate-50 px-3 text-xs font-bold text-ink focus:border-brand focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Published)</option>
              <option value="draft">Inactive (Draft)</option>
            </select>
          </div>

          {/* Sharing filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted">Sharing:</span>
            <select
              value={sharingFilter}
              onChange={(e) => setSharingFilter(e.target.value)}
              className="h-10 rounded-xl border border-line bg-slate-50 px-3 text-xs font-bold text-ink focus:border-brand focus:outline-none"
            >
              <option value="all">All Sharing</option>
              <option value="approved">Approved & Active</option>
              <option value="submitted">Awaiting Review</option>
              <option value="rejected">Rejected / Changes Needed</option>
              <option value="featured">Featured by A.L.M.A.</option>
              <option value="private">Private / Classroom Drafts</option>
            </select>
          </div>
        </div>
      </section>

      {/* Mission Cards Grid */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((m) => {
            const metrics = missionMetrics.get(m.id) || {
              totalAttempts: 0,
              completedCount: 0,
              totalStars: 0,
              completionRate: 0,
              participants: []
            };
            const isPublished = m.status === "published";
            const isRejected = !isPublished && m.sharing_status === "rejected";
            const isSubmitted = !isPublished && (m.sharing_status === "submitted" || m.sharing_status === "under_review");
            const storeName = m.store_id ? storeMap.get(m.store_id) : "Partner Store";
            const latestReview = reviews.find((r) => r.mission_id === m.id);

            return (
              <article
                key={m.id}
                className="panel flex flex-col justify-between overflow-hidden border bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Card Top: Badges & Status */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-2xs ${
                          isPublished
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : isRejected
                            ? "bg-rose-50 text-rose-800 border border-rose-300"
                            : isSubmitted
                            ? "bg-amber-50 text-amber-900 border border-amber-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isPublished
                              ? "bg-emerald-500 animate-pulse"
                              : isRejected
                              ? "bg-rose-500"
                              : isSubmitted
                              ? "bg-amber-500 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        />
                        {isPublished
                          ? "Active & Published"
                          : isRejected
                          ? "Revisions Needed"
                          : isSubmitted
                          ? "In Admin Review"
                          : "Draft Mode"}
                      </span>

                      {isPublished ? (
                        m.sharing_status === "featured" ? (
                          <Badge tone="purple">Featured</Badge>
                        ) : (
                          <Badge tone="green">Approved</Badge>
                        )
                      ) : isRejected ? (
                        <Badge tone="rose">Action Needed</Badge>
                      ) : isSubmitted ? (
                        <Badge tone="amber">Pending Approval</Badge>
                      ) : (
                        <Badge tone="slate">Draft</Badge>
                      )}
                    </div>

                    {/* Star Chip */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black text-amber-900 shadow-2xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      <span>{m.stars || 5} Stars</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-navy">{m.title}</h3>
                    <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
                      {m.description || "A four-step grocery learning mission covering phonemic awareness, product barcode scanning, oral reading fluency, and math."}
                    </p>
                  </div>

                  {/* Rejection Feedback Note */}
                  {isRejected && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>Admin Review Feedback:</span>
                      </div>
                      <p className="text-xs text-rose-900 italic font-medium leading-relaxed pl-4 border-l-2 border-rose-400">
                        {latestReview?.feedback ? `"${latestReview.feedback}"` : "Revisions requested by administrator before publishing."}
                      </p>
                    </div>
                  )}

                  {/* Submitted Note */}
                  {isSubmitted && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-800 flex items-center gap-2 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
                      <span>Submitted for admin review. Students cannot access until approved.</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted font-bold pt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {m.estimated_minutes || 12} mins
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-brand px-2 py-1">
                      <Award className="h-3.5 w-3.5" />
                      Grades {m.grade_min === 0 ? "K" : m.grade_min}–{m.grade_max}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1">
                      <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                      {m.passage || "Fluency Passage"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                      (studentAssignments ?? []).filter((sa) => sa.mission_id === m.id).length > 0
                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      <Users className="h-3.5 w-3.5 text-purple-600" />
                      {(studentAssignments ?? []).filter((sa) => sa.mission_id === m.id).length > 0
                        ? `${(studentAssignments ?? []).filter((sa) => sa.mission_id === m.id).length} Students Assigned`
                        : "All Students Access"}
                    </span>
                  </div>

                  {/* Participation Stats Preview */}
                  <div className="rounded-xl bg-slate-50 p-3 border border-line/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <UsersRound className="h-3.5 w-3.5 text-brand" />
                        {metrics.completedCount} student completion{metrics.completedCount === 1 ? "" : "s"}
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {metrics.completionRate}% completion
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="border-t bg-slate-50/60 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Direct Student Preview */}
                    <Link href={`/${role}/missions?id=${m.id}&preview=true`} className="w-full">
                      <Button
                        variant="secondary"
                        className="w-full text-xs font-bold h-9 bg-blue-50/80 hover:bg-blue-100 text-brand border border-blue-200 shadow-2xs"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-brand" /> Student Preview
                      </Button>
                    </Link>

                    {/* Edit in Builder */}
                    <Link href={`/${role}/missions?id=${m.id}`} className="w-full">
                      <Button variant="secondary" className="w-full text-xs font-bold h-9">
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit / Builder
                      </Button>
                    </Link>
                  </div>

                  {/* Manage Student Access Button */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedMissionForAccess(m)}
                    className="w-full text-xs font-bold h-9 bg-purple-50/90 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5 text-purple-700" />
                    <span>
                      Manage Student Access
                      {(studentAssignments ?? []).filter((sa) => sa.mission_id === m.id).length > 0
                        ? ` (${(studentAssignments ?? []).filter((sa) => sa.mission_id === m.id).length} Selected)`
                        : " (All Students)"}
                    </span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Role-Specific Primary Workflow Action */}
                    {role === "teacher" && !isPublished ? (
                      isSubmitted ? (
                        <div className="flex items-center justify-center rounded-lg border border-amber-300 bg-amber-100/70 px-2 py-1 text-[11px] font-bold text-amber-900">
                          <Clock className="mr-1 h-3 w-3 text-amber-700 animate-pulse" /> In Admin Review
                        </div>
                      ) : (
                        <form
                          action={async (fd) => {
                            setIsSubmitting(m.id);
                            const res = await submitMission(fd);
                            setIsSubmitting(null);
                            if (res?.error) {
                              showToast(`Error: ${res.error}`);
                            } else {
                              showToast(`Mission "${m.title}" submitted for admin review!`);
                            }
                          }}
                        >
                          <input type="hidden" name="missionId" value={m.id} />
                          <Button
                            type="submit"
                            disabled={isSubmitting === m.id}
                            className="w-full text-xs font-bold h-9 bg-navy text-white hover:bg-navy-lighter"
                          >
                            {isSubmitting === m.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {isRejected ? "Resubmit" : "Submit Review"}
                          </Button>
                        </form>
                      )
                    ) : (
                      /* Toggle Active / Inactive */
                      <form
                        action={async (fd) => {
                          setIsToggling(m.id);
                          const res = await toggleMissionStatus(fd);
                          setIsToggling(null);
                          if (res?.error) {
                            showToast(res.error);
                          } else {
                            showToast(`Mission "${m.title}" is now ${isPublished ? "Inactive (Draft)" : "Active (Published)"}!`);
                          }
                        }}
                      >
                        <input type="hidden" name="missionId" value={m.id} />
                        <input type="hidden" name="currentStatus" value={m.status || "draft"} />
                        <Button
                          type="submit"
                          disabled={isToggling === m.id}
                          className={`w-full text-xs font-bold h-9 ${
                            isPublished
                              ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          <Power className="mr-1.5 h-3.5 w-3.5" />
                          {isPublished ? "Make Inactive" : role === "admin" ? "Approve & Activate" : "Make Active"}
                        </Button>
                      </form>
                    )}

                    {/* View Results Modal */}
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedMissionForResults(m)}
                      className="text-xs font-bold h-9 bg-white hover:bg-blue-50 hover:text-brand"
                    >
                      <Trophy className="mr-1.5 h-3.5 w-3.5 text-amber-600" /> Results ({metrics.participants.length})
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full panel p-12 text-center space-y-3 bg-white border">
            <LibraryBig className="mx-auto h-12 w-12 text-muted" />
            <h3 className="font-black text-navy text-lg">No missions match your search</h3>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Try adjusting your search terms or filters above, or create a brand-new mission using the Mission Builder.
            </p>
          </div>
        )}
      </section>

      {/* Participants & Results Modal */}
      {selectedMissionForResults && (() => {
        const m = selectedMissionForResults;
        const metrics = missionMetrics.get(m.id) || {
          totalAttempts: 0,
          completedCount: 0,
          totalStars: 0,
          completionRate: 0,
          participants: []
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="panel max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border p-6 sm:p-8 space-y-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-black tracking-widest text-brand uppercase">Mission Participants & Results</span>
                  <h2 className="text-2xl font-black text-navy mt-1">{m.title}</h2>
                  <p className="text-xs text-muted mt-1">
                    Grades {m.grade_min === 0 ? "K" : m.grade_min}–{m.grade_max} · {m.estimated_minutes || 12} mins · {m.stars || 5} Stars Reward
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMissionForResults(null)}
                  className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="panel bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
                  <p className="text-xs font-bold text-brand uppercase">Participants</p>
                  <p className="text-2xl font-black text-navy mt-1">{metrics.totalAttempts}</p>
                </div>
                <div className="panel bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Completions</p>
                  <p className="text-2xl font-black text-navy mt-1">{metrics.completedCount}</p>
                  <span className="text-[11px] font-bold text-emerald-700">({metrics.completionRate}% rate)</span>
                </div>
                <div className="panel bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
                  <p className="text-xs font-bold text-amber-700 uppercase">Stars Earned</p>
                  <p className="text-2xl font-black text-navy mt-1">{metrics.totalStars} ★</p>
                </div>
              </div>

              {/* Student Roster Table */}
              <div>
                <h4 className="text-sm font-extrabold text-navy mb-3">Student Participation Log</h4>
                {metrics.participants.length > 0 ? (
                  <div className="panel overflow-hidden border rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b font-extrabold uppercase text-muted">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Grade</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Stars</th>
                          <th className="px-4 py-3">Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {metrics.participants.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-ink">{p.student_name}</td>
                            <td className="px-4 py-3 text-muted">{p.class_name}</td>
                            <td className="px-4 py-3 text-muted">Grade {p.grade_level === 0 ? "K" : p.grade_level}</td>
                            <td className="px-4 py-3">
                              <Badge tone={p.status === "completed" ? "green" : "blue"}>
                                {p.status === "completed" ? "Completed" : "In Progress"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-bold text-amber-700">
                              {p.stars_earned || m.stars || 5} ★
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "Active Session"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="panel p-8 text-center text-muted bg-slate-50 border rounded-xl">
                    No student attempts have been logged for this mission yet. Students will appear here as soon as they scan the store QR code and begin.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center border-t pt-4">
                <Link href={`/${role}/missions?id=${m.id}`}>
                  <Button className="bg-brand text-white font-bold text-xs h-9">
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit in Mission Builder
                  </Button>
                </Link>
                <Button variant="secondary" onClick={() => setSelectedMissionForResults(null)} className="text-xs h-9">
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      <ManageStudentAccessModal
        isOpen={!!selectedMissionForAccess}
        onClose={() => setSelectedMissionForAccess(null)}
        mission={selectedMissionForAccess}
        students={students}
        classes={classes}
        currentAssignedStudentIds={
          selectedMissionForAccess
            ? (studentAssignments ?? [])
                .filter((sa) => sa.mission_id === selectedMissionForAccess.id)
                .map((sa) => sa.student_id)
            : []
        }
        onSaved={() => {
          showToast(`Student access saved for "${selectedMissionForAccess?.title}"!`);
          router.refresh();
        }}
      />
    </main>
  );
}

