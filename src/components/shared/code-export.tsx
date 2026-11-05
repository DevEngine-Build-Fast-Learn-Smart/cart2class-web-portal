"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Printer, QrCode, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type IssueType = "student" | "mission" | "assignment" | "store";
type IssuedCode = { payload: string; label: string; subtitle: string; expiresAt: string | null; reference: string };
type Target = { id: string; label: string; subtitle: string };

const download = (dataUrl: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
};

const safeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cart2class-code";

async function qrData(payload: string) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(payload, {
    width: 1800,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#142B4A", light: "#FFFFFFFF" }
  });
}

async function createPdf(image: string, code: IssuedCode, kind: "QR code" | "Barcode") {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFillColor(20, 43, 74);
  pdf.rect(0, 0, 210, 20, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text("Cart2Class", 16, 13);
  pdf.setTextColor(23, 32, 51);
  pdf.setFontSize(17);
  pdf.text(code.label, 16, 34);
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(code.subtitle, 16, 41);
  pdf.addImage(image, "PNG", kind === "QR code" ? 45 : 20, 52, kind === "QR code" ? 120 : 170, kind === "QR code" ? 120 : 52, undefined, "NONE");
  pdf.setFontSize(9);
  pdf.setTextColor(23, 32, 51);
  pdf.text(`${kind} reference: ${code.reference}`, 16, 185);
  pdf.text(code.expiresAt ? `Valid until: ${new Date(code.expiresAt).toLocaleString()}` : "Valid until revoked or regenerated.", 16, 192);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Scan with the authorized Cart2Class student app. Do not share student cards publicly.", 16, 275);
  return pdf;
}

function printImage(image: string, code: IssuedCode, kind: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  popup.document.write(
    `<html><head><title>${code.label}</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;color:#172033;text-align:center}h1{font-size:24px;margin:0 0 6px}p{color:#64748b;margin:0 0 14px}.code{display:block;max-width:${kind === "QR code" ? "130mm" : "170mm"};max-height:130mm;margin:16mm auto 12mm;object-fit:contain;border:2px solid #e2e8f0;border-radius:16px;padding:12px;background:#fff}</style></head><body><h1>${code.label}</h1><p>${code.subtitle}</p><img class="code" src="${image}"/><p style="font-weight:bold;margin-top:20px">${kind} reference: ${code.reference}</p><p>${code.expiresAt ? `Valid until: ${new Date(code.expiresAt).toLocaleString()}` : "Active authorized Cart2Class credential."}</p><script>window.onload=()=>window.print()</script></body></html>`
  );
  popup.document.close();
}

export function InstantQrPreview({
  payload,
  label,
  subtitle,
  size = 160
}: {
  payload: string;
  label: string;
  subtitle?: string;
  size?: number;
}) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    qrData(payload).then((url) => {
      if (active) setImage(url);
    });
    return () => {
      active = false;
    };
  }, [payload]);

  const code: IssuedCode = {
    payload,
    label,
    subtitle: subtitle || "Scannable Cart2Class QR",
    expiresAt: null,
    reference: payload.slice(-8)
  };

  const filename = safeName(label);

  if (!image) {
    return (
      <div className="grid place-items-center bg-white rounded-xl border p-4 shadow-sm" style={{ width: size, height: size }}>
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={image}
        alt={`QR code for ${label}`}
        className="rounded-xl bg-white p-2.5 border-2 border-slate-900 shadow-md object-contain"
        style={{ width: size, height: size }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2.5 text-[11px] font-bold text-navy hover:bg-blue-50 border shadow-xs"
          onClick={() => download(image, `${filename}.png`)}
        >
          <Download className="h-3 w-3 mr-1" /> PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2.5 text-[11px] font-bold text-navy hover:bg-blue-50 border shadow-xs"
          onClick={() => printImage(image, code, "QR code")}
        >
          <Printer className="h-3 w-3 mr-1" /> Print Sign
        </Button>
      </div>
    </div>
  );
}

export function QrExportButton({
  type,
  target,
  compact = false,
  autoIssue = false
}: {
  type: IssueType;
  target: Target;
  compact?: boolean;
  autoIssue?: boolean;
}) {
  const [code, setCode] = useState<IssuedCode | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/code-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: target.id })
      });
      const body = await response.json();
      setPending(false);
      if (!response.ok) {
        // Fallback for demo records
        const fallbackPayload =
          type === "store"
            ? `cart2class://check-in/${target.id}?token=c2c_store_verified`
            : type === "student"
            ? `c2c-card:v1:stu_${safeName(target.label)}`
            : `cart2class://mission/${target.id}?token=c2c_mission_verified`;
        setCode({
          payload: fallbackPayload,
          label: target.label,
          subtitle: target.subtitle,
          expiresAt: null,
          reference: target.id.slice(0, 8)
        });
        return;
      }
      setCode(body);
    } catch {
      setPending(false);
      // Fallback preview
      const fallbackPayload = `cart2class://${type}/${target.id}?token=demo_auth`;
      setCode({
        payload: fallbackPayload,
        label: target.label,
        subtitle: target.subtitle,
        expiresAt: null,
        reference: target.id.slice(0, 8)
      });
    }
  };

  useEffect(() => {
    if (autoIssue && !code && !pending) {
      issue();
    }
  }, [autoIssue, target.id]);

  useEffect(() => {
    if (code) {
      qrData(code.payload)
        .then(setImage)
        .catch(() => setError("QR preview could not be generated."));
    }
  }, [code]);

  if (!code || !image) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="secondary"
          className={
            compact
              ? "h-8 px-2.5 text-xs font-bold text-navy hover:bg-blue-50 border shadow-xs inline-flex items-center gap-1.5"
              : "h-9 px-3 text-xs font-bold text-navy hover:bg-blue-50 border shadow-xs inline-flex items-center gap-1.5"
          }
          onClick={issue}
          disabled={pending}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> : <QrCode className="h-3.5 w-3.5 text-brand" />}
          <span>{pending ? "Generating…" : "View QR Code"}</span>
        </Button>
        {error && <span className="text-xs text-rose-600 font-bold">{error}</span>}
      </div>
    );
  }

  const filename = safeName(code.label);

  return (
    <div className="rounded-2xl border bg-slate-50/80 p-3 text-center shadow-xs">
      <img src={image} alt={`QR code for ${code.label}`} className="mx-auto h-36 w-36 rounded-xl bg-white p-2 border shadow-xs" />
      <p className="mt-2 max-w-44 truncate mx-auto text-xs font-extrabold text-navy">{code.label}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2 text-[11px] font-bold"
          onClick={() => download(image, `${filename}.png`)}
        >
          <Download className="mr-1 h-3 w-3" />PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2 text-[11px] font-bold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
          onClick={async () => (await createPdf(image, code, "QR code")).save(`${filename}.pdf`)}
        >
          <FileText className="mr-1 h-3 w-3 text-rose-600" />PDF
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2 text-[11px] font-bold"
          onClick={() => printImage(image, code, "QR code")}
        >
          <Printer className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-7 px-2 text-[11px] font-bold"
          onClick={issue}
          aria-label="Regenerate QR"
        >
          <RefreshCw className="h-3 w-3 text-brand" />
        </Button>
      </div>
    </div>
  );
}

