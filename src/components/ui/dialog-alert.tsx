"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuccess = type === "success";
  const isError = type === "error";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-md px-4 pointer-events-none animate-in slide-in-from-top-3 fade-in duration-200">
      <div
        className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border bg-white/95 backdrop-blur-md shadow-2xl transition ${
          isSuccess
            ? "border-emerald-200 shadow-emerald-500/10"
            : isError
            ? "border-rose-200 shadow-rose-500/10"
            : "border-blue-200 shadow-blue-500/10"
        }`}
      >
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/80"
              : isError
              ? "bg-rose-50 text-rose-600 ring-4 ring-rose-50/80"
              : "bg-blue-50 text-brand ring-4 ring-blue-50/80"
          }`}
        >
          {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-black text-sm text-navy">{title || (isSuccess ? "Success" : isError ? "Action Failed" : "Notice")}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600 leading-relaxed">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy transition shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-navy/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto panel bg-white p-6 shadow-2xl border border-slate-200 rounded-3xl space-y-4">
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
    </div>,
    document.body
  );
}

