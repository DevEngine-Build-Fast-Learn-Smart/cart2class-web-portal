"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Sparkles,
  Calendar,
  Clock,
  Store,
  School,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Link as LinkIcon,
  Check,
  Trash2,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNewMission } from "@/features/dashboard/mission-builder-actions";

type StoreItem = Record<string, any>;
type ClassItem = Record<string, any>;

export function CreateMissionModal({
  role = "teacher",
  stores = [],
  classes = [],
  triggerText = "Create New Mission",
  triggerClassName = "bg-navy text-white hover:bg-navy/90 font-bold",
  onCreated
}: {
  role?: "teacher" | "admin";
  stores: StoreItem[];
  classes: ClassItem[];
  triggerText?: string;
  triggerClassName?: string;
  onCreated?: (missionId: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [storeId, setStoreId] = useState(stores[0]?.id || "");
  const [gradeMin, setGradeMin] = useState(0);
  const [gradeMax, setGradeMax] = useState(2);
  const [estimatedMinutes, setEstimatedMinutes] = useState(12);
  const [stars, setStars] = useState(5);
  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">("immediate");
  const [opensAt, setOpensAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    classes.map((c) => c.id)
  );
  const [submitForReview, setSubmitForReview] = useState(role === "teacher");

  // Cover Image State
  const [coverSource, setCoverSource] = useState<"upload" | "url">("upload");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleOpen = () => {
    setTitle("");
    setDescription("");
    setStoreId(stores[0]?.id || "");
    setGradeMin(0);
    setGradeMax(2);
    setEstimatedMinutes(12);
    setStars(5);
    setScheduleType("immediate");
    setOpensAt("");
    setExpiresAt("");
    setSelectedClassIds(classes.map((c) => c.id));
    setSubmitForReview(role === "teacher");
    setCoverSource("upload");
    setCoverImageUrl("");
    setCoverFile(null);
    setCoverPreview(null);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const objectUrl = URL.createObjectURL(file);
      setCoverPreview(objectUrl);
    }
  };

  const clearCoverImage = () => {
    setCoverFile(null);
    setCoverImageUrl("");
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  const toggleClassId = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a mission title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("description", description.trim());
      formData.set("storeId", storeId);
      formData.set("gradeMin", String(gradeMin));
      formData.set("gradeMax", String(gradeMax));
      formData.set("estimatedMinutes", String(estimatedMinutes));
      formData.set("stars", String(stars));

      if (scheduleType === "scheduled" && opensAt) {
        formData.set("opensAt", opensAt);
      }
      if (expiresAt) {
        formData.set("expiresAt", expiresAt);
      }

      for (const cId of selectedClassIds) {
        formData.append("classIds", cId);
      }

      formData.set("submitForReview", String(submitForReview));

      if (coverSource === "upload" && coverFile) {
        formData.set("coverFile", coverFile);
      } else if (coverSource === "url" && coverImageUrl.trim()) {
        formData.set("coverImageUrl", coverImageUrl.trim());
      }

      const result = await createNewMission(formData);

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.missionId) {
        setIsOpen(false);
        if (onCreated) {
          onCreated(result.missionId);
        } else {
          router.push(`/${role}/missions?id=${result.missionId}`);
          router.refresh();
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred while creating the mission.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-2 ${triggerClassName}`}
      >
        <Plus className="h-4 w-4" />
        {triggerText}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-line flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-md shadow-blue-500/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-navy leading-tight">Create New Mission</h2>
                  <p className="text-xs text-muted">
                    Configure grocery learning goals, schedule start time, and assign classrooms.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl p-2 text-muted hover:bg-slate-200/70 hover:text-ink transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SECTION 1: Mission Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1">
                    Mission Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Fruit & Veggie Discovery, Breakfast Quest..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-slate-50 px-4 text-sm font-bold text-ink transition focus:border-brand focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-ink">
                    Mission Description & Objective
                  </label>
                  <textarea
                    rows={2}
                    placeholder="A little shopping, a lot of discovery! Find produce, scan barcodes, and read aloud..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-line bg-slate-50 p-3 text-sm font-medium text-ink transition focus:border-brand focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Clean Cover Image Dropzone / URL Component */}
              <div className="rounded-2xl border border-line bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-brand" /> Mission Cover Picture (Optional)
                  </label>
                  {/* Source Toggle */}
                  <div className="flex rounded-lg border border-line bg-white p-0.5 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCoverSource("upload")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                        coverSource === "upload"
                          ? "bg-navy text-white shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <Upload className="h-3 w-3" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverSource("url")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                        coverSource === "url"
                          ? "bg-navy text-white shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <LinkIcon className="h-3 w-3" /> Image URL
                    </button>
                  </div>
                </div>

                {coverSource === "upload" ? (
                  <div>
                    {coverPreview ? (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50/50 p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="h-14 w-14 rounded-xl object-cover border border-emerald-200 shadow-2xs"
                          />
                          <div>
                            <p className="text-xs font-bold text-ink truncate max-w-xs">
                              {coverFile?.name || "Uploaded image"}
                            </p>
                            <p className="text-[11px] text-muted">
                              {coverFile ? `${(coverFile.size / 1024).toFixed(1)} KB` : "Image ready"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={clearCoverImage}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-line hover:border-brand p-5 text-center cursor-pointer bg-white transition hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1.5"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="hidden"
                        />
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-brand">
                          <Upload className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-bold text-ink">
                          Click to browse or drop cover image here
                        </p>
                        <p className="text-[10px] text-muted">Supports PNG, JPG, or SVG up to 5MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="https://example.com/cover-image.png"
                      value={coverImageUrl}
                      onChange={(e) => {
                        setCoverImageUrl(e.target.value);
                        setCoverPreview(e.target.value || null);
                      }}
                      className="h-10 flex-1 rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                    />
                    {coverPreview && (
                      <div className="h-10 w-10 rounded-xl border border-line overflow-hidden bg-white grid place-items-center shrink-0">
                        <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Store & Duration & Stars */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-brand" /> Partner Store Location
                  </label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-slate-50 px-3 text-xs font-bold text-ink focus:border-brand focus:bg-white focus:outline-none"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand" /> Duration & Stars Reward
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="h-11 rounded-xl border border-line bg-slate-50 px-2.5 text-xs font-bold text-ink focus:border-brand focus:bg-white focus:outline-none"
                    >
                      <option value={8}>8 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={12}>12 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                    <select
                      value={stars}
                      onChange={(e) => setStars(Number(e.target.value))}
                      className="h-11 rounded-xl border border-line bg-slate-50 px-2.5 text-xs font-bold text-ink focus:border-brand focus:bg-white focus:outline-none"
                    >
                      <option value={3}>⭐ 3 Stars</option>
                      <option value={5}>⭐ 5 Stars</option>
                      <option value={10}>⭐ 10 Stars</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Grade Level Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-ink">
                  Target Grade Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Kindergarten (K)", min: 0, max: 0 },
                    { label: "1st Grade", min: 1, max: 1 },
                    { label: "2nd Grade", min: 2, max: 2 },
                    { label: "All K–2", min: 0, max: 2 }
                  ].map((g) => {
                    const isSelected = gradeMin === g.min && gradeMax === g.max;
                    return (
                      <button
                        type="button"
                        key={g.label}
                        onClick={() => {
                          setGradeMin(g.min);
                          setGradeMax(g.max);
                        }}
                        className={`rounded-xl py-2 px-3 text-xs font-black transition border ${
                          isSelected
                            ? "bg-navy text-white border-navy shadow-xs"
                            : "bg-slate-50 text-muted hover:bg-slate-100 border-line"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: Mission Schedule (Start Time & Upcoming Support) */}
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-cyan-700" /> Mission Start Time & Schedule
                  </label>
                  <div className="flex rounded-lg border border-cyan-300 bg-white p-0.5 text-xs font-bold">
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

                {scheduleType === "scheduled" ? (
                  <div className="grid gap-3 sm:grid-cols-2 pt-1">
                    <div>
                      <span className="block text-[11px] font-bold text-muted mb-1">
                        Opens At (Start Date & Time):
                      </span>
                      <input
                        type="datetime-local"
                        required={scheduleType === "scheduled"}
                        value={opensAt}
                        onChange={(e) => setOpensAt(e.target.value)}
                        className="h-10 w-full rounded-xl border border-cyan-300 bg-white px-3 text-xs font-bold text-ink focus:border-cyan-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-muted mb-1">
                        Due / Expires At (Optional):
                      </span>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="h-10 w-full rounded-xl border border-cyan-300 bg-white px-3 text-xs font-bold text-ink focus:border-cyan-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted leading-relaxed">
                    Students will have instant access to save and play this mission upon opening their tablet app.
                  </p>
                )}

                <div className="rounded-xl bg-white/80 p-3 border border-cyan-200 flex items-start gap-2">
                  <span className="text-sm">💡</span>
                  <p className="text-[11px] text-cyan-900 leading-normal font-medium">
                    <strong>Upcoming Missions Support:</strong> When scheduled for a future date/time, students in assigned classrooms will see this mission on their mobile home screen with an upcoming countdown card.
                  </p>
                </div>
              </div>

              {/* SECTION 6: Classroom Access Checkboxes */}
              <div className="rounded-2xl border border-line bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-brand" /> Which Students / Classrooms Get Access?
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAllClasses}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    {selectedClassIds.length === classes.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 pt-1 max-h-36 overflow-y-auto">
                  {classes.map((c) => {
                    const isChecked = selectedClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        onClick={() => toggleClassId(c.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs font-bold transition ${
                          isChecked
                            ? "bg-blue-50/90 border-brand text-brand shadow-2xs"
                            : "bg-white border-line text-muted hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-line text-brand focus:ring-brand"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 7: Admin Review Workflow */}
              {role === "teacher" && (
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <ClipboardCheck className="h-4 w-4 text-amber-700" />
                    <span>Teacher Workflow: Administrative Approval Required</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    New teacher missions are created as drafts. Once you finish configuring your questions and media, submit the mission for administrative review. After an administrator approves it, the mission is published and becomes active for students in partner stores.
                  </p>
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={submitForReview}
                      onChange={(e) => setSubmitForReview(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-400 text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-bold text-ink">
                      Submit for Admin Review immediately (you can still add & edit questions anytime in the builder)
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="border-t pt-4 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={handleClose}
                  className="font-bold border-line"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-navy hover:bg-navy/90 text-white font-bold px-6 h-11 rounded-xl shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Mission...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Create & Open Builder
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
