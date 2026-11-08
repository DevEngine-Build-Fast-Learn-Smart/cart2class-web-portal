"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpenCheck, Building2, ClipboardCheck, LibraryBig, LineChart, QrCode, School, Settings, Trophy, UsersRound, Barcode, type LucideIcon } from "lucide-react";
import type { Role } from "@/types/domain";

type NavigationItem = { name: string; href: string; icon: LucideIcon };

const nav: Record<Role, NavigationItem[]> = {
  parent: [
    { name: "Overview", href: "/parent", icon: LineChart },
    { name: "My children", href: "/parent/children", icon: UsersRound },
    { name: "Mission progress", href: "/parent/progress", icon: ClipboardCheck },
    { name: "Class leaderboard", href: "/parent/leaderboard", icon: Trophy },
    { name: "Recordings", href: "/parent/recordings", icon: BookOpenCheck }
  ],
  teacher: [
    { name: "Overview", href: "/teacher", icon: LineChart },
    { name: "Classes", href: "/teacher/classes", icon: School },
    { name: "Students & QR cards", href: "/teacher/students", icon: QrCode },
    { name: "Missions", href: "/teacher/missions", icon: ClipboardCheck },
    { name: "QR & Barcodes", href: "/teacher/barcodes", icon: Barcode },
    { name: "Mission library", href: "/teacher/library", icon: LibraryBig },
    { name: "Reading reviews", href: "/teacher/recordings", icon: BookOpenCheck }
  ],
  store: [
    { name: "Overview", href: "/store", icon: LineChart },
    { name: "Check-in QR", href: "/store/check-in", icon: QrCode },
    { name: "QR & Barcodes", href: "/store/barcodes", icon: Barcode },
    { name: "Products", href: "/store/products", icon: LibraryBig },
    { name: "Class participation", href: "/store/participation", icon: LineChart },
    { name: "Rewards", href: "/store/rewards", icon: Trophy },
    { name: "Store profile", href: "/store/profile", icon: Building2 },
    { name: "Notifications", href: "/store/notifications", icon: Bell },
    { name: "Account settings", href: "/store/settings", icon: Settings }
  ],
  admin: [
    { name: "Overview", href: "/admin", icon: LineChart },
    { name: "Schools & classes", href: "/admin/schools", icon: School },
    { name: "Users & students", href: "/admin/users", icon: UsersRound },
    { name: "Partner stores", href: "/admin/stores", icon: Building2 },
    { name: "Missions", href: "/admin/missions", icon: ClipboardCheck },
    { name: "QR & Barcodes", href: "/admin/barcodes", icon: Barcode },
    { name: "Mission library", href: "/admin/library", icon: LibraryBig },
    { name: "Review queue", href: "/admin/reviews", icon: BookOpenCheck },
    { name: "Reports", href: "/admin/reports", icon: LineChart },
    { name: "Legal & policies", href: "/admin/legal", icon: LibraryBig },
    { name: "Deletion requests", href: "/admin/deletion-requests", icon: ClipboardCheck },
    { name: "Audit logs", href: "/admin/audit-logs", icon: LineChart },
    { name: "Settings", href: "/admin/settings", icon: Settings }
  ]
};

export function SidebarNavigation({
  role,
  onNavigate
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = nav[role] || [];

  return (
    <nav className="mt-6 space-y-1" aria-label="Portal navigation">
      {items.map(({ name, href, icon: Icon }) => {
        const active =
          href.split("/").length === 2
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition-colors duration-150 ${
              active
                ? "bg-white text-navy shadow-[0_10px_25px_rgba(0,0,0,0.22)]"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                active
                  ? "bg-cyan-100 text-cyan-800"
                  : "text-slate-400 group-hover:bg-white/10 group-hover:text-cyan-300"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{name}</span>
            {active && (
              <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
