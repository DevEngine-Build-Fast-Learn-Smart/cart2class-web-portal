"use client";

import Image from "next/image";
import { usePortalSettings } from "@/lib/portal-settings";

export function BrandLogo({
  width = 48,
  height = 48,
  className = "h-full w-full object-contain",
  alt = "Cart2Class logo",
  priority = false
}: {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const { settings } = usePortalSettings();

  if (settings.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={settings.logoUrl}
        width={width}
        height={height}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <Image
      src="/cart2class-logo.png"
      width={width}
      height={height}
      alt={alt}
      className={className}
      priority={priority}
    />
  );
}

export function BrandName() {
  const { settings } = usePortalSettings();
  return <span>{settings.platformName || "Cart2Class"}</span>;
}

