"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users,
  Check,
  Search,
  School,
  X,
  Loader2,
  GraduationCap,
  Sparkles,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateMissionStudentAccess } from "./mission-library-actions";

type StudentItem = Record<string, any>;
type ClassItem = Record<string, any>;
type MissionItem = Record<string, any>;

export function ManageStudentAccessModal({
  isOpen,
  onClose,
  mission,
  students = [],
  classes = [],
  currentAssignedStudentIds = [],
  onSaved
}: {
  isOpen: boolean;
  onClose: () => void;
  mission: MissionItem | null;
  students: StudentItem[];
  classes: ClassItem[];
  currentAssignedStudentIds?: string[];
  onSaved?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // If currentAssignedStudentIds is empty, it means either none or all.
  // We initialize mode: if specific student IDs were saved, mode is "specific".
  const initialMode = (currentAssignedStudentIds && currentAssignedStudentIds.length > 0) ? "specific" : "all";
  const [accessMode, setAccessMode] = useState<"all" | "specific">(initialMode);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentAssignedStudentIds && currentAssignedStudentIds.length > 0
      ? currentAssignedStudentIds
      : students.map((s) => s.id)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Map classes by id for quick lookup
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) {
      map.set(c.id, c.name);
    }
    return map;
  }, [classes]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_initial || ""}`.toLowerCase();
      const matchesSearch = !search.trim() || fullName.includes(search.toLowerCase().trim());
      const matchesClass = selectedClassId === "all" || s.class_id === selectedClassId;
      return matchesSearch && matchesClass;
    });
  }, [students, search, selectedClassId]);

  if (!isOpen || !mission) return null;

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(students.map((s) => s.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleSave = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("missionId", mission.id);

      if (accessMode === "all") {
        formData.set("allStudents", "true");
      } else {
        formData.set("allStudents", "false");
        for (const id of selectedIds) {
          formData.append("studentIds", id);
        }
      }

      const res = await updateMissionStudentAccess(formData);
      if (res?.error) {
        setStatusMessage(`Error: ${res.error}`);
      } else {
        setStatusMessage("Student access updated successfully!");
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 600);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl border border-line bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-purple-50/80">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-navy">Manage Student Access</h2>
                <span className="rounded-full bg-blue-100 text-brand px-2.5 py-0.5 text-xs font-extrabold">
                  Mission #{mission.mission_number ?? 1}
                </span>
              </div>
              <p className="text-xs text-muted font-bold mt-0.5 truncate max-w-md">
                {mission.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-slate-100 hover:text-ink transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Access Scope Options */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> Access Policy for this Mission
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label
                onClick={() => setAccessMode("all")}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                  accessMode === "all"
                    ? "bg-blue-50/90 border-brand shadow-xs ring-2 ring-brand/20"
                    : "bg-white border-line hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === "all"}
                  onChange={() => setAccessMode("all")}
                  className="mt-1 text-brand focus:ring-brand"
                />
                <div>
                  <p className="text-sm font-extrabold text-navy">All Classroom Students</p>
                  <p className="text-xs text-muted leading-relaxed mt-0.5">
                    Every student in assigned classrooms can join and play this mission.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setAccessMode("specific")}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                  accessMode === "specific"
                    ? "bg-purple-50/90 border-purple-500 shadow-xs ring-2 ring-purple-500/20"
                    : "bg-white border-line hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === "specific"}
                  onChange={() => setAccessMode("specific")}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="text-sm font-extrabold text-purple-950">Select Specific Students</p>
                  <p className="text-xs text-muted leading-relaxed mt-0.5">
                    Only students checked below can access and launch this mission.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Student Selector Section */}
          <div className="rounded-2xl border border-line bg-slate-50/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-brand" /> Student Roster ({students.length} Total)
                </span>
                {accessMode === "specific" && (
                  <span className="rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-[11px] font-extrabold">
                    {selectedIds.length} Selected
                  </span>
                )}
              </div>

              {accessMode === "specific" && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="font-bold text-brand hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="font-bold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search student by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs font-bold text-navy placeholder:text-muted focus:border-brand focus:outline-none"
                />
              </div>

              <div className="relative">
                <School className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-9 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs font-bold text-navy focus:border-brand focus:outline-none"
                >
                  <option value="all">All Classrooms</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students List */}
            <div className="grid gap-2 sm:grid-cols-2 pt-2 max-h-64 overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs font-bold text-muted">
                  No students found matching your search.
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isChecked = accessMode === "all" || selectedIds.includes(s.id);
                  const className = s.class_id ? classMap.get(s.class_id) || "Class" : "General";
                  const initial = s.first_name ? s.first_name[0].toUpperCase() : "S";

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (accessMode === "specific") toggleStudent(s.id);
                      }}
                      className={`flex items-center justify-between rounded-xl border p-2.5 transition select-none ${
                        accessMode === "specific" ? "cursor-pointer" : "opacity-90"
                      } ${
                        isChecked
                          ? "bg-white border-brand shadow-2xs"
                          : "bg-slate-100/60 border-line text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {s.avatar_url ? (
                          <img
                            src={s.avatar_url}
                            alt={s.first_name}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-brand to-teal-400 text-xs font-black text-white shadow-2xs">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-navy truncate">
                            {s.first_name} {s.last_initial ? `${s.last_initial}.` : ""}
                          </p>
                          <p className="text-[10px] font-bold text-muted truncate">
                            {className} · Grade {s.grade_level === 0 ? "K" : s.grade_level || 1}
                          </p>
                        </div>
                      </div>

                      <div className="pl-2 shrink-0">
                        <div
                          className={`grid h-5 w-5 place-items-center rounded-md border transition ${
                            isChecked
                              ? "bg-brand border-brand text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {accessMode === "all" && (
              <p className="text-[11px] font-bold text-slate-500 italic pt-1">
                ℹ️ Currently set to &quot;All Students&quot; — every student shown above is enabled. Switch to &quot;Select Specific Students&quot; to pick individual learners.
              </p>
            )}
          </div>

          {statusMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-bold text-center ${
                statusMessage.startsWith("Error")
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t bg-slate-50/80 px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={isPending} className="font-bold text-xs">
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || (accessMode === "specific" && selectedIds.length === 0)}
            className="bg-navy hover:bg-navy-lighter text-white font-extrabold text-xs h-10 px-5 shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Access...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Student Access
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
