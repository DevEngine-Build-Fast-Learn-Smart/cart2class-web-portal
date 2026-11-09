"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateMissionSchedule } from "@/features/dashboard/mission-builder-actions";

type Row = Record<string, any>;

export function EditMissionScheduleModal({
  mission,
  isOpen,
  onClose,
  triggerText,
  triggerClassName,
}: {
  mission: Row;
  isOpen?: boolean;
  onClose?: () => void;
  triggerText?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalOpen(val);
  };

  const currentOpensAt = mission.opens_at ? new Date(mission.opens_at) : null;
  const currentExpiresAt = mission.expires_at ? new Date(mission.expires_at) : null;

  // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (d: Date | null) => {
    if (!d || isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const isInitiallyScheduled = !!currentOpensAt && currentOpensAt > new Date();
  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">(
    isInitiallyScheduled ? "scheduled" : "immediate"
  );
  const [opensAt, setOpensAt] = useState(formatForInput(currentOpensAt));
  const [expiresAt, setExpiresAt] = useState(formatForInput(currentExpiresAt));
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    Number(mission.estimated_minutes || 12)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpen = () => {
    const o = mission.opens_at ? new Date(mission.opens_at) : null;
    const e = mission.expires_at ? new Date(mission.expires_at) : null;
    const sched = !!o && o > new Date();
    setScheduleType(sched ? "scheduled" : "immediate");
    setOpensAt(formatForInput(o));
    setExpiresAt(formatForInput(e));
    setEstimatedMinutes(Number(mission.estimated_minutes || 12));
    setErrorMsg(null);
    setSuccessMsg(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const fd = new FormData();
      fd.append("missionId", mission.id);
      fd.append("scheduleType", scheduleType);
      fd.append("opensAt", opensAt);
      fd.append("expiresAt", expiresAt);
      fd.append("estimatedMinutes", String(estimatedMinutes));

      const res = await updateMissionSchedule(fd);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Mission schedule & time updated successfully!");
        setTimeout(() => {
          setOpen(false);
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {triggerText && (
        <Button
          type="button"
          onClick={handleOpen}
          className={triggerClassName || "font-bold border-cyan-300 bg-cyan-50/90 hover:bg-cyan-100 text-cyan-900 h-10 px-3.5 text-xs shadow-2xs"}
        >
          <Calendar className="mr-1.5 h-4 w-4 text-cyan-700" />
          <span>{triggerText}</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-line space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-100 text-cyan-800">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-navy">Change Mission Schedule & Time</h2>
                  <p className="text-xs font-bold text-muted line-clamp-1">{mission.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-slate-100 hover:text-navy transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Schedule Type Toggle */}
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-700" /> Schedule Mode
                  </label>
                  <div className="flex rounded-lg border border-cyan-300 bg-white p-0.5 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setScheduleType("immediate")}
                      className={`rounded-md px-3 py-1 transition ${
                        scheduleType === "immediate"
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Start Immediately
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("scheduled")}
                      className={`rounded-md px-3 py-1 transition ${
                        scheduleType === "scheduled"
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Schedule Upcoming
                    </button>
                  </div>
                </div>

                {scheduleType === "immediate" ? (
                  <p className="text-xs font-medium text-cyan-900 bg-cyan-100/70 p-2.5 rounded-xl border border-cyan-200">
                    Students will have active access immediately once published. No countdown timer will be required.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-950 mb-1">
                        Opens At (Start Date & Time):
                      </label>
                      <input
                        type="datetime-local"
                        required={scheduleType === "scheduled"}
                        value={opensAt}
                        onChange={(e) => setOpensAt(e.target.value)}
                        className="h-10 w-full rounded-xl border border-cyan-300 bg-white px-3 text-xs font-bold text-ink focus:border-cyan-600 focus:outline-none"
                      />
                      <p className="text-[10px] text-cyan-800 mt-1">
                        Students will see this mission locked with a live countdown timer until this exact date & time.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cyan-950 mb-1">
                        Due / Expires At (Optional):
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="h-10 w-full rounded-xl border border-cyan-300 bg-white px-3 text-xs font-bold text-ink focus:border-cyan-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Duration / Estimated Minutes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand" /> Estimated Duration
                </label>
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-line bg-slate-50 px-3 text-xs font-bold text-ink focus:border-brand focus:bg-white focus:outline-none"
                >
                  <option value={8}>8 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={12}>12 minutes</option>
                  <option value={14}>14 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={25}>25 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold h-10 px-5 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Schedule…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
