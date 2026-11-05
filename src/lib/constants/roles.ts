import type { Role } from "@/types/domain";

export const roleLabels: Record<Role, string> = {
  parent: "Parent & Guardian", teacher: "Teacher", store: "Store Partner", admin: "A.L.M.A. Administrator"
};
export const roleHome: Record<Role, `/${Role}`> = {
  parent: "/parent", teacher: "/teacher", store: "/store", admin: "/admin"
};
export const roleAccents: Record<Role, string> = {
  parent: "#1D4ED8", teacher: "#8B5CF6", store: "#0F766E", admin: "#142B4A"
};
