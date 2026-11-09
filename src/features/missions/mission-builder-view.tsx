"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  BookOpen,
  Calculator,
  Trash2,
  Eye,
  Send,
  Upload,
  ArrowRight,
  ArrowLeft,
  X,
  FileAudio,
  FileImage,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mic,
  Check,
  Sparkles,
  Star,
  RotateCcw,
  Play,
  Square,
  Award,
  Barcode as BarcodeIcon,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Copy,
  ExternalLink,
  LayoutGrid,
  ListFilter,
  Search,
  Music,
  FolderCheck,
  Clock,
  MessageSquare,
  CheckCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/ui/audio-player";
import { BarcodeExportButton } from "@/components/shared/code-export";
import { OptionPictureManager } from "./option-picture-manager";
import { CreateMissionModal } from "./create-mission-modal";
import {
  saveStage1Question,
  deleteStage1Question,
  saveStage2Product,
  deleteStage2Product,
  saveStage3Reading,
  saveStage4Math,
  deleteStage4Math,
  uploadMissionAsset
} from "@/features/dashboard/mission-builder-actions";
import { submitMission, reviewMission } from "@/features/dashboard/workflow-actions";

type Row = Record<string, any>;

export function MissionBuilderView({
  mission,
  stages,
  questionsByStage,
  products,
  assets,
  stores,
  allMissions = [],
  classes = [],
  reviews = [],
  role = "teacher"
}: {
  mission: Row;
  stages: Row[];
  questionsByStage: Record<string, Row[]>;
  products: Row[];
  assets: Row[];
  stores: Row[];
  allMissions?: Row[];
  classes?: Row[];
  reviews?: Row[];
  role?: "teacher" | "admin";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stage1" | "stage2" | "stage3" | "stage4" | "media" | "preview">("stage1");
  const [previewStage, setPreviewStage] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Row | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Row | null>(null);

  const [productList, setProductList] = useState<Row[]>(products);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [stage2Toast, setStage2Toast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Interactive Student Preview State
  const [soundQIndex, setSoundQIndex] = useState(0);
  const [soundAnswer, setSoundAnswer] = useState<string | null>(null);
  const [soundFeedback, setSoundFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [soundHintVisible, setSoundHintVisible] = useState(false);

  const [productIdx, setProductIdx] = useState(0);
  const [productScanned, setProductScanned] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(false);

  const [mathQIndex, setMathQIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState<string | null>(null);
  const [mathFeedback, setMathFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [mathHintVisible, setMathHintVisible] = useState(false);

  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [isRecordingSim, setIsRecordingSim] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingRecorded, setRecordingRecorded] = useState(false);

  // Media Library state & filters
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaStageFilter, setMediaStageFilter] = useState<string>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "image" | "audio">("all");
  const [mediaViewMode, setMediaViewMode] = useState<"grid" | "table">("grid");
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [uploadSelectedFile, setUploadSelectedFile] = useState<File | null>(null);
  const [uploadStageKey, setUploadStageKey] = useState<string>("phonemic_awareness");
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Admin Review & Teacher Submission state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectFeedbackText, setRejectFeedbackText] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewAlert, setReviewAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const latestReview = reviews.find((r) => r.mission_id === mission.id) || reviews[0];

  const handleAdminApprove = async () => {
    setIsReviewSubmitting(true);
    setReviewAlert(null);
    try {
      const fd = new FormData();
      fd.append("missionId", mission.id);
      fd.append("decision", "approved");
      const res = await reviewMission(fd);
      if (res?.error) {
        setReviewAlert({ type: "error", message: res.error });
      } else {
        setReviewAlert({
          type: "success",
          message: `Mission "${mission.title}" approved & published! Students now have active access in stores.`
        });
        router.refresh();
      }
    } catch (err: any) {
      setReviewAlert({ type: "error", message: err.message || "Failed to approve mission." });
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleAdminReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewSubmitting(true);
    setReviewAlert(null);
    try {
      const fd = new FormData();
      fd.append("missionId", mission.id);
      fd.append("decision", "rejected");
      fd.append("feedback", rejectFeedbackText.trim());
      const res = await reviewMission(fd);
      if (res?.error) {
        setReviewAlert({ type: "error", message: res.error });
      } else {
        setReviewAlert({
          type: "success",
          message: `Mission marked as Rejected with feedback. It is unpublished and inaccessible to students.`
        });
        setShowRejectDialog(false);
        setRejectFeedbackText("");
        router.refresh();
      }
    } catch (err: any) {
      setReviewAlert({ type: "error", message: err.message || "Failed to reject mission." });
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleTeacherSubmit = async () => {
    setIsReviewSubmitting(true);
    setReviewAlert(null);
    try {
      const fd = new FormData();
      fd.append("missionId", mission.id);
      const res = await submitMission(fd);
      if (res?.error) {
        setReviewAlert({ type: "error", message: res.error });
      } else {
        setReviewAlert({
          type: "success",
          message: `Mission submitted for administrative review! Awaiting admin approval.`
        });
        router.refresh();
      }
    } catch (err: any) {
      setReviewAlert({ type: "error", message: err.message || "Failed to submit mission." });
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const copyAssetInfo = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAssetId(id);
    setTimeout(() => {
      setCopiedAssetId(null);
    }, 2000);
  };

  const getCleanName = (a: Row) => {
    const raw = a.file_name || a.asset_path || "asset";
    const segments = raw.split("/");
    const lastSegment = segments[segments.length - 1] || raw;
    return lastSegment.replace(/^\d+_/, "");
  };

  const getStageTone = (stageKey?: string): "blue" | "green" | "amber" | "purple" | "slate" => {
    switch (stageKey) {
      case "phonemic_awareness":
        return "blue";
      case "phonics":
        return "green";
      case "fluency":
        return "amber";
      case "math":
        return "purple";
      default:
        return "slate";
    }
  };

  const getStageLabel = (stageKey?: string) => {
    switch (stageKey) {
      case "phonemic_awareness":
        return "Stage 1: Sounds";
      case "phonics":
        return "Stage 2: Products";
      case "fluency":
        return "Stage 3: Fluency";
      case "math":
        return "Stage 4: Math";
      default:
        return "General";
    }
  };

  useEffect(() => {
    setProductList(products);
  }, [products]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("preview") === "true" || urlParams.get("tab") === "preview") {
        startPreview();
      }
    }
  }, []);

  const resolveProductImg = (asset: string | null | undefined): string | null => {
    if (!asset || typeof asset !== "string") return null;
    const trimmed = asset.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("assets/")) return `/${trimmed}`;
    return trimmed;
  };

  const stage1 = stages.find((s) => s.stage_key === "phonemic_awareness") || stages[0];
  const stage2 = stages.find((s) => s.stage_key === "phonics") || stages[1];
  const stage3 = stages.find((s) => s.stage_key === "fluency") || stages[2];
  const stage4 = stages.find((s) => s.stage_key === "math") || stages[3];

  const stage1Questions = stage1 ? questionsByStage[stage1.id] || [] : [];
  const stage4Questions = stage4 ? questionsByStage[stage4.id] || [] : [];

  // SpeechSynthesis TTS helper
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.onend = () => setIsReadingAloud(false);
      utterance.onerror = () => setIsReadingAloud(false);
      setIsReadingAloud(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
    }
  };

  const startPreview = () => {
    stopSpeaking();
    setPreviewStage(0);
    setSoundQIndex(0);
    setSoundAnswer(null);
    setSoundFeedback(null);
    setSoundHintVisible(false);
    setProductIdx(0);
    setProductScanned(false);
    setMathQIndex(0);
    setMathAnswer(null);
    setMathFeedback(null);
    setMathHintVisible(false);
    setIsRecordingSim(false);
    setRecordingRecorded(false);
    setActiveTab("preview");
  };

  const handleSimulateScan = () => {
    setScanAnimation(true);
    setTimeout(() => {
      setScanAnimation(false);
      setProductScanned(true);
    }, 500);
  };

  const handleSimulateRecording = () => {
    if (isRecordingSim) return;
    setIsRecordingSim(true);
    setRecordingSeconds(1);
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsRecordingSim(false);
          setRecordingRecorded(true);
          return 4;
        }
        return prev + 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${role}/library`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shared Mission Library
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-navy">{mission.title}</h1>
              <Badge
                tone={
                  mission.status === "published"
                    ? "green"
                    : mission.sharing_status === "rejected"
                    ? "rose"
                    : mission.sharing_status === "submitted"
                    ? "amber"
                    : "blue"
                }
              >
                {mission.status === "published"
                  ? "Active / Published"
                  : mission.sharing_status === "rejected"
                  ? "Rejected"
                  : mission.sharing_status === "submitted"
                  ? "Awaiting Admin Review"
                  : "Draft Mode"}
              </Badge>
              {allMissions.length > 1 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs font-bold text-muted">Switch:</span>
                  <select
                    value={mission.id}
                    onChange={(e) => router.push(`/${role}/missions?id=${e.target.value}`)}
                    className="h-8 rounded-lg border border-line bg-slate-50 px-2 text-xs font-bold text-navy focus:border-brand focus:outline-none"
                  >
                    {allMissions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} (#{m.mission_number || 1})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-sm text-muted">
              Mission #{mission.mission_number || 4} · Grades {mission.grade_min}–{mission.grade_max} · {mission.estimated_minutes || 12} mins · {mission.stars || 5} Stars
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CreateMissionModal
              role={role}
              stores={stores}
              classes={classes}
              triggerText="Create New Mission"
              triggerClassName="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 text-xs shadow-xs"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={startPreview}
              className="font-bold border-brand text-brand h-10"
            >
              <Eye className="mr-2 h-4 w-4" /> Student Mission Preview
            </Button>

            {/* Admin Review Controls */}
            {role === "admin" && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleAdminApprove}
                  disabled={isReviewSubmitting || mission.status === "published"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-3.5 text-xs shadow-xs disabled:opacity-60"
                >
                  {isReviewSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                  {mission.status === "published" ? "Approved & Live" : "Approve & Publish"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isReviewSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-3.5 text-xs shadow-xs"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Reject with Feedback
                </Button>
              </div>
            )}

            {/* Teacher Workflow Actions */}
            {role === "teacher" && (
              <>
                {mission.status === "published" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> Live in Stores
                  </span>
                ) : mission.sharing_status === "submitted" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                    <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> Awaiting Admin Approval
                  </span>
                ) : (
                  <Button
                    type="button"
                    onClick={handleTeacherSubmit}
                    disabled={isReviewSubmitting}
                    className="bg-navy hover:bg-navy-lighter text-white font-bold h-10 px-4 text-xs shadow-xs"
                  >
                    {isReviewSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                    {mission.sharing_status === "rejected" ? "Resubmit for Review" : "Submit for Admin Review"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Notification / Alert */}
      {reviewAlert && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-bold ${
            reviewAlert.type === "success"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {reviewAlert.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{reviewAlert.message}</span>
          </div>
          <button
            onClick={() => setReviewAlert(null)}
            className="text-muted hover:text-ink transition ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Rejection Banner with Admin Feedback */}
      {mission.sharing_status === "rejected" && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/80 p-5 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-rose-900 font-extrabold text-sm">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>Admin Review: Changes Requested (Not Published)</span>
            </div>
            <Badge tone="rose">Rejected</Badge>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            This mission was reviewed by an administrator and is currently unpublished. Students cannot access it on their tablets until revisions are made and approved.
            {latestReview?.feedback ? " Administrator review feedback is provided below:" : " Please review your mission questions and resubmit when ready."}
          </p>
          {latestReview?.feedback && (
            <div className="rounded-xl border border-rose-200 bg-white p-4 text-xs text-ink space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Administrator Review Feedback:</span>
              </div>
              <p className="italic text-slate-800 whitespace-pre-wrap pl-4 border-l-2 border-rose-500 font-medium">
                &ldquo;{latestReview.feedback}&rdquo;
              </p>
            </div>
          )}
          {role === "teacher" && (
            <div className="pt-1 flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={handleTeacherSubmit}
                disabled={isReviewSubmitting}
                className="bg-navy hover:bg-navy-lighter text-white font-bold h-9 px-4 text-xs"
              >
                {isReviewSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                Resubmit for Admin Review
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Awaiting Review Banner */}
      {mission.sharing_status === "submitted" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">
                Mission Submitted · Awaiting Administrator Approval
              </h4>
              <p className="text-xs text-amber-850 mt-0.5">
                Students cannot access this mission until an administrator reviews and approves it.
              </p>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAdminApprove}
                disabled={isReviewSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 text-xs"
              >
                {isReviewSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                Approve & Publish
              </Button>
              <Button
                type="button"
                onClick={() => setShowRejectDialog(true)}
                disabled={isReviewSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 px-4 text-xs"
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> Reject with Feedback
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Published Status Banner */}
      {mission.status === "published" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-950">
              Live & Published: This mission is approved. Students in assigned classrooms have active access on their tablets in partner stores.
            </span>
          </div>
          <Badge tone="green">Active in Stores</Badge>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-1">
        <button
          onClick={() => setActiveTab("stage1")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition ${
            activeTab === "stage1" ? "border-b-2 border-brand bg-blue-50 text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <Volume2 className="h-4 w-4" /> Stage 1: Sounds ({stage1Questions.length})
        </button>
        <button
          onClick={() => setActiveTab("stage2")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition ${
            activeTab === "stage2" ? "border-b-2 border-brand bg-blue-50 text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <ShoppingBag className="h-4 w-4" /> Stage 2: Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("stage3")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition ${
            activeTab === "stage3" ? "border-b-2 border-brand bg-blue-50 text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Stage 3: Reading
        </button>
        <button
          onClick={() => setActiveTab("stage4")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition ${
            activeTab === "stage4" ? "border-b-2 border-brand bg-blue-50 text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <Calculator className="h-4 w-4" /> Stage 4: Math ({stage4Questions.length})
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition ${
            activeTab === "media" ? "border-b-2 border-brand bg-blue-50 text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <Upload className="h-4 w-4" /> Media Library ({assets.length})
        </button>
      </div>

      {/* STAGE 1: SOUNDS */}
      {activeTab === "stage1" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-navy">Stage 1 — Phonemic Awareness & Sounds</h3>
            <p className="text-sm text-muted">Create questions that test initial sounds, phonics, and spoken word prompts.</p>
          </div>

          <form action={async (fd) => { await saveStage1Question(fd); }} className="panel p-5 bg-slate-50 border space-y-4">
            <h4 className="font-extrabold text-ink">Add / Edit Sound Question</h4>
            <input type="hidden" name="missionId" value={mission.id} />
            <input type="hidden" name="stageId" value={stage1?.id || ""} />
            <input type="hidden" name="questionId" value={selectedQuestion?.id || ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">
                Question Prompt (Written)
                <input
                  required
                  name="prompt"
                  defaultValue={selectedQuestion?.prompt_text || "Which one starts with /b/?"}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold">
                Spoken Prompt (Read Aloud by TTS or Recording)
                <input
                  name="spoken"
                  defaultValue={selectedQuestion?.spoken_prompt || "Which word begins with the sound buh?"}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold md:col-span-2">
                Hint
                <input
                  name="hint"
                  defaultValue={selectedQuestion?.hint_text || "Listen: buh, buh, banana."}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>

              {/* Dynamic Option Pictures */}
              <OptionPictureManager
                key={`s1-${selectedQuestion?.id || "new"}`}
                initialOptions={selectedQuestion?.answer_config?.options || ["banana", "apple", "carrot", "milk"]}
                initialOptionImages={selectedQuestion?.answer_config?.optionImages || {}}
                initialCorrect={selectedQuestion?.answer_config?.correct || "banana"}
                mediaAssets={assets}
                missionId={mission.id}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-navy text-white font-bold">
                {selectedQuestion ? "Update Question" : "Add Question"}
              </Button>
              {selectedQuestion && (
                <Button type="button" variant="secondary" onClick={() => setSelectedQuestion(null)}>
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Questions list */}
          <div className="space-y-3">
            {stage1Questions.map((q, idx) => (
              <div key={q.id} className="panel p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <span className="text-xs font-bold text-brand uppercase">Question #{idx + 1}</span>
                  <h5 className="font-extrabold text-ink">{q.prompt_text}</h5>
                  <p className="text-xs text-muted">Spoken: &ldquo;{q.spoken_prompt}&rdquo;</p>
                  <p className="text-xs text-muted mt-1">
                    Options: {q.answer_config?.options?.join(", ")} · Correct: <span className="font-bold text-green-700">{q.answer_config?.correct}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelectedQuestion(q)} className="h-8 px-2 text-xs">Edit</Button>
                  <form action={async (fd) => { await deleteStage1Question(fd); }}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="missionId" value={mission.id} />
                    <Button variant="ghost" className="h-8 px-2 text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 2: PRODUCTS */}
      {activeTab === "stage2" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-navy">Stage 2 — Grocery Products & Barcode Scanning</h3>
            <p className="text-sm text-muted">Configure scannable produce and package items for student discovery in the aisles.</p>
          </div>

          {stage2Toast && (
            <div
              className={`flex items-center gap-2 rounded-xl p-4 text-sm font-bold border ${
                stage2Toast.type === "success"
                  ? "bg-teal-50 border-teal-200 text-teal-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {stage2Toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span>{stage2Toast.message}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingProduct(true);
              setStage2Toast(null);
              try {
                const fd = new FormData(e.currentTarget);
                const res = await saveStage2Product(fd);
                if (res?.error) {
                  setStage2Toast({ type: "error", message: res.error });
                } else {
                  setStage2Toast({
                    type: "success",
                    message: selectedProduct
                      ? "Product updated successfully with picture!"
                      : "Product added successfully with picture!"
                  });
                  if (res?.product) {
                    setProductList((prev) => {
                      const idx = prev.findIndex((item) => item.id === res.product.id);
                      if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = res.product;
                        return updated;
                      }
                      return [...prev, res.product];
                    });
                  }
                  setSelectedProduct(null);
                  setProductImagePreview(null);
                  (e.target as HTMLFormElement).reset();
                  router.refresh();
                }
              } catch (err: any) {
                setStage2Toast({ type: "error", message: err.message || "Failed to save product." });
              } finally {
                setIsSubmittingProduct(false);
              }
            }}
            className="panel p-5 bg-slate-50 border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-ink">
                {selectedProduct ? `Edit Product: ${selectedProduct.name}` : "Add New Mission Product"}
              </h4>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductImagePreview(null);
                  }}
                  className="text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <input type="hidden" name="missionId" value={mission.id} />
            <input type="hidden" name="productId" value={selectedProduct?.id || ""} />

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-bold">
                Product Name
                <input
                  required
                  name="name"
                  key={`name-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct?.name || ""}
                  placeholder="e.g. Fresh Sweet Corn"
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold">
                Barcode (UPC / EAN / Code128)
                <input
                  required
                  name="barcode"
                  key={`barcode-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct?.barcode || ""}
                  placeholder="e.g. 012345678905 or C2CAPPLE001"
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal font-mono"
                />
              </label>
              <label className="text-sm font-bold">
                Price ($ USD)
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  key={`price-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct ? selectedProduct.price_cents / 100 : 1.0}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold">
                Weight in Grams
                <input
                  type="number"
                  name="weightGrams"
                  key={`weight-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct?.weight_grams || 500}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold">
                Package Size / Unit
                <input
                  name="packageSize"
                  key={`pkg-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct?.package_size || "1 each"}
                  placeholder="e.g. 2 for $1 or 1 lb bag"
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>

              {/* Product Picture upload & link section */}
              <div className="text-sm font-bold md:col-span-3 panel bg-white p-4 rounded-xl border space-y-3">
                <span className="block text-xs font-bold uppercase text-muted">
                  Product Picture (Upload File or Enter Image Link)
                </span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Live Preview Box */}
                  <div className="h-20 w-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                    {productImagePreview || selectedProduct?.image_asset ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveProductImg(productImagePreview || selectedProduct?.image_asset) || ""}
                        alt="Product Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                          const fb = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fb) fb.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`grid h-full w-full place-items-center text-slate-300 ${
                        productImagePreview || selectedProduct?.image_asset ? "hidden" : ""
                      }`}
                    >
                      <ShoppingBag className="h-7 w-7 text-slate-300" />
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="grid gap-3 sm:grid-cols-2 flex-1 w-full">
                    <label className="text-xs font-normal">
                      <span className="font-bold text-ink block mb-1">Upload Local Image (Max 5MB)</span>
                      <input
                        type="file"
                        name="productFile"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("File size exceeds 5MB limit. Please choose a smaller image.");
                              e.target.value = "";
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setProductImagePreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs font-normal file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-brand hover:file:bg-blue-100"
                      />
                    </label>
                    <label className="text-xs font-normal">
                      <span className="font-bold text-ink block mb-1">Or Image Link / Asset Path</span>
                      <input
                        name="imageAsset"
                        placeholder="e.g. assets/images/corn.svg or https://..."
                        key={`asset-${selectedProduct?.id || "new"}`}
                        defaultValue={selectedProduct?.image_asset || "assets/images/corn.svg"}
                        onChange={(e) => setProductImagePreview(e.target.value)}
                        className="block h-9 w-full rounded-lg border bg-slate-50 px-3 text-xs font-normal"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <label className="text-sm font-bold md:col-span-3">
                Instructions for Student
                <input
                  name="instructions"
                  key={`instr-${selectedProduct?.id || "new"}`}
                  defaultValue={selectedProduct?.instructions || "Find fresh sweet corn in produce and scan the barcode sticker."}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmittingProduct} className="bg-navy text-white font-bold">
                {isSubmittingProduct ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : selectedProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </Button>
              {selectedProduct && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductImagePreview(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Products grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {productList.map((p) => {
              const imgSrc = resolveProductImg(p.image_asset);
              return (
                <div key={p.id} className="panel p-5 flex flex-col justify-between bg-white border hover:shadow-sm transition">
                  <div className="flex items-start gap-4">
                    {/* Product Image Thumbnail */}
                    <div className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center p-1.5">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            const fb = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fb) fb.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`grid h-full w-full place-items-center bg-blue-50/50 text-slate-300 ${
                          imgSrc ? "hidden" : ""
                        }`}
                      >
                        <ShoppingBag className="h-8 w-8 text-brand/40" />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                        Barcode: {p.barcode}
                      </span>
                      <h5 className="font-extrabold text-ink text-base capitalize truncate mt-0.5">{p.name}</h5>
                      <p className="text-sm font-bold text-brand mt-1">
                        ${(p.price_cents / 100).toFixed(2)} · {p.weight_grams}g · {p.package_size}
                      </p>
                      <p className="text-xs text-muted mt-1.5 line-clamp-2">
                        {p.instructions || "Scan to match item."}
                      </p>
                    </div>
                  </div>

                  {/* Scannable Barcode Label & Download */}
                  {p.barcode ? (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-bold text-muted mb-2">Scannable Barcode Label (Scan with App):</p>
                      <BarcodeExportButton
                        value={p.barcode}
                        label={p.name}
                        subtitle={`Code128 · ${(p.price_cents / 100).toFixed(2)} USD`}
                        symbology="CODE128"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSelectedProduct(p);
                        setProductImagePreview(p.image_asset || null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="h-8 px-3 text-xs font-bold"
                    >
                      Edit Product
                    </Button>
                    <form
                      action={async (fd) => {
                        if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                          await deleteStage2Product(fd);
                          setProductList((prev) => prev.filter((item) => item.id !== p.id));
                          router.refresh();
                        }
                      }}
                    >
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="missionId" value={mission.id} />
                      <Button variant="ghost" type="submit" className="h-8 px-2 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 3: READING & FLUENCY */}
      {activeTab === "stage3" && (
        <form action={async (fd) => { await saveStage3Reading(fd); }} className="panel p-6 space-y-4 max-w-3xl">
          <h3 className="text-lg font-extrabold text-navy">Stage 3 — Reading Passage & Private Voice Recording</h3>
          <p className="text-sm text-muted">
            The Flutter app displays this complete passage. Students record their audio aloud for teacher & parent review.
          </p>

          <input type="hidden" name="missionId" value={mission.id} />
          <input type="hidden" name="stageId" value={stage3?.id || ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">
              Passage Title
              <input
                required
                name="passageTitle"
                defaultValue={stage3?.title || mission.passage || "Fresh Corn"}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold">
              Passage Price/Subtitle Detail
              <input
                name="passageDetail"
                defaultValue={mission.passage_detail || "2 for $1"}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              Complete Reading Passage Text
              <textarea
                required
                name="passageText"
                rows={5}
                defaultValue={
                  stage3?.passage_text ||
                  "Fresh sweet corn is in aisle 1. It has soft yellow kernels and green silk. Look for ears with bright green husks!"
                }
                className="mt-1 block w-full rounded-lg border p-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              Reading Guidance / Instructions
              <input
                name="instructions"
                defaultValue={stage3?.instructions || "Read the sign aloud and tap the microphone when you are ready to record."}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold">
              Maximum Recording Duration (Seconds)
              <input
                type="number"
                name="durationSeconds"
                defaultValue={stage3?.duration_seconds || 30}
                min={5}
                max={180}
                className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-bold self-center pt-5">
              <input
                type="checkbox"
                name="recordingEnabled"
                defaultChecked={stage3 ? stage3.recording_enabled : true}
                className="h-5 w-5 rounded border-gray-300 text-brand"
              />
              Enable Student Voice Recording
            </label>
          </div>
          <Button type="submit" className="bg-navy text-white font-bold mt-4">Save Reading Passage</Button>
        </form>
      )}

      {/* STAGE 4: MATHEMATICS */}
      {activeTab === "stage4" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-navy">Stage 4 — Mathematics & Price Comparisons</h3>
            <p className="text-sm text-muted">Create math problems based on scanned grocery item prices and weights.</p>
          </div>

          <form action={async (fd) => { await saveStage4Math(fd); }} className="panel p-5 bg-slate-50 border space-y-4">
            <h4 className="font-extrabold text-ink">Add / Edit Math Question</h4>
            <input type="hidden" name="missionId" value={mission.id} />
            <input type="hidden" name="stageId" value={stage4?.id || ""} />
            <input type="hidden" name="questionId" value={selectedQuestion?.id || ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">
                Question Prompt
                <input
                  required
                  name="prompt"
                  defaultValue={selectedQuestion?.prompt_text || "Which one costs more?"}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-bold">
                Question Kind
                <select
                  name="kind"
                  defaultValue={selectedQuestion?.question_kind || "priceMore"}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                >
                  <option value="priceMore">priceMore (Which costs more?)</option>
                  <option value="priceLess">priceLess (Which costs less?)</option>
                  <option value="weightCompare">weightCompare (Which is heavier?)</option>
                  <option value="counting">counting (Count items)</option>
                  <option value="totalCost">totalCost (Addition)</option>
                </select>
              </label>
              <label className="text-sm font-bold md:col-span-2">
                Hint
                <input
                  name="hint"
                  defaultValue={selectedQuestion?.hint_text || "Look at the price tag."}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                />
              </label>

              {/* Dynamic Math Option Pictures */}
              <OptionPictureManager
                key={`s4-${selectedQuestion?.id || "new"}`}
                initialOptions={selectedQuestion?.answer_config?.options || ["apples", "corn"]}
                initialOptionImages={selectedQuestion?.answer_config?.optionImages || {}}
                initialCorrect={selectedQuestion?.answer_config?.correct || "apples"}
                mediaAssets={assets}
                missionId={mission.id}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-navy text-white font-bold">
                {selectedQuestion ? "Update Question" : "Add Math Question"}
              </Button>
              {selectedQuestion && (
                <Button type="button" variant="secondary" onClick={() => setSelectedQuestion(null)}>Clear</Button>
              )}
            </div>
          </form>

          {/* Math questions list */}
          <div className="space-y-3">
            {stage4Questions.map((q, idx) => (
              <div key={q.id} className="panel p-4 flex justify-between items-center hover:bg-slate-50 transition border rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-purple-700 uppercase">Math #{idx + 1} ({q.question_kind || "priceMore"})</span>
                  <h5 className="font-extrabold text-ink">{q.prompt_text}</h5>
                  <p className="text-xs text-muted mt-1">
                    Options: {q.answer_config?.options?.join(", ")} · Correct: <span className="font-bold text-green-700">{q.answer_config?.correct}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelectedQuestion(q)} className="h-8 px-2 text-xs">Edit</Button>
                  <form action={async (fd) => { await deleteStage4Math(fd); }}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="missionId" value={mission.id} />
                    <Button variant="ghost" className="h-8 px-2 text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          {/* STAGE 4 ASSETS SECTION: Below Stage 4, displays math assets with zero horizontal scroll */}
          <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/40 via-white to-slate-50 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
                  <Calculator className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-navy leading-tight">Stage 4 Math Assets & Option Graphics</h4>
                  <p className="text-xs text-muted">Scanned items and comparison picture cards saved for offline calculation.</p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMediaStageFilter("math");
                  setActiveTab("media");
                }}
                className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 border-purple-200 h-8 px-3"
              >
                Open Full Media Library ({assets.length}) →
              </Button>
            </div>

            {/* Quick visual grid of Stage 4 assets */}
            {(() => {
              const stage4Assets = assets.filter(
                (a) =>
                  a.stage_key === "math" ||
                  (a.asset_path && (a.asset_path.includes("apple") || a.asset_path.includes("corn") || a.asset_path.includes("carrot") || a.asset_path.includes("milk")))
              );

              if (stage4Assets.length === 0) {
                return (
                  <p className="text-xs text-muted py-2">
                    No stage-specific assets tagged yet. Upload produce images below or in the Media Library.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                  {stage4Assets.slice(0, 6).map((a) => {
                    const clean = getCleanName(a);
                    return (
                      <div
                        key={a.id}
                        className="rounded-xl border border-line bg-white p-2.5 flex flex-col items-center justify-between shadow-2xs hover:shadow-xs transition"
                      >
                        <div className="h-16 w-full rounded-lg bg-slate-50 border grid place-items-center overflow-hidden mb-2 p-1">
                          {a.content_type?.startsWith("audio") || (a.asset_path || "").endsWith(".m4a") ? (
                            <FileAudio className="h-6 w-6 text-purple-600" />
                          ) : (
                            <img
                              src={a.cdn_url || a.asset_path}
                              alt={clean}
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-ink truncate w-full text-center" title={clean}>
                          {clean}
                        </p>
                        <span className="text-[10px] font-mono text-muted mt-0.5">
                          {(a.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY — ZERO HORIZONTAL SCROLL & UPGRADED AUDIO PLAYERS */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-2xs">
                  <FolderCheck className="h-4 w-4" />
                </span>
                <h3 className="text-2xl font-black text-navy leading-tight">Mission Media Library</h3>
              </div>
              <p className="text-xs text-muted mt-1 max-w-2xl">
                All educational audio narrations (M4A/MP3) and picture cards (SVG/PNG) bundled for student tablets. Every file is validated with SHA-256 for 100% reliable offline sync.
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-brand border border-blue-200">
                📁 {assets.length} Assets
              </span>
              <span className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700 border border-purple-200">
                🎵 {assets.filter((a) => a.content_type?.startsWith("audio") || (a.asset_path || "").endsWith(".m4a")).length} Audio
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 border border-emerald-200">
                🖼️ {assets.filter((a) => a.content_type?.startsWith("image") || /\.(png|jpg|jpeg|svg|webp)$/i.test(a.asset_path || "")).length} Images
              </span>
            </div>
          </div>

          {/* Upload Status Alert */}
          {uploadStatus && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-bold border ${
                uploadStatus.type === "success"
                  ? "bg-teal-50 border-teal-200 text-teal-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {/* Upgraded Upload Panel */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!uploadSelectedFile) {
                setUploadStatus({ type: "error", message: "Please select a file to upload." });
                return;
              }
              setIsUploadingAsset(true);
              setUploadStatus(null);
              try {
                const fd = new FormData();
                fd.append("missionId", mission.id);
                fd.append("stageKey", uploadStageKey);
                fd.append("file", uploadSelectedFile);
                const res = await uploadMissionAsset(fd);
                if (res?.error) {
                  setUploadStatus({ type: "error", message: res.error });
                } else {
                  setUploadStatus({ type: "success", message: `Successfully uploaded "${uploadSelectedFile.name}" to media storage!` });
                  setUploadSelectedFile(null);
                  router.refresh();
                }
              } catch (err: any) {
                setUploadStatus({ type: "error", message: err.message || "Upload failed." });
              } finally {
                setIsUploadingAsset(false);
              }
            }}
            className="rounded-2xl border border-line bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-5 shadow-xs space-y-4 max-w-3xl"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-ink flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-brand" /> Upload Media Asset to Storage
              </h4>
              <span className="text-[11px] font-bold text-muted">Automatic SHA-256 Checksum Calculation</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black uppercase tracking-wider text-ink block">
                Target Stage Category
                <select
                  value={uploadStageKey}
                  onChange={(e) => setUploadStageKey(e.target.value)}
                  className="mt-1 block h-10 w-full rounded-xl border border-line bg-white px-3 text-xs font-bold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="phonemic_awareness">🎵 Stage 1: Phonemic Awareness</option>
                  <option value="phonics">🛒 Stage 2: Products & Barcodes</option>
                  <option value="fluency">📖 Stage 3: Fluency & Passage</option>
                  <option value="math">➕ Stage 4: Mathematics</option>
                  <option value="general">🌟 General / Mission Cover</option>
                </select>
              </label>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-ink block mb-1">
                  File (Audio or Image)
                </span>
                <label className="flex items-center gap-3 h-10 w-full rounded-xl border border-dashed border-brand/50 hover:border-brand bg-blue-50/40 hover:bg-blue-50 px-3 cursor-pointer transition">
                  <Upload className="h-4 w-4 text-brand shrink-0" />
                  <span className="text-xs font-bold text-brand truncate flex-1">
                    {uploadSelectedFile ? uploadSelectedFile.name : "Choose audio (M4A/MP3) or picture..."}
                  </span>
                  {uploadSelectedFile && (
                    <span className="text-[10px] font-mono text-muted shrink-0">
                      {(uploadSelectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*,audio/*"
                    onChange={(e) => setUploadSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted">
                Accepted: .m4a, .mp3, .wav, .png, .jpg, .svg, .webp (up to 10MB)
              </p>
              <Button
                type="submit"
                disabled={isUploadingAsset || !uploadSelectedFile}
                className="bg-navy hover:bg-navy/90 text-white font-bold h-9 px-4 text-xs"
              >
                {isUploadingAsset ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload to Storage
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Filter, Search & View Switcher Toolbar (Guaranteed Zero Horizontal Overflow) */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[220px] flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search assets by file name or keyword..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-line bg-slate-50 pl-9 pr-3 text-xs font-medium text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
                {mediaSearch && (
                  <button
                    type="button"
                    onClick={() => setMediaSearch("")}
                    className="absolute right-2.5 top-2.5 text-xs text-muted hover:text-ink"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* View Switcher Toggle: Grid vs Fixed Table */}
              <div className="flex rounded-xl border border-line bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMediaViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                    mediaViewMode === "grid"
                      ? "bg-white text-navy shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Visual Card Grid (Responsive & Zero Side Scroll)"
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Visual Grid
                </button>
                <button
                  type="button"
                  onClick={() => setMediaViewMode("table")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                    mediaViewMode === "table"
                      ? "bg-white text-navy shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Compact Fixed Table (Zero Horizontal Scroll)"
                >
                  <ListFilter className="h-3.5 w-3.5" /> Compact Table
                </button>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60">
              {/* Stage Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted mr-1">Stage:</span>
                {[
                  { key: "all", label: "All Stages" },
                  { key: "phonemic_awareness", label: "Stage 1 (Sounds)" },
                  { key: "phonics", label: "Stage 2 (Products)" },
                  { key: "fluency", label: "Stage 3 (Fluency)" },
                  { key: "math", label: "Stage 4 (Math)" },
                  { key: "general", label: "General" }
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setMediaStageFilter(s.key)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition border ${
                      mediaStageFilter === s.key
                        ? "bg-navy text-white border-navy"
                        : "bg-slate-50 text-muted hover:bg-slate-100 border-line"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted mr-1">Type:</span>
                {[
                  { key: "all", label: "All" },
                  { key: "image", label: "🖼️ Images" },
                  { key: "audio", label: "🎵 Audio" }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setMediaTypeFilter(t.key as any)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition border ${
                      mediaTypeFilter === t.key
                        ? "bg-brand text-white border-brand"
                        : "bg-slate-50 text-muted hover:bg-slate-100 border-line"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ASSET DISPLAY SECTION */}
          {(() => {
            const filteredAssets = assets.filter((a) => {
              const fullPath = (a.asset_path || a.file_name || "").toLowerCase();
              const clean = getCleanName(a).toLowerCase();
              const matchesSearch =
                !mediaSearch.trim() ||
                fullPath.includes(mediaSearch.toLowerCase()) ||
                clean.includes(mediaSearch.toLowerCase());

              const matchesStage =
                mediaStageFilter === "all" ||
                (a.stage_key || "general").toLowerCase() === mediaStageFilter.toLowerCase();

              const isAudio =
                a.content_type?.startsWith("audio") ||
                fullPath.endsWith(".m4a") ||
                fullPath.endsWith(".mp3") ||
                fullPath.endsWith(".wav");

              const isImage =
                a.content_type?.startsWith("image") ||
                fullPath.endsWith(".png") ||
                fullPath.endsWith(".jpg") ||
                fullPath.endsWith(".jpeg") ||
                fullPath.endsWith(".svg") ||
                fullPath.endsWith(".webp");

              const matchesType =
                mediaTypeFilter === "all" ||
                (mediaTypeFilter === "audio" && isAudio) ||
                (mediaTypeFilter === "image" && isImage);

              return matchesSearch && matchesStage && matchesType;
            });

            if (filteredAssets.length === 0) {
              return (
                <div className="panel p-12 text-center rounded-2xl border bg-white space-y-2">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand mx-auto mb-2">
                    <FolderCheck className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-navy">No media assets found</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Try adjusting your search query or stage filter, or upload a new asset above.
                  </p>
                  {(mediaSearch || mediaStageFilter !== "all" || mediaTypeFilter !== "all") && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setMediaSearch("");
                        setMediaStageFilter("all");
                        setMediaTypeFilter("all");
                      }}
                      className="text-xs font-bold mt-2"
                    >
                      Reset All Filters
                    </Button>
                  )}
                </div>
              );
            }

            {/* 1. VISUAL GRID VIEW (DEFAULT - 100% RESPONSIVE, ZERO HORIZONTAL SCROLL) */}
            if (mediaViewMode === "grid") {
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {filteredAssets.map((a) => {
                    const cleanName = getCleanName(a);
                    const isAudio =
                      a.content_type?.startsWith("audio") ||
                      (a.asset_path || "").endsWith(".m4a") ||
                      (a.asset_path || "").endsWith(".mp3");
                    const isCopied = copiedAssetId === a.id;

                    return (
                      <div
                        key={a.id}
                        className="group rounded-2xl border border-line bg-white p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        {/* Media Preview Box */}
                        <div className="relative h-28 w-full rounded-xl bg-slate-50 border overflow-hidden flex items-center justify-center p-2 mb-2.5">
                          {isAudio ? (
                            <div className="flex flex-col items-center justify-center text-center w-full">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-100 text-purple-700 mb-1.5">
                                <FileAudio className="h-4 w-4" />
                              </span>
                              <AudioPlayer
                                compact
                                src={a.cdn_url || a.asset_path}
                                className="w-full max-w-[130px]"
                              />
                            </div>
                          ) : (
                            <img
                              src={a.cdn_url || a.asset_path}
                              alt={cleanName}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          )}

                          {/* Top Tag */}
                          <div className="absolute top-1.5 right-1.5">
                            <Badge tone={getStageTone(a.stage_key)} className="text-[9px] px-1.5 py-0.5">
                              {a.stage_key ? a.stage_key.replace("_", " ") : "general"}
                            </Badge>
                          </div>
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 space-y-1">
                          <p
                            className="text-xs font-black text-ink truncate block"
                            title={cleanName}
                          >
                            {cleanName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                            <span>{(a.size_bytes / 1024).toFixed(1)} KB</span>
                            <span title={`SHA-256: ${a.sha256_hash}`}>
                              {a.sha256_hash ? `${a.sha256_hash.slice(0, 6)}...` : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Action Strip */}
                        <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-line/60">
                          <button
                            type="button"
                            onClick={() => copyAssetInfo(a.cdn_url || a.asset_path, a.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-brand transition"
                            title="Copy Media URL"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {a.cdn_url && (
                            <a
                              href={a.cdn_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted hover:text-navy transition p-1"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            {/* 2. COMPACT FIXED TABLE (100% WIDTH, ZERO HORIZONTAL SCROLL) */}
            return (
              <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden w-full">
                <table className="w-full table-fixed text-left text-xs sm:text-sm">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[16%]" />
                    <col className="w-[18%]" />
                    <col className="w-[10%]" />
                    <col className="w-[22%]" />
                  </colgroup>
                  <thead className="border-b bg-slate-50 text-[11px] font-black uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-3">Asset Name & Path</th>
                      <th className="px-3 py-3">Stage</th>
                      <th className="px-3 py-3">SHA-256 Digest</th>
                      <th className="px-3 py-3">Size</th>
                      <th className="px-4 py-3">Preview / Play</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filteredAssets.map((a) => {
                      const cleanName = getCleanName(a);
                      const isAudio =
                        a.content_type?.startsWith("audio") ||
                        (a.asset_path || "").endsWith(".m4a") ||
                        (a.asset_path || "").endsWith(".mp3");
                      const isCopied = copiedAssetId === a.id;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition">
                          {/* Asset Column (Truncated & clean filename) */}
                          <td className="px-4 py-3 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0">
                                {isAudio ? (
                                  <FileAudio className="h-4 w-4 text-purple-600" />
                                ) : (
                                  <FileImage className="h-4 w-4 text-blue-600" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-ink truncate text-xs sm:text-sm" title={cleanName}>
                                  {cleanName}
                                </p>
                                <p className="font-mono text-[10px] text-muted truncate" title={a.asset_path}>
                                  {a.asset_path || a.file_name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyAssetInfo(a.cdn_url || a.asset_path, a.id)}
                                className="shrink-0 p-1 text-slate-400 hover:text-brand transition"
                                title="Copy asset path"
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>

                          {/* Stage Column */}
                          <td className="px-3 py-3 min-w-0">
                            <Badge tone={getStageTone(a.stage_key)} className="text-[10px] truncate max-w-full">
                              {getStageLabel(a.stage_key)}
                            </Badge>
                          </td>

                          {/* SHA-256 Digest Column (Truncated + Copy) */}
                          <td className="px-3 py-3 min-w-0">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-muted truncate">
                              <span className="truncate" title={a.sha256_hash}>
                                {a.sha256_hash ? `${a.sha256_hash.slice(0, 8)}...` : "—"}
                              </span>
                              {a.sha256_hash && (
                                <button
                                  type="button"
                                  onClick={() => copyAssetInfo(a.sha256_hash, `sha-${a.id}`)}
                                  className="shrink-0 p-0.5 text-slate-400 hover:text-ink transition"
                                  title="Copy full SHA-256 checksum"
                                >
                                  {copiedAssetId === `sha-${a.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Size Column */}
                          <td className="px-3 py-3 font-mono text-[11px] text-muted whitespace-nowrap">
                            {(a.size_bytes / 1024).toFixed(1)} KB
                          </td>

                          {/* Preview Column (Custom AudioPlayer or Image thumbnail) */}
                          <td className="px-4 py-3 min-w-0">
                            {isAudio ? (
                              <AudioPlayer
                                compact
                                src={a.cdn_url || a.asset_path}
                                title={cleanName}
                                className="max-w-[200px]"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <img
                                  src={a.cdn_url || a.asset_path}
                                  alt={cleanName}
                                  className="h-9 w-9 object-contain rounded-lg border bg-slate-50 p-0.5 shrink-0"
                                  loading="lazy"
                                />
                                {a.cdn_url && (
                                  <a
                                    href={a.cdn_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-bold text-brand hover:underline flex items-center gap-0.5"
                                  >
                                    View <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* STUDENT MISSION PREVIEW MODAL / TAB */}
      {activeTab === "preview" && (
        <div className="panel p-6 border-2 border-brand/40 bg-gradient-to-b from-blue-50/40 via-white to-slate-50 max-w-3xl mx-auto shadow-2xl rounded-3xl">
          {/* Top Bar: Title & Close */}
          <div className="flex justify-between items-center border-b pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-black tracking-widest text-brand uppercase block">Student Experience Preview</span>
                <span className="text-[11px] text-muted font-bold">Interactive walk-through of all 4 stages & questions</span>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                stopSpeaking();
                if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "true") {
                  router.push(`/${role}/library`);
                } else {
                  setActiveTab("stage1");
                }
              }}
              className="h-8 px-2.5 text-xs font-bold text-muted hover:text-ink"
            >
              <X className="h-4 w-4 mr-1" /> Close Preview
            </Button>
          </div>

          {/* Interactive Step Pipeline Navigator */}
          <div className="mb-6 rounded-2xl bg-slate-100/80 p-1.5 flex items-center justify-between gap-1 text-xs font-bold">
            {[
              { idx: 0, label: "Welcome", icon: Sparkles },
              { idx: 1, label: `1. Sounds (${stage1Questions.length})`, icon: Volume2 },
              { idx: 2, label: `2. Products (${productList.length})`, icon: ShoppingBag },
              { idx: 3, label: "3. Reading", icon: BookOpen },
              { idx: 4, label: `4. Math (${stage4Questions.length})`, icon: Calculator },
              { idx: 5, label: "Complete", icon: Award }
            ].map((step) => {
              const isActive = previewStage === step.idx;
              const isPast = previewStage > step.idx;
              const Icon = step.icon;
              return (
                <button
                  key={step.idx}
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setPreviewStage(step.idx);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition text-[11px] font-black ${
                    isActive
                      ? "bg-navy text-white shadow-xs"
                      : isPast
                      ? "bg-white text-emerald-700 shadow-2xs"
                      : "text-muted hover:text-ink hover:bg-white/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline truncate">{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stage 0: Mission Welcome Screen */}
          {previewStage === 0 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-900 border border-amber-300">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {mission.stars || 5} Stars Classroom Reward
              </div>

              <div>
                <h2 className="text-3xl font-black text-navy">{mission.title}</h2>
                <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
                  {mission.description || "An interactive grocery learning quest designed for K-2 students."}
                </p>
              </div>

              {/* Mission Details Card */}
              <div className="grid gap-3 sm:grid-cols-3 max-w-lg mx-auto text-left">
                <div className="panel bg-white p-3.5 border shadow-2xs rounded-xl">
                  <p className="text-[10px] font-bold text-muted uppercase">Partner Store</p>
                  <p className="font-extrabold text-xs text-ink truncate mt-0.5">
                    {stores.find((s) => s.id === mission.store_id)?.name || "Partner Market"}
                  </p>
                </div>
                <div className="panel bg-white p-3.5 border shadow-2xs rounded-xl">
                  <p className="text-[10px] font-bold text-muted uppercase">Grade Level</p>
                  <p className="font-extrabold text-xs text-ink mt-0.5">
                    Grades {mission.grade_min === 0 ? "K" : mission.grade_min}–{mission.grade_max}
                  </p>
                </div>
                <div className="panel bg-white p-3.5 border shadow-2xs rounded-xl">
                  <p className="text-[10px] font-bold text-muted uppercase">Duration</p>
                  <p className="font-extrabold text-xs text-ink mt-0.5">
                    ~{mission.estimated_minutes || 12} minutes
                  </p>
                </div>
              </div>

              {/* 4 Steps Roadmap */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-2">
                <div className="rounded-xl border border-line bg-white p-3 text-center">
                  <span className="grid h-8 w-8 mx-auto place-items-center rounded-lg bg-blue-50 text-brand mb-1.5">
                    <Volume2 className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-black text-navy">Stage 1: Sounds</p>
                  <p className="text-[10px] text-muted font-bold">{stage1Questions.length} Questions</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-3 text-center">
                  <span className="grid h-8 w-8 mx-auto place-items-center rounded-lg bg-teal-50 text-teal-700 mb-1.5">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-black text-navy">Stage 2: Barcodes</p>
                  <p className="text-[10px] text-muted font-bold">{productList.length} Items</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-3 text-center">
                  <span className="grid h-8 w-8 mx-auto place-items-center rounded-lg bg-amber-50 text-amber-700 mb-1.5">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-black text-navy">Stage 3: Reading</p>
                  <p className="text-[10px] text-muted font-bold">Voice Recording</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-3 text-center">
                  <span className="grid h-8 w-8 mx-auto place-items-center rounded-lg bg-purple-50 text-purple-700 mb-1.5">
                    <Calculator className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-black text-navy">Stage 4: Math</p>
                  <p className="text-[10px] text-muted font-bold">{stage4Questions.length} Questions</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    setPreviewStage(1);
                    setSoundQIndex(0);
                    setSoundAnswer(null);
                    setSoundFeedback(null);
                  }}
                  className="bg-brand hover:bg-brand/90 text-white font-extrabold px-8 py-3.5 text-base rounded-2xl shadow-lg"
                >
                  Start Mission Experience <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Stage 1: Phonemic Awareness & Sounds */}
          {previewStage === 1 && (() => {
            const currentQ = stage1Questions[soundQIndex] || stage1Questions[0];
            const answerConfig = currentQ?.answer_config || {};
            const options: string[] = answerConfig.options || ["apple", "banana", "carrot", "corn"];
            const correctOpt: string = answerConfig.correct || options[0] || "";
            const optionImages: Record<string, string> = answerConfig.optionImages || {};

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Stage Header with Question Counter */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-brand">
                      Stage 1 of 4: Phonemic Awareness
                    </span>
                    <h3 className="text-lg font-black text-navy">Sound Discovery & Phonics</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 text-brand px-3 py-1 text-xs font-black">
                      Question {soundQIndex + 1} of {Math.max(1, stage1Questions.length)}
                    </span>
                  </div>
                </div>

                {/* Question Indicator Dots */}
                {stage1Questions.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5">
                    {stage1Questions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSoundQIndex(i);
                          setSoundAnswer(null);
                          setSoundFeedback(null);
                          setSoundHintVisible(false);
                          stopSpeaking();
                        }}
                        className={`h-2.5 rounded-full transition-all ${
                          i === soundQIndex
                            ? "w-8 bg-brand"
                            : "w-2.5 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to Question ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Question Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border space-y-4 text-center">
                  <h4 className="text-2xl font-black text-navy">
                    {currentQ?.prompt_text || "Which one starts with this sound?"}
                  </h4>

                  {/* Spoken Voice Bar with Real SpeechSynthesis Audio */}
                  <div className="flex flex-wrap items-center justify-center gap-3 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-sm font-bold text-ink">
                      &ldquo;{currentQ?.spoken_prompt || currentQ?.prompt_text || "Listen to the word sound"}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        isReadingAloud
                          ? stopSpeaking()
                          : speakText(currentQ?.spoken_prompt || currentQ?.prompt_text || "")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white px-3 py-1.5 text-xs font-bold hover:bg-brand/90 transition shadow-2xs"
                    >
                      {isReadingAloud ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" /> Stop Voice
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Listen Voice
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Banner */}
                  {soundFeedback === "correct" && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs font-extrabold text-emerald-800 border border-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
                      <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      <span>⭐ Correct! Outstanding listening! Tap Next to continue.</span>
                    </div>
                  )}
                  {soundFeedback === "incorrect" && (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs font-extrabold text-amber-800 border border-amber-300 flex items-center justify-center gap-2 animate-in fade-in">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>Keep trying! Listen closely to the sound prompt and try another choice.</span>
                    </div>
                  )}

                  {/* Option Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {options.map((opt) => {
                      const img = optionImages[opt];
                      const isSelected = soundAnswer === opt;
                      const isOptionCorrect = opt.toLowerCase().trim() === correctOpt.toLowerCase().trim();

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSoundAnswer(opt);
                            if (isOptionCorrect) {
                              setSoundFeedback("correct");
                            } else {
                              setSoundFeedback("incorrect");
                            }
                          }}
                          className={`group relative rounded-2xl border-2 p-4 text-center font-extrabold transition flex flex-col items-center justify-center gap-2.5 ${
                            isSelected && isOptionCorrect
                              ? "border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400"
                              : isSelected && !isOptionCorrect
                              ? "border-rose-400 bg-rose-50/70"
                              : "border-line bg-white hover:border-brand hover:bg-blue-50/30"
                          }`}
                        >
                          {isSelected && isOptionCorrect && (
                            <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}

                          {img ? (
                            <img src={img} alt={opt} className="h-16 w-16 object-contain rounded-lg" />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-slate-100 grid place-items-center text-slate-400 group-hover:text-brand">
                              <ShoppingBag className="h-7 w-7" />
                            </div>
                          )}
                          <span className="text-sm font-extrabold text-ink capitalize">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Hint Accordion */}
                  {currentQ?.hint_text && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSoundHintVisible((prev) => !prev)}
                        className="text-xs font-bold text-muted hover:text-brand inline-flex items-center gap-1"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {soundHintVisible ? "Hide hint" : "Need a hint?"}
                      </button>
                      {soundHintVisible && (
                        <p className="mt-1 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 animate-in fade-in">
                          💡 Hint: {currentQ.hint_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      stopSpeaking();
                      if (soundQIndex > 0) {
                        setSoundQIndex((prev) => prev - 1);
                        setSoundAnswer(null);
                        setSoundFeedback(null);
                        setSoundHintVisible(false);
                      } else {
                        setPreviewStage(0);
                      }
                    }}
                    className="font-bold"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {soundQIndex > 0 ? "Previous Question" : "Mission Overview"}
                  </Button>

                  {soundQIndex < stage1Questions.length - 1 ? (
                    <Button
                      onClick={() => {
                        stopSpeaking();
                        setSoundQIndex((prev) => prev + 1);
                        setSoundAnswer(null);
                        setSoundFeedback(null);
                        setSoundHintVisible(false);
                      }}
                      className="bg-navy hover:bg-navy/90 text-white font-bold"
                    >
                      Next Question <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        stopSpeaking();
                        setPreviewStage(2);
                        setProductIdx(0);
                        setProductScanned(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Proceed to Stage 2: Products <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stage 2: Grocery Products & Barcodes */}
          {previewStage === 2 && (() => {
            const currentProduct = productList[productIdx] || productList[0];
            const hasMultiple = productList.length > 1;

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                      Stage 2 of 4: Grocery Products & Barcodes
                    </span>
                    <h3 className="text-lg font-black text-navy">Find Item & Scan Code128 Barcode</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-100 text-teal-800 px-3 py-1 text-xs font-black">
                      Product {productIdx + 1} of {Math.max(1, productList.length)}
                    </span>
                  </div>
                </div>

                {/* Product Dots */}
                {hasMultiple && (
                  <div className="flex items-center justify-center gap-1.5">
                    {productList.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setProductIdx(i);
                          setProductScanned(false);
                        }}
                        className={`h-2.5 rounded-full transition-all ${
                          i === productIdx
                            ? "w-8 bg-teal-600"
                            : "w-2.5 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to Product ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Product Detail & Barcode Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border space-y-5">
                  <div className="grid gap-5 sm:grid-cols-[140px_1fr] items-center">
                    {/* Product Image */}
                    <div className="h-32 w-32 mx-auto rounded-2xl bg-slate-50 border border-line p-2 grid place-items-center overflow-hidden shadow-2xs">
                      {currentProduct?.image_asset ? (
                        <img
                          src={resolveProductImg(currentProduct.image_asset) || ""}
                          alt={currentProduct.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-slate-300" />
                      )}
                    </div>

                    {/* Product Metadata */}
                    <div className="space-y-2 text-center sm:text-left">
                      <span className="inline-block rounded-md bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-800 border border-teal-200">
                        {currentProduct?.package_size || "Produce Aisle"}
                      </span>
                      <h4 className="text-2xl font-black text-navy">{currentProduct?.name || "Target Grocery Item"}</h4>
                      <p className="text-xs text-muted leading-relaxed">
                        {currentProduct?.instructions || currentProduct?.description || "Find this fresh item in the grocery aisle and scan the scannable barcode label."}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs font-extrabold text-ink">
                        <span>Price: ${((currentProduct?.price_cents || 100) / 100).toFixed(2)}</span>
                        <span>·</span>
                        <span>Weight: {currentProduct?.weight_grams || 500}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Barcode Scanner Test Panel */}
                  <div className="rounded-2xl bg-slate-50 p-5 border-2 border-dashed border-teal-300 text-center space-y-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-muted">
                        Scannable Code128 Barcode
                      </p>
                      <p className="font-mono text-xl font-black text-navy mt-1">
                        {currentProduct?.barcode || "C2CAPPLE001"}
                      </p>
                    </div>

                    {/* Scan Animation & Feedback */}
                    {productScanned ? (
                      <div className="rounded-xl bg-emerald-50 p-3 text-xs font-extrabold text-emerald-800 border border-emerald-300 flex items-center justify-center gap-2 animate-in zoom-in-95">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>Barcode {currentProduct?.barcode} Successfully Verified & Collected! ✓</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          type="button"
                          onClick={handleSimulateScan}
                          disabled={scanAnimation}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5"
                        >
                          {scanAnimation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning Barcode...
                            </>
                          ) : (
                            <>
                              <BarcodeIcon className="mr-2 h-4 w-4" /> Simulate Barcode Scan
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {currentProduct?.barcode && (
                      <div className="max-w-xs mx-auto text-left pt-1">
                        <BarcodeExportButton
                          value={currentProduct.barcode}
                          label={currentProduct.name}
                          subtitle="Test Scannable Barcode · Code128"
                          symbology="CODE128"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (productIdx > 0) {
                        setProductIdx((prev) => prev - 1);
                        setProductScanned(false);
                      } else {
                        setPreviewStage(1);
                        setSoundQIndex(stage1Questions.length - 1);
                      }
                    }}
                    className="font-bold"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {productIdx > 0 ? "Previous Product" : "Stage 1: Sounds"}
                  </Button>

                  {productIdx < productList.length - 1 ? (
                    <Button
                      onClick={() => {
                        setProductIdx((prev) => prev + 1);
                        setProductScanned(false);
                      }}
                      className="bg-navy hover:bg-navy/90 text-white font-bold"
                    >
                      Next Product <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setPreviewStage(3);
                        setRecordingRecorded(false);
                        setIsRecordingSim(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Proceed to Stage 3: Reading <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stage 3: Reading & Fluency */}
          {previewStage === 3 && (() => {
            const passageTitle = stage3?.title || mission.passage || "Fresh Grocery Discovery";
            const passageText = stage3?.passage_text || mission.passage_detail || "Look at the fresh fruits and vegetables in the market. Each item has bright colors and delicious flavors. Sweet apples are crisp, and golden corn is sweet. Healthy foods help you grow strong!";

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                      Stage 3 of 4: Oral Reading Fluency
                    </span>
                    <h3 className="text-lg font-black text-navy">Read Aloud & Audio Voice Recording</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-black">
                    Fluency Passage
                  </span>
                </div>

                {/* Reading Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-navy flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                      {passageTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        isReadingAloud ? stopSpeaking() : speakText(passageText)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                    >
                      {isReadingAloud ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" /> Stop Voice
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Read Aloud (TTS)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Passage Text Container */}
                  <div className="rounded-2xl bg-amber-50/50 p-6 border border-amber-200 text-ink text-base leading-8 font-medium">
                    {passageText}
                  </div>

                  {/* Voice Recorder Simulator */}
                  <div className="rounded-2xl bg-slate-50 p-5 border border-line text-center space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">
                      Student Voice Recording Simulator
                    </p>

                    {isRecordingSim ? (
                      <div className="flex items-center justify-center gap-3 py-2 animate-pulse">
                        <span className="h-3.5 w-3.5 rounded-full bg-rose-600 animate-ping" />
                        <span className="font-mono text-sm font-black text-rose-700">
                          Recording in progress: 0:0{recordingSeconds} / 0:45
                        </span>
                      </div>
                    ) : recordingRecorded ? (
                      <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-300 space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Student Voice Recording Captured (32 seconds) ✓ Saved to Evaluation Feed</span>
                        </div>
                        <AudioPlayer
                          src="/sample-reading-recording.wav"
                          title="Maya · Fresh Corn Oral Fluency Recording"
                          className="max-w-md mx-auto"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        Students read the passage into their tablet microphone. Recordings are uploaded for teacher evaluation.
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-3 pt-1">
                      <Button
                        type="button"
                        onClick={handleSimulateRecording}
                        disabled={isRecordingSim}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5"
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        {isRecordingSim
                          ? "Recording Voice..."
                          : recordingRecorded
                          ? "Re-record Simulation"
                          : "Simulate Student Voice Recording"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      stopSpeaking();
                      setPreviewStage(2);
                    }}
                    className="font-bold"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Stage 2: Products
                  </Button>

                  <Button
                    onClick={() => {
                      stopSpeaking();
                      setPreviewStage(4);
                      setMathQIndex(0);
                      setMathAnswer(null);
                      setMathFeedback(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Proceed to Stage 4: Math <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Stage 4: Grocery Mathematics */}
          {previewStage === 4 && (() => {
            const currentQ = stage4Questions[mathQIndex] || stage4Questions[0];
            const answerConfig = currentQ?.answer_config || {};
            const options: string[] = answerConfig.options || ["corn ($0.89)", "apples ($1.49)"];
            const correctOpt: string = answerConfig.correct || options[0] || "";
            const optionImages: Record<string, string> = answerConfig.optionImages || {};

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                      Stage 4 of 4: Grocery Mathematics
                    </span>
                    <h3 className="text-lg font-black text-navy">Price & Quantity Math Challenges</h3>
                  </div>
                  <span className="rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-xs font-black">
                    Question {mathQIndex + 1} of {Math.max(1, stage4Questions.length)}
                  </span>
                </div>

                {/* Math Question Dots */}
                {stage4Questions.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5">
                    {stage4Questions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setMathQIndex(i);
                          setMathAnswer(null);
                          setMathFeedback(null);
                          setMathHintVisible(false);
                          stopSpeaking();
                        }}
                        className={`h-2.5 rounded-full transition-all ${
                          i === mathQIndex
                            ? "w-8 bg-purple-600"
                            : "w-2.5 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to Math Question ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Math Question Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border space-y-4 text-center">
                  <div className="inline-block rounded-md bg-purple-50 px-2.5 py-1 text-xs font-extrabold text-purple-800 border border-purple-200 uppercase tracking-wider">
                    {currentQ?.question_kind || "Price Comparison"}
                  </div>

                  <h4 className="text-2xl font-black text-navy">
                    {currentQ?.prompt_text || "Which item costs less?"}
                  </h4>

                  {/* Audio Read Aloud for Math Question */}
                  <div className="flex flex-wrap items-center justify-center gap-3 bg-purple-50/70 p-3 rounded-xl border border-purple-100">
                    <span className="text-sm font-bold text-ink">
                      &ldquo;{currentQ?.spoken_prompt || currentQ?.prompt_text || "Compare the prices of each item"}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        isReadingAloud
                          ? stopSpeaking()
                          : speakText(currentQ?.spoken_prompt || currentQ?.prompt_text || "")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-purple-700 transition shadow-2xs"
                    >
                      {isReadingAloud ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" /> Stop Voice
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Listen Voice
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Banner */}
                  {mathFeedback === "correct" && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs font-extrabold text-emerald-800 border border-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
                      <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      <span>⭐ Correct calculation! Fantastic grocery math work!</span>
                    </div>
                  )}
                  {mathFeedback === "incorrect" && (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs font-extrabold text-amber-800 border border-amber-300 flex items-center justify-center gap-2 animate-in fade-in">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>Compare the dollar amounts again. You can do it!</span>
                    </div>
                  )}

                  {/* Math Options Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {options.map((opt) => {
                      const img = optionImages[opt];
                      const isSelected = mathAnswer === opt;
                      const isOptionCorrect = opt.toLowerCase().trim() === correctOpt.toLowerCase().trim();

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setMathAnswer(opt);
                            if (isOptionCorrect) {
                              setMathFeedback("correct");
                            } else {
                              setMathFeedback("incorrect");
                            }
                          }}
                          className={`group relative rounded-2xl border-2 p-4 text-center font-extrabold transition flex flex-col items-center justify-center gap-2.5 ${
                            isSelected && isOptionCorrect
                              ? "border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400"
                              : isSelected && !isOptionCorrect
                              ? "border-rose-400 bg-rose-50/70"
                              : "border-line bg-white hover:border-purple-400 hover:bg-purple-50/30"
                          }`}
                        >
                          {isSelected && isOptionCorrect && (
                            <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}

                          {img ? (
                            <img src={img} alt={opt} className="h-14 w-14 object-contain rounded-lg" />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-purple-50 text-purple-700 grid place-items-center">
                              <Calculator className="h-6 w-6" />
                            </div>
                          )}
                          <span className="text-sm font-extrabold text-ink">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Hint Accordion */}
                  {currentQ?.hint_text && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setMathHintVisible((prev) => !prev)}
                        className="text-xs font-bold text-muted hover:text-purple-600 inline-flex items-center gap-1"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {mathHintVisible ? "Hide hint" : "Need a hint?"}
                      </button>
                      {mathHintVisible && (
                        <p className="mt-1 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 animate-in fade-in">
                          💡 Hint: {currentQ.hint_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      stopSpeaking();
                      if (mathQIndex > 0) {
                        setMathQIndex((prev) => prev - 1);
                        setMathAnswer(null);
                        setMathFeedback(null);
                        setMathHintVisible(false);
                      } else {
                        setPreviewStage(3);
                      }
                    }}
                    className="font-bold"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {mathQIndex > 0 ? "Previous Question" : "Stage 3: Reading"}
                  </Button>

                  {mathQIndex < stage4Questions.length - 1 ? (
                    <Button
                      onClick={() => {
                        stopSpeaking();
                        setMathQIndex((prev) => prev + 1);
                        setMathAnswer(null);
                        setMathFeedback(null);
                        setMathHintVisible(false);
                      }}
                      className="bg-navy hover:bg-navy/90 text-white font-bold"
                    >
                      Next Question <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        stopSpeaking();
                        setPreviewStage(5);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Complete Mission 🎉 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stage 5: Celebration & Victory Screen */}
          {previewStage === 5 && (
            <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="relative inline-block">
                <span className="text-6xl animate-bounce inline-block">🎉</span>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-900 border border-amber-300">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  +{mission.stars || 5} Stars Awarded
                </span>
                <h2 className="text-3xl font-black text-navy mt-3">Mission Accomplished!</h2>
                <p className="mt-2 text-sm text-muted max-w-md mx-auto">
                  You successfully verified all learning objectives for <strong>{mission.title}</strong>!
                </p>
              </div>

              {/* Accomplishment Recap Checklist */}
              <div className="rounded-2xl bg-white p-5 border border-line max-w-md mx-auto text-left space-y-3 shadow-2xs">
                <div className="flex items-center gap-3 text-xs font-bold text-ink">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>{stage1Questions.length} Phonemic Awareness Sound Questions Solved</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-ink">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>{productList.length} In-Store Grocery Barcodes Scanned</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-ink">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>Oral Reading Fluency Audio Captured</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-ink">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>{stage4Questions.length} Mathematics Challenges Completed</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button
                  variant="secondary"
                  onClick={startPreview}
                  className="font-bold border-line"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Restart Preview
                </Button>
                <Button
                  onClick={() => {
                    stopSpeaking();
                    setActiveTab("stage1");
                  }}
                  className="bg-navy text-white hover:bg-navy/90 font-bold"
                >
                  Return to Mission Builder
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Reject Feedback Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-line">
            <button
              onClick={() => setShowRejectDialog(false)}
              className="absolute top-4 right-4 text-muted hover:text-ink transition rounded-lg p-1 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-navy">Reject Mission & Send Feedback</h3>
                <p className="text-xs text-muted">Keep mission unpublished and guide the teacher on needed edits.</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-line text-xs space-y-1">
              <span className="font-extrabold text-navy">Mission: </span>
              <span className="text-slate-700">{mission.title}</span>
            </div>
            <form onSubmit={handleAdminReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                  Rejection Feedback / Change Request (Optional)
                </label>
                <textarea
                  value={rejectFeedbackText}
                  onChange={(e) => setRejectFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Please check Question 2 in Stage 1 — sound buh shouldn't have apple as an option. Also please verify barcode C2CAPPLE001 in Stage 2."
                  className="w-full rounded-xl border border-line p-3 text-xs text-ink placeholder:text-muted focus:border-rose-500 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRejectDialog(false)}
                  disabled={isReviewSubmitting}
                  className="h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isReviewSubmitting}
                  className="h-10 px-5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {isReviewSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <X className="mr-1.5 h-3.5 w-3.5" />}
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
