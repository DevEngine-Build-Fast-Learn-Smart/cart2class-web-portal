import type { SupabaseClient } from "@supabase/supabase-js";
import { AlertCircle, Building2, ClipboardCheck, School, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BarcodeExportButton, BulkQrSheetButton, QrExportButton } from "@/components/shared/code-export";
import { publishMission, reviewMission } from "./workflow-actions";

type Row = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "—";
const statusTone = (status: unknown): "green" | "amber" | "slate" | "blue" => status === "active" || status === "published" || status === "approved" ? "green" : status === "submitted" || status === "pending" ? "amber" : status === "draft" ? "blue" : "slate";

function DataTable({ columns, rows, empty }: { columns: { key: string; label: string; render?: (row: Row) => React.ReactNode }[]; rows: Row[]; empty: string }) {
  if (!rows.length) return <EmptyState title="No records found" description={empty} />;
  return <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-muted"><tr>{columns.map((column) => <th className="whitespace-nowrap px-5 py-3" key={column.key}>{column.label}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr className="hover:bg-slate-50/70" key={String(row.id ?? index)}>{columns.map((column) => <td className="whitespace-nowrap px-5 py-3.5" key={column.key}>{column.render ? column.render(row) : text(row[column.key])}</td>)}</tr>)}</tbody></table></div></div>;
}

const pageMeta: Record<string, { title: string; description: string; icon: typeof School }> = {
  schools: { title: "Schools & classes", description: "Organization school roster and active classroom structure.", icon: School },
  users: { title: "Users & students", description: "Authorized portal accounts and protected learner records.", icon: UsersRound },
  stores: { title: "Partner stores", description: "Approved locations and aggregate reward activity.", icon: Building2 },
  missions: { title: "Mission management", description: "Mission publication, sharing, and versioning status.", icon: ClipboardCheck },
  reviews: { title: "Shared mission review queue", description: "Submitted content awaiting administrative review.", icon: ClipboardCheck },
  reports: { title: "Reports & analytics", description: "Current database-backed program summary.", icon: ClipboardCheck },
  settings: { title: "Organization settings", description: "Connected organization profile and configuration.", icon: Building2 }
};

