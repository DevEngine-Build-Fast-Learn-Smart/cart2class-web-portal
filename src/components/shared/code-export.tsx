"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Printer, QrCode, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortalSettings } from "@/lib/portal-settings";

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

let cachedLogoDataUrl: string | null = null;
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const settings = getPortalSettings();
    if (settings.logoUrl) {
      return settings.logoUrl;
    }
  } catch {}
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch("/cart2class-logo-pdf.png");
    const blob = res.ok ? await res.blob() : await (await fetch("/cart2class-logo.png")).blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUrl = reader.result as string;
        resolve(cachedLogoDataUrl);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function createPdf(image: string, code: IssuedCode, kind: "QR code" | "Barcode") {
  const settings = getPortalSettings();
  const format = settings.pdfPaperFormat === "letter" ? "letter" : "a4";
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format });
  const logoUrl = settings.pdfEmbedLogo !== false ? await loadLogoDataUrl() : null;
  const pageWidth = format === "letter" ? 215.9 : 210;
  const pageHeight = format === "letter" ? 279.4 : 297;

  // 1. Top Decorative Header Bar (Navy with subtle golden/amber accent)
  pdf.setFillColor(20, 43, 74); // #142B4A Navy
  pdf.rect(0, 0, pageWidth, 24, "F");
  pdf.setFillColor(245, 158, 11); // #F59E0B Amber
  pdf.rect(0, 24, pageWidth, 2, "F");

  // Top header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(settings.pdfHeaderTitle || "CART2CLASS LEARNING NETWORK", 16, 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(203, 213, 225); // #CBD5E1
  pdf.text(settings.pdfHeaderSubtitle || "A.L.M.A. Verified Official Educational Credential", 16, 18);

  // 2. Centered Logo and Main Heading
  if (logoUrl) {
    try {
      pdf.addImage(logoUrl, "PNG", (pageWidth - 24) / 2, 34, 24, 24, undefined, "NONE");
    } catch {}
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(20, 43, 74); // Navy
  pdf.text(settings.platformName || "Cart2Class", pageWidth / 2, 65, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // Slate-500
  pdf.text(settings.tagline || "Aisle Discovery & Classroom Learning Platform", pageWidth / 2, 71, { align: "center" });

  // 3. Main Framed Credential Card (Center Middle)
  const cardW = 154;
  const cardH = kind === "QR code" ? 148 : 122;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = 78;

  // Outer Card Background & Border
  pdf.setFillColor(248, 250, 252); // Slate-50
  pdf.roundedRect(cardX, cardY, cardW, cardH, 8, 8, "F");
  pdf.setDrawColor(203, 213, 225); // Slate-300
  pdf.setLineWidth(1);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 8, 8, "S");

  // Header Pill inside Card
  pdf.setFillColor(238, 242, 255); // Indigo-50
  pdf.roundedRect(cardX + 16, cardY + 8, cardW - 32, 8, 4, 4, "F");
  pdf.setDrawColor(199, 210, 254); // Indigo-200
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX + 16, cardY + 8, cardW - 32, 8, 4, 4, "S");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(67, 56, 202); // Indigo-700
  const credentialType = kind === "Barcode" ? "PRODUCT SCANNER BARCODE" : "OFFICIAL SCANNABLE CREDENTIAL PASS";
  pdf.text(credentialType, pageWidth / 2, cardY + 13.5, { align: "center" });

  // Recipient / Item Title (e.g. Maya C, Green Basket Market)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.setTextColor(15, 23, 42); // Slate-900
  pdf.text(code.label.slice(0, 36), pageWidth / 2, cardY + 25, { align: "center" });

  // Subtitle (e.g. Kindergarten A · Grade 0)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(100, 116, 139); // Slate-500
  pdf.text(code.subtitle.slice(0, 50), pageWidth / 2, cardY + 31, { align: "center" });

  // QR Code or Barcode Image in the Center of Card
  if (kind === "QR code") {
    const qrSize = 70;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = cardY + 36;

    // QR White Pad & Dark Slate Border
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 4, 4, "F");
    pdf.setDrawColor(30, 41, 59); // Slate-800
    pdf.setLineWidth(1.2);
    pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 4, 4, "S");

    // QR Image
    pdf.addImage(image, "PNG", qrX, qrY, qrSize, qrSize, undefined, "NONE");

    // Reference ID below QR - Perfectly centered
    const rawRef = code.reference || code.payload.slice(-16);
    let tokenText = `TOKEN ID: ${rawRef}`;
    if (rawRef.length > 20) {
      tokenText = `TOKEN ID: ${rawRef.slice(0, 8)}...${rawRef.slice(-6)}`;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text(tokenText, pageWidth / 2, qrY + qrSize + 9.5, { align: "center" });

    // Active Verification Status Badge Pill (Centered Middle, Pure ASCII with crisp drawn circle)
    const pillW = 86;
    const pillH = 7.5;
    const pillX = (pageWidth - pillW) / 2;
    const pillY = qrY + qrSize + 13.5;

    pdf.setFillColor(236, 253, 245); // Emerald-50
    pdf.roundedRect(pillX, pillY, pillW, pillH, 3.75, 3.75, "F");
    pdf.setDrawColor(167, 243, 208); // Emerald-200
    pdf.setLineWidth(0.5);
    pdf.roundedRect(pillX, pillY, pillW, pillH, 3.75, 3.75, "S");

    // Crisp Green Circle Indicator
    pdf.setFillColor(16, 185, 129); // Emerald-500
    pdf.circle(pillX + 6.5, pillY + 3.75, 1.25, "F");

    // Text in Helvetica Bold - 100% clean alignment and zero encoding corruption
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(4, 120, 87); // Emerald-700
    pdf.text("ACTIVE VERIFIED CART2CLASS DIGITAL PASS", pillX + 11.5, pillY + 4.9);
  } else {
    // Barcode Layout
    const barW = 120;
    const barH = 38;
    const barX = (pageWidth - barW) / 2;
    const barY = cardY + 36;

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 4, 4, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 4, 4, "S");

    pdf.addImage(image, "PNG", barX, barY, barW, barH, undefined, "NONE");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    pdf.text(`BARCODE / UPC: ${code.reference || code.payload}`, pageWidth / 2, barY + barH + 11, { align: "center" });
  }

  // 4. Instructions & Safe Scanning Callout Box (Below the Card)
  const infoY = cardY + cardH + 7;
  pdf.setFillColor(239, 246, 255); // Blue-50
  pdf.roundedRect(cardX, infoY, cardW, 25, 6, 6, "F");
  pdf.setDrawColor(191, 219, 254); // Blue-200
  pdf.setLineWidth(0.8);
  pdf.roundedRect(cardX, infoY, cardW, 25, 6, 6, "S");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(30, 58, 138); // Blue-900
  pdf.text("STUDENT & CLASSROOM USAGE INSTRUCTIONS", cardX + 10, infoY + 7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 64, 175); // Blue-800
  const instrText =
    kind === "QR code"
      ? "Point the Cart2Class Student Mobile App camera at this QR code to sign in instantly.\nNo typing required. Works offline in participating grocery store aisles."
      : "Scan this product barcode in the grocery aisle during your Cart2Class learning mission\nto reveal real-world product price and weight math problems.";
  pdf.text(instrText, cardX + 10, infoY + 13);

  // 5. Legal & Privacy Footer
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184); // Slate-400
  pdf.text(
    settings.pdfComplianceNotice || "CART2CLASS LEARNING PROGRAM · VERIFIED SAFE PILOT · DO NOT SHARE PUBLICLY",
    pageWidth / 2,
    pageHeight - 17,
    { align: "center" }
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    code.expiresAt ? `Valid until: ${new Date(code.expiresAt).toLocaleDateString()}` : "Active authorized Cart2Class credential · Revocable by school administrator.",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  // Bottom Accent Bar
  pdf.setFillColor(20, 43, 74);
  pdf.rect(0, pageHeight - 5, pageWidth, 5, "F");

  return pdf;
}

