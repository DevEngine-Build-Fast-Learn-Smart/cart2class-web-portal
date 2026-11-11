import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  Store,
  ShieldAlert
} from "lucide-react";
import { LoginForm } from "@/features/authentication/login-form";

const publicLinks = [
  ["Privacy", "/privacy-policy"],
  ["Terms", "/terms-and-conditions"],
  ["Data deletion", "/data-deletion"],
  ["Child safety", "/child-safety"],
  ["About", "/about"],
  ["Contact", "/contact"]
] as const;

const rolePortals = [
  {
    role: "teacher",
    name: "Teacher Portal",
    url: "/teacher",
    color: "border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-900",
    icon: GraduationCap,
    desc: "Classroom missions & students"
  },
  {
    role: "parent",
    name: "Parent Portal",
    url: "/parent",
    color: "border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900",
    icon: HeartHandshake,
    desc: "Child audio & grocery stars"
  },
  {
    role: "store",
    name: "Store Partner",
    url: "/store",
    color: "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900",
    icon: Store,
    desc: "Store kiosks & produce barcodes"
  },
  {
    role: "admin",
    name: "Super Admin",
    url: "/super-admin",
    color: "border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900",
    icon: ShieldAlert,
    desc: "A.L.M.A. district governance"
  }
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.12fr_.88fr]">
      {/* LEFT BRAND SECTION */}
      <section className="relative hidden overflow-hidden bg-navy px-12 py-10 text-white lg:flex lg:flex-col xl:px-20 xl:py-14">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-blue-400/10 blur-3xl" />

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
              <p className="mt-0.5 text-sm font-bold text-teal-200">
                A.L.M.A. Learning Portal
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="relative my-auto max-w-3xl py-12">
          <div className="mb-8 grid h-36 w-36 place-items-center rounded-[2rem] bg-white p-3 shadow-2xl shadow-black/20 xl:h-44 xl:w-44">
            <Image
              src="/cart2class-logo.png"
              width={176}
              height={176}
              alt="Cart2Class"
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-teal-200">
            <Sparkles className="h-4 w-4" />
            Everyday learning, thoughtfully connected
          </p>

          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl 2xl:text-7xl">
            A grocery trip can grow a lifelong learner.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 xl:text-xl xl:leading-9">
            Turn everyday shopping into meaningful reading and mathematics experiences
            for young learners. A connected learning community for families, teachers,
            store partners and A.L.M.A. administrators.
          </p>
        </div>

        <p className="relative flex items-center gap-3 text-sm font-semibold text-slate-300">
          <ShieldCheck className="h-5 w-5 text-teal-200" />
          Privacy-centered educational technology
        </p>
      </section>

      {/* RIGHT SIGN IN SECTION */}
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white p-1 shadow-panel">
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
                  <p className="text-xs font-bold text-muted">A.L.M.A. Learning Portal</p>
                </div>
              </div>
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
              >
                ← Home
              </Link>
            </div>
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(20,43,74,.10)] sm:p-10">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-brand">Welcome back</p>
              <span className="text-xs font-bold text-slate-400">Portal Gateway</span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Sign in to your portal
            </h2>

            <p className="mt-2.5 max-w-md text-sm leading-6 text-muted sm:text-base">
              Select your designated role portal below for customized tools, or sign in directly:
            </p>

            {/* Role Portal Gateway Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {rolePortals.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.role}
                    href={item.url}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 transition hover:shadow-md ${item.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5" />
                      <ArrowRight className="h-3.5 w-3.5 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-black leading-tight">{item.name}</p>
                      <p className="mt-0.5 text-[11px] font-medium opacity-80">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="relative my-7 flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="mx-3 shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Or sign in directly
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Direct Login Form */}
            <LoginForm />
          </section>

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
