import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResetRequestForm } from "@/features/authentication/reset-request-form";
export default function ForgotPasswordPage() { return <main className="grid min-h-screen place-items-center p-5"><section className="panel w-full max-w-md p-7"><Link href="/login" className="inline-flex items-center text-sm font-bold text-brand hover:underline"><ArrowLeft className="mr-2 h-4 w-4" />Back to sign in</Link><p className="eyebrow mt-7">Account recovery</p><h1 className="mt-2 text-2xl font-extrabold">Reset your password</h1><p className="mt-2 text-sm leading-6 text-muted">Enter your email and we’ll send a secure link if it’s associated with a Cart2Class account.</p><ResetRequestForm /></section></main>; }
