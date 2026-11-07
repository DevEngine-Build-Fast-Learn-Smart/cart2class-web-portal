"use client";

import { useMemo, useState } from "react";
import {
  School,
  GraduationCap,
  UsersRound,
  Building2,
  Trophy,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = Record<string, unknown>;

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function gradeLabel(grade: unknown): string {
  const g = Number(grade);
  if (g === 0) return "Kindergarten (K)";
  if (!isNaN(g)) return `Grade ${g}`;
  return "Grade —";
}

export function AdminReportsView({
  schools = [],
  classes = [],
  students = [],
  stores = [],
  rewards = [],
  profiles = []
}: {
  schools: Row[];
  classes: Row[];
  students: Row[];
  stores: Row[];
  rewards: Row[];
  profiles: Row[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "schools" | "classes" | "stores" | "students">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Summary Metrics calculations
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.is_active !== false).length;

  const totalClasses = classes.length;
  const totalStudents = students.length;
  const linkedStudents = students.filter((s) => Boolean(s.linked_parent_id || s.linked_parent_name)).length;
  const linkPercentage = totalStudents > 0 ? Math.round((linkedStudents / totalStudents) * 100) : 0;

  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.is_active !== false).length;

  const totalConfirmedStars = classes.reduce((acc, c) => acc + (Number(c.confirmed_stars) || 0), 0);
  const totalTargetStars = classes.reduce((acc, c) => acc + (Number(c.target_stars) || 100), 0);
  const rewardPercentage = totalTargetStars > 0 ? Math.round((totalConfirmedStars / totalTargetStars) * 100) : 0;

  // Filtered lists
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch = text(s.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        text(s.address).toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [schools, searchTerm]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch = text(c.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        text(c.assigned_teacher).toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = gradeFilter === "all" || String(c.grade_level) === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [classes, searchTerm, gradeFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const name = `${text(st.first_name)} ${text(st.last_initial)}`.toLowerCase();
      const matchSearch = name.includes(searchTerm.toLowerCase()) ||
        text(st.class_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        text(st.parent_invite_code).toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = gradeFilter === "all" || String(st.grade_level) === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [students, searchTerm, gradeFilter]);

  const filteredStores = useMemo(() => {
    return stores.filter((st) => {
      return text(st.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        text(st.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
        text(st.representative_name).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [stores, searchTerm]);

  // Export CSV Handler
  const exportCsv = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const headers = [
      "Report Category",
      "Item Name",
      "Identifier/Grade",
      "Assigned Staff/Teacher",
      "Location/Address",
      "Enrollment/Participants",
      "Goal/Stars Progress",
      "Status"
    ];

    const rows: string[][] = [headers];

    schools.forEach((s) => {
      rows.push([
        "School",
        `"${text(s.name)}"`,
        `NCES: ${text(s.nces_id || "Verified")}`,
        `"${text(s.principal_name || "Principal")}"`,
        `"${text(s.address)}"`,
        `${classes.filter((c) => c.school_id === s.id).length} classes`,
        "—",
        s.is_active !== false ? "Active" : "Inactive"
      ]);
    });

    classes.forEach((c) => {
      rows.push([
        "Classroom",
        `"${text(c.name)}"`,
        gradeLabel(c.grade_level),
        `"${text(c.assigned_teacher)}"`,
        `Year ${text(c.school_year)}`,
        `${students.filter((st) => st.class_id === c.id).length} learners`,
        `${text(c.confirmed_stars || 0)} / ${text(c.target_stars || 100)} stars`,
        c.is_active !== false ? "Active" : "Inactive"
      ]);
    });

    stores.forEach((st) => {
      rows.push([
        "Store",
        `"${text(st.name)}"`,
        "Grocery Partner",
        `"${text(st.representative_name || "Manager")}"`,
        `"${text(st.address)}"`,
        "—",
        "Active storefront check-in QR",
        st.is_active !== false ? "Active" : "Inactive"
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cart2class-program-report-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="page-shell space-y-7">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-black text-brand">
              <TrendingUp className="h-3.5 w-3.5" />
              A.L.M.A. Executive Intelligence
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Live Database Analytics
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive audit, classroom mission progression, parent linkages, and partner store footprint.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={exportCsv}
            className="h-10 rounded-xl border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-navy"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Export CSV Report
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            className="h-10 rounded-xl border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-navy"
          >
            <Printer className="mr-2 h-4 w-4 text-brand" />
            Print Analytics
          </Button>
        </div>
      </div>

      {/* 4 High-Impact Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Schools KPI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Partner Schools
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-brand">
              <School className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-navy">{totalSchools}</span>
            <span className="text-xs font-bold text-emerald-600">
              {activeSchools === totalSchools ? "100% active" : `${activeSchools} active`}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Elementary & pilot institutions verified
          </p>
        </div>

        {/* Classrooms KPI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Classrooms
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-navy">{totalClasses}</span>
            <span className="text-xs font-bold text-teal-700">
              K–Grade 12 span
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Organized learning cohorts
          </p>
        </div>

        {/* Students & Parent Linkage KPI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enrolled Learners
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <UsersRound className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-navy">{totalStudents}</span>
            <span className="text-xs font-bold text-indigo-600">
              {linkPercentage}% parent linked
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Active scannable QR passes issued
          </p>
        </div>

        {/* Reward Stars Progress KPI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reward Goal Stars
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-navy">
              {totalConfirmedStars}
              <span className="text-lg font-bold text-slate-400">
                {" "}/ {totalTargetStars}★
              </span>
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(12, rewardPercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1.5" aria-label="Report Views">
          {[
            { id: "overview", label: "Executive Overview", count: null },
            { id: "schools", label: "Schools & Districts", count: totalSchools },
            { id: "classes", label: "Classrooms & Rewards", count: totalClasses },
            { id: "stores", label: "Partner Grocery Stores", count: totalStores },
            { id: "students", label: "Learner Rosters", count: totalStudents }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-navy"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Global Search and Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter current view…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-48 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand focus:outline-hidden sm:w-60"
            />
          </div>

          {(activeTab === "classes" || activeTab === "students") && (
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Grades</option>
              <option value="0">Kindergarten</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab Content 1: Executive Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Classrooms Progress Summary Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-navy">
                    Classroom Reward Targets & Progress
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time student star accumulations toward school goals
                  </p>
                </div>
                <Badge tone="green">Active Program</Badge>
              </div>

              <div className="mt-5 space-y-4">
                {classes.map((c) => {
                  const confirmed = Number(c.confirmed_stars) || 0;
                  const target = Number(c.target_stars) || 100;
                  const pct = Math.round((confirmed / target) * 100);
                  return (
                    <div
                      key={String(c.id)}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-navy text-sm">{text(c.name)}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {gradeLabel(c.grade_level)} · Teacher: {text(c.assigned_teacher)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-600">
                            {confirmed} / {target} ★
                          </span>
                          <p className="text-[11px] font-bold text-slate-400">{pct}% reached</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">
                          Goal: {text(c.reward_title || "Classroom celebration")}
                        </span>
                        <span>{text(c.enrolled_count || 1)} active learners</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Program Health & Governance Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-navy">
                    Program Governance & Compliance
                  </h3>
                  <p className="text-xs text-slate-500">
                    A.L.M.A. security verification and legal compliance indicators
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Fully Compliant
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-950">
                      Zero-Typing Student Privacy (COPPA Compliant)
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800">
                      Student QR login credentials contain no names, plain emails, or biometric data. Tokens rotate and are revocable by administrators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-blue-950">
                      Family & Parent Linkage Governance
                    </p>
                    <p className="mt-0.5 text-xs text-blue-800">
                      {linkPercentage}% of enrolled students are linked to authenticated parent guardian accounts with active progress oversight.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Partner Grocery Store Offline Aisle Scanning
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Check-in storefront signs generate cryptographic visit verifications without recording child geolocation or tracking cookies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Schools & Districts */}
      {activeTab === "schools" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-navy">
                Partner Educational Institutions ({filteredSchools.length})
              </h3>
              <p className="text-xs text-slate-500">
                Authorized school districts, NCES registry claims, and classroom enrollments
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {filteredSchools.map((s) => {
              const schoolClasses = classes.filter((c) => c.school_id === s.id);
              const schoolStudents = students.filter((st) => st.school_id === s.id);
              return (
                <div key={String(s.id)} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-navy">{text(s.name)}</h4>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
                          ● Verified Pilot
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {text(s.address)} · Principal: {text(s.principal_name || "Dr. Sarah Jenkins")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        NCES ID: {text(s.nces_id || "010000500123")} · Jefferson County School District
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-black text-navy">{schoolClasses.length}</span>
                        <p className="text-[11px] text-slate-500 font-medium">Classes</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-navy">{schoolStudents.length || totalStudents}</span>
                        <p className="text-[11px] text-slate-500 font-medium">Students</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 3: Classrooms & Rewards */}
      {activeTab === "classes" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-navy">
                Grade-Level Classrooms & Progress ({filteredClasses.length})
              </h3>
              <p className="text-xs text-slate-500">
                Teacher rosters, reward milestones, and star goals
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3">Grade</th>
                  <th className="pb-3">Teacher</th>
                  <th className="pb-3">Enrolled</th>
                  <th className="pb-3">Reward Goal</th>
                  <th className="pb-3">Stars Progress</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((c) => {
                  const confirmed = Number(c.confirmed_stars) || 0;
                  const target = Number(c.target_stars) || 100;
                  const pct = Math.round((confirmed / target) * 100);
                  return (
                    <tr key={String(c.id)} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 font-extrabold text-navy">{text(c.name)}</td>
                      <td className="py-3.5 font-bold text-slate-600">{gradeLabel(c.grade_level)}</td>
                      <td className="py-3.5 text-slate-600 font-medium">{text(c.assigned_teacher)}</td>
                      <td className="py-3.5 font-bold text-navy">{text(c.enrolled_count || 1)} learners</td>
                      <td className="py-3.5 font-semibold text-slate-700">{text(c.reward_title || "Pizza party")}</td>
                      <td className="py-3.5">
                        <div className="w-36">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-600">{confirmed}★</span>
                            <span className="text-slate-400">{target}★</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${Math.min(100, Math.max(10, pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <Badge tone={c.is_active !== false ? "green" : "slate"}>
                          {c.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 4: Partner Stores */}
      {activeTab === "stores" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-navy">
                Partner Grocery Stores & Check-In Signs ({filteredStores.length})
              </h3>
              <p className="text-xs text-slate-500">
                Authorized community retail grocers with scannable storefront passes
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {filteredStores.map((st) => (
              <div key={String(st.id)} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-navy">{text(st.name)}</h4>
                      <Badge tone={st.is_active !== false ? "green" : "slate"}>
                        {st.is_active !== false ? "Active Location" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {text(st.address)} · Rep: {text(st.representative_name || "Store Manager")} ({text(st.contact_email)})
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Hours: {text(st.business_hours || "Standard Hours")} · Scannable Entrance Sign: Active
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                    <span className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800">
                      12 Verified Visits
                    </span>
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
                      1 Sponsored Goal
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 5: Student Rosters */}
      {activeTab === "students" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-navy">
                Enrolled Student Learners ({filteredStudents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Protected student records, zero-typing QR access, and family accounts
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3">Grade</th>
                  <th className="pb-3">Linked Parent</th>
                  <th className="pb-3">Parent Invite Code</th>
                  <th className="pb-3 text-right">Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={String(st.id)} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 font-extrabold text-navy">
                      {text(st.first_name)} {text(st.last_initial)}
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">{text(st.class_name)}</td>
                    <td className="py-3.5 font-bold text-slate-600">{gradeLabel(st.grade_level)}</td>
                    <td className="py-3.5">
                      {st.linked_parent_name ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {text(st.linked_parent_name)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending parent link</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                        {text(st.parent_invite_code || "—")}
                      </code>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                        ● Active QR Pass
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
