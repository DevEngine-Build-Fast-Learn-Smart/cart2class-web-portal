"use client";

import { useEffect, useState } from "react";

export interface PortalSettings {
  // Dynamic Branding
  logoUrl: string; // custom logo (data URL or external URL) or "" for default
  logoSource: "default" | "file" | "url";
  platformName: string;
  tagline: string;
  organizationName: string;
  primaryColor: string;

  // PDF Export Settings
  pdfPaperFormat: "a4" | "letter";
  pdfHeaderTitle: string;
  pdfHeaderSubtitle: string;
  pdfShowCutGuides: boolean;
  pdfEmbedLogo: boolean;
  pdfTokenDisplay: "short" | "full" | "masked";
  pdfComplianceNotice: string;

  // Academic & Program Governance
  schoolYear: string;
  maxStudentsPerClass: number;
  qrCodeExpiryPolicy: "never" | "30_days" | "90_days" | "school_year";
  allowParentSelfLink: boolean;
  requireTeacherVerification: boolean;

  // Store Rules
  storeCheckinFrequency: "weekly" | "monthly" | "manual";
  maxStarsPerVisit: number;
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  logoUrl: "",
  logoSource: "default",
  platformName: "Cart2Class",
  tagline: "Everyday learning, thoughtfully connected",
  organizationName: "A.L.M.A. Demo Organization",
  primaryColor: "#142B4A",

  pdfPaperFormat: "a4",
  pdfHeaderTitle: "CART2CLASS LEARNING NETWORK",
  pdfHeaderSubtitle: "A.L.M.A. Verified Official Educational Credential",
  pdfShowCutGuides: true,
  pdfEmbedLogo: true,
  pdfTokenDisplay: "short",
  pdfComplianceNotice: "CART2CLASS PLATFORM · COPPA & FERPA COMPLIANT · AUTHORIZED SCHOOL BADGES",

  schoolYear: "2026–2027",
  maxStudentsPerClass: 30,
  qrCodeExpiryPolicy: "school_year",
  allowParentSelfLink: true,
  requireTeacherVerification: false,

  storeCheckinFrequency: "monthly",
  maxStarsPerVisit: 5
};

const STORAGE_KEY = "cart2class_portal_settings_v1";
const SETTINGS_EVENT = "cart2class:settings-updated";

export function getPortalSettings(): PortalSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PORTAL_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PORTAL_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PORTAL_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PORTAL_SETTINGS;
  }
}

export function savePortalSettings(settings: Partial<PortalSettings>): PortalSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PORTAL_SETTINGS, ...settings };
  }
  try {
    const current = getPortalSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save portal settings:", err);
    return getPortalSettings();
  }
}

export function resetPortalSettings(): PortalSettings {
  if (typeof window === "undefined") return DEFAULT_PORTAL_SETTINGS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: DEFAULT_PORTAL_SETTINGS }));
    return DEFAULT_PORTAL_SETTINGS;
  } catch {
    return DEFAULT_PORTAL_SETTINGS;
  }
}

export function usePortalSettings() {
  const [settings, setSettings] = useState<PortalSettings>(getPortalSettings);

  useEffect(() => {
    // Initial sync
    setSettings(getPortalSettings());

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<PortalSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getPortalSettings());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return {
    settings,
    saveSettings: savePortalSettings,
    resetSettings: resetPortalSettings
  };
}

