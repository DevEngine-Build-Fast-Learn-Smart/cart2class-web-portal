"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Trophy,
  School,
  Building2,
  UsersRound,
  GraduationCap,
  Sparkles,
  QrCode,
  ArrowRight,
  ClipboardCheck,
  ShieldCheck,
  Volume2,
  Clock,
  Printer,
  ChevronRight,
  BookOpen,
  MapPin,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity, Metric, Role } from "@/types/domain";
import { roleLabels } from "@/lib/constants/roles";

const metricIcons = {
  blue: School,
  purple: GraduationCap,
  teal: UsersRound,
  amber: Trophy
};

export function DashboardView({
  role,
  displayName,
  metrics,
  progress,
  notices,
  activities,
  extraData = {}
}: {
  role: Role;
  displayName: string;
  metrics: Metric[];
  progress: { name: string; completed: number; assigned: number }[];
  notices: { title: string; body: string; created_at: string }[];
  activities: Activity[];
  extraData?: Record<string, any>;
}) {
  const firstName = displayName.split(" ")[0];

  return (
    <main className="page-shell space-y-7">
      {/* Hero Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b pb-6">
        <div>
          <p className="eyebrow">{roleLabels[role]}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-navy">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted font-medium">
            {role === "admin" && "Executive dashboard managing educational pilots, curriculum reviews, store partners, and student QR credentials."}
            {role === "teacher" && "Classroom hub for monitoring grocery aisle missions, listening to student reading recordings, and tracking star goals."}
            {role === "parent" && "Your family portal for tracking grocery store missions, listening to voice recordings, and celebrating earned stars."}
            {role === "store" && "Retail partner operations hub managing scannable entrance signs, community visits, and sponsored classroom rewards."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="green">Active Session Verified</Badge>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => {
          const tones = ["blue", "purple", "teal", "amber"] as const;
          const tone = metric.tone || tones[idx % 4];
          const IconComponent = metricIcons[tone] || Trophy;

          return (
            <article key={metric.label} className="panel p-6 bg-white border shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted">{metric.label}</span>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 border text-brand">
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-3xl sm:text-4xl font-black text-navy">{metric.value}</p>
              {metric.detail && <p className="mt-1 text-xs font-bold text-muted">{metric.detail}</p>}
            </article>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* 1. ADMIN OVERVIEW CONTENT                                                 */}
      {/* ========================================================================= */}
      {role === "admin" && (
        <div className="space-y-6">
          {/* Quick Action Bar */}
          <div className="panel p-5 bg-gradient-to-r from-blue-900 to-navy text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Administrator Quick Actions</h2>
              <p className="text-xs text-slate-300 mt-0.5">Rapidly provision partner schools, classrooms, partner stores, or enroll learners.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/admin/schools" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-teal-300" /> Add School / Class
              </Link>
              <Link href="/admin/users" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-300" /> Enroll Student QR
              </Link>
              <Link href="/admin/stores" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-300" /> Add Store Partner
              </Link>
              <Link href="/admin/reviews" className="rounded-xl bg-teal-500 hover:bg-teal-400 text-navy font-black px-3.5 py-2 text-xs transition flex items-center gap-1.5 shadow-sm">
                <ClipboardCheck className="h-3.5 w-3.5" /> Review Missions
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Review Queue Preview */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Curriculum Review Queue</h3>
                  <p className="text-xs text-muted">Teacher-submitted missions awaiting administrative publishing</p>
                </div>
                <Link href="/admin/reviews" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {extraData.reviewQueue?.length ? (
                <div className="space-y-3">
                  {extraData.reviewQueue.map((m: any) => (
                    <div key={m.id} className="panel bg-slate-50/70 p-4 rounded-xl border flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-ink text-sm block">{m.title}</span>
                        <span className="text-xs text-muted">v{m.current_version} · {m.estimated_minutes} min duration</span>
                      </div>
                      <Link href="/admin/reviews" className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition">
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel p-6 text-center text-muted bg-slate-50 rounded-xl border">
                  <ClipboardCheck className="mx-auto h-7 w-7 text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-ink">Review queue is clear</p>
                  <p className="text-[11px] text-muted">All submitted missions have been reviewed and published.</p>
                </div>
              )}
            </div>

            {/* Educational Pilot Schools Overview */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Pilot Educational Institutions</h3>
                  <p className="text-xs text-muted">Active elementary schools with legal claim records</p>
                </div>
                <Link href="/admin/schools" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {(extraData.schoolsList || [{ name: "Oak Grove Elementary", district_name: "Jefferson County District", nces_id: "010000500123", address: "100 Learning Lane, Alabama" }]).map((sc: any) => (
                  <div key={sc.id || sc.name} className="panel bg-slate-50/70 p-4 rounded-xl border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink text-sm">{sc.name}</span>
                      <Badge tone="green">Verified Pilot</Badge>
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <School className="h-3.5 w-3.5 text-brand" /> {sc.district_name || "District Partner"} · NCES: {sc.nces_id || "010000500123"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {sc.address || "100 Learning Lane, Alabama"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TEACHER OVERVIEW CONTENT                                               */}
      {/* ========================================================================= */}
      {role === "teacher" && (
        <div className="space-y-6">
          {/* Quick Action Bar */}
          <div className="panel p-5 bg-gradient-to-r from-blue-900 to-navy text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Classroom Operations Hub</h2>
              <p className="text-xs text-slate-300 mt-0.5">Launch missions, review student reading voice recordings, and manage student QR cards.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/teacher/missions" className="rounded-xl bg-teal-500 hover:bg-teal-400 text-navy font-black px-3.5 py-2 text-xs transition flex items-center gap-1.5 shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Launch Mission
              </Link>
              <Link href="/teacher/classes" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-teal-300" /> View Classes & Goals
              </Link>
              <Link href="/teacher/recordings" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-blue-300" /> Reading Reviews
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reading Reviews Inbox */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Reading Voice Submissions Inbox</h3>
                  <p className="text-xs text-muted">Stage 3 voice recordings awaiting teacher feedback</p>
                </div>
                <Link href="/teacher/recordings" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {extraData.pendingRecordings?.length ? (
                <div className="space-y-3">
                  {extraData.pendingRecordings.map((rec: any) => (
                    <div key={rec.id} className="panel bg-slate-50 p-4 rounded-xl border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink text-sm">
                          {rec.students?.first_name || "Maya"} {rec.students?.last_initial || "C."}
                        </span>
                        <Badge tone="amber">Pending Review</Badge>
                      </div>
                      <p className="text-xs text-muted">Passage: Fresh Corn</p>
                      <audio
                        controls
                        preload="metadata"
                        src={rec.playback_url || "/sample-reading-recording.wav"}
                        className="w-full h-9 mt-1"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel p-6 text-center text-muted bg-slate-50 rounded-xl border">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-ink">All reading recordings reviewed!</p>
                  <p className="text-[11px] text-muted">New voice recordings from classroom grocery trips will appear here.</p>
                </div>
              )}
            </div>

            {/* Classroom Star Goal */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Classroom Reward Star Goal</h3>
                  <p className="text-xs text-muted">Cumulative stars earned by all students</p>
                </div>
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>

              <div className="panel bg-gradient-to-br from-amber-50/50 to-white p-5 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-navy text-lg">Pizza Party Celebration</h4>
                    <p className="text-xs text-muted">Kindergarten A · Partner: Green Basket Market</p>
                  </div>
                  <span className="font-black text-amber-600 text-xl">18 / 100 ★</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border">
                  <div className="bg-brand h-3 rounded-full transition-all" style={{ width: "18%" }} />
                </div>
                <p className="text-xs text-muted">82 more stars needed to unlock the celebration!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PARENT OVERVIEW CONTENT                                                */}
      {/* ========================================================================= */}
      {role === "parent" && (
        <div className="space-y-6">
          {/* Quick Action Bar */}
          <div className="panel p-5 bg-gradient-to-r from-blue-900 to-navy text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Family Grocery Learning Hub</h2>
              <p className="text-xs text-slate-300 mt-0.5">Explore aisle missions with your child and listen to their reading recordings.</p>
            </div>
            <Link href="/parent/children" className="rounded-xl bg-teal-500 hover:bg-teal-400 text-navy font-black px-4 py-2 text-xs transition flex items-center gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Link Another Child
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* My Children Quick Cards */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">My Children in Cart2Class</h3>
                  <p className="text-xs text-muted">Select a child to view their complete grocery learning journey</p>
                </div>
                <Link href="/parent/children" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                  View full profiles <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {(extraData.children?.length ? extraData.children : [{ id: "c1", first_name: "Maya", last_initial: "C", grade_level: 0, classes: { name: "Kindergarten A" } }]).map((child: any) => (
                  <Link
                    key={child.id}
                    href="/parent/children"
                    className="panel bg-slate-50/70 p-4 rounded-xl border flex items-center justify-between hover:bg-blue-50/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 font-extrabold text-brand text-sm">
                        {child.first_name[0]}{child.last_initial ?? ""}
                      </div>
                      <div>
                        <span className="font-bold text-ink text-sm group-hover:text-brand transition">
                          {child.first_name} {child.last_initial ?? ""}
                        </span>
                        <span className="text-xs text-muted block">
                          {child.classes?.name || "Kindergarten A"} · Grade {child.grade_level === 0 ? "K" : child.grade_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-600 text-sm">18 ★</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Grocery Learning Parenting Guide */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Grocery Aisle Learning Tips</h3>
                  <p className="text-xs text-muted">Make your everyday supermarket trip fun and educational</p>
                </div>
                <Sparkles className="h-5 w-5 text-brand" />
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div className="panel bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
                  <p className="font-bold text-brand mb-1">🍎 Phonics in Produce</p>
                  Ask your child to find foods that start with the letter sound they are practicing (e.g. &ldquo;/b/ for Banana, /a/ for Apple&rdquo;).
                </div>
                <div className="panel bg-teal-50/60 p-3.5 rounded-xl border border-teal-200/80">
                  <p className="font-bold text-teal-800 mb-1">⚖️ Math with the Scale</p>
                  Place 3 apples on the hanging grocery scale and read the weight together. Which is heavier: 3 apples or 2 oranges?
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STORE OVERVIEW CONTENT                                                 */}
      {/* ========================================================================= */}
      {role === "store" && (
        <div className="space-y-6">
          {/* Quick Action Bar */}
          <div className="panel p-5 bg-gradient-to-r from-blue-900 to-navy text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Retail Partner Operations</h2>
              <p className="text-xs text-slate-300 mt-0.5">Welcome students to your grocery branch, verify check-in signs, and support classroom rewards.</p>
            </div>
            <Link href="/store/check-in" className="rounded-xl bg-teal-500 hover:bg-teal-400 text-navy font-black px-4 py-2 text-xs transition flex items-center gap-1.5 shadow-sm">
              <QrCode className="h-3.5 w-3.5" /> View Entrance Sign QR
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Store Information */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Store Branch Profile</h3>
                  <p className="text-xs text-muted">Your participating grocery storefront</p>
                </div>
                <Badge tone="green">Active Partner</Badge>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <p className="text-base font-black text-navy">{extraData.storeInfo?.name || "Green Basket Market"}</p>
                <p className="flex items-center gap-1.5 text-muted">
                  <MapPin className="h-3.5 w-3.5 text-brand" /> {extraData.storeInfo?.address || "20 Community Way, Alabama"}
                </p>
                <p className="flex items-center gap-1.5 text-muted">
                  <Clock className="h-3.5 w-3.5 text-teal-600" /> {extraData.storeInfo?.business_hours || "8:00 AM - 9:00 PM Daily"}
                </p>
                <p className="flex items-center gap-1.5 text-muted">
                  <UsersRound className="h-3.5 w-3.5 text-purple-600" /> Manager: {extraData.storeInfo?.representative_name || "Manager"}
                </p>
              </div>
            </div>

            {/* Sponsored Classroom Rewards */}
            <div className="panel p-6 bg-white border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-navy text-base">Sponsored Classroom Goals</h3>
                  <p className="text-xs text-muted">Celebrations sponsored by your store location</p>
                </div>
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>

              <div className="panel bg-slate-50 p-4 rounded-xl border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-navy">Pizza Party Celebration</span>
                  <span className="text-brand font-black">18 / 100 ★</span>
                </div>
                <p className="text-[11px] text-muted">Kindergarten A (Oak Grove Elementary)</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full" style={{ width: "18%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy-First Commitment Banner */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-teal-50/60 to-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <ShieldCheck className="h-6 w-6 shrink-0 text-teal-600" />
          <div>
            <h3 className="font-extrabold text-navy text-sm">COPPA & Privacy-First by Design</h3>
            <p className="text-xs leading-relaxed text-muted mt-0.5">
              Cart2Class isolates student records strictly within verified school and guardian relationships. Partner stores receive aggregate visits only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