export async function AdminSectionView({ slug, supabase }: { slug: string; supabase: SupabaseClient }) {
  const meta = pageMeta[slug] ?? { title: "Not found", description: "This administrator area is unavailable.", icon: AlertCircle };
  const Icon = meta.icon;
  const renderBody = async () => {
    if (slug === "schools") { const [{ data: schools }, { data: classes }] = await Promise.all([supabase.from("schools").select("id,name,address,is_active").order("name"), supabase.from("classes").select("id,name,grade_level,school_year,is_active").order("grade_level")]); return <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><DataTable rows={(schools ?? []) as Row[]} empty="Create an organization school to begin." columns={[{ key: "name", label: "School" }, { key: "address", label: "Address" }, { key: "is_active", label: "Status", render: (row) => <Badge tone={row.is_active ? "green" : "slate"}>{row.is_active ? "Active" : "Inactive"}</Badge> }]} /><DataTable rows={(classes ?? []) as Row[]} empty="No classes are configured yet." columns={[{ key: "name", label: "Class" }, { key: "grade_level", label: "Grade", render: (row) => `Grade ${text(row.grade_level)}` }, { key: "school_year", label: "School year" }, { key: "is_active", label: "Status", render: (row) => <Badge tone={row.is_active ? "green" : "slate"}>{row.is_active ? "Active" : "Inactive"}</Badge> }]} /></div>; }
    if (slug === "users") { const [{ data: profiles }, { data: memberships }, { data: students }, { data: classes }] = await Promise.all([supabase.from("profiles").select("id,display_name,account_status").order("display_name"), supabase.from("role_memberships").select("user_id,role"), supabase.from("students").select("id,first_name,last_initial,grade_level,class_id,is_active").order("first_name"), supabase.from("classes").select("id,name")]); const roleByUser = new Map((memberships ?? []).map((membership) => [membership.user_id, membership.role])); const className = new Map((classes ?? []).map((entry) => [entry.id, entry.name])); const studentRows = (students ?? []).map((student) => ({ ...student, class_name: className.get(student.class_id) ?? "Unassigned", label: `${student.first_name} ${student.last_initial ?? ""}`.trim() })); return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-2"><DataTable rows={(profiles ?? []).map((profile) => ({ ...profile, role: roleByUser.get(profile.id) ?? "—" })) as Row[]} empty="No authorized accounts are present." columns={[{ key: "display_name", label: "Account" }, { key: "role", label: "Role", render: (row) => <Badge tone="blue">{text(row.role)}</Badge> }, { key: "account_status", label: "Status", render: (row) => <Badge tone={statusTone(row.account_status)}>{text(row.account_status)}</Badge> }]} /><DataTable rows={studentRows as Row[]} empty="No student records are present." columns={[{ key: "label", label: "Student" }, { key: "class_name", label: "Class" }, { key: "grade_level", label: "Grade", render: (row) => `Grade ${text(row.grade_level)}` }, { key: "id", label: "QR card", render: (row) => <QrExportButton compact type="student" target={{ id: text(row.id), label: text(row.label), subtitle: `${text(row.class_name)} · Grade ${text(row.grade_level)}` }} /> }]} /></div><div className="panel p-5"><h2 className="font-extrabold">Printable class QR card sheets</h2><p className="mt-1 text-sm text-muted">Each PDF uses A4 layout and only displays a student’s minimum necessary name and class information.</p><div className="mt-4 flex flex-wrap gap-3">{(classes ?? []).map((classroom) => <BulkQrSheetButton key={classroom.id} type="student" label={`${classroom.name} student QR cards`} targets={studentRows.filter((student) => student.class_id === classroom.id).map((student) => ({ id: student.id, label: student.label, subtitle: `${classroom.name} · Grade ${student.grade_level}` }))} />)}</div></div></div>; }
    if (slug === "stores") { const [{ data: stores }, { data: rewards }] = await Promise.all([supabase.from("stores").select("id,name,contact_email,address,is_active").order("name"), supabase.from("reward_goals").select("id,title,current_stars,target_stars,status").order("created_at", { ascending: false })]); return <div className="grid gap-5 xl:grid-cols-2"><DataTable rows={(stores ?? []) as Row[]} empty="No partner stores are connected." columns={[{ key: "name", label: "Store" }, { key: "contact_email", label: "Contact" }, { key: "is_active", label: "Status", render: (row) => <Badge tone={row.is_active ? "green" : "slate"}>{row.is_active ? "Active" : "Inactive"}</Badge> }, { key: "id", label: "Check-in QR", render: (row) => <QrExportButton compact type="store" target={{ id: text(row.id), label: text(row.name), subtitle: "Store check-in · Scan to begin a Cart2Class mission" }} /> }]} /><DataTable rows={(rewards ?? []) as Row[]} empty="No class reward goals exist yet." columns={[{ key: "title", label: "Reward goal" }, { key: "current_stars", label: "Progress", render: (row) => `${text(row.current_stars)} / ${text(row.target_stars)} stars` }, { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{text(row.status)}</Badge> }]} /></div>; }
    if (slug === "missions" || slug === "reviews") {
      const { data } = await supabase.from("missions").select("id,title,description,status,sharing_status,current_version,estimated_minutes,grade_min,grade_max").order("updated_at", { ascending: false });
      const rows = (data ?? []) as Row[];
      if (slug === "reviews") {
        const submitted = rows.filter((row) => row.sharing_status === "submitted" || row.sharing_status === "under_review");
        return <div className="space-y-4">{submitted.length ? submitted.map((row) => <article className="panel p-5" key={text(row.id)}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-extrabold">{text(row.title)}</h2><p className="mt-1 text-sm text-muted">v{text(row.current_version)} · {text(row.estimated_minutes)} min</p></div><Badge tone="amber">{text(row.sharing_status)}</Badge></div><p className="mt-3 text-sm text-muted">{text(row.description)}</p><form action={reviewMission} className="mt-4 grid gap-3 md:grid-cols-[11rem_1fr_auto]"><input type="hidden" name="missionId" value={text(row.id)} /><select name="decision" className="h-10 rounded-lg border bg-white px-3 text-sm"><option value="approved">Approve for publishing</option><option value="changes_requested">Request changes</option><option value="rejected">Reject</option></select><input name="feedback" className="h-10 rounded-lg border px-3 text-sm" placeholder="Review feedback" /><button className="rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">Save decision</button></form></article>) : <EmptyState title="No submitted missions" description="Teacher submissions will appear here for review." />}</div>;
      }
      const eligible = rows.filter((row) => row.status === "published" && (row.sharing_status === "approved" || row.sharing_status === "featured"));
      const columns = [{ key: "title", label: "Mission" }, { key: "status", label: "Publication", render: (row: Row) => <Badge tone={statusTone(row.status)}>{text(row.status)}</Badge> }, { key: "sharing_status", label: "Library", render: (row: Row) => <Badge tone={statusTone(row.sharing_status)}>{text(row.sharing_status)}</Badge> }, { key: "current_version", label: "Version", render: (row: Row) => `v${text(row.current_version)}` }, { key: "estimated_minutes", label: "Duration", render: (row: Row) => `${text(row.estimated_minutes)} min` }, { key: "id", label: "Actions", render: (row: Row) => <div className="flex flex-wrap gap-2">{row.sharing_status === "approved" && row.status !== "published" && <form action={publishMission}><input type="hidden" name="missionId" value={text(row.id)} /><button className="rounded-lg bg-navy px-2 py-1.5 text-xs font-bold text-white">Publish</button></form>}{row.status === "published" && (row.sharing_status === "approved" || row.sharing_status === "featured") && <QrExportButton compact type="mission" target={{ id: text(row.id), label: text(row.title), subtitle: `Grades ${text(row.grade_min)}–${text(row.grade_max)} · Mission v${text(row.current_version)}` }} />}</div> }];
      const [{ data: products }, { data: missionProducts }] = await Promise.all([
        supabase.from("products").select("id,name,barcode,barcode_symbology,category").not("barcode", "is", null).order("name"),
        supabase.from("mission_products").select("id,name,barcode").not("barcode", "is", null).order("name")
      ]);
      const barcodeMap = new Map<string, { id: string; name: string; barcode: string; barcode_symbology: string; category?: string }>();
      for (const p of products ?? []) {
        if (p.barcode) {
          barcodeMap.set(p.barcode, {
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            barcode_symbology: p.barcode_symbology || "CODE128",
            category: p.category || "Educational product"
          });
        }
      }
      for (const mp of missionProducts ?? []) {
        if (mp.barcode && !barcodeMap.has(mp.barcode)) {
          barcodeMap.set(mp.barcode, {
            id: mp.id,
            name: mp.name,
            barcode: mp.barcode,
            barcode_symbology: "CODE128",
            category: "Mission Produce"
          });
        }
      }
      const combinedProducts = Array.from(barcodeMap.values());
      return <div className="space-y-5"><div className="flex justify-end"><BulkQrSheetButton type="mission" label="Published mission QR codes" targets={eligible.map((row) => ({ id: text(row.id), label: text(row.title), subtitle: `Mission QR · v${text(row.current_version)}` }))} /></div><DataTable rows={rows} empty="No missions are available yet." columns={columns} /><section className="panel p-5"><h2 className="font-extrabold">Educational product barcodes ({combinedProducts.length})</h2><p className="mt-1 text-sm text-muted">Print scannable Code128 labels for approved demo, store, and educational product activities.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{combinedProducts.map((product) => <BarcodeExportButton key={product.barcode} value={product.barcode} label={product.name} subtitle={`${product.category ?? "Educational product"} · ${product.barcode_symbology}`} symbology={product.barcode_symbology as "CODE128" | "EAN13" | "UPC"} />)}</div></section></div>;
    }
    if (slug === "settings") { const { data } = await supabase.from("organizations").select("id,name,slug,created_at").order("name"); return <DataTable rows={(data ?? []) as Row[]} empty="No organization settings are available." columns={[{ key: "name", label: "Organization" }, { key: "slug", label: "Identifier" }, { key: "created_at", label: "Created" }]} />; }
    const [schools, classes, students, stores] = await Promise.all([supabase.from("schools").select("id", { count: "exact", head: true }), supabase.from("classes").select("id", { count: "exact", head: true }), supabase.from("students").select("id", { count: "exact", head: true }), supabase.from("stores").select("id", { count: "exact", head: true })]); return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Schools", schools.count], ["Classes", classes.count], ["Students", students.count], ["Partner stores", stores.count]].map(([label, value]) => <article className="panel p-5" key={String(label)}><p className="text-sm font-bold text-muted">{label}</p><p className="metric-value mt-2">{value ?? 0}</p></article>)}</div>;
  };
  return <main className="page-shell"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand"><Icon className="h-5 w-5" /></div><div><p className="eyebrow">A.L.M.A. administrator</p><h1 className="mt-1 text-3xl font-extrabold">{meta.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{meta.description}</p></div></div><section className="mt-7">{await renderBody()}</section></main>;
}
