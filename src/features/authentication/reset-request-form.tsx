"use client";
import { useActionState } from "react";
import { requestReset, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
const initialState: AuthState = {};
export function ResetRequestForm() { const [state, action, pending] = useActionState(requestReset, initialState); return <form action={action} className="mt-6 space-y-4"><label className="block text-sm font-bold">Email address<input name="email" type="email" required className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm" placeholder="you@example.org" /></label>{state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{state.message}</p>}<Button className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button></form>; }
