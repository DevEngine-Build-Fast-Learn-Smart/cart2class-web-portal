"use client";

import { AlertTriangle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToastAlert({
  type = "success",
  title,
  message,
  onClose
}: {
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300 shadow-2xl">
      <div
        className={`flex items-start gap-3.5 p-4.5 rounded-2xl border-2 backdrop-blur-md ${
          isSuccess
            ? "bg-emerald-50/95 border-emerald-300/90 text-emerald-950 shadow-emerald-500/10"
            : isError
            ? "bg-rose-50/95 border-rose-300/90 text-rose-950 shadow-rose-500/10"
            : "bg-blue-50/95 border-blue-300/90 text-blue-950 shadow-blue-500/10"
        }`}
      >
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            isSuccess
              ? "bg-emerald-600 text-white"
              : isError
              ? "bg-rose-600 text-white"
              : "bg-brand text-white"
          }`}
        >
          {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-black text-sm">{title || (isSuccess ? "Success" : isError ? "Action Failed" : "Notice")}</p>
          <p className="mt-0.5 text-xs font-medium leading-relaxed opacity-90">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-ink transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Deactivation",
  message,
  targetLabel,
  onConfirm,
  onCancel,
  confirmButtonText = "Yes, Deactivate"
}: {
  isOpen: boolean;
  title?: string;
  message?: string;
  targetLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md panel bg-white p-6 shadow-2xl border-2 border-rose-200 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-navy">{title}</h3>
            {targetLabel && <p className="text-xs font-bold text-rose-700 mt-0.5">{targetLabel}</p>}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {message ||
            "Are you sure you want to proceed with this action? This will deactivate active credentials and restrict portal access. An administrator can re-enable this record later."}
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="secondary" onClick={onCancel} className="font-bold text-xs h-9 px-4">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-9 px-4 shadow-sm transition"
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

