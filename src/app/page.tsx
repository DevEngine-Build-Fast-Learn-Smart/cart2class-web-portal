import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  Store,
  ShieldAlert,
  Volume2,
  Barcode,
  Mic,
  Calculator,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

const publicLinks = [
  ["Privacy Policy", "/privacy-policy"],
  ["Terms of Service", "/terms-and-conditions"],
  ["Data Deletion", "/data-deletion"],
  ["Child Safety", "/child-safety"],
  ["About A.L.M.A.", "/about"],
  ["Contact Support", "/contact"]
] as const;

const portalGateways = [
  {
    role: "admin",
    name: "Super Admin",
    title: "Super Admin & Governance",
    url: "/super-admin",
    colorName: "Blues",
    themeBg: "bg-gradient-to-br from-[#071329] via-[#0F2342] to-[#142B4A]",
    accentGlow: "bg-blue-400/20",
    pillColor: "bg-blue-400/20 text-cyan-200 border-blue-400/30",
    buttonClass: "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-900/40",
    icon: ShieldAlert,
    tagline: "District-Wide Curriculum & Enterprise Oversight",
    description:
      "Govern schools, approve mission libraries, monitor store partnerships, and inspect enterprise COPPA compliance.",
    highlights: [
      "School & classroom district administration",
      "Mission library review & global approvals",
      "Store partner kiosk onboarding & audits",
      "Certified FERPA / COPPA governance"
    ]
  },
  {
    role: "teacher",
    name: "Teachers",
    title: "Teacher Classroom Workspace",
    url: "/teacher",
    colorName: "Purple",
    themeBg: "bg-gradient-to-br from-[#2D0B4E] via-[#4A1577] to-[#6B21A8]",
    accentGlow: "bg-purple-400/20",
    pillColor: "bg-purple-400/20 text-purple-200 border-purple-400/30",
    buttonClass: "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-900/40",
    icon: GraduationCap,
    tagline: "Classroom Missions & Student Audio Telemetry",
    description:
      "Assign standards-aligned grocery missions, review student voice recordings, print QR cards, and award class stars.",
    highlights: [
      "Visual Mission Builder with picture choices",
      "Student voice recording player & feedback",
      "Printable student QR login cards & badges",
      "Real-time class star goal tracker"
    ]
  },
  {
    role: "parent",
    name: "Parents & Guardians",
    title: "Parent & Family Portal",
    url: "/parent",
    colorName: "Yellows",
    themeBg: "bg-gradient-to-br from-[#682B05] via-[#8D3B07] to-[#B45309]",
    accentGlow: "bg-amber-400/25",
    pillColor: "bg-amber-400/20 text-amber-200 border-amber-400/30",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-white shadow-amber-950/40",
    icon: HeartHandshake,
    tagline: "Celebrate Grocery Learning & Audio Memories",
    description:
      "Listen to in-store reading recordings, follow quest progress, celebrate grocery stars, and connect safely with family invite codes.",
    highlights: [
      "Listen to child voice reading recordings",
      "Track grocery stars & completed missions",
      "Instant student linking with safe invite codes",
      "100% ad-free & COPPA child privacy safe"
    ]
  },
  {
    role: "store",
    name: "Store Partners",
    title: "Store Partner Retail Kiosk",
    url: "/store",
    colorName: "Greens",
    themeBg: "bg-gradient-to-br from-[#022C22] via-[#064E3B] to-[#047857]",
    accentGlow: "bg-emerald-400/20",
    pillColor: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30",
    buttonClass: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/40",
    icon: Store,
    tagline: "Community Discovery Carts & Produce Barcodes",
    description:
      "Provide kid-friendly discovery carts, verify store check-ins, map produce barcodes, and champion neighborhood schools.",
    highlights: [
      "1-tap discovery cart PIN check-in kiosk",
      "Produce & grocery barcode mapping tool",
      "School engagement & foot-traffic metrics",
      "Community educational sponsorship"
    ]
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFEFE] text-slate-900 selection:bg-brand selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white p-1 shadow-md shadow-navy/10 border border-slate-100 transition group-hover:scale-105">
              <Image
                src="/cart2class-logo.png"
                width={48}
                height={48}
                alt="Cart2Class logo"
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-navy">Cart2Class</p>
              <p className="text-[11px] font-bold tracking-wide text-brand uppercase">
                A.L.M.A. Learning Portal
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex text-sm font-bold text-slate-600">
            <a href="#portals" className="transition hover:text-navy">
              The 4 Portals
            </a>
            <a href="#experience" className="transition hover:text-navy">
              Learning Missions
            </a>
            <a href="#safety" className="transition hover:text-navy">
              Child Safety
            </a>
            <Link href="/about" className="transition hover:text-navy">
              About
            </Link>
          </nav>

          {/* Quick Portal Switcher Pills */}
          <div className="flex items-center gap-2">
            <a
              href="#portals"
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-navy/20 transition hover:bg-slate-800"
            >
              Access Portals <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH VERY VERY LARGE CONTENT TEXT & FLOATING ANIMATIONS */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-36 bg-gradient-to-b from-slate-50 via-white to-slate-50/50">
        {/* Ambient background blur circles */}
        <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 h-[40rem] w-[55rem] rounded-full bg-blue-100/60 blur-3xl -z-10" />
        <div className="pointer-events-none absolute -left-20 top-72 h-[30rem] w-[30rem] rounded-full bg-amber-100/50 blur-3xl -z-10" />
        <div className="pointer-events-none absolute -right-20 top-80 h-[30rem] w-[30rem] rounded-full bg-purple-100/50 blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs sm:text-sm font-black text-blue-800 shadow-sm backdrop-blur-sm animate-pulse-soft">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>K-2 REAL-WORLD EDUCATIONAL ECOSYSTEM</span>
          </div>

          {/* VERY VERY LARGE CONTENT HEADLINE */}
          <h1 className="mt-8 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.93] text-navy">
            A Grocery Trip Can Grow a{" "}
            <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-amber-600 bg-clip-text text-transparent">
              Lifelong Learner.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="mt-8 max-w-4xl mx-auto text-lg sm:text-2xl md:text-3xl font-medium leading-relaxed sm:leading-relaxed text-slate-600">
            Turn everyday grocery shopping into standards-aligned reading, phonics, and math adventures. A connected learning community for families, teachers, store partners and A.L.M.A. administrators.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#portals"
              className="inline-flex items-center gap-2 rounded-2xl bg-navy px-8 py-4 text-base sm:text-lg font-black text-white shadow-xl shadow-navy/25 transition hover:scale-105 hover:bg-slate-800 active:scale-95"
            >
              Choose Your Role Portal
              <ArrowRight className="h-5 w-5" />
            </a>

            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-4 text-base sm:text-lg font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              COPPA Certified Safe
            </Link>
          </div>

          {/* Floating High-Quality Animated Badges */}
          <div className="mt-16 relative mx-auto max-w-5xl">
            {/* Center Mascot & Graphic Presentation */}
            <div className="relative mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white/90 p-6 sm:p-10 shadow-2xl shadow-navy/10 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-2 shadow-lg shadow-black/10 border border-slate-100">
                    <Image
                      src="/cart2class-logo.png"
                      width={64}
                      height={64}
                      alt="Cart2Class logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-navy">Cart2Class Mobile Kiosk</p>
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      100% Offline-Capable In Any Partner Store
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 bg-slate-100/80 px-3.5 py-1.5 rounded-full">
                  <span>Common Core K-2</span>
                  <span>·</span>
                  <span>A.L.M.A. Verified</span>
                </div>
              </div>

              {/* 4 Interactive Role Badges Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <Link
                  href="/super-admin"
                  className="group rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 transition hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900">Super Admin</span>
                    <ArrowRight className="h-3 w-3 text-blue-600 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-xs text-blue-700/80 font-medium">District Scale</p>
                  <p className="mt-2 text-[11px] font-black uppercase text-blue-800">/super-admin</p>
                </Link>

                <Link
                  href="/teacher"
                  className="group rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 transition hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900">Teachers</span>
                    <ArrowRight className="h-3 w-3 text-purple-600 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-xs text-purple-700/80 font-medium">Class Missions</p>
                  <p className="mt-2 text-[11px] font-black uppercase text-purple-800">/teacher</p>
                </Link>

                <Link
                  href="/parent"
                  className="group rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 transition hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900">Parents</span>
                    <ArrowRight className="h-3 w-3 text-amber-600 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-xs text-amber-700/80 font-medium">Family Audio</p>
                  <p className="mt-2 text-[11px] font-black uppercase text-amber-800">/parent</p>
                </Link>

                <Link
                  href="/store"
                  className="group rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">Store Partner</span>
                    <ArrowRight className="h-3 w-3 text-emerald-600 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-xs text-emerald-700/80 font-medium">Retail Kiosks</p>
                  <p className="mt-2 text-[11px] font-black uppercase text-emerald-800">/store</p>
                </Link>
              </div>
            </div>

            {/* Floating Live Simulation Badges around the Hero */}
            <div className="hidden lg:block absolute -top-8 -left-12 animate-float-slow">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-xl">
                  🍎
                </span>
                <div className="text-left">
                  <p className="text-xs font-black text-ink">Fruit Scout Mission</p>
                  <p className="text-[11px] font-bold text-amber-600">Found 3 Apples! +5 Stars ⭐</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -top-8 -right-12 animate-float-reverse">
              <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
                  <Mic className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-black text-ink">Voice Reading Quest</p>
                  <p className="text-[11px] font-bold text-purple-600">Reading Aloud Passed (100%)</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -left-14 animate-float-reverse">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Barcode className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-black text-ink">Produce Barcode Scanned</p>
                  <p className="text-[11px] font-bold text-emerald-600">Fresh Carrot · UPC Verified</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -right-14 animate-float-slow">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-black text-ink">Mrs. Taylor&apos;s Class</p>
                  <p className="text-[11px] font-bold text-blue-600">68/100 Stars · Goal Active 🌟</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 4 DEDICATED PORTALS SECTION WITH COLOR THEMES */}
      <section id="portals" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-[40rem] w-[40rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-[40rem] w-[40rem] rounded-full bg-purple-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-teal-300">
              <Sparkles className="h-3.5 w-3.5" />
              Role-Separated Portals
            </span>

            <h2 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">
              Four Portals. One United Ecosystem.
            </h2>

            <p className="mt-5 text-lg sm:text-xl text-slate-300 leading-relaxed">
              Each stakeholder has a dedicated, color-coded workspace with custom tools, strict credential validation, and FERPA/COPPA compliance.
            </p>
          </div>

          {/* 4 Large Interactive Role Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {portalGateways.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.role}
                  className={`relative rounded-[2.5rem] border border-white/15 ${item.themeBg} p-8 sm:p-10 shadow-2xl flex flex-col justify-between overflow-hidden group transition duration-300 hover:scale-[1.02] hover:shadow-black/50`}
                >
                  {/* Subtle orb glow */}
                  <div
                    className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full ${item.accentGlow} blur-2xl group-hover:scale-125 transition duration-500`}
                  />

                  <div>
                    {/* Top Pill & Icon */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wider ${item.pillColor}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name} · {item.colorName}
                      </span>

                      <span className="font-mono text-xs font-bold text-white/50 tracking-wider">
                        {item.url}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-white">
                      {item.title}
                    </h3>

                    {/* Tagline */}
                    <p className="mt-2 text-sm font-bold text-white/80 uppercase tracking-wider">
                      {item.tagline}
                    </p>

                    {/* Description */}
                    <p className="mt-4 text-base leading-7 text-white/90">
                      {item.description}
                    </p>

                    {/* Highlights list */}
                    <ul className="mt-6 space-y-2.5 border-t border-white/15 pt-5 text-sm text-white/85">
                      {item.highlights.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-white/80" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Direct Link Action Button */}
                  <div className="mt-8 pt-4">
                    <Link
                      href={item.url}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black transition ${item.buttonClass}`}
                    >
                      Enter {item.name} Portal
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. THE 4-STAGE LEARNING EXPERIENCE */}
      <section id="experience" className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-muted">
              In-Store Pedagogy
            </span>
            <h2 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-navy">
              From Grocery Aisles to Classroom Mastery.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Students complete 4 interactive stages designed specifically for K-2 early childhood literacy and mathematics standards:
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Volume2 className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-blue-600">Stage 1</p>
              <h3 className="mt-1 text-xl font-black text-navy">Phonemic Sounds</h3>
              <p className="mt-3 text-sm text-slate-600 leading-6">
                Listen to spoken prompts and initial sound clues to match letters with grocery items (e.g. &apos;/b/ for banana&apos;).
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                <Barcode className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-purple-600">Stage 2</p>
              <h3 className="mt-1 text-xl font-black text-navy">Product Discovery</h3>
              <p className="mt-3 text-sm text-slate-600 leading-6">
                Navigate the produce section, find farm-fresh items, and scan real store barcodes right from the discovery cart.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <Mic className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-amber-600">Stage 3</p>
              <h3 className="mt-1 text-xl font-black text-navy">Reading Aloud</h3>
              <p className="mt-3 text-sm text-slate-600 leading-6">
                Read age-appropriate decodable stories and record voice passages for teacher grading and family pride.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Calculator className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-emerald-600">Stage 4</p>
              <h3 className="mt-1 text-xl font-black text-navy">Grocery Math</h3>
              <p className="mt-3 text-sm text-slate-600 leading-6">
                Calculate unit prices, weigh produce on scales, and count change to build practical early math confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY, SAFETY & COMPLIANCE GUARANTEE */}
      <section id="safety" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 sm:p-14 shadow-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  COPPA & FERPA Certified
                </span>

                <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-navy leading-tight">
                  Student Privacy Always Comes First.
                </h2>

                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                  Cart2Class is engineered strictly for early learners. We collect zero commercial data, display zero advertisements, and never sell or track student activities across third parties.
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Passwordless QR Cards
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Encrypted Voice Clips
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Parent Deletion Rights
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-black text-navy">100%</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Ad-Free Kid Safety
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-black text-navy">4 Roles</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Strict Separation
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-black text-navy">Offline</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Tablet Capable
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-black text-navy">K-2</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Aligned Curriculum
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BOTTOM BANNER */}
      <section className="py-20 bg-navy text-white text-center relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[35rem] w-[50rem] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 relative">
          <p className="text-xs font-black uppercase tracking-[.25em] text-teal-300">
            Cart2Class Learning Community
          </p>

          <h2 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight">
            Ready to Enter Your Portal?
          </h2>

          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Select your authorized role to access student records, classroom missions, family audio, or retail store kiosks.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teacher"
              className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 text-sm shadow-md transition"
            >
              Teacher Portal (/teacher)
            </Link>
            <Link
              href="/parent"
              className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-3 text-sm shadow-md transition"
            >
              Parent Portal (/parent)
            </Link>
            <Link
              href="/store"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 text-sm shadow-md transition"
            >
              Store Kiosk (/store)
            </Link>
            <Link
              href="/super-admin"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 text-sm shadow-md transition"
            >
              Super Admin (/super-admin)
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/cart2class-logo.png"
                width={38}
                height={38}
                alt="Cart2Class logo"
                className="h-9 w-9 object-contain"
              />
              <div>
                <p className="text-base font-black text-navy">Cart2Class</p>
                <p className="text-xs text-muted">A.L.M.A. Real-World Learning Portal</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold">
              {publicLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition hover:text-navy hover:underline"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-muted">
            © {new Date().getFullYear()} Cart2Class & A.L.M.A. All rights reserved. Built for student privacy, teacher empowerment, and community engagement.
          </div>
        </div>
      </footer>
    </div>
  );
}
