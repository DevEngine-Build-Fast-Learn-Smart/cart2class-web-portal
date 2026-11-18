"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardPlus, PencilLine, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateMissionModal } from "./create-mission-modal";

type Row = Record<string, any>;

export function MissionBuilderStartView({
  role,
  missions,
  stores,
  classes,
  students
}: {
  role: "admin" | "teacher";
  missions: Row[];
  stores: Row[];
  classes: Row[];
  students: Row[];
}) {
  const roleLabel = role === "admin" ? "A.L.M.A. administrator" : "Teacher";
  const libraryHref = `/${role}/library`;

  return (
    <main className="page-shell space-y-6">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-white via-cyan-50/40 to-blue-50/60 p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-brand">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-md shadow-blue-500/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="eyebrow">{roleLabel}</p>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">Mission Builder</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Start a fresh learning mission or reopen an existing one. Choose a mission first so you never edit the wrong draft by accident.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={libraryHref} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy transition hover:bg-slate-50">
              <BookOpenCheck className="mr-2 h-4 w-4" /> Mission library
            </Link>
            <CreateMissionModal
              role={role}
              stores={stores}
              classes={classes}
              students={students}
              triggerText="Create new mission"
              triggerClassName="h-10 rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-bold"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-brand"><ClipboardPlus className="h-4 w-4" /></span>
          <h2 className="mt-3 font-extrabold text-navy">1. Create a draft</h2>
          <p className="mt-1 text-sm leading-5 text-muted">Set the title, grades, classroom access, store, and schedule.</p>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><PencilLine className="h-4 w-4" /></span>
          <h2 className="mt-3 font-extrabold text-navy">2. Build the stages</h2>
          <p className="mt-1 text-sm leading-5 text-muted">Add sounds, products, reading, math, and supporting media.</p>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BookOpenCheck className="h-4 w-4" /></span>
          <h2 className="mt-3 font-extrabold text-navy">3. Review and publish</h2>
          <p className="mt-1 text-sm leading-5 text-muted">Preview your learner experience, then publish when it is ready.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-line bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-extrabold text-navy">Open an existing mission</h2>
            <p className="mt-1 text-sm text-muted">Select a mission to continue editing its content and settings.</p>
          </div>
          <Badge tone="blue">{missions.length} available</Badge>
        </div>
        {missions.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
            {missions.map((mission) => (
              <Link
                key={mission.id}
                href={`/${role}/missions?id=${mission.id}`}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-brand">Mission #{mission.mission_number ?? "—"}</p>
                    <h3 className="mt-1 truncate font-extrabold text-navy">{mission.title}</h3>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="auto">{mission.status ?? "draft"}</Badge>
                  <Badge tone="auto">{mission.sharing_status ?? "private"}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ClipboardPlus className="mx-auto h-9 w-9 text-slate-300" />
            <h3 className="mt-3 font-extrabold text-navy">No missions yet</h3>
            <p className="mt-1 text-sm text-muted">Create your first mission to begin building its learning stages.</p>
          </div>
        )}
      </section>
    </main>
  );
}