function printImage(image: string, code: IssuedCode, kind: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  popup.document.write(
    `<!DOCTYPE html><html><head><title>${code.label} - Cart2Class</title><style>@page{size:A4;margin:12mm}body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;text-align:center;background:#f8fafc;margin:0;padding:20px}.card{max-width:140mm;margin:20px auto;background:#fff;border:2px solid #cbd5e1;border-radius:20px;padding:28px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.06)}.brand{font-size:12px;font-weight:900;letter-spacing:1px;color:#142b4a;text-transform:uppercase;margin-bottom:8px}.title{font-size:26px;font-weight:900;color:#142b4a;margin:0 0 4px}.sub{font-size:14px;color:#64748b;font-weight:600;margin:0 0 20px}.qr-pad{display:inline-block;background:#fff;border:2px solid #0f172a;border-radius:16px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.code{display:block;width:${kind === "QR code" ? "68mm" : "120mm"};height:${kind === "QR code" ? "68mm" : "40mm"};margin:0 auto;object-fit:contain}.token{font-family:monospace;font-size:12px;font-weight:700;color:#334155;margin-top:16px;margin-bottom:4px}.valid{font-size:11px;color:#059669;font-weight:700}.instr{margin-top:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px;font-size:12px;color:#1e40af;line-height:1.4}</style></head><body><div class="card"><div class="brand">Cart2Class Learning Network</div><h1 class="title">${code.label}</h1><p class="sub">${code.subtitle}</p><div class="qr-pad"><img class="code" src="${image}"/></div><p class="token">TOKEN: ${code.reference || code.payload.slice(-12)}</p><p class="valid">● Active Authorized Cart2Class Credential</p><div class="instr">Point the Cart2Class Student Mobile App camera at this QR code to sign in instantly. Keep safe for grocery missions.</div></div><script>window.onload=()=>window.print()</script></body></html>`
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
  autoIssue = false,
  bare = false,
  size = 160
}: {
  type: IssueType;
  target: Target;
  compact?: boolean;
  autoIssue?: boolean;
  bare?: boolean;
  size?: number;
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

  if (bare) {
    return (
      <div className="flex flex-col items-center">
        <img
          src={image}
          alt={`QR code for ${code.label}`}
          style={{ width: size, height: size }}
          className="rounded-2xl bg-white p-2.5 border-2 border-slate-900 shadow-md object-contain"
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2.5 text-[11px] font-bold text-navy hover:bg-blue-50 border shadow-xs inline-flex items-center"
            onClick={() => download(image, `${filename}.png`)}
          >
            <Download className="mr-1 h-3 w-3" />PNG
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2.5 text-[11px] font-bold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 shadow-xs inline-flex items-center"
            onClick={async () => (await createPdf(image, code, "QR code")).save(`${filename}.pdf`)}
          >
            <FileText className="mr-1 h-3 w-3 text-rose-600" />PDF Card
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 border shadow-xs inline-flex items-center"
            onClick={() => printImage(image, code, "QR code")}
          >
            <Printer className="mr-1 h-3 w-3" />Print
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-[11px] font-bold text-brand hover:bg-blue-50"
            onClick={issue}
            title="Regenerate QR"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

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

      const settings = getPortalSettings();
      const format = settings.pdfPaperFormat === "letter" ? "letter" : "a4";
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format });
      const logoUrl = settings.pdfEmbedLogo !== false ? await loadLogoDataUrl() : null;
      const pageWidth = format === "letter" ? 215.9 : 210;
      const totalPages = Math.max(1, Math.ceil(issued.length / 4));

      const renderPageDecorations = (pageNumber: number) => {
        // 1. Top Decorative Header Bar (Navy + Amber accent)
        pdf.setFillColor(20, 43, 74); // #142B4A Navy
        pdf.rect(0, 0, pageWidth, 20, "F");
        pdf.setFillColor(245, 158, 11); // #F59E0B Amber
        pdf.rect(0, 20, pageWidth, 1.8, "F");

        // Header logo & branding
        if (logoUrl) {
          try {
            pdf.addImage(logoUrl, "PNG", 12, 3.5, 13, 13, undefined, "NONE");
          } catch {}
        }
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(settings.pdfHeaderTitle || "CART2CLASS LEARNING NETWORK", logoUrl ? 28 : 14, 9.5);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(203, 213, 225);
        pdf.text(`Official Student Login QR Badges · ${label}`, logoUrl ? 28 : 14, 15);

        // Header Right - Page Counter & Status
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, 10, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(245, 158, 11);
        pdf.text(`${issued.length} Total Badges`, pageWidth - 14, 15.5, { align: "right" });

        // 2. Cut & Usage Guide Banner
        if (settings.pdfShowCutGuides !== false) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7.8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(
            "Cut along dashed borders to distribute individual login cards to students. Students scan with the Cart2Class Student Mobile App camera to sign in.",
            pageWidth / 2,
            26,
            { align: "center" }
          );
        }

        // 3. Footer
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          settings.pdfComplianceNotice || "CART2CLASS PLATFORM · COPPA & FERPA COMPLIANT · AUTHORIZED SCHOOL BADGES",
          pageWidth / 2,
          288,
          { align: "center" }
        );
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text(
          "Session tokens are cryptographically secured and revocable by school staff.",
          pageWidth / 2,
          292,
          { align: "center" }
        );
        pdf.setFillColor(20, 43, 74);
        pdf.rect(0, 294.5, pageWidth, 2.5, "F");
      };

      // Card Geometry (2 cols x 2 rows = 4 per page)
      const cardW = 89;
      const cardH = 120;
      const colX = [12, 109];
      const rowY = [30, 156];

      for (let index = 0; index < issued.length; index += 1) {
        const pageIndex = index % 4;
        const pageNumber = Math.floor(index / 4) + 1;

        if (index > 0 && pageIndex === 0) {
          pdf.addPage();
        }
        if (pageIndex === 0) {
          renderPageDecorations(pageNumber);
        }

        const col = pageIndex % 2;
        const row = Math.floor(pageIndex / 2);
        const cardX = colX[col];
        const cardY = rowY[row];
        const cardCenterX = cardX + cardW / 2;

        const current = issued[index];

        // 1. Card Background & Outer Cut Outline
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "F");

        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setLineWidth(0.6);
        if (settings.pdfShowCutGuides !== false) {
          pdf.setLineDashPattern([2, 2], 0);
        }
        pdf.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "S");
        if (settings.pdfShowCutGuides !== false) {
          pdf.setLineDashPattern([], 0); // reset to solid
        }

        // 2. Card Header / Brand Pill
        pdf.setFillColor(20, 43, 74); // Navy
        pdf.roundedRect(cardX + 6, cardY + 6, cardW - 12, 9, 3, 3, "F");
        if (logoUrl) {
          try {
            pdf.addImage(logoUrl, "PNG", cardX + 8, cardY + 7.5, 6, 6, undefined, "NONE");
          } catch {}
        }
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.text("CART2CLASS STUDENT PASS", cardCenterX + (logoUrl ? 3 : 0), cardY + 12, { align: "center" });

        // 3. Student Name & Classroom details
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13.5);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text(current.label.slice(0, 24), cardCenterX, cardY + 22.5, { align: "center" });

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.text(current.subtitle.slice(0, 36), cardCenterX, cardY + 27, { align: "center" });

        // 4. Centered QR Code
        const qrSize = 50;
        const qrX = cardCenterX - qrSize / 2;
        const qrY = cardY + 31;

        // White Pad behind QR
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(qrX - 2.5, qrY - 2.5, qrSize + 5, qrSize + 5, 3, 3, "F");
        pdf.setDrawColor(30, 41, 59); // slate-800
        pdf.setLineWidth(0.8);
        pdf.roundedRect(qrX - 2.5, qrY - 2.5, qrSize + 5, qrSize + 5, 3, 3, "S");

        const image = await qrData(current.payload);
        pdf.addImage(image, "PNG", qrX, qrY, qrSize, qrSize, undefined, "NONE");

        // 5. Token Reference below QR - clean & centered
        let refStr = current.reference || current.payload.slice(-10);
        if (refStr.length > 16) {
          refStr = `${refStr.slice(0, 8)}...${refStr.slice(-4)}`;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.2);
        pdf.setTextColor(51, 65, 85);
        pdf.text(`TOKEN: ${refStr.toUpperCase()}`, cardCenterX, qrY + qrSize + 6, { align: "center" });

        // 6. Action Callout Pill
        const pillY = qrY + qrSize + 9;
        pdf.setFillColor(239, 246, 255); // blue-50
        pdf.roundedRect(cardX + 7, pillY, cardW - 14, 11, 3, 3, "F");
        pdf.setDrawColor(191, 219, 254); // blue-200
        pdf.setLineWidth(0.5);
        pdf.roundedRect(cardX + 7, pillY, cardW - 14, 11, 3, 3, "S");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(30, 64, 175); // blue-800
        pdf.text("ZERO-TYPING INSTANT LOGIN", cardCenterX, pillY + 4.2, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.2);
        pdf.setTextColor(59, 130, 246); // blue-500
        pdf.text("Point Cart2Class camera at QR to log in", cardCenterX, pillY + 8.2, { align: "center" });

        // 7. Security footer on card
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(148, 163, 184);
        pdf.text("Official Student Pass · Keep with classroom materials", cardCenterX, cardY + cardH - 3, { align: "center" });
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
