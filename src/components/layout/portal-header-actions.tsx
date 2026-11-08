"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, Upload, Link2, X, Check, AlertCircle, Shield, Mail, ArrowUpRight } from "lucide-react";
import { roleAccents, roleLabels } from "@/lib/constants/roles";
import type { Profile, Role } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { updateMyProfile } from "@/features/authentication/profile-actions";

const headerNav: Record<Role, { name: string; href: string }[]> = {
  admin: [
    { name: "Overview", href: "/admin" },
    { name: "Schools", href: "/admin/schools" },
    { name: "Users", href: "/admin/users" },
    { name: "Stores", href: "/admin/stores" },
    { name: "Missions", href: "/admin/missions" },
    { name: "Library", href: "/admin/library" },
    { name: "Reports", href: "/admin/reports" }
  ],
  teacher: [
    { name: "Overview", href: "/teacher" },
    { name: "Classes", href: "/teacher/classes" },
    { name: "Students", href: "/teacher/students" },
    { name: "Missions", href: "/teacher/missions" },
    { name: "Library", href: "/teacher/library" },
    { name: "Reviews", href: "/teacher/recordings" }
  ],
  parent: [
    { name: "Overview", href: "/parent" },
    { name: "Children", href: "/parent/children" },
    { name: "Progress", href: "/parent/progress" },
    { name: "Leaderboard", href: "/parent/leaderboard" },
    { name: "Recordings", href: "/parent/recordings" }
  ],
  store: [
    { name: "Overview", href: "/store" },
    { name: "Check-in", href: "/store/check-in" },
    { name: "Products", href: "/store/products" },
    { name: "Participation", href: "/store/participation" },
    { name: "Rewards", href: "/store/rewards" },
    { name: "Profile", href: "/store/profile" }
  ]
};

const roleCta: Record<Role, { label: string; href: string }> = {
  admin: { label: "+ Add Record ↗", href: "/admin/schools" },
  teacher: { label: "+ Add Student ↗", href: "/teacher/students" },
  parent: { label: "+ Link Child ↗", href: "/parent/children" },
  store: { label: "Scan QR ↗", href: "/store/check-in" }
};

