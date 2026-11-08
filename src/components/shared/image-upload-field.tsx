"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Link2, X, Image as ImageIcon, AlertCircle } from "lucide-react";

interface ImageUploadFieldProps {
  label?: string;
  fileInputName?: string;
  urlInputName?: string;
  initialUrl?: string | null;
  shape?: "circle" | "square";
  helpText?: string;
}

export function ImageUploadField({
  label = "Profile Picture",
  fileInputName = "avatarFile",
  urlInputName = "avatarUrl",
  initialUrl = null,
  shape = "circle",
  helpText = "Optional · Maximum size 5MB"
}: ImageUploadFieldProps) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [urlInput, setUrlInput] = useState<string>(initialUrl || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl) {
      setPreviewUrl(initialUrl);
      setUrlInput(initialUrl);
    }
  }, [initialUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit. Please select a smaller photo.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const val = e.target.value;
    setUrlInput(val);
    setPreviewUrl(val.trim() || null);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setUrlInput("");
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-navy flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-brand" />
          {label}
        </label>
        <span className="text-[11px] text-muted">{helpText}</span>
      </div>

      <div className="flex items-start gap-3">
        {/* Thumbnail Preview */}
        <div className="relative shrink-0">
          <div
            className={`h-14 w-14 overflow-hidden border-2 border-slate-200 bg-white shadow-xs flex items-center justify-center ${
              shape === "circle" ? "rounded-full" : "rounded-xl"
            }`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={() => {
                  setErrorMsg("Could not load image from provided link. Check URL format.");
                }}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-slate-300" />
            )}
          </div>
          {previewUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 p-0.5 text-white shadow hover:bg-red-700 transition"
              title="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Upload Mode Selector & Inputs */}
        <div className="flex-1 space-y-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setTab("file");
                setErrorMsg(null);
              }}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                tab === "file"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Upload className="h-3 w-3" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("url");
                setErrorMsg(null);
              }}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                tab === "url"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Link2 className="h-3 w-3" /> Image Link
            </button>
          </div>

          {/* Mode: File upload */}
          {tab === "file" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                name={fileInputName}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-md file:border-0 file:bg-brand/10 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-brand hover:file:bg-brand/20 cursor-pointer"
              />
              {/* Also preserve URL if already set */}
              <input type="hidden" name={urlInputName} value={urlInput} />
            </div>
          )}

          {/* Mode: Web URL */}
          {tab === "url" && (
            <div>
              <input
                type="url"
                name={urlInputName}
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="https://example.com/photo.jpg"
                className="block h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand focus:outline-hidden"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-red-600 animate-in fade-in">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

