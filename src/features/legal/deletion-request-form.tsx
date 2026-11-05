"use client";

import { useActionState } from "react";
import { submitDeletionRequest, type DeletionRequestState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: DeletionRequestState = {};
export function DeletionRequestForm() {
  const [state, action, pending] = useActionState(submitDeletionRequest, initial);
  return <form action={action} className="mt-8 grid gap-4 rounded-2xl border bg-slate-50 p-5" noValidate>
    <h2 className="text-lg font-extrabold">Submit a deletion request</h2>
    <p className="text-sm leading-6 text-muted">We collect only what is needed to identify and verify your request. Do not include passwords, QR codes, or recordings.</p>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Your name<input required name="name" className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 font-normal" /></label><label className="text-sm font-bold">Email address<input required name="email" type="email" className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 font-normal" /></label></div>
    <label className="text-sm font-bold">What do you need reviewed?<select name="requestType" className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 font-normal"><option value="account">Account data</option><option value="student_record">Student record</option><option value="recording">Reading recording</option><option value="other">Other request</option></select></label>
    <label className="text-sm font-bold">Brief details <span className="font-normal text-muted">(optional)</span><textarea name="details" rows={4} className="mt-1.5 w-full rounded-lg border bg-white p-3 font-normal" placeholder="Tell us enough to locate the request. Avoid sensitive information." /></label>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{state.success}</p>}
    <Button type="submit" disabled={pending} className="w-fit">{pending ? "Submitting…" : "Submit request"}</Button>
  </form>;
}
