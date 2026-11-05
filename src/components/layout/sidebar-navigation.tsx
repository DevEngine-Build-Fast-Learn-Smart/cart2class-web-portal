"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpenCheck, Building2, ClipboardCheck, LibraryBig, LineChart, QrCode, School, Settings, Trophy, UsersRound, type LucideIcon } from "lucide-react";
import type { Role } from "@/types/domain";

type NavigationItem = { name: string; href: string; icon: LucideIcon };

const nav: Record<Role, NavigationItem[]> = {
  parent: [{ name: "Overview", href: "/parent", icon: LineChart }, { name: "My children", href: "/parent/children", icon: UsersRound }, { name: "Mission progress", href: "/parent/progress", icon: ClipboardCheck }, { name: "Recordings", href: "/parent/recordings", icon: BookOpenCheck }],
  teacher: [{ name: "Overview", href: "/teacher", icon: LineChart }, { name: "Classes", href: "/teacher/classes", icon: School }, { name: "Students & QR cards", href: "/teacher/students", icon: QrCode }, { name: "Missions", href: "/teacher/missions", icon: ClipboardCheck }, { name: "Mission library", href: "/teacher/library", icon: LibraryBig }, { name: "Reading reviews", href: "/teacher/recordings", icon: BookOpenCheck }],
  store: [{ name: "Overview", href: "/store", icon: LineChart }, { name: "Check-in QR", href: "/store/check-in", icon: QrCode }, { name: "Products", href: "/store/products", icon: LibraryBig }, { name: "Class participation", href: "/store/participation", icon: LineChart }, { name: "Rewards", href: "/store/rewards", icon: Trophy }, { name: "Store profile", href: "/store/profile", icon: Building2 }, { name: "Notifications", href: "/store/notifications", icon: Bell }, { name: "Account settings", href: "/store/settings", icon: Settings }],
  admin: [{ name: "Overview", href: "/admin", icon: LineChart }, { name: "Schools & classes", href: "/admin/schools", icon: School }, { name: "Users & students", href: "/admin/users", icon: UsersRound }, { name: "Partner stores", href: "/admin/stores", icon: Building2 }, { name: "Missions", href: "/admin/missions", icon: ClipboardCheck }, { name: "Review queue", href: "/admin/reviews", icon: BookOpenCheck }, { name: "Reports", href: "/admin/reports", icon: LineChart }, { name: "Legal & policies", href: "/admin/legal", icon: LibraryBig }, { name: "Deletion requests", href: "/admin/deletion-requests", icon: ClipboardCheck }, { name: "Audit logs", href: "/admin/audit-logs", icon: LineChart }, { name: "Settings", href: "/admin/settings", icon: Settings }]
};

export function SidebarNavigation({ role }: { role: Role }) {
  const pathname = usePathname();
  return <nav className="mt-9 space-y-1.5" aria-label="Portal navigation">{nav[role].map(({ name, href, icon: Icon }) => {
    const active = href.split("/").length === 2 ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-bold transition ${active ? "bg-white text-navy shadow-[0_8px_20px_rgba(2,12,27,.18)]" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-blue-50 text-brand" : "text-slate-300 group-hover:bg-white/10"}`}><Icon className="h-[18px] w-[18px]" /></span><span>{name}</span></Link>;
  })}</nav>;
}
