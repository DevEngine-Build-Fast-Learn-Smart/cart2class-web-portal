import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  Store,
  ShieldAlert
} from "lucide-react";
import { LoginForm } from "./login-form";
import type { Role } from "@/types/domain";

const publicLinks = [
  ["Privacy", "/privacy-policy"],
  ["Terms", "/terms-and-conditions"],
  ["Data deletion", "/data-deletion"],
  ["Child safety", "/child-safety"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

interface RoleTheme {
  name: string;
  badgeLabel: string;
  badgeIcon: any;
  leftBg: string;
  glowTop: string;
  glowBottom: string;
  tagColor: string;
  tagText: string;
  headline: string;
  subtitle: string;
  securityText: string;
  securityColor: string;
  badgePillClass: string;
  buttonClass: string;
  cardEyebrow: string;
  cardTitle: string;
  cardSubtitle: string;
  accentHex: string;
}

const roleThemes: Record<Role, RoleTheme> = {
  admin: {
    name: "Super Admin",
    badgeLabel: "Super Admin",
    badgeIcon: ShieldAlert,
    leftBg: "bg-gradient-to-br from-[#071329] via-[#0F2342] to-[#142B4A]",
    glowTop: "bg-blue-400/20",
    glowBottom: "bg-cyan-400/15",
    tagColor: "text-cyan-300",
    tagText: "A.L.M.A. DISTRICT GOVERNANCE & OVERSIGHT",
    headline: "Orchestrate district learning at community scale.",
    subtitle:
      "Manage curriculum standards, school enrollments, store partnerships, and enterprise COPPA compliance across your entire learning network.",
    securityText: "Certified FERPA & COPPA Enterprise Governance",
    securityColor: "text-cyan-300",
    badgePillClass: "bg-blue-50 text-blue-800 border-blue-200",
    buttonClass: "w-full h-11 text-base font-bold bg-[#142B4A] hover:bg-[#1C3B66] text-white shadow-lg shadow-blue-950/20",
    cardEyebrow: "SUPER ADMIN ACCESS",
    cardTitle: "Super Admin Sign In",
    cardSubtitle: "Sign in with your authorized district or system administrator credentials.",
    accentHex: "#142B4A"
  },
  parent: {
    name: "Parents & Guardians",
    badgeLabel: "Parent Portal",
    badgeIcon: HeartHandshake,
    leftBg: "bg-gradient-to-br from-[#78350F] via-[#92400E] to-[#B45309]",
    glowTop: "bg-amber-300/30",
    glowBottom: "bg-yellow-400/25",
    tagColor: "text-amber-200",
    tagText: "FAMILY DISCOVERY & HOME LEARNING",
    headline: "Turn every aisle into a joyful learning quest.",
    subtitle:
      "Track your child's phonics achievements, listen to in-store reading recordings, and celebrate real-world grocery store learning milestones together.",
    securityText: "100% Kid Safe & COPPA Privacy Protected",
    securityColor: "text-amber-200",
    badgePillClass: "bg-amber-50 text-amber-900 border-amber-300",
    buttonClass: "w-full h-11 text-base font-bold bg-[#D97706] hover:bg-[#B45309] text-white shadow-lg shadow-amber-900/20",
    cardEyebrow: "PARENT & GUARDIAN ACCESS",
    cardTitle: "Parent Portal Sign In",
    cardSubtitle: "Sign in with your family account or school-provided invitation code.",
    accentHex: "#D97706"
  },
  teacher: {
    name: "Teachers",
    badgeLabel: "Teacher Workspace",
    badgeIcon: GraduationCap,
    leftBg: "bg-gradient-to-br from-[#3B0764] via-[#581C87] to-[#4C1D95]",
    glowTop: "bg-purple-400/25",
    glowBottom: "bg-fuchsia-400/20",
    tagColor: "text-purple-200",
    tagText: "CLASSROOM EXTENSION & REAL-WORLD PRACTICE",
    headline: "Bring your classroom into the neighborhood.",
    subtitle:
      "Assign standards-aligned grocery missions, track phonemic mastery, review student voice recordings, and celebrate class reward goals in real time.",
    securityText: "Standards-Aligned K-2 Literacy & Math Tools",
    securityColor: "text-purple-200",
    badgePillClass: "bg-purple-50 text-purple-900 border-purple-200",
    buttonClass: "w-full h-11 text-base font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-950/20",
    cardEyebrow: "TEACHER WORKSPACE",
    cardTitle: "Teacher Sign In",
    cardSubtitle: "Sign in to manage your classes, student missions, and learning telemetry.",
    accentHex: "#7C3AED"
  },
  store: {
    name: "Store Partners",
    badgeLabel: "Store Kiosk",
    badgeIcon: Store,
    leftBg: "bg-gradient-to-br from-[#022C22] via-[#064E3B] to-[#065F46]",
    glowTop: "bg-emerald-400/25",
    glowBottom: "bg-teal-400/20",
    tagColor: "text-emerald-200",
    tagText: "COMMUNITY RETAIL PARTNER NETWORK",
    headline: "Transform your store into a community classroom.",
    subtitle:
      "Verify kid-friendly discovery carts, scan educational produce barcodes, celebrate learner milestones, and give back to local school families.",
    securityText: "Verified Community Store Partner Kiosk",
    securityColor: "text-emerald-200",
    badgePillClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
    buttonClass: "w-full h-11 text-base font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-lg shadow-emerald-950/20",
    cardEyebrow: "STORE PARTNER KIOSK",
    cardTitle: "Store Partner Sign In",
    cardSubtitle: "Sign in to access your store kiosk, barcode catalog, and school check-ins.",
    accentHex: "#059669"
  }
};

const allRoles: { role: Role; label: string; url: string }[] = [
  { role: "admin", label: "Super Admin", url: "/super-admin" },
  { role: "teacher", label: "Teacher", url: "/teacher" },
  { role: "parent", label: "Parent", url: "/parent" },
  { role: "store", label: "Store", url: "/store" }
];

export function RoleLoginView({ role }: { role: Role }) {
  const theme = roleThemes[role];
  const BadgeIcon = theme.badgeIcon;
  const otherRoles = allRoles.filter((r) => r.role !== role);

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.12fr_.88fr]">
      {/* 1. LEFT ADVERTISING PANEL (Role-tailored background & advertising content) */}
      <section
        className={`relative hidden overflow-hidden ${theme.leftBg} px-12 py-10 text-white lg:flex lg:flex-col xl:px-20 xl:py-14 transition-colors duration-500`}
      >
        {/* Ambient Glowing Orbs */}
        <div
          className={`pointer-events-none absolute -right-36 -top-36 h-[32rem] w-[32rem] rounded-full ${theme.glowTop} blur-3xl`}
        />
        <div
          className={`pointer-events-none absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full ${theme.glowBottom} blur-3xl`}
        />

        {/* Top Header: Logo + Brand + Home link */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-1.5 shadow-xl shadow-black/20">
              <Image
                src="/cart2class-logo.png"
                width={64}
                height={64}
                alt="Cart2Class logo"
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight">Cart2Class</p>
              <p className={`mt-0.5 text-sm font-bold ${theme.tagColor}`}>
                A.L.M.A. Learning Portal
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>

        {/* Center Advertising Content */}
        <div className="relative my-auto max-w-3xl py-12">
          {/* Big White Card with Cart2Class Mascot */}
          <div className="mb-8 grid h-36 w-36 place-items-center rounded-[2rem] bg-white p-3 shadow-2xl shadow-black/25 xl:h-44 xl:w-44">
            <Image
              src="/cart2class-logo.png"
              width={176}
              height={176}
              alt="Cart2Class"
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Role Eyebrow Tag */}
          <p
            className={`flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] ${theme.tagColor}`}
          >
            <Sparkles className="h-4 w-4" />
            {theme.tagText}
          </p>

          {/* Large Headline */}
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl 2xl:text-7xl">
            {theme.headline}
          </h1>

          {/* Rich Subtitle */}
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 xl:text-xl xl:leading-9">
            {theme.subtitle}
          </p>

          {/* Active Portal Badge */}
          <div className="mt-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md">
              <BadgeIcon className="h-4 w-4" />
              {theme.badgeLabel} Active
            </span>
          </div>
        </div>

        {/* Bottom Security / Privacy Pill */}
        <p className="relative flex items-center gap-3 text-sm font-semibold text-white/80">
          <ShieldCheck className={`h-5 w-5 ${theme.securityColor}`} />
          {theme.securityText}
        </p>
      </section>

      {/* 2. RIGHT FORM SECTION */}
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-xl">
          {/* Mobile Top Header */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1 shadow-panel">
                  <Image
                    src="/cart2class-logo.png"
                    width={48}
                    height={48}
                    alt="Cart2Class logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-2xl font-extrabold tracking-tight text-navy">Cart2Class</p>
                  <p className="text-xs font-bold text-muted">{theme.badgeLabel}</p>
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
              >
                <ArrowLeft className="h-3 w-3" />
                Home
              </Link>
            </div>
          </div>

          {/* Main Login Card */}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(20,43,74,.10)] sm:p-10">
            {/* Header Badge */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${theme.badgePillClass}`}
              >
                <BadgeIcon className="h-3.5 w-3.5" />
                {theme.badgeLabel}
              </span>

              <span className="text-[11px] font-bold text-slate-400">
                Single-Role Portal
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {theme.cardTitle}
            </h2>
            <p className="mt-2.5 max-w-md text-sm leading-6 text-muted sm:text-base">
              {theme.cardSubtitle}
            </p>

            {/* Login Form with hidden expectedRole for strict credential enforcement */}
            <div className="mt-8">
              <LoginForm
                expectedRole={role}
                buttonClassName={theme.buttonClass}
              />
            </div>

            {/* Portal Switcher */}
            <div className="mt-8 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500">
                Need a different portal? Switch to:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {otherRoles.map((r) => (
                  <Link
                    key={r.role}
                    href={r.url}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {r.label}
                    <ArrowUpRight className="h-3 w-3 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Public Links Footer */}
          <footer className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-muted">
              {publicLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition hover:text-brand hover:underline"
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1 text-xs text-muted">
              © Cart2Class <ArrowUpRight className="h-3.5 w-3.5" /> Public information and support
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

