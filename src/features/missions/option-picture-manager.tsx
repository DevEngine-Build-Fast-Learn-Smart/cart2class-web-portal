"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Link2, Image as ImageIcon, CheckCircle2, Trash2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadOptionImage } from "@/features/dashboard/mission-builder-actions";

type OptionItem = {
  id: string;
  label: string;
  imageUrl: string;
};

type Row = Record<string, any>;

export function OptionPictureManager({
  initialOptions = ["banana", "apple", "carrot", "milk"],
  initialOptionImages = {},
  initialCorrect = "banana",
  mediaAssets = [],
  missionId = "general"
}: {
  initialOptions?: string[];
  initialOptionImages?: Record<string, string>;
  initialCorrect?: string;
  mediaAssets?: Row[];
  missionId?: string;
}) {
  const [items, setItems] = useState<OptionItem[]>(() => {
    return initialOptions.map((opt, idx) => ({
      id: `opt-${idx}-${Date.now()}`,
      label: opt,
      imageUrl: initialOptionImages[opt] || ""
    }));
  });

  const [correct, setCorrect] = useState<string>(initialCorrect || initialOptions[0] || "banana");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [showUrlInputIdx, setShowUrlInputIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update when props change (e.g. when teacher clicks "Edit" on a different question)
  useEffect(() => {
    setItems(
      initialOptions.map((opt, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        label: opt,
        imageUrl: initialOptionImages[opt] || ""
      }))
    );
    setCorrect(initialCorrect || initialOptions[0] || "banana");
  }, [initialOptions, initialOptionImages, initialCorrect]);

  const handleLabelChange = (index: number, newLabel: string) => {
    const oldLabel = items[index].label;
    const updated = [...items];
    updated[index].label = newLabel;
    setItems(updated);

    if (correct === oldLabel) {
      setCorrect(newLabel);
    }
  };

  const handleImageUrlChange = (index: number, newUrl: string) => {
    const updated = [...items];
    updated[index].imageUrl = newUrl;
    setItems(updated);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(index);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("missionId", missionId);

    try {
      const res = await uploadOptionImage(fd);
      if (res?.success && res.url) {
        handleImageUrlChange(index, res.url);
      }
    } catch (err) {
      console.error("Failed to upload image", err);
    } finally {
      setUploadingIdx(null);
    }
  };

  const addOption = () => {
    const nextIdx = items.length + 1;
    const newLabel = `Option ${nextIdx}`;
    setItems([
      ...items,
      {
        id: `opt-${Date.now()}`,
        label: newLabel,
        imageUrl: ""
      }
    ]);
  };

  const removeOption = (index: number) => {
    if (items.length <= 1) return;
    const itemToRemove = items[index];
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered);

    if (correct === itemToRemove.label && filtered.length > 0) {
      setCorrect(filtered[0].label);
    }
  };

  // Compile option data for hidden inputs
  const optionsList = items.map((it) => it.label.trim()).filter(Boolean);
  const optionImagesMap: Record<string, string> = {};
  for (const it of items) {
    if (it.label.trim() && it.imageUrl.trim()) {
      optionImagesMap[it.label.trim()] = it.imageUrl.trim();
    }
  }

  // Filter image media assets from library
  const imageAssets = mediaAssets.filter(
    (a) => a.content_type?.startsWith("image") || a.asset_path?.endsWith(".svg") || a.asset_path?.endsWith(".png")
  );

  return (
    <div className="space-y-4 md:col-span-2 rounded-2xl border-2 border-brand/20 bg-blue-50/20 p-5">
      {/* Hidden inputs submitted with the parent form */}
      <input type="hidden" name="options" value={optionsList.join(", ")} />
      <input type="hidden" name="optionImagesJson" value={JSON.stringify(optionImagesMap)} />
      <input type="hidden" name="correct" value={correct} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div>
          <h4 className="text-sm font-black text-navy flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand" /> Kid-Friendly Picture Choices
          </h4>
          <p className="text-xs text-muted mt-0.5">
            Young children tap picture cards in the iPad app. Upload or link an image for each choice below.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addOption}
          className="text-xs font-bold h-8 bg-white border-brand/30 text-brand hover:bg-brand hover:text-white"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Choice
        </Button>
      </div>

      {/* Option Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, idx) => {
          const isCorrect = correct === item.label;

          return (
            <div
              key={item.id}
              className={`panel p-4 rounded-xl border transition relative ${
                isCorrect
                  ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-sm"
                  : "border-line bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Image Preview / Upload Box */}
                <div className="relative h-20 w-20 shrink-0 rounded-xl border-2 border-dashed border-line bg-slate-50 overflow-hidden grid place-items-center">
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.label}
                        className="h-full w-full object-contain p-1"
                        onError={(e) => {
                          // Fallback to placeholder if broken link
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUrlChange(idx, "")}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-navy/80 text-white flex items-center justify-center hover:bg-rose-600 transition"
                        title="Remove Image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : uploadingIdx === idx ? (
                    <div className="text-[10px] font-bold text-brand animate-pulse text-center p-1">
                      Uploading...
                    </div>
                  ) : (
                    <label
                      htmlFor={`file-upload-${idx}`}
                      className="cursor-pointer grid place-items-center text-center p-1 text-muted hover:text-brand transition"
                      title="Upload local picture"
                    >
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                      <span className="text-[10px] font-bold mt-1 text-slate-500">Add Pic</span>
                    </label>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  id={`file-upload-${idx}`}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(idx, e)}
                />

                {/* Option Text and Settings */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase text-muted">
                      Choice #{idx + 1}
                    </span>
                    {items.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="text-slate-400 hover:text-rose-600 transition p-0.5"
                        title="Delete choice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={item.label}
                    onChange={(e) => handleLabelChange(idx, e.target.value)}
                    placeholder="e.g. banana"
                    className="h-9 w-full rounded-lg border border-line bg-slate-50/70 px-2.5 text-xs font-bold text-ink focus:border-brand focus:bg-white focus:outline-none"
                  />

                  {/* Image Options: Upload, Paste URL, or Media Library */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <label
                      htmlFor={`file-upload-${idx}`}
                      className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-brand bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-0.5 transition"
                    >
                      <Upload className="h-3 w-3" /> File
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowUrlInputIdx(showUrlInputIdx === idx ? null : idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md px-2 py-0.5 transition"
                    >
                      <Link2 className="h-3 w-3" /> Link
                    </button>

                    {imageAssets.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleImageUrlChange(idx, e.target.value);
                        }}
                        className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md px-1.5 py-0.5 border-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Library</option>
                        {imageAssets.map((asset) => (
                          <option key={asset.id} value={asset.cdn_url || asset.asset_path}>
                            {asset.file_name || asset.asset_path}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Optional Inline URL input */}
                  {showUrlInputIdx === idx && (
                    <div className="pt-1 animate-in fade-in">
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...)"
                        value={item.imageUrl}
                        onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                        className="h-7 w-full rounded border border-line bg-white px-2 text-[11px] font-mono text-muted focus:border-brand focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Correct Answer Selector */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setCorrect(item.label)}
                      className={`inline-flex items-center gap-1.5 text-xs font-black transition ${
                        isCorrect ? "text-emerald-700" : "text-muted hover:text-ink"
                      }`}
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full border ${
                          isCorrect ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-400 bg-white"
                        }`}
                      >
                        {isCorrect && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      {isCorrect ? "Correct Answer ⭐" : "Mark as Correct"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

