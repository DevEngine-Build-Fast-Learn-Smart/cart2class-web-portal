export const roles = ["parent", "teacher", "store", "admin"] as const;
export type Role = (typeof roles)[number];

export type Membership = { role: Role; organization_id: string; is_active: boolean };
export type Profile = { id: string; display_name: string; account_status: "active" | "disabled" | "invited" };
export type Metric = { label: string; value: string | number; detail?: string; tone?: "blue" | "purple" | "teal" | "amber" };
export type Activity = { title: string; detail: string; occurred_at: string; kind: "mission" | "reward" | "review" | "notice" };
