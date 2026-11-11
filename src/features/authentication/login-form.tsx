"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, AlertCircle } from "lucide-react";
import { login, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types/domain";

const initialState: AuthState = {};

export function LoginForm({
  expectedRole,
  buttonClassName,
  forgotPasswordHref = "/forgot-password"
}: {
  expectedRole?: Role;
  buttonClassName?: string;
  forgotPasswordHref?: string;
}) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {expectedRole && <input type="hidden" name="expectedRole" value={expectedRole} />}
      
      <label className="block text-sm font-bold text-ink">
        Email address
        <div className="relative mt-2">
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-ink placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            placeholder="you@example.org"
          />
        </div>
      </label>

      <label className="block text-sm font-bold text-ink">
        Password
        <div className="relative mt-2">
          <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-ink placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            placeholder="••••••••"
          />
        </div>
      </label>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-sm font-semibold text-rose-800 animate-in fade-in duration-200"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-muted">Secure access for authorized users</span>
        <Link className="font-bold text-brand hover:underline" href={forgotPasswordHref}>
          Forgot password?
        </Link>
      </div>

      <Button
        className={buttonClassName || "w-full h-11 text-base font-bold shadow-md"}
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : (
          <>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
