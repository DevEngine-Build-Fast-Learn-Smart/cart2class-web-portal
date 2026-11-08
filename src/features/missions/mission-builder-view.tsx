"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Volume2,
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
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptionPictureManager } from "./option-picture-manager";
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
import { submitMission } from "@/features/dashboard/workflow-actions";

type Row = Record<string, any>;

export function MissionBuilderView({
  mission,
  stages,
  questionsByStage,
  products,
  assets,
  stores
}: {
  mission: Row;
  stages: Row[];
  questionsByStage: Record<string, Row[]>;
  products: Row[];
  assets: Row[];
  stores: Row[];
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

  useEffect(() => {
    setProductList(products);
  }, [products]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/teacher/library"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shared Mission Library
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-navy">{mission.title}</h1>
              <Badge tone={mission.status === "published" ? "green" : mission.sharing_status === "submitted" ? "amber" : "blue"}>
                {mission.status === "published" ? "Published" : mission.sharing_status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Mission #{mission.mission_number || 4} · Grades {mission.grade_min}–{mission.grade_max} · {mission.estimated_minutes || 12} mins · {mission.stars || 5} Stars
            </p>
          </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPreviewStage(0);
              setActiveTab("preview");
            }}
            className="font-bold border-brand text-brand"
          >
            <Eye className="mr-2 h-4 w-4" /> Student Mission Preview
          </Button>

          {mission.sharing_status === "private" && (
            <form action={async (fd) => { await submitMission(fd); }}>
              <input type="hidden" name="missionId" value={mission.id} />
              <Button type="submit" className="bg-navy text-white font-bold">
                <Send className="mr-2 h-4 w-4" /> Submit for Review
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>

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
              <div key={q.id} className="panel p-4 flex justify-between items-center hover:bg-slate-50">
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
        </div>
      )}

      {/* MEDIA LIBRARY */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-navy">Mission Media Library</h3>
            <p className="text-sm text-muted">Upload and manage educational audio (M4A/MP3) and images (SVG/PNG/JPG) with SHA-256 validation.</p>
          </div>

          <form action={async (fd) => { await uploadMissionAsset(fd); }} className="panel p-5 bg-slate-50 border space-y-4 max-w-xl">
            <h4 className="font-extrabold text-ink">Upload Media Asset</h4>
            <input type="hidden" name="missionId" value={mission.id} />
            <div className="grid gap-4">
              <label className="text-sm font-bold">
                Stage Category
                <select name="stageKey" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                  <option value="phonemic_awareness">Stage 1: Phonemic Awareness</option>
                  <option value="phonics">Stage 2: Products</option>
                  <option value="fluency">Stage 3: Fluency</option>
                  <option value="math">Stage 4: Math</option>
                  <option value="general">General / Cover</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                File (Image or Audio)
                <input required type="file" name="file" accept="image/*,audio/*" className="mt-1 block w-full text-sm font-normal" />
              </label>
            </div>
            <Button type="submit" className="bg-navy text-white font-bold">Upload to Storage</Button>
          </form>

          {/* Uploaded assets */}
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs font-extrabold uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3">Asset</th>
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">SHA-256 Digest</th>
                    <th className="px-5 py-3">Size</th>
                    <th className="px-5 py-3">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assets.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-ink flex items-center gap-2">
                        {a.content_type?.startsWith("audio") ? <FileAudio className="h-4 w-4 text-purple-600" /> : <FileImage className="h-4 w-4 text-blue-600" />}
                        {a.asset_path || a.file_name}
                      </td>
                      <td className="px-5 py-3.5"><Badge tone="blue">{a.stage_key || "general"}</Badge></td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted truncate max-w-xs">{a.sha256_hash}</td>
                      <td className="px-5 py-3.5 text-xs text-muted">{(a.size_bytes / 1024).toFixed(1)} KB</td>
                      <td className="px-5 py-3.5">
                        {a.cdn_url && a.content_type?.startsWith("audio") && (
                          <audio controls src={a.cdn_url} className="h-8 max-w-[200px]" />
                        )}
                        {a.cdn_url && a.content_type?.startsWith("image") && (
                          <img src={a.cdn_url} alt="asset" className="h-10 w-10 object-contain rounded border" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MISSION PREVIEW MODAL / TAB */}
      {activeTab === "preview" && (
        <div className="panel p-6 border-2 border-brand/40 bg-gradient-to-b from-blue-50/40 to-white max-w-2xl mx-auto shadow-xl rounded-2xl">
          <div className="flex justify-between items-center border-b pb-3 mb-6">
            <span className="text-xs font-black tracking-widest text-brand uppercase">Student Experience Preview</span>
            <Button variant="ghost" onClick={() => setActiveTab("stage1")} className="h-8 px-2">
              <X className="h-4 w-4" /> Close
            </Button>
          </div>

          {/* Preview Welcome Screen */}
          {previewStage === 0 && (
            <div className="text-center py-6 space-y-4">
              <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-extrabold text-amber-800">
                {mission.stars || 5} Stars Reward
              </span>
              <h2 className="text-3xl font-black text-navy">{mission.title}</h2>
              <p className="text-muted max-w-md mx-auto">{mission.description}</p>
              <div className="panel bg-white p-4 max-w-sm mx-auto shadow-sm text-left">
                <p className="text-xs font-bold text-muted uppercase">Partner Store</p>
                <p className="font-extrabold text-ink">{stores.find((s) => s.id === mission.store_id)?.name || "Partner Market"}</p>
                <p className="text-xs text-muted mt-2">Duration: ~{mission.estimated_minutes || 12} minutes</p>
              </div>
              <Button onClick={() => setPreviewStage(1)} className="bg-brand text-white font-extrabold px-8 py-3 text-lg rounded-xl shadow-md">
                Begin Mission <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Preview Stage 1 */}
          {previewStage === 1 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold text-muted">
                <span>STAGE 1: SOUNDS</span>
                <span>Question 1 of {stage1Questions.length || 1}</span>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border space-y-4 text-center">
                <h3 className="text-xl font-black text-navy">{stage1Questions[0]?.prompt_text || "Which one starts with /b/?"}</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-brand font-bold bg-blue-50 py-2 rounded-lg">
                  <Volume2 className="h-5 w-5" /> &ldquo;{stage1Questions[0]?.spoken_prompt || "Which word begins with the sound buh?"}&rdquo;
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {(stage1Questions[0]?.answer_config?.options || ["banana", "apple", "carrot", "milk"]).map((opt: string) => {
                    const imgUrl = stage1Questions[0]?.answer_config?.optionImages?.[opt];
                    return (
                      <button
                        key={opt}
                        onClick={() => alert(opt === (stage1Questions[0]?.answer_config?.correct || "banana") ? "Correct! ⭐" : "Try again!")}
                        className="rounded-xl border-2 border-line hover:border-brand p-3 text-center font-extrabold text-ink hover:bg-blue-50/50 transition flex flex-col items-center justify-center gap-2"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={opt} className="h-12 w-12 object-contain" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                        <span className="text-sm font-bold">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setPreviewStage(0)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setPreviewStage(2)} className="bg-navy text-white font-bold">Stage 2: Products <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Preview Stage 2 */}
          {previewStage === 2 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold text-muted">
                <span>STAGE 2: GROCERY PRODUCTS</span>
                <span>Scan in Store</span>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border space-y-4">
                <span className="text-xs font-bold text-teal-700 uppercase">Target Item: {products[0]?.name || "Corn"}</span>
                <h3 className="text-xl font-black text-navy">Find and scan the barcode</h3>
                <p className="text-sm text-muted">{products[0]?.instructions || "Scan the barcode on the produce label."}</p>
                <div className="panel bg-slate-50 p-4 text-center border-2 border-dashed border-teal-300 rounded-xl">
                  <p className="font-mono font-bold text-lg text-ink">UPC: {products[0]?.barcode || "012345678905"}</p>
                  <p className="text-xs text-muted mt-1">${((products[0]?.price_cents || 100) / 100).toFixed(2)} · {products[0]?.weight_grams || 500}g</p>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setPreviewStage(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setPreviewStage(3)} className="bg-navy text-white font-bold">Stage 3: Reading <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Preview Stage 3 */}
          {previewStage === 3 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold text-muted">
                <span>STAGE 3: READING & FLUENCY</span>
                <span>Record Voice</span>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border space-y-4">
                <h3 className="text-xl font-black text-navy">{stage3?.title || mission.passage || "Fresh Corn"}</h3>
                <p className="text-sm leading-7 text-ink bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                  {stage3?.passage_text || "Fresh sweet corn is in aisle 1. It has soft yellow kernels and green silk. Look for ears with bright green husks!"}
                </p>
                <div className="text-center pt-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-800 px-4 py-2 font-bold text-sm">
                    <span className="h-3 w-3 rounded-full bg-rose-600 animate-pulse" /> Tap to record your voice reading
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setPreviewStage(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setPreviewStage(4)} className="bg-navy text-white font-bold">Stage 4: Math <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Preview Stage 4 */}
          {previewStage === 4 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold text-muted">
                <span>STAGE 4: MATHEMATICS</span>
                <span>Price Math</span>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border space-y-4 text-center">
                <h3 className="text-xl font-black text-navy">{stage4Questions[0]?.prompt_text || "Which one costs more?"}</h3>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {(stage4Questions[0]?.answer_config?.options || ["apples", "corn"]).map((opt: string) => {
                    const imgUrl = stage4Questions[0]?.answer_config?.optionImages?.[opt];
                    return (
                      <button
                        key={opt}
                        onClick={() => alert(opt === (stage4Questions[0]?.answer_config?.correct || "apples") ? "Correct math answer! ⭐" : "Try again!")}
                        className="rounded-xl border-2 border-line hover:border-brand p-3 text-center font-extrabold text-ink hover:bg-blue-50/50 transition flex flex-col items-center justify-center gap-2"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={opt} className="h-12 w-12 object-contain" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                            <Calculator className="h-5 w-5" />
                          </div>
                        )}
                        <span className="text-sm font-bold">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setPreviewStage(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setPreviewStage(5)} className="bg-green-700 text-white font-bold">Complete Mission <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Preview Complete */}
          {previewStage === 5 && (
            <div className="text-center py-6 space-y-4">
              <span className="text-5xl">🎉</span>
              <h2 className="text-3xl font-black text-navy">Mission Completed!</h2>
              <p className="text-muted">You earned {mission.stars || 5} stars for your classroom!</p>
              <Button onClick={() => setPreviewStage(0)} className="bg-brand text-white font-bold">
                Restart Preview
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
