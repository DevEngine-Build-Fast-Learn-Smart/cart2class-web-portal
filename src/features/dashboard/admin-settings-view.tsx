"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Building2,
  FileText,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Eye,
  Settings,
  Sparkles,
  Sliders,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalSettings, type PortalSettings } from "@/lib/portal-settings";

type Row = Record<string, unknown>;

export function AdminSettingsView({
  organizations = []
}: {
  organizations: Row[];
}) {
  const { settings, saveSettings, resetSettings } = usePortalSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state initialized from persistent portal settings
  const [formData, setFormData] = useState<PortalSettings>(settings);
  const [urlInput, setUrlInput] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"branding" | "pdf" | "governance" | "stores">("branding");

  // Keep local state in sync when settings update
  const updateField = <K extends keyof PortalSettings>(key: K, value: PortalSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // File Upload Handler (reads image file and converts to optimized Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, or SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 2MB. Please select a smaller logo file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateField("logoUrl", dataUrl);
        updateField("logoSource", "file");
        setSuccessMsg("Logo file loaded! Click 'Save Settings' to apply across the portal & PDFs.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // URL Link Handler
  const handleApplyUrl = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!urlInput.trim()) {
      setErrorMsg("Please enter a valid image URL.");
      return;
    }
    updateField("logoUrl", urlInput.trim());
    updateField("logoSource", "url");
    setSuccessMsg("Image URL loaded! Click 'Save Settings' to apply.");
  };

  // Reset Logo to Default
  const handleResetLogo = () => {
    updateField("logoUrl", "");
    updateField("logoSource", "default");
    setUrlInput("");
    setSuccessMsg("Reset logo to default Cart2Class logo. Click 'Save Settings' to apply.");
  };

  // Save All Settings
  const handleSave = () => {
    setErrorMsg(null);
    try {
      saveSettings(formData);
      setSuccessMsg("All organization settings & dynamic branding saved successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg("Failed to save settings. Please try again.");
    }
  };

  // Restore Factory Defaults
  const handleRestoreDefaults = () => {
    if (confirm("Restore all settings to platform factory defaults?")) {
      const defaults = resetSettings();
      setFormData(defaults);
      setUrlInput("");
      setSuccessMsg("Restored factory defaults.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <main className="page-shell space-y-7">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-black text-brand">
              <Settings className="h-3.5 w-3.5" />
              A.L.M.A. Administration
            </span>
            <span className="text-xs font-semibold text-slate-400">
              System Configuration & Branding
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize dynamic portal logos, PDF credential layouts, program governance, and grocery partner rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRestoreDefaults}
            className="h-10 rounded-xl border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw className="mr-2 h-4 w-4 text-slate-500" />
            Reset Defaults
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-10 rounded-xl bg-navy px-5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notifications Alert */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs font-bold text-emerald-900 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-xs font-bold text-rose-900 shadow-xs animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 pb-3">
        <nav className="flex flex-wrap gap-2">
          {[
            { id: "branding", label: "Dynamic Branding & Logo", icon: Palette },
            { id: "pdf", label: "PDF Export & Badges", icon: FileText },
            { id: "governance", label: "Program & Academic Rules", icon: ShieldCheck },
            { id: "stores", label: "Grocery Partner Policies", icon: Building2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-navy text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Dynamic Branding & Logo */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left Column: Logo Upload & Title Controls */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-navy">
                  Web Portal & Application Logo
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Upload an image file or provide a web link. This logo will automatically brand your sidebar, top navigation, and scannable PDFs.
                </p>
              </div>

              {/* Upload or Link Selector */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition hover:border-brand hover:bg-blue-50/30"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm text-brand">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-xs font-extrabold text-navy">
                      Upload Logo File
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      PNG, JPG, SVG up to 2MB
                    </p>
                  </div>

                  {/* URL Input Box */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-brand" />
                        <label className="text-xs font-extrabold text-navy">
                          Or Load from Image URL
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="mt-2.5 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleApplyUrl}
                      className="mt-3 h-8 w-full rounded-xl border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Fetch & Preview URL
                    </Button>
                  </div>
                </div>

                {/* Reset button if custom logo active */}
                {formData.logoUrl && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                    <span className="font-semibold">
                      Custom logo active ({formData.logoSource === "file" ? "Local file" : "Web URL"})
                    </span>
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="font-black text-rose-700 underline hover:text-rose-900"
                    >
                      Remove & Restore Default
                    </button>
                  </div>
                )}
              </div>

              {/* Text branding inputs */}
              <div className="grid gap-4 pt-4 border-t border-slate-100 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={formData.platformName}
                    onChange={(e) => updateField("platformName", e.target.value)}
                    placeholder="e.g. Cart2Class"
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Organization Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                    placeholder="e.g. A.L.M.A. Demo Organization"
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Platform Tagline & Mission Statement
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="e.g. Everyday learning, thoughtfully connected"
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Previews */}
            <div className="space-y-4">
              {/* Preview 1: Dark Sidebar Header */}
              <div className="rounded-2xl border border-slate-200 bg-navy p-5 text-white shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                  Live Preview · Dark Sidebar Header
                </span>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/10">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-md">
                    {formData.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Image
                        src="/cart2class-logo.png"
                        width={48}
                        height={48}
                        alt="Default logo"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight text-white">
                      {formData.platformName || "Cart2Class"}
                    </p>
                    <p className="text-xs font-bold text-teal-200">
                      A.L.M.A. Administrator
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Light PDF Credential Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Live Preview · Scannable PDF Pass
                </span>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100">
                    {formData.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Image
                        src="/cart2class-logo.png"
                        width={56}
                        height={56}
                        alt="Default logo"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-black text-navy">
                    {formData.platformName || "Cart2Class"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {formData.tagline || "Aisle Discovery Platform"}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                    ● Active Verified Digital Pass
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PDF Export & Badges Settings */}
      {activeTab === "pdf" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-navy">
              PDF Generation & Printing Parameters
            </h3>
            <p className="text-xs text-slate-500">
              Configure paper layout, header titles, scissor cut guides, and token security notices.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Default Paper Layout
              </label>
              <select
                value={formData.pdfPaperFormat}
                onChange={(e) => updateField("pdfPaperFormat", e.target.value as "a4" | "letter")}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="a4">Standard A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11.0 in)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                A4 is recommended for global school printing and standard badge sheets.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Token ID Format on Badges
              </label>
              <select
                value={formData.pdfTokenDisplay}
                onChange={(e) => updateField("pdfTokenDisplay", e.target.value as "short" | "full" | "masked")}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="short">Short 8-Character Reference (Recommended)</option>
                <option value="full">Full Cryptographic UUID</option>
                <option value="masked">Masked Security Token</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Controls the token text printed beneath the QR code.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PDF Top Header Title
              </label>
              <input
                type="text"
                value={formData.pdfHeaderTitle}
                onChange={(e) => updateField("pdfHeaderTitle", e.target.value)}
                placeholder="e.g. CART2CLASS LEARNING NETWORK"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PDF Top Header Subtitle
              </label>
              <input
                type="text"
                value={formData.pdfHeaderSubtitle}
                onChange={(e) => updateField("pdfHeaderSubtitle", e.target.value)}
                placeholder="e.g. A.L.M.A. Verified Official Educational Credential"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Legal & Compliance Notice (Printed on Footer)
              </label>
              <input
                type="text"
                value={formData.pdfComplianceNotice}
                onChange={(e) => updateField("pdfComplianceNotice", e.target.value)}
                placeholder="e.g. CART2CLASS PLATFORM · COPPA & FERPA COMPLIANT · AUTHORIZED SCHOOL BADGES"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Toggle Toggles */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-extrabold text-navy">
                  Show Scissors Cut Guides on Classroom Sheets
                </p>
                <p className="text-xs text-slate-500">
                  Renders dashed cut borders and scissor marks around each student ID card.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.pdfShowCutGuides}
                onChange={(e) => updateField("pdfShowCutGuides", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-extrabold text-navy">
                  Embed Organization Logo on Generated PDFs
                </p>
                <p className="text-xs text-slate-500">
                  Places your dynamic logo in the header of single and bulk PDF exports.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.pdfEmbedLogo}
                onChange={(e) => updateField("pdfEmbedLogo", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Program & Academic Governance */}
      {activeTab === "governance" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-navy">
              Academic & Family Governance Policies
            </h3>
            <p className="text-xs text-slate-500">
              Control enrollment maximums, parent code authorization, and student credential rotation.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active School Year
              </label>
              <input
                type="text"
                value={formData.schoolYear}
                onChange={(e) => updateField("schoolYear", e.target.value)}
                placeholder="2026–2027"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Max Learners Per Classroom
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.maxStudentsPerClass}
                onChange={(e) => updateField("maxStudentsPerClass", Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Student QR Code Expiry & Rotation Policy
              </label>
              <select
                value={formData.qrCodeExpiryPolicy}
                onChange={(e) => updateField("qrCodeExpiryPolicy", e.target.value as PortalSettings["qrCodeExpiryPolicy"])}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="school_year">Active for Full School Year (Recommended)</option>
                <option value="90_days">Quarterly Renewal (Every 90 Days)</option>
                <option value="30_days">Monthly Rotation (Every 30 Days)</option>
                <option value="never">Permanent Non-Expiring</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-extrabold text-navy">
                  Allow Parent Self-Linking with Invite Codes
                </p>
                <p className="text-xs text-slate-500">
                  Parents can enter codes like C2C-PAR-XXXX to link their child profile immediately.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allowParentSelfLink}
                onChange={(e) => updateField("allowParentSelfLink", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Grocery Partner Policies */}
      {activeTab === "stores" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-navy">
              Grocery Partner & Check-In Sign Rules
            </h3>
            <p className="text-xs text-slate-500">
              Manage storefront entrance sign lifecycle, aisle mission verification, and reward star limits.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Check-In Code Rotation Schedule
              </label>
              <select
                value={formData.storeCheckinFrequency}
                onChange={(e) => updateField("storeCheckinFrequency", e.target.value as PortalSettings["storeCheckinFrequency"])}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="monthly">Monthly Check-In Sign Rotation</option>
                <option value="weekly">Weekly Rotation (High Security)</option>
                <option value="manual">Manual Rotation by Store Manager</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Max Stars per Grocery Trip
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={formData.maxStarsPerVisit}
                onChange={(e) => updateField("maxStarsPerVisit", Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:col-span-2">
              <p className="text-xs font-black text-blue-950">
                COPPA Student Privacy Shield (Fixed Guarantee)
              </p>
              <p className="mt-1 text-xs text-blue-800">
                Under no circumstances do participating stores receive individual child names, device IDs, or personal photos. Stores receive only aggregate attendance metrics.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
