"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { login, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: AuthState = {};
export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return <form action={action} className="space-y-5" noValidate>
    <label className="block text-sm font-bold text-ink">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted" /><input name="email" type="email" autoComplete="email" required className="h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm" placeholder="you@example.org" /></div></label>
    <label className="block text-sm font-bold text-ink">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted" /><input name="password" type="password" autoComplete="current-password" required className="h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm" placeholder="••••••••" /></div></label>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
    <div className="flex items-center justify-between text-sm"><span className="text-muted">Secure access for authorized users</span><Link className="font-bold text-brand hover:underline" href="/forgot-password">Forgot password?</Link></div>
    <Button className="w-full" type="submit" disabled={pending}>{pending ? "Signing in…" : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
  </form>;
}
