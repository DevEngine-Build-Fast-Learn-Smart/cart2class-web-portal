import type { Role } from "@/types/domain";

export const roleLabels: Record<Role, string> = {
  parent: "Parent & Guardian",
  teacher: "Teacher",
  store: "Store Partner",
  admin: "A.L.M.A. Administrator"
};

export const roleHome: Record<Role, `/${Role}`> = {
  parent: "/parent",
  teacher: "/teacher",
  store: "/store",
  admin: "/admin"
};

export const roleLoginUrls: Record<Role, string> = {
  admin: "/super-admin",
  teacher: "/teacher",
  parent: "/parent",
  store: "/store"
};

export const roleAccents: Record<Role, string> = {
  parent: "#D97706",
  teacher: "#7C3AED",
  store: "#059669",
  admin: "#142B4A"
};
