import { cn } from "@/lib/utils/cn";

export type BadgeTone = "auto" | "slate" | "blue" | "green" | "amber" | "purple" | "teal" | "rose" | "red";

function inferToneFromText(text: string): Exclude<BadgeTone, "auto"> {
  const normalized = text.trim().toLowerCase().replace(/[-_\s]+/g, " ");

  if (
    normalized.includes("approved") ||
    normalized.includes("published") ||
    normalized.includes("active") ||
    normalized.includes("completed") ||
    normalized.includes("reviewed") ||
    normalized.includes("ready") ||
    normalized.includes("passed") ||
    normalized.includes("success") ||
    normalized.includes("picked up")
  ) {
    return "green";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("submitted") ||
    normalized.includes("under review") ||
    normalized.includes("in progress") ||
    normalized.includes("reviewing") ||
    normalized.includes("verifying") ||
    normalized.includes("received")
  ) {
    return "amber";
  }

  if (
    normalized.includes("rejected") ||
    normalized.includes("changes requested") ||
    normalized.includes("declined") ||
    normalized.includes("disabled") ||
    normalized.includes("inactive") ||
    normalized.includes("error") ||
    normalized.includes("failed") ||
    normalized.includes("revoked")
  ) {
    return "rose";
  }

  if (
    normalized.includes("draft") ||
    normalized.includes("available") ||
    normalized.includes("enrolled") ||
    normalized.includes("teacher")
  ) {
    return "blue";
  }

  if (normalized.includes("admin") || normalized.includes("coordinator")) {
    return "purple";
  }

  if (normalized.includes("parent") || normalized.includes("guardian") || normalized.includes("family")) {
    return "teal";
  }

  if (normalized.includes("store") || normalized.includes("partner")) {
    return "amber";
  }

  return "slate";
}

export function Badge({
  children,
  tone = "auto",
  className,
  dot = true
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
}) {
  const tones: Record<Exclude<BadgeTone, "auto">, { bg: string; dot: string }> = {
    green: {
      bg: "bg-emerald-50 text-emerald-900 border-emerald-300 ring-emerald-400/25",
      dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
    },
    amber: {
      bg: "bg-amber-50 text-amber-900 border-amber-300 ring-amber-400/25",
      dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-pulse"
    },
    rose: {
      bg: "bg-rose-50 text-rose-900 border-rose-300 ring-rose-400/25",
      dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"
    },
    red: {
      bg: "bg-red-50 text-red-900 border-red-300 ring-red-400/25",
      dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
    },
    blue: {
      bg: "bg-blue-50 text-blue-900 border-blue-300 ring-blue-400/25",
      dot: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
    },
    purple: {
      bg: "bg-purple-50 text-purple-900 border-purple-300 ring-purple-400/25",
      dot: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]"
    },
    teal: {
      bg: "bg-teal-50 text-teal-900 border-teal-300 ring-teal-400/25",
      dot: "bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.5)]"
    },
    slate: {
      bg: "bg-slate-100 text-slate-800 border-slate-300 ring-slate-400/25",
      dot: "bg-slate-400"
    }
  };

  const resolvedTone: Exclude<BadgeTone, "auto"> =
    tone === "auto"
      ? typeof children === "string"
        ? inferToneFromText(children)
        : "slate"
      : tone;

  const selected = tones[resolvedTone] || tones.slate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black tracking-wide shadow-xs shrink-0 self-start h-fit leading-none ring-1 ring-inset transition-all",
        selected.bg,
        className
      )}
    >
      {dot && <span className={cn("h-2 w-2 shrink-0 rounded-full", selected.dot)} />}
      <span className="capitalize">{children}</span>
    </span>
  );
}
