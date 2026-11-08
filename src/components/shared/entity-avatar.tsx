"use client";

import { useState, useEffect } from "react";
import { User, School, Building2, GraduationCap, LucideIcon } from "lucide-react";

type AvatarKind = "user" | "student" | "school" | "store";

interface EntityAvatarProps {
  src?: string | null;
  alt: string;
  kind?: AvatarKind;
  size?: "sm" | "md" | "lg";
  className?: string;
  shape?: "circle" | "square" | "rounded";
}

const defaultIcons: Record<AvatarKind, LucideIcon> = {
  user: User,
  student: GraduationCap,
  school: School,
  store: Building2
};

const defaultToneClasses: Record<AvatarKind, string> = {
  user: "bg-slate-100 text-slate-700 border-slate-200",
  student: "bg-blue-50 text-brand border-blue-200",
  school: "bg-teal-50 text-teal-700 border-teal-200",
  store: "bg-amber-50 text-amber-700 border-amber-200"
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base"
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6"
};

export function EntityAvatar({
  src,
  alt,
  kind = "user",
  size = "md",
  className = "",
  shape = "rounded"
}: EntityAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const radiusClass =
    shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-lg" : "rounded-xl";

  const Icon = defaultIcons[kind] || User;
  const toneClass = defaultToneClasses[kind] || defaultToneClasses.user;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Clean up and validate src
  const validSrc =
    typeof src === "string" && src.trim() && src !== "null" && src !== "undefined"
      ? src.trim()
      : null;

  if (validSrc && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={validSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`${sizeClass} ${radiusClass} object-cover border border-slate-200 shadow-xs shrink-0 ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={`grid ${sizeClass} ${radiusClass} place-items-center border shadow-xs shrink-0 ${toneClass} ${className}`}
    >
      <Icon className={iconSize} />
    </div>
  );
}

