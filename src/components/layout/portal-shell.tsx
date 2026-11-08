"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X, Sparkles } from "lucide-react";
import { logout } from "@/features/authentication/actions";
import { roleAccents, roleLabels } from "@/lib/constants/roles";
import type { Profile, Role } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SidebarNavigation } from "./sidebar-navigation";
import { BrandLogo, BrandName } from "@/components/shared/brand-logo";
import { PortalHeaderActions } from "./portal-header-actions";

export function PortalShell({
  children,
  role,
  profile
}: {
  children: React.ReactNode;
  role: Role;
  profile: Profile;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = profile.display_name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* 1. UNIQUE FLOATING CAPSULE SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col h-[calc(100vh-2rem)] sticky top-4 m-4 rounded-3xl bg-[#080f20]/95 backdrop-blur-xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(2,12,27,0.5)] p-5 text-slate-200 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Brand Header */}
        <Link
          href={`/${role}`}
          className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-cyan-950/30 ring-2 ring-cyan-400/30">
            <BrandLogo width={44} height={44} priority />
          </span>
          <div>
            <BrandName />
            <span className="block text-[10px] font-mono text-cyan-400 font-bold tracking-wider">
              ALMA v2.0 • Online
            </span>
          </div>
        </Link>

        {/* Role Pill Badge */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
              {roleLabels[role]}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Portal
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
          <SidebarNavigation role={role} />
        </div>

        {/* Bottom User Profile Mini-Card & Sign Out */}
        <div className="mt-auto border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-2.5">
            <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden ring-1 ring-cyan-400/40 grid place-items-center bg-white shadow-xs">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="grid h-full w-full place-items-center text-xs font-black text-white"
                  style={{ backgroundColor: roleAccents[role] }}
                >
                  {initials}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate leading-tight">
                {profile.display_name}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {profile.email || "Active User"}
              </p>
            </div>
          </div>

          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="h-10 w-full justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-200 transition"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE DRAWER */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-navy/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-[290px] h-[calc(100vh-2rem)] m-4 rounded-3xl bg-[#080f20] border border-white/15 p-5 shadow-2xl text-slate-200 overflow-y-auto overflow-x-hidden scrollbar-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1">
                  <BrandLogo width={36} height={36} />
                </span>
                <BrandName />
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
              <SidebarNavigation
                role={role}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>

            <div className="mt-auto border-t border-white/10 pt-4">
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-10 w-full justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT AREA WITH FLOATING PILL HEADER */}
      <div className="min-w-0 flex flex-col">
        {/* Modern Floating Capsule Header (DevEngine Style) */}
        <header className="sticky top-3 z-30 mx-3 sm:mx-6 lg:mx-8 my-3 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-navy lg:hidden focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Left Brand Badge on Mobile/Small Screen */}
          <Link
            href={`/${role}`}
            className="flex items-center gap-2 lg:hidden shrink-0"
          >
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white border border-slate-200 p-0.5">
              <BrandLogo width={28} height={28} />
            </span>
            <span className="font-black text-navy text-sm hidden sm:inline">
              Cart2Class
            </span>
          </Link>

          {/* Center Capsule Tabs & Right Controls */}
          <PortalHeaderActions role={role} profile={profile} />
        </header>

        {/* Content View */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