export function PortalHeaderActions({
  role,
  profile
}: {
  role: Role;
  profile: Profile;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [previewAvatar, setPreviewAvatar] = useState(profile.avatar_url || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDisplayName(profile.display_name);
    setAvatarUrl(profile.avatar_url || "");
    setPreviewAvatar(profile.avatar_url || "");
  }, [profile.display_name, profile.avatar_url]);

  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit Check
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File exceeds the 5MB size limit. Please choose a smaller photo.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatar(objectUrl);
  };

  const handleUrlChange = (url: string) => {
    setAvatarUrl(url);
    if (!selectedFile) {
      setPreviewAvatar(url);
    }
  };

  const tabs = headerNav[role] || [];
  const cta = roleCta[role];

  return (
    <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
      {/* Center Segmented Capsule Navigation (DevEngine Style) */}
      <nav
        aria-label="Quick navigation"
        className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100/80 p-1 shadow-inner mx-auto max-w-2xl overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive =
            tab.href.split("/").length === 2
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-cyan-50 font-black text-cyan-950 border border-cyan-300/80 shadow-xs"
                  : "text-slate-600 hover:text-navy hover:bg-white/70"
              }`}
            >
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              )}
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Controls: Cyan Pill CTA + Bell + Avatar (DevEngine Style) */}
      <div className="ml-auto flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Vibrant Cyan Pill Button (Matching "Build Together ↗") */}
        {cta && (
          <Link
            href={cta.href}
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs px-4 py-2 shadow-[0_4px_14px_rgba(6,182,212,0.35)] transition hover:scale-105 active:scale-95"
          >
            <span>{cta.label}</span>
          </Link>
        )}

        {/* Circular Notification Bell Button */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setShowNotificationModal(true)}
          className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition hover:scale-105 active:scale-95 focus:outline-none"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-amber-500" />
        </button>

        {/* Circular Profile Avatar with Glowing Cyan Ring */}
        <button
          type="button"
          onClick={() => {
            setPreviewAvatar(avatarUrl);
            setSelectedFile(null);
            setFileError(null);
            setShowProfileModal(true);
          }}
          className="relative grid h-10 w-10 place-items-center rounded-full ring-2 ring-cyan-400 ring-offset-2 overflow-hidden shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition focus:outline-none shrink-0 bg-white"
          title={`Edit Profile (${displayName})`}
        >
          {previewAvatar ? (
            <img
              src={previewAvatar}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              onError={() => setPreviewAvatar("")}
            />
          ) : (
            <span
              className="grid h-full w-full place-items-center text-xs font-black text-white"
              style={{ backgroundColor: roleAccents[role] }}
            >
              {initials}
            </span>
          )}
        </button>
      </div>

      {/* 1. NOTIFICATIONS COMING SOON MODAL (Mounted directly to document.body via Portal) */}
      {mounted &&
        showNotificationModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
            <div className="relative z-[10000] max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 my-auto">
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
                <Bell className="h-8 w-8 animate-bounce" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand ring-4 ring-white" />
              </div>

              <div>
                <span className="inline-block rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-black uppercase tracking-wider mb-2">
                  Feature Preview
                </span>
                <h2 className="text-2xl font-black text-navy">Notifications Coming Soon</h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  You&apos;re all caught up! Real-time alerts for grocery store check-ins, student mission submissions, and classroom star rewards will be delivered directly here.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setShowNotificationModal(false)}
                  className="w-full bg-navy hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl shadow-md"
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2. PROFILE SETTINGS MODAL (Mounted directly to document.body via Portal - NEVER HIDES BEHIND SCREEN) */}
      {mounted &&
        showProfileModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
            <div className="relative z-[10000] max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-black tracking-widest text-brand uppercase">My Account</span>
                  <h2 className="text-2xl font-black text-navy mt-0.5">Profile Settings</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Success Toast inside modal */}
              {successToast && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-1">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* Error Message */}
              {fileError && (
                <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <form
                action={async (fd) => {
                  setFileError(null);
                  setIsSaving(true);
                  if (selectedFile) {
                    fd.set("avatarFile", selectedFile);
                  }
                  const res = await updateMyProfile(fd);
                  setIsSaving(false);
                  if (res?.error) {
                    setFileError(res.error);
                  } else {
                    setDisplayName(res.displayName || displayName);
                    if (res.avatarUrl) {
                      setAvatarUrl(res.avatarUrl);
                      setPreviewAvatar(res.avatarUrl);
                    }
                    setSuccessToast("Profile successfully updated!");
                    setTimeout(() => {
                      setSuccessToast(null);
                      setShowProfileModal(false);
                    }, 1200);
                  }
                }}
                className="space-y-4"
              >
                {/* Profile Avatar & Upload */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="relative h-20 w-20 max-h-20 max-w-20 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs flex items-center justify-center">
                    {previewAvatar ? (
                      <img
                        src={previewAvatar}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="h-20 w-20 max-h-20 max-w-20 w-full h-full object-cover"
                        onError={() => setPreviewAvatar("")}
                      />
                    ) : (
                      <span
                        className="grid h-full w-full place-items-center text-xl font-black text-white"
                        style={{ backgroundColor: roleAccents[role] }}
                      >
                        {initials}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs font-black text-navy uppercase tracking-wider">Profile Photo</p>
                    <p className="text-[11px] text-muted">Upload local image (Max 5MB) or enter URL</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-navy bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-xl shadow-2xs transition">
                        <Upload className="h-3.5 w-3.5 text-brand" /> Upload Photo
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>

                      {previewAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl("");
                            setPreviewAvatar("");
                            setSelectedFile(null);
                          }}
                          className="text-xs font-bold text-rose-600 hover:underline px-2 py-1.5"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Paste Image URL Field */}
                <label className="block text-xs font-bold text-muted">
                  Or Paste Image Link
                  <div className="relative mt-1">
                    <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                    <input
                      name="avatarUrl"
                      value={avatarUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://example.com/photo.png"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-normal text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                </label>

                {/* Display Name (Editable) */}
                <label className="block text-sm font-bold text-ink">
                  Full Name / Display Name
                  <input
                    required
                    name="displayName"
                    defaultValue={displayName}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal text-ink focus:border-brand focus:outline-none"
                  />
                </label>

                {/* Email Address (Immutable / Disabled) */}
                <label className="block text-sm font-bold text-ink">
                  Email Address
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      disabled
                      value={profile.email || "Managed by Admin"}
                      className="block h-10 w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted mt-1 block">
                    Email address is managed by A.L.M.A. administration and cannot be changed.
                  </span>
                </label>

                {/* Account Role Badge */}
                <div className="flex items-center justify-between panel bg-slate-50 p-3 rounded-xl border text-xs">
                  <span className="font-bold text-muted">Portal Access Level:</span>
                  <span className="font-black text-brand uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> {roleLabels[role]}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-navy text-white font-bold h-10"
                  >
                    {isSaving ? "Saving..." : "Save Profile Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowProfileModal(false)}
                    className="h-10 px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

