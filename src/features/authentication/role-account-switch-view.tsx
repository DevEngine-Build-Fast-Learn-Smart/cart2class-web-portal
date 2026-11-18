import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";

import { logout } from "./actions";
import { roleHome, roleLabels } from "@/lib/constants/roles";
import type { Role } from "@/types/domain";

export function RoleAccountSwitchView({
  targetRole,
  currentRoles,
  email,
}: {
  targetRole: Role;
  currentRoles: Role[];
  email?: string | null;
}) {
  const currentPortal = currentRoles[0]
    ? roleLabels[currentRoles[0]]
    : "another Cart2Class portal";
  const targetPortal = roleLabels[targetRole];
  const returnTo = currentRoles[0] ? roleHome[currentRoles[0]] : "/login";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5 sm:p-8">
      <section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(20,43,74,.12)]">
        <div className="bg-navy px-7 py-8 text-white sm:px-10">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20">
              <Image
                src="/cart2class-logo.png"
                width={56}
                height={56}
                alt="Cart2Class logo"
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight">
                Switch portal account
              </p>
              <p className="mt-1 text-sm font-medium text-slate-300">
                Cart2Class keeps each role area separate.
              </p>
            </div>
          </div>
        </div>
        <div className="px-7 py-8 sm:px-10 sm:py-10">
          <p className="eyebrow text-brand">{targetPortal}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            You’re already signed in to a different portal.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            {email ? (
              <>
                <strong className="font-bold text-ink">{email}</strong> is
                currently signed in to{" "}
              </>
            ) : (
              "The current account is signed in to "
            )}
            <strong className="font-bold text-ink">{currentPortal}</strong>. To
            use the {targetPortal}, sign out first and use an account authorized
            for that role.
          </p>
          <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <p>
                Your existing session stays active until you choose to switch.
                This prevents one tab from silently changing another portal’s
                account.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <form action={logout} className="sm:flex-1">
              <input type="hidden" name="role" value={targetRole} />
              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">
                <LogOut className="h-4 w-4" />
                Sign out and use {targetPortal}
              </button>
            </form>
            <Link
              href={returnTo}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 sm:flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Stay in {currentPortal}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
