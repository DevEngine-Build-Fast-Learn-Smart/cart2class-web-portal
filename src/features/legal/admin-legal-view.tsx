import type { SupabaseClient } from "@supabase/supabase-js";
import { ShieldCheck, UserCheck, GraduationCap, Building2, FileText, Clock, ChevronDown, Activity, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { publishPolicyVersion, savePolicyVersion, updateDeletionRequest } from "./actions";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric"
      }).format(new Date(value))
    : "—";

function getAuditMeta(action: string, entityType: string) {
  if (action.includes("student")) {
    return {
      title: action === "student.updated" ? "Learner Record Updated" : "Learner Roster Event",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      badgeTone: "blue" as const
    };
  }
  if (action.includes("policy")) {
    return {
      title: action === "policy.published" ? "Legal Policy Published" : "Policy Document Updated",
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      badgeTone: "green" as const
    };
  }
  if (action.includes("store")) {
    return {
      title: "Store Partner Event",
      icon: Building2,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      badgeTone: "amber" as const
    };
  }
  return {
    title: action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Activity,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    badgeTone: "slate" as const
  };
}

export async function AdminLegalView({
  slug,
  supabase
}: {
  slug: "legal" | "deletion-requests" | "audit-logs";
  supabase: SupabaseClient;
}) {
  if (slug === "legal") {
    const [{ data: documents }, { data: versions }] = await Promise.all([
      supabase.from("policy_documents").select("id,slug,title").order("title"),
      supabase
        .from("policy_versions")
        .select("id,document_id,title,status,published_at,effective_at,created_at,content_markdown")
        .order("created_at", { ascending: false })
    ]);

    return (
      <main className="page-shell">
        <div>
          <p className="eyebrow">A.L.M.A. administrator</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">Legal & Policies</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Create reviewable versions and publish one approved version per public policy. Only published versions are visible to visitors.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {(documents ?? []).map((document) => {
            const related = (versions ?? []).filter((version) => version.document_id === document.id);
            return (
              <section key={document.id} className="panel p-6 border shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-navy">{document.title}</h2>
                    <p className="mt-0.5 text-xs text-muted font-mono">/{document.slug}</p>
                  </div>
                  <a className="text-sm font-bold text-brand hover:underline" href={`/${document.slug}`} target="_blank">
                    Preview public page
                  </a>
                </div>

                <div className="space-y-3">
                  {related.length ? (
                    related.map((version) => (
                      <article className="rounded-xl border bg-slate-50/50 p-4" key={version.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-ink">{version.title}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              Created {formatDate(version.created_at)} · Published {formatDate(version.published_at)}
                            </p>
                          </div>
                          <Badge>{version.status}</Badge>
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-bold text-brand">View content markdown</summary>
                          <div className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs leading-6 text-slate-700 border">
                            {version.content_markdown}
                          </div>
                        </details>
                        {version.status !== "published" && (
                          <form action={publishPolicyVersion} className="mt-3">
                            <input type="hidden" name="versionId" value={version.id} />
                            <button className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition">
                              Publish this version
                            </button>
                          </form>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No policy versions yet.</p>
                  )}
                </div>

                <details className="rounded-xl border bg-slate-50 p-4">
                  <summary className="cursor-pointer font-bold text-sm text-navy">Create a draft version</summary>
                  <form action={savePolicyVersion} className="mt-4 grid gap-3">
                    <input type="hidden" name="documentId" value={document.id} />
                    <label className="text-xs font-bold">
                      Title
                      <input
                        required
                        name="title"
                        defaultValue={document.title}
                        className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 font-normal text-sm"
                      />
                    </label>
                    <label className="text-xs font-bold">
                      Content
                      <textarea
                        required
                        name="content"
                        rows={8}
                        className="mt-1 block w-full rounded-lg border bg-white p-3 font-normal text-sm"
                        placeholder="Write the policy content for review."
                      />
                    </label>
                    <button className="w-fit rounded-lg border border-brand px-3 py-2 text-xs font-bold text-brand hover:bg-blue-50 transition">
                      Save draft
                    </button>
                  </form>
                </details>
              </section>
            );
          })}
        </div>
      </main>
    );
  }

  if (slug === "deletion-requests") {
    const { data: requests } = await supabase
      .from("data_deletion_requests")
      .select("id,requester_name,requester_email,request_type,details,status,resolution_note,created_at")
      .order("created_at", { ascending: false });

    return (
      <main className="page-shell">
        <div>
          <p className="eyebrow">A.L.M.A. administrator</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">Data Deletion Requests</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Verify identity and authority before changing any account, student, recording, or retention data.
          </p>
        </div>

        <section className="mt-6 space-y-4">
          {requests?.length ? (
            requests.map((request) => (
              <article key={request.id} className="panel p-5 border shadow-xs space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-ink text-base">{request.requester_name}</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {request.requester_email} · {request.request_type.replace("_", " ")} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge>{request.status.replace("_", " ")}</Badge>
                </div>
                {request.details && (
                  <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700 border">
                    {request.details}
                  </p>
                )}
                <form action={updateDeletionRequest} className="grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
                  <input type="hidden" name="id" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="h-10 rounded-lg border bg-white px-3 text-sm font-medium"
                  >
                    <option value="received">Received</option>
                    <option value="verifying">Verifying</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="declined">Declined</option>
                  </select>
                  <input
                    name="resolutionNote"
                    defaultValue={request.resolution_note ?? ""}
                    placeholder="Internal resolution note"
                    className="h-10 rounded-lg border bg-white px-3 text-sm"
                  />
                  <button className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition">
                    Update
                  </button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState
              title="No deletion requests"
              description="Publicly submitted requests will appear here for authorized review."
            />
          )}
        </section>
      </main>
    );
  }

  // slug === "audit-logs"
  const { data: audits } = await supabase
    .from("audit_logs")
    .select("id,action,entity_type,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const totalAudits = audits?.length ?? 0;
  const policyAudits = audits?.filter((a) => a.action.includes("policy")).length ?? 0;
  const studentAudits = audits?.filter((a) => a.action.includes("student")).length ?? 0;

  return (
    <main className="page-shell space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">A.L.M.A. administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy">Audit Logs & Compliance Feed</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Immutable event log tracking administrative actions, roster updates, legal policy publications, and QR security operations.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Recorded Events</span>
            <Activity className="h-5 w-5 text-brand" />
          </div>
          <p className="mt-3 text-3xl font-black text-navy">{totalAudits}</p>
          <p className="mt-1 text-xs text-muted">Total administrative audit entries</p>
        </div>
        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Roster Events</span>
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-black text-navy">{studentAudits}</p>
          <p className="mt-1 text-xs text-muted">Learner assignments & enrollments</p>
        </div>
        <div className="panel p-5 bg-white border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Policy & Security</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-black text-navy">{policyAudits}</p>
          <p className="mt-1 text-xs text-muted">Published policies & legal changes</p>
        </div>
      </div>

      {/* Audit Log Timeline Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy">Activity Feed ({totalAudits})</h2>
          <span className="text-xs text-muted">Chronological order (most recent first)</span>
        </div>

        {audits?.length ? (
          <div className="space-y-3">
            {audits.map((audit) => {
              const meta = getAuditMeta(audit.action, audit.entity_type);
              const Icon = meta.icon;
              const metadataObj = (typeof audit.metadata === "object" && audit.metadata !== null ? audit.metadata : {}) as Record<string, any>;
              const keys = Object.keys(metadataObj);

              return (
                <article key={audit.id} className="panel p-5 border shadow-xs bg-white hover:shadow-md transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-ink text-sm sm:text-base">{meta.title}</h3>
                          <Badge tone={meta.badgeTone}>{audit.entity_type}</Badge>
                        </div>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="h-3.5 w-3.5" /> {formatDate(audit.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted bg-slate-100 px-2.5 py-1 rounded-md">
                      {audit.action}
                    </span>
                  </div>

                  {/* Formatted Key-Value Details */}
                  {keys.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {keys.map((k) => (
                          <div key={k} className="inline-flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1 text-slate-700">
                            <span className="font-bold text-muted capitalize">{k.replace(/_/g, " ")}:</span>
                            <span className="font-mono font-medium text-ink truncate max-w-xs">{String(metadataObj[k])}</span>
                          </div>
                        ))}
                      </div>

                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-muted hover:text-brand inline-flex items-center gap-1">
                          View raw JSON metadata <ChevronDown className="h-3 w-3" />
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-100">
                          {JSON.stringify(audit.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No audit activity yet"
            description="Audited administrative actions will appear here."
          />
        )}
      </section>
    </main>
  );
}
