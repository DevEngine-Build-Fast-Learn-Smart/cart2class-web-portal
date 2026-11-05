import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = { primary: "bg-brand text-white hover:bg-blue-800", secondary: "border bg-white text-ink hover:bg-slate-50", ghost: "text-muted hover:bg-slate-100 hover:text-ink", danger: "bg-red-600 text-white hover:bg-red-700" };
  return <button className={cn("inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50", variants[variant], className)} {...props} />;
}