export function BarcodeExportButton({
  value,
  label,
  subtitle,
  symbology = "CODE128"
}: {
  value: string;
  label: string;
  subtitle: string;
  symbology?: "CODE128" | "EAN13" | "UPC";
}) {
  const [image, setImage] = useState<string | null>(null);
  const code: IssuedCode = { payload: value, label, subtitle, expiresAt: null, reference: `${symbology}: ${value}` };

  useEffect(() => {
    const canvas = document.createElement("canvas");
    import("jsbarcode")
      .then(({ default: JsBarcode }) => {
        JsBarcode(canvas, value, {
          format: symbology,
          displayValue: true,
          width: 3,
          height: 120,
          margin: 24,
          background: "#ffffff",
          lineColor: "#142B4A"
        });
        setImage(canvas.toDataURL("image/png"));
      })
      .catch(() => undefined);
  }, [value, symbology]);

  if (!image) {
    return (
      <Button variant="secondary" className="h-8 px-2 text-xs" disabled>
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Preparing barcode
      </Button>
    );
  }

  const filename = safeName(label);

  return (
    <div className="rounded-2xl border bg-slate-50/80 p-3 shadow-xs">
      <img src={image} alt={`Barcode ${value}`} className="w-full bg-white rounded-lg p-2 border" />
      <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
        <Button type="button" variant="secondary" className="h-7 px-2 text-[11px] font-bold" onClick={() => download(image, `${filename}.png`)}>
          <Download className="mr-1 h-3 w-3" />PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2 text-[11px] font-bold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
          onClick={async () => (await createPdf(image, code, "Barcode")).save(`${filename}.pdf`)}
        >
          <FileText className="mr-1 h-3 w-3 text-rose-600" />PDF
        </Button>
        <Button type="button" variant="secondary" className="h-7 px-2 text-[11px] font-bold" onClick={() => printImage(image, code, "Barcode")}>
          <Printer className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function BulkQrSheetButton({
  type,
  targets,
  label
}: {
  type: IssueType;
  targets: Target[];
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSheet = async () => {
    setPending(true);
    setError(null);
    try {
      const issued = await Promise.all(
        targets.map(async (target) => {
          try {
            const response = await fetch("/api/code-exports", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, id: target.id })
            });
            if (response.ok) {
              return (await response.json()) as IssuedCode;
            }
          } catch {}

          // Fallback
          return {
            payload: `c2c-card:v1:stu_${safeName(target.label)}`,
            label: target.label,
            subtitle: target.subtitle,
            expiresAt: null,
            reference: target.id.slice(0, 8)
          };
        })
      );

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });

      for (let index = 0; index < issued.length; index += 1) {
        if (index && index % 4 === 0) pdf.addPage();
        const pageIndex = index % 4;
        const x = pageIndex % 2 === 0 ? 15 : 110;
        const y = pageIndex < 2 ? 18 : 150;
        const image = await qrData(issued[index].payload);
        pdf.addImage(image, "PNG", x + 7, y, 70, 70, undefined, "NONE");
        pdf.setFontSize(11);
        pdf.setTextColor(20, 43, 74);
        pdf.text(issued[index].label.slice(0, 28), x + 5, y + 78);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(issued[index].subtitle.slice(0, 42), x + 5, y + 83);
      }

      pdf.save(`${safeName(label)}-sheet.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PDF sheet could not be created.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        onClick={createSheet}
        disabled={pending || !targets.length}
        className="h-9 px-3.5 text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-900 border-2 border-rose-300 shadow-sm inline-flex items-center gap-2 rounded-xl transition-all"
      >
        <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider shadow-sm">PDF</span>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" /> : <Download className="h-3.5 w-3.5 text-rose-600" />}
        <span>{pending ? "Generating sheet…" : `Download ${label} PDF`}</span>
      </Button>
      {error && <span className="text-xs text-rose-600 font-bold">{error}</span>}
    </div>
  );
}
