"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Copy,
  Check,
  School,
  Building2,
  UsersRound,
  Trophy,
  Link2,
  Unlink,
  Clock,
  MapPin,
  Mail,
  UserCheck,
  GraduationCap,
  QrCode,
  Printer,
  Sparkles,
  Download,
  Phone,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrExportButton, BulkQrSheetButton, InstantQrPreview } from "@/components/shared/code-export";
import { ToastAlert, ConfirmDeleteModal } from "@/components/ui/dialog-alert";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import {
  createPortalUser,
  updatePortalUser,
  deletePortalUser,
  createAdminStudent,
  updateAdminStudent,
  deleteAdminStudent,
  createSchool,
  updateSchool,
  deleteSchool,
  createClass,
  updateClass,
  deleteClass,
  createStore,
  updateStore,
  deleteStore,
  rotateStoreCheckinCode,
  linkStudentToParent,
  unlinkStudentFromParent
} from "./admin-actions";

type Row = Record<string, any>;

function GradeLevelSelect({
  name = "gradeLevel",
  defaultValue = 0,
  label = "Grade Level"
}: {
  name?: string;
  defaultValue?: number | string;
  label?: string;
}) {
  const [isCustom, setIsCustom] = useState(
    Number(defaultValue) > 12 || (Number(defaultValue) < 0 && defaultValue !== "")
  );
  const [selectedVal, setSelectedVal] = useState<string>(String(defaultValue ?? 0));
  const [customVal, setCustomVal] = useState<string>(String(defaultValue ?? ""));

  const standardGrades = [
    { value: "0", label: "Kindergarten (Grade 0)" },
    { value: "1", label: "Grade 1" },
    { value: "2", label: "Grade 2" },
    { value: "3", label: "Grade 3" },
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
    { value: "10", label: "Grade 10" },
    { value: "11", label: "Grade 11" },
    { value: "12", label: "Grade 12" }
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-navy">{label}</span>
        {!isCustom ? (
          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              setCustomVal(selectedVal);
            }}
            className="text-[11px] font-bold text-brand hover:underline"
          >
            + Add New Grade
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              const num = Number(customVal);
              if (num >= 0 && num <= 12) setSelectedVal(String(num));
              else setSelectedVal("0");
            }}
            className="text-[11px] font-bold text-muted hover:underline"
          >
            ← Select from list
          </button>
        )}
      </div>

      {!isCustom ? (
        <select
          name={name}
          value={selectedVal}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setIsCustom(true);
              setCustomVal("");
            } else {
              setSelectedVal(e.target.value);
            }
          }}
          className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal text-slate-800"
        >
          {standardGrades.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
          <option value="custom" className="font-bold text-brand">
            + Add New Grade Level...
          </option>
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            name={name}
            min={0}
            max={12}
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Enter grade number (0 to 12)"
            autoFocus
            required
            className="mt-1 block h-10 w-full rounded-lg border-2 border-brand bg-white px-3 text-sm font-normal text-slate-800 focus:outline-hidden"
          />
        </div>
      )}
    </div>
  );
}

export function AdminManagementView({
  slug,
  profiles,
  students,
  schools,
  classes,
  stores,
  rewards
}: {
  slug: string;
  profiles: Row[];
  students: Row[];
  schools: Row[];
  classes: Row[];
  stores: Row[];
  rewards: Row[];
}) {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateStore, setShowCreateStore] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string>("teacher");
  const [editingUser, setEditingUser] = useState<Row | null>(null);
  const [editingStudent, setEditingStudent] = useState<Row | null>(null);
  const [editingSchool, setEditingSchool] = useState<Row | null>(null);
  const [editingClass, setEditingClass] = useState<Row | null>(null);
  const [editingStore, setEditingStore] = useState<Row | null>(null);
  const [linkingStudent, setLinkingStudent] = useState<Row | null>(null);

  // Dedicated Student QR Card Preview Modal state
  const [previewCardStudent, setPreviewCardStudent] = useState<Row | null>(null);

  // Delete Confirmation Modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    targetLabel: string;
    message?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    targetLabel: "",
    onConfirm: async () => {}
  });

  // Toast Notification state
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; title?: string; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const parentProfiles = profiles.filter((p) => p.role === "parent");

  const showToast = (message: string, type: "success" | "error" = "success", title?: string) => {
    setToast({ type, message, title });
    setTimeout(() => setToast(null), 4500);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied code to clipboard: ${code}`, "success", "Code Copied");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /* ========================================================================= */
  /* TAB: USERS & STUDENTS                                                     */
  /* ========================================================================= */
  if (slug === "users") {
    const totalUsers = profiles.length;
    const activeStaff = profiles.filter((p) => p.role === "teacher" || p.role === "admin" || p.role === "store").length;
    const enrolledStudents = students.filter((s) => s.is_active).length;
    const linkedStudents = students.filter((s) => s.linked_parent_id).length;
    const linkagePct = enrolledStudents > 0 ? Math.round((linkedStudents / enrolledStudents) * 100) : 0;

    return (
      <main className="page-shell space-y-6">
        {toast && <ToastAlert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

        <ConfirmDeleteModal
          isOpen={deleteConfirmation.isOpen}
          title={deleteConfirmation.title}
          targetLabel={deleteConfirmation.targetLabel}
          message={deleteConfirmation.message}
          onConfirm={async () => {
            await deleteConfirmation.onConfirm();
            setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Header & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="eyebrow">A.L.M.A. administrator</p>
            <h1 className="mt-1 text-3xl font-black text-navy tracking-tight">User & Student Management</h1>
            <p className="mt-1 text-[15px] text-muted">
              Configure authorized staff credentials, enroll learners, issue physical QR login cards, and link guardian accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => setShowCreateUser(!showCreateUser)} className="bg-navy text-white font-bold h-10 px-4 text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add User Account
            </Button>
            <Button onClick={() => setShowCreateStudent(!showCreateStudent)} variant="secondary" className="font-bold h-10 px-4 text-sm">
              <Plus className="mr-2 h-4 w-4" /> Enroll Student
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Total Accounts</span>
              <UsersRound className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalUsers}</p>
            <p className="mt-1 text-xs font-bold text-muted">Admins, Teachers, Stores & Parents</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Staff & Partners</span>
              <UserCheck className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{activeStaff}</p>
            <p className="mt-1 text-xs font-bold text-muted">Active educators & merchants</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Enrolled Learners</span>
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{enrolledStudents}</p>
            <p className="mt-1 text-xs font-bold text-muted">Physical QR cards issued</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Family Linkage</span>
              <Link2 className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{linkagePct}%</p>
            <p className="mt-1 text-xs font-bold text-muted">{linkedStudents} of {enrolledStudents} linked to parents</p>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <form
            action={async (fd) => {
              const res = await createPortalUser(fd);
              if (res?.error) showToast(res.error, "error", "Account Creation Failed");
              else {
                setShowCreateUser(false);
                showToast("User account created successfully! Credentials ready for sign-in.", "success", "Account Created");
              }
            }}
            className="panel p-6 border-2 border-brand/30 bg-blue-50/20 space-y-4"
          >
            <div>
              <h3 className="text-lg font-black text-navy">Create New Authorized Account</h3>
              <p className="text-xs text-muted">Credentials will allow the user to sign in to their respective portal.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">
                Email Address
                <input required type="email" name="email" placeholder="user@example.com" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Initial Password
                <input required type="text" name="password" defaultValue="12345678" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Full Display Name
                <input required type="text" name="displayName" placeholder="e.g. Jane Doe" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Assigned Role
                <select
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                >
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="store">Partner Store</option>
                  <option value="admin">A.L.M.A. Administrator</option>
                </select>
              </label>

              {selectedRole === "teacher" && (
                <label className="text-xs font-bold">
                  Classroom Assignment
                  <select name="classId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                    <option value="">Select classroom...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedRole === "store" && (
                <label className="text-xs font-bold">
                  Associated Store Branch
                  <select name="storeId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                    <option value="">Select store...</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedRole === "parent" && (
                <label className="text-xs font-bold">
                  Initial Child Link (Optional)
                  <select name="studentId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                    <option value="">Select child...</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>{st.first_name} {st.last_initial ?? ""} ({st.class_name})</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="md:col-span-2 lg:col-span-3">
                <ImageUploadField
                  label="Profile Picture (Optional)"
                  fileInputName="avatarFile"
                  urlInputName="avatarUrl"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-navy text-white font-bold h-9 px-4 text-xs">Create Account</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateUser(false)} className="h-9 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        )}

        {/* Enroll Student Form */}
        {showCreateStudent && (
          <form
            action={async (fd) => {
              const res = await createAdminStudent(fd);
              if (res?.error) showToast(res.error, "error", "Enrollment Failed");
              else {
                setShowCreateStudent(false);
                showToast("Learner enrolled successfully with QR Card and Parent Invite Code!", "success", "Student Enrolled");
              }
            }}
            className="panel p-6 border-2 border-brand/30 bg-blue-50/20 space-y-4"
          >
            <div>
              <h3 className="text-lg font-black text-navy">Enroll New Learner</h3>
              <p className="text-xs text-muted">
                Enrolling automatically generates a scannable student QR card (for zero-typing mobile login) and a parent invite code.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold">
                First Name
                <input required type="text" name="firstName" placeholder="e.g. Maya" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Last Initial
                <input maxLength={2} name="lastInitial" placeholder="e.g. C" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal uppercase" />
              </label>
              <GradeLevelSelect name="gradeLevel" defaultValue="0" />
              <label className="text-xs font-bold">
                Classroom
                <select required name="classId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                  <option value="">Select classroom...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2 lg:col-span-4">
                <ImageUploadField
                  label="Learner Profile Photo (Optional)"
                  fileInputName="avatarFile"
                  urlInputName="avatarUrl"
                  shape="circle"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-navy text-white font-bold h-9 px-4 text-xs">Enroll Student</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateStudent(false)} className="h-9 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        )}

        {/* Student QR Login Card Preview Modal */}
        {previewCardStudent && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto panel bg-white p-6 shadow-2xl border-2 border-brand/30 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-brand" />
                  <h3 className="text-lg font-black text-navy">Student Login QR Card</h3>
                </div>
                <button
                  onClick={() => setPreviewCardStudent(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-ink"
                >
                  ✕
                </button>
              </div>

              {/* Physical Card Mockup */}
              <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 p-6 text-center shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand">Cart2Class Student Card</span>
                  <Badge tone="blue">Grade {previewCardStudent.grade_level === 0 ? "K" : previewCardStudent.grade_level}</Badge>
                </div>

                <div>
                  <h4 className="text-2xl font-black text-navy">
                    {previewCardStudent.first_name} {previewCardStudent.last_initial ?? ""}
                  </h4>
                  <p className="text-xs text-muted font-bold mt-0.5">
                    {previewCardStudent.class_name || "Kindergarten A"} · Room 12
                  </p>
                </div>

                {/* Scannable QR Code */}
                <div className="py-2 flex justify-center">
                  <QrExportButton
                    bare={true}
                    size={168}
                    compact={false}
                    autoIssue={true}
                    type="student"
                    target={{
                      id: previewCardStudent.id,
                      label: `${previewCardStudent.first_name} ${previewCardStudent.last_initial ?? ""}`.trim(),
                      subtitle: `${previewCardStudent.class_name || "Class"} · Grade ${previewCardStudent.grade_level}`
                    }}
                  />
                </div>

                <div className="rounded-xl bg-blue-50/80 p-3.5 text-xs text-blue-900 border border-blue-200 shadow-xs">
                  <p className="font-extrabold flex items-center justify-center gap-1.5 text-[13px]">
                    <Sparkles className="h-4 w-4 text-brand shrink-0" /> Zero-Typing Student Login
                  </p>
                  <p className="mt-1 text-[11px] text-blue-800 leading-relaxed text-center">
                    The student points their mobile tablet or phone camera at this QR code to sign in instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCopy(previewCardStudent.card_code || previewCardStudent.id)}
                  className="text-xs h-9 px-3 font-bold text-navy hover:bg-blue-50 border shadow-xs inline-flex items-center"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Token
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-navy text-white text-xs font-bold h-9 px-4 hover:bg-navy/90 inline-flex items-center"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Card
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPreviewCardStudent(null)}
                    className="text-xs h-9 px-3 font-bold text-slate-700 hover:bg-slate-100 border shadow-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portal Users Table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-navy">Portal Accounts ({profiles.length})</h2>
            <span className="text-xs font-bold text-muted">All active staff and family credentials</span>
          </div>
          <div className="panel overflow-hidden border shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b bg-slate-50 text-[12px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Account Name</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-bold text-ink">
                        <div className="flex items-center gap-3">
                          <EntityAvatar src={p.avatar_url} alt={p.display_name} kind="user" size="md" shape="rounded" />
                          <span>{p.display_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={p.role === "admin" ? "purple" : p.role === "teacher" ? "blue" : p.role === "store" ? "amber" : "teal"}>
                          {p.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={p.account_status === "active" ? "green" : "slate"}>
                          {p.account_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <Button variant="secondary" onClick={() => setEditingUser(p)} className="h-8 px-2.5 text-xs font-bold">
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: "Deactivate User Account",
                              targetLabel: p.display_name,
                              message: `Are you sure you want to deactivate the account for ${p.display_name}? This will revoke their portal sign-in credentials immediately.`,
                              onConfirm: async () => {
                                const fd = new FormData();
                                fd.append("userId", p.id);
                                await deletePortalUser(fd);
                                showToast(`Deactivated account for ${p.display_name}`, "success", "Account Deactivated");
                              }
                            });
                          }}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Deactivate Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Student Records Table */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-navy">Learner Rosters & Login QR Cards ({students.length})</h2>
              <p className="text-xs text-muted">Manage student card QR codes for mobile zero-typing login and guardian links.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <BulkQrSheetButton
                  key={cls.id}
                  type="student"
                  label={`${cls.name} QR cards`}
                  targets={students.filter((st) => st.class_id === cls.id).map((st) => ({
                    id: st.id,
                    label: `${st.first_name} ${st.last_initial ?? ""}`.trim(),
                    subtitle: `${cls.name} · Grade ${st.grade_level}`
                  }))}
                />
              ))}
            </div>
          </div>

          <div className="panel overflow-hidden border shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b bg-slate-50 text-[12px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Classroom</th>
                    <th className="px-5 py-3.5">Parent Invite Code</th>
                    <th className="px-5 py-3.5">Linked Parent</th>
                    <th className="px-5 py-3.5">Student Login QR</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <EntityAvatar src={st.avatar_url} alt={`${st.first_name} ${st.last_initial ?? ""}`} kind="student" size="md" shape="rounded" />
                          <div>
                            <span className="font-bold text-ink block text-[15px]">{st.first_name} {st.last_initial ?? ""}</span>
                            <span className="text-[11px] text-muted font-mono">{st.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-ink block">{st.class_name || "Unassigned"}</span>
                        <span className="text-xs text-muted">Grade {st.grade_level === 0 ? "K" : st.grade_level}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {st.parent_invite_code ? (
                          <div className="flex items-center gap-1.5">
                            <code className="bg-slate-100 rounded px-2.5 py-1 font-mono font-bold text-xs text-brand border">
                              {st.parent_invite_code}
                            </code>
                            <button
                              onClick={() => handleCopy(st.parent_invite_code)}
                              className="text-muted hover:text-brand p-1"
                              title="Copy invite code"
                            >
                              {copiedCode === st.parent_invite_code ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {st.linked_parent_name ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full text-xs border border-teal-200">
                              <Link2 className="h-3.5 w-3.5 text-teal-600" /> {st.linked_parent_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmation({
                                  isOpen: true,
                                  title: "Unlink Parent Guardian",
                                  targetLabel: `${st.linked_parent_name} from ${st.first_name}`,
                                  message: `Are you sure you want to unlink ${st.linked_parent_name} from ${st.first_name}? They will no longer have access to this learner's recordings.`,
                                  onConfirm: async () => {
                                    const fd = new FormData();
                                    fd.append("studentId", st.id);
                                    fd.append("parentUserId", st.linked_parent_id);
                                    await unlinkStudentFromParent(fd);
                                    showToast("Parent unlinked from learner.", "success", "Guardian Unlinked");
                                  }
                                });
                              }}
                              title="Unlink parent"
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLinkingStudent(st)}
                            className="inline-flex items-center gap-1 font-bold text-brand hover:underline text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition"
                          >
                            <Plus className="h-3.5 w-3.5" /> Link Parent
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Button
                          variant="secondary"
                          onClick={() => setPreviewCardStudent(st)}
                          className="h-8 px-3 text-xs font-bold inline-flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 text-brand border-blue-200"
                        >
                          <QrCode className="h-3.5 w-3.5 text-brand" /> View Login Card
                        </Button>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Button variant="secondary" onClick={() => setEditingStudent(st)} className="h-8 px-2.5 text-xs font-bold">
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: "Deactivate Student",
                              targetLabel: `${st.first_name} ${st.last_initial ?? ""}`,
                              message: `Are you sure you want to deactivate learner ${st.first_name}? Their student QR card login credential will be revoked.`,
                              onConfirm: async () => {
                                const fd = new FormData();
                                fd.append("studentId", st.id);
                                await deleteAdminStudent(fd);
                                showToast(`Deactivated student ${st.first_name}`, "success", "Student Deactivated");
                              }
                            });
                          }}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Deactivate Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Edit User Account Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-navy/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-navy">Edit Account: {editingUser.display_name}</h3>
                <button onClick={() => setEditingUser(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                action={async (fd) => {
                  const res = await updatePortalUser(fd);
                  if (res?.error) showToast(res.error, "error", "Update Failed");
                  else {
                    setEditingUser(null);
                    showToast(`Updated account for ${editingUser.display_name}`, "success", "Account Updated");
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                <input type="hidden" name="userId" value={editingUser.id} />
                <label className="block">
                  Display Name
                  <input
                    required
                    type="text"
                    name="displayName"
                    defaultValue={editingUser.display_name}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <label className="block">
                  Account Status
                  <select
                    name="accountStatus"
                    defaultValue={editingUser.account_status || "active"}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
                <label className="block">
                  Set New Password (optional)
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="Leave blank to keep unchanged"
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <ImageUploadField
                  label="Profile Picture"
                  fileInputName="avatarFile"
                  urlInputName="avatarUrl"
                  initialUrl={editingUser.avatar_url || null}
                  shape="circle"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="secondary" onClick={() => setEditingUser(null)} className="h-9 px-4 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 text-xs font-bold bg-navy text-white hover:bg-slate-800">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Record Modal */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-navy/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-navy">Edit Learner: {editingStudent.first_name} {editingStudent.last_initial || ""}</h3>
                <button onClick={() => setEditingStudent(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                action={async (fd) => {
                  const res = await updateAdminStudent(fd);
                  if (res?.error) showToast(res.error, "error", "Update Failed");
                  else {
                    setEditingStudent(null);
                    showToast(`Updated student profile for ${editingStudent.first_name}`, "success", "Learner Updated");
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                <input type="hidden" name="studentId" value={editingStudent.id} />
                <label className="block">
                  First Name
                  <input
                    required
                    type="text"
                    name="firstName"
                    defaultValue={editingStudent.first_name}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <label className="block">
                  Last Initial (COPPA Privacy)
                  <input
                    type="text"
                    name="lastInitial"
                    defaultValue={editingStudent.last_initial || ""}
                    maxLength={1}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal uppercase"
                  />
                </label>
                <GradeLevelSelect name="gradeLevel" defaultValue={editingStudent.grade_level ?? 0} />
                <label className="block">
                  Assigned Classroom
                  <select
                    required
                    name="classId"
                    defaultValue={editingStudent.class_id}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <ImageUploadField
                  label="Learner Profile Photo"
                  fileInputName="avatarFile"
                  urlInputName="avatarUrl"
                  initialUrl={editingStudent.avatar_url || null}
                  shape="circle"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="secondary" onClick={() => setEditingStudent(null)} className="h-9 px-4 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 text-xs font-bold bg-navy text-white hover:bg-slate-800">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ========================================================================= */
  /* TAB: SCHOOLS & CLASSROOMS                                                 */
  /* ========================================================================= */
  if (slug === "schools") {
    const totalSchools = schools.length;
    const totalClasses = classes.length;
    const totalEnrolled = students.filter((s) => s.is_active).length;
    const totalConfirmedStars = classes.reduce((sum, c) => sum + (c.confirmed_stars || 0), 0);

    return (
      <main className="page-shell space-y-6">
        {toast && <ToastAlert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

        <ConfirmDeleteModal
          isOpen={deleteConfirmation.isOpen}
          title={deleteConfirmation.title}
          targetLabel={deleteConfirmation.targetLabel}
          message={deleteConfirmation.message}
          onConfirm={async () => {
            await deleteConfirmation.onConfirm();
            setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Header & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="eyebrow">A.L.M.A. administrator</p>
            <h1 className="mt-1 text-3xl font-black text-navy tracking-tight">Schools & Classrooms</h1>
            <p className="mt-1 text-[15px] text-muted">
              Add verified pilot educational institutions with legal claims, NCES IDs, and grade-level classrooms.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => setShowCreateSchool(!showCreateSchool)} className="bg-navy text-white font-bold h-10 px-4 text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Partner School
            </Button>
            <Button onClick={() => setShowCreateClass(!showCreateClass)} variant="secondary" className="font-bold h-10 px-4 text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Class
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Partner Schools</span>
              <School className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalSchools}</p>
            <p className="mt-1 text-xs font-bold text-muted">Elementary partner pilots</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Classrooms</span>
              <GraduationCap className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalClasses}</p>
            <p className="mt-1 text-xs font-bold text-muted">K–2 grade learning groups</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Enrolled Students</span>
              <UsersRound className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalEnrolled}</p>
            <p className="mt-1 text-xs font-bold text-muted">Across all classrooms</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Total Goal Stars</span>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalConfirmedStars} ★</p>
            <p className="mt-1 text-xs font-bold text-muted">Earned toward class rewards</p>
          </div>
        </div>

        {/* Create School Form (Comprehensive Legal School Claim) */}
        {showCreateSchool && (
          <form
            action={async (fd) => {
              const res = await createSchool(fd);
              if (res?.error) showToast(res.error, "error", "School Creation Failed");
              else {
                setShowCreateSchool(false);
                showToast("Partner school registered with verified educational claim!", "success", "School Registered");
              }
            }}
            className="panel p-6 border-2 border-brand/30 bg-blue-50/20 space-y-4"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-black text-navy">Register Verified Partner School (Legal Claim)</h3>
            </div>
            <p className="text-xs text-muted">
              Enter official educational institution details, district affiliation, and verification authority.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">
                School Official Name
                <input required type="text" name="name" placeholder="e.g. Oak Grove Elementary" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                School District / LEA
                <input type="text" name="districtName" placeholder="e.g. Jefferson County School District" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                NCES School ID (12 digits)
                <input type="text" name="ncesId" placeholder="e.g. 010000500123" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold md:col-span-2">
                Street Address
                <input type="text" name="address" placeholder="e.g. 100 Learning Lane" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs font-bold">
                  City
                  <input type="text" name="city" placeholder="City" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
                </label>
                <label className="text-xs font-bold">
                  State
                  <input type="text" name="state" placeholder="State" maxLength={2} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal uppercase" />
                </label>
                <label className="text-xs font-bold">
                  Zip
                  <input type="text" name="zipCode" placeholder="ZIP" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
                </label>
              </div>
              <label className="text-xs font-bold">
                Principal / Administrator Name
                <input type="text" name="principalName" placeholder="e.g. Dr. Sarah Jenkins" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Official Institutional Email
                <input type="email" name="contactEmail" placeholder="principal@school.edu" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Official Contact Phone
                <input type="tel" name="contactPhone" placeholder="(205) 555-0192" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>

              <div className="md:col-span-2 lg:col-span-3">
                <ImageUploadField
                  label="School Logo / Insignia"
                  fileInputName="logoFile"
                  urlInputName="logoUrl"
                  shape="square"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-navy text-white font-bold h-9 px-4 text-xs">Verify & Save School</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateSchool(false)} className="h-9 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        )}

        {/* Create Classroom Form */}
        {showCreateClass && (
          <form
            action={async (fd) => {
              const res = await createClass(fd);
              if (res?.error) showToast(res.error, "error", "Classroom Creation Failed");
              else {
                setShowCreateClass(false);
                showToast("Classroom created successfully!", "success", "Classroom Added");
              }
            }}
            className="panel p-6 border-2 border-teal/30 bg-teal-50/20 space-y-4"
          >
            <h3 className="text-lg font-black text-navy">Add Classroom</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">
                School
                <select required name="schoolId" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal">
                  <option value="">Select school...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Classroom Name
                <input required type="text" name="name" placeholder="e.g. Kindergarten A" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <GradeLevelSelect name="gradeLevel" defaultValue="0" />
              <label className="text-xs font-bold">
                School Year
                <input required type="text" name="schoolYear" defaultValue="2026-2027" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Class Reward Goal Title
                <input type="text" name="rewardTitle" defaultValue="Pizza party" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Target Stars
                <input type="number" name="targetStars" defaultValue={100} min={10} max={1000} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-navy text-white font-bold h-9 px-4 text-xs">Save Classroom</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateClass(false)} className="h-9 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        )}

        {/* Schools & Classrooms Grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Schools Table */}
          <div className="panel overflow-hidden border shadow-xs bg-white">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-navy text-base">Partner Schools ({schools.length})</h3>
                <p className="text-xs text-muted">Educational organizations with verified legal pilot claims</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b bg-slate-50 text-[12px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">School & District</th>
                    <th className="px-5 py-3.5">Principal & Contact</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schools.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <EntityAvatar src={s.logo_url} alt={s.name} kind="school" size="md" shape="square" />
                          <div>
                            <span className="font-bold text-ink block text-[15px]">{s.name}</span>
                            <span className="text-xs text-muted">{s.district_name || "District Partner"} · NCES: {s.nces_id || "010000500123"}</span>
                            <span className="text-xs text-slate-400 block mt-0.5">{s.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">
                        <span className="font-bold text-slate-700 block">{s.principal_name || "Dr. Sarah Jenkins"}</span>
                        <span>{s.contact_email || "principal@school.edu"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={s.is_active ? "green" : "slate"}>
                          {s.is_active ? "Verified Pilot" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Button variant="secondary" onClick={() => setEditingSchool(s)} className="h-8 px-2.5 text-xs font-bold">
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: "Deactivate Partner School",
                              targetLabel: s.name,
                              message: `Are you sure you want to deactivate ${s.name}? All classrooms and enrolled student cards linked to this school will be suspended.`,
                              onConfirm: async () => {
                                const fd = new FormData();
                                fd.append("schoolId", s.id);
                                await deleteSchool(fd);
                                showToast(`Deactivated school ${s.name}`, "success", "School Deactivated");
                              }
                            });
                          }}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Deactivate School"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classrooms Table */}
          <div className="panel overflow-hidden border shadow-xs bg-white">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-navy text-base">Classrooms ({classes.length})</h3>
                <p className="text-xs text-muted">Grade levels, assigned teachers, and star targets</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b bg-slate-50 text-[12px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Class</th>
                    <th className="px-5 py-3.5">Grade</th>
                    <th className="px-5 py-3.5">Teacher</th>
                    <th className="px-5 py-3.5">Reward Goal</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-ink block text-[15px]">{c.name}</span>
                        <span className="text-xs text-muted font-bold">{c.enrolled_count ?? 0} active learners</span>
                      </td>
                      <td className="px-5 py-3.5">Grade {c.grade_level === 0 ? "K" : c.grade_level}</td>
                      <td className="px-5 py-3.5 text-xs text-muted font-medium">{c.assigned_teacher}</td>
                      <td className="px-5 py-3.5 text-xs text-muted">
                        <span className="font-bold text-ink block">{c.reward_title || "Pizza party"}</span>
                        <span className="text-brand font-black">({c.confirmed_stars ?? 0}/{c.target_stars ?? 100}★)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Button variant="secondary" onClick={() => setEditingClass(c)} className="h-8 px-2.5 text-xs font-bold">
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: "Deactivate Classroom",
                              targetLabel: c.name,
                              message: `Are you sure you want to deactivate classroom ${c.name}?`,
                              onConfirm: async () => {
                                const fd = new FormData();
                                fd.append("classId", c.id);
                                await deleteClass(fd);
                                showToast(`Deactivated class ${c.name}`, "success", "Class Deactivated");
                              }
                            });
                          }}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Deactivate Classroom"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit School Modal (Legal Claim Details) */}
        {editingSchool && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-navy/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-black text-navy">Edit Partner School (Legal Educational Claim)</h3>
                </div>
                <button onClick={() => setEditingSchool(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                action={async (fd) => {
                  const res = await updateSchool(fd);
                  if (res?.error) showToast(res.error, "error", "Update Failed");
                  else {
                    setEditingSchool(null);
                    showToast(`Updated verified details for ${editingSchool.name}`, "success", "School Updated");
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                <input type="hidden" name="schoolId" value={editingSchool.id} />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    School Official Name
                    <input
                      required
                      type="text"
                      name="name"
                      defaultValue={editingSchool.name}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    School District / LEA
                    <input
                      type="text"
                      name="districtName"
                      defaultValue={editingSchool.district_name || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    NCES ID (12 digits)
                    <input
                      type="text"
                      name="ncesId"
                      defaultValue={editingSchool.nces_id || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    Street Address
                    <input
                      type="text"
                      name="address"
                      defaultValue={editingSchool.address || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      City
                      <input
                        type="text"
                        name="city"
                        defaultValue={editingSchool.city || ""}
                        className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                      />
                    </label>
                    <label className="block">
                      State
                      <input
                        type="text"
                        name="state"
                        defaultValue={editingSchool.state || ""}
                        maxLength={2}
                        className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal uppercase"
                      />
                    </label>
                    <label className="block">
                      Zip
                      <input
                        type="text"
                        name="zipCode"
                        defaultValue={editingSchool.zip_code || ""}
                        className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                      />
                    </label>
                  </div>
                  <label className="block">
                    Principal / Administrator
                    <input
                      type="text"
                      name="principalName"
                      defaultValue={editingSchool.principal_name || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    Institutional Contact Email
                    <input
                      type="email"
                      name="contactEmail"
                      defaultValue={editingSchool.contact_email || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    Contact Phone
                    <input
                      type="tel"
                      name="contactPhone"
                      defaultValue={editingSchool.contact_phone || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                </div>

                <ImageUploadField
                  label="School Logo / Insignia"
                  fileInputName="logoFile"
                  urlInputName="logoUrl"
                  initialUrl={editingSchool.logo_url || null}
                  shape="square"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingSchool.is_active}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    <span>Active Partner Status</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Agreement Status:</span>
                    <select
                      name="agreementStatus"
                      defaultValue={editingSchool.agreement_status || "verified"}
                      className="h-8 rounded-lg border bg-white px-2 text-xs font-normal"
                    >
                      <option value="verified">Verified</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="secondary" onClick={() => setEditingSchool(null)} className="h-9 px-4 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 text-xs font-bold bg-navy text-white hover:bg-slate-800">
                    Save Verified School
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Classroom Modal */}
        {editingClass && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-navy/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-navy">Edit Classroom: {editingClass.name}</h3>
                <button onClick={() => setEditingClass(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                action={async (fd) => {
                  const res = await updateClass(fd);
                  if (res?.error) showToast(res.error, "error", "Update Failed");
                  else {
                    setEditingClass(null);
                    showToast(`Updated classroom ${editingClass.name}`, "success", "Classroom Updated");
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                <input type="hidden" name="classId" value={editingClass.id} />
                <label className="block">
                  Classroom Name
                  <input
                    required
                    type="text"
                    name="name"
                    defaultValue={editingClass.name}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <GradeLevelSelect name="gradeLevel" defaultValue={editingClass.grade_level ?? 0} />
                  <label className="block">
                    School Year
                    <input
                      required
                      type="text"
                      name="schoolYear"
                      defaultValue={editingClass.school_year || "2026-2027"}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    Class Reward Title
                    <input
                      type="text"
                      name="rewardTitle"
                      defaultValue={editingClass.reward_title || "Pizza party"}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    Target Stars
                    <input
                      type="number"
                      name="targetStars"
                      defaultValue={editingClass.target_stars || 100}
                      min={10}
                      max={1000}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingClass.is_active}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span>Active Classroom Status</span>
                </label>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="secondary" onClick={() => setEditingClass(null)} className="h-9 px-4 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 text-xs font-bold bg-navy text-white hover:bg-slate-800">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ========================================================================= */
  /* TAB: PARTNER STORES                                                       */
  /* ========================================================================= */
  if (slug === "stores") {
    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.is_active).length;
    const activeRewards = rewards.length;
    const totalVisits = rewards.reduce((sum, r) => sum + (r.current_stars || 0), 0);

    return (
      <main className="page-shell space-y-6">
        {toast && <ToastAlert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

        <ConfirmDeleteModal
          isOpen={deleteConfirmation.isOpen}
          title={deleteConfirmation.title}
          targetLabel={deleteConfirmation.targetLabel}
          message={deleteConfirmation.message}
          onConfirm={async () => {
            await deleteConfirmation.onConfirm();
            setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Header & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="eyebrow">A.L.M.A. administrator</p>
            <h1 className="mt-1 text-3xl font-black text-navy tracking-tight">Partner Stores & Check-In Signs</h1>
            <p className="mt-1 text-[15px] text-muted">Manage participating grocery store branches, entrance signs, and reward sponsorships.</p>
          </div>
          <Button onClick={() => setShowCreateStore(!showCreateStore)} className="bg-navy text-white font-bold h-10 px-4 text-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Partner Store
          </Button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Partner Stores</span>
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalStores}</p>
            <p className="mt-1 text-xs font-bold text-muted">Participating grocery locations</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Active Check-In Signs</span>
              <QrCode className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{activeStores}</p>
            <p className="mt-1 text-xs font-bold text-muted">Entrance QR codes active</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">In-Store Stars</span>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{totalVisits} ★</p>
            <p className="mt-1 text-xs font-bold text-muted">Scans accumulated in store</p>
          </div>
          <div className="panel p-6 bg-white border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Reward Commitments</span>
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-navy">{activeRewards}</p>
            <p className="mt-1 text-xs font-bold text-muted">Class goals sponsored</p>
          </div>
        </div>

        {/* Create Store Form */}
        {showCreateStore && (
          <form
            action={async (fd) => {
              const res = await createStore(fd);
              if (res?.error) showToast(res.error, "error", "Store Creation Failed");
              else {
                setShowCreateStore(false);
                showToast("Partner grocery store added successfully!", "success", "Store Added");
              }
            }}
            className="panel p-6 border-2 border-brand/30 bg-blue-50/20 space-y-4"
          >
            <h3 className="text-lg font-black text-navy">Add Partner Grocery Store</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">
                Store Name
                <input required type="text" name="name" placeholder="e.g. Green Basket Market" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Contact Email
                <input type="email" name="contactEmail" placeholder="partner@store.com" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Representative Name
                <input type="text" name="representativeName" placeholder="e.g. John Doe (Manager)" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold md:col-span-2">
                Branch Address
                <input type="text" name="address" placeholder="e.g. 20 Community Way, Alabama" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Business Hours
                <input type="text" name="businessHours" placeholder="e.g. 8:00 AM - 9:00 PM" className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal" />
              </label>

              <div className="md:col-span-2 lg:col-span-3">
                <ImageUploadField
                  label="Store Logo / Front Image"
                  fileInputName="logoFile"
                  urlInputName="logoUrl"
                  shape="square"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-navy text-white font-bold h-9 px-4 text-xs">Save Store</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateStore(false)} className="h-9 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        )}

        {/* Stores Table */}
        <div className="panel overflow-hidden border shadow-xs bg-white">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-navy text-base">Participating Store Locations ({stores.length})</h3>
              <p className="text-xs text-muted">Stores equipped with scannable Cart2Class entrance check-in signs</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b bg-slate-50 text-[12px] font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Store Name</th>
                  <th className="px-5 py-3.5">Representative / Hours</th>
                  <th className="px-5 py-3.5">Address & Contact</th>
                  <th className="px-5 py-3.5">Entrance Sign QR</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <EntityAvatar src={s.logo_url} alt={s.name} kind="store" size="md" shape="square" />
                        <div>
                          <span className="font-bold text-ink block text-[15px]">{s.name}</span>
                          <span className="text-xs text-muted font-mono">ID: {s.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-ink block">{s.representative_name || "Manager"}</span>
                      <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="h-3.5 w-3.5" /> {s.business_hours || "Standard Hours"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {s.address || "—"}
                      </span>
                      <span className="flex items-center gap-1 mt-0.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {s.contact_email || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <QrExportButton
                        compact
                        type="store"
                        target={{
                          id: s.id,
                          label: s.name,
                          subtitle: "Store check-in · Scan to begin a Cart2Class mission"
                        }}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={s.is_active ? "green" : "slate"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <Button variant="secondary" onClick={() => setEditingStore(s)} className="h-8 px-2.5 text-xs font-bold">
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <form action={async (fd) => { await rotateStoreCheckinCode(fd); }} className="inline-block">
                        <input type="hidden" name="storeId" value={s.id} />
                        <Button variant="secondary" type="submit" className="h-8 px-2.5 text-xs font-bold">
                          Rotate QR
                        </Button>
                      </form>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmation({
                            isOpen: true,
                            title: "Deactivate Partner Store",
                            targetLabel: s.name,
                            message: `Are you sure you want to deactivate ${s.name}? Its entrance check-in sign will be revoked immediately.`,
                            onConfirm: async () => {
                              const fd = new FormData();
                              fd.append("storeId", s.id);
                              await deleteStore(fd);
                              showToast(`Deactivated store ${s.name}`, "success", "Store Deactivated");
                            }
                          });
                        }}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                        title="Deactivate Store"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower Screen Enrichment: Storefront Check-in Poster Preview + Rewards */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          {/* Printable Entrance Sign Card */}
          <div className="panel p-6 bg-gradient-to-br from-white to-blue-50/50 border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-navy text-base">Storefront Check-In Sign Poster</h3>
                <p className="text-xs text-muted">Printable sign displayed at partner store entrance doors</p>
              </div>
              <Badge tone="green">A4 / Letter Poster</Badge>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-brand/30 bg-white p-6 text-center space-y-4 shadow-sm">
              <span className="eyebrow text-brand font-black">CART2CLASS LEARNING PARTNER</span>
              <div className="flex flex-col items-center justify-center gap-2">
                <EntityAvatar src={stores[0]?.logo_url} alt={stores[0]?.name || "Store"} kind="store" size="lg" shape="square" />
                <h4 className="text-3xl font-black text-navy">{stores[0]?.name || "Green Basket Market"}</h4>
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Welcome young shoppers! Point your Cart2Class Student App camera at this sign to verify your store visit and begin your aisle mission.
              </p>

              {/* Automatic High-Resolution Scannable QR Sign */}
              <div className="py-2 flex justify-center">
                <InstantQrPreview
                  payload={`cart2class://check-in/${stores[0]?.id || "00000000-0000-0000-0000-000000000031"}?token=c2c_store_verified`}
                  label={stores[0]?.name || "Green Basket Market"}
                  subtitle="Scannable Store Check-In Sign"
                  size={168}
                />
              </div>

              <p className="text-[11px] text-muted font-medium">
                Position this sign at child eye-level (approx. 3.5 to 4 feet) near the store entrance or produce section.
              </p>
            </div>
          </div>

          {/* Sponsored Classroom Rewards */}
          <div className="panel p-6 bg-white border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-navy text-base">Sponsored Classroom Rewards</h3>
                <p className="text-xs text-muted">Class goals backed by partner grocery stores</p>
              </div>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>

            {rewards.length > 0 ? (
              <div className="space-y-4">
                {rewards.map((rw) => (
                  <div key={rw.id} className="panel bg-slate-50/70 p-5 rounded-xl border space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-navy text-sm">{rw.title}</span>
                      <Badge tone={rw.status === "ready" ? "green" : "amber"}>{rw.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted font-bold">
                      <span>Progress:</span>
                      <span className="text-brand font-black">{rw.current_stars} / {rw.target_stars} ★</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border">
                      <div
                        className="bg-brand h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((rw.current_stars || 0) / (rw.target_stars || 100)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No reward goals currently connected to this store.</p>
            )}
          </div>
        </div>

        {/* Edit Store Partner Modal */}
        {editingStore && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-navy/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto rounded-2xl bg-white p-6 shadow-2xl border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-black text-navy">Edit Store: {editingStore.name}</h3>
                <button onClick={() => setEditingStore(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                action={async (fd) => {
                  const res = await updateStore(fd);
                  if (res?.error) showToast(res.error, "error", "Update Failed");
                  else {
                    setEditingStore(null);
                    showToast(`Updated partner store details for ${editingStore.name}`, "success", "Store Updated");
                  }
                }}
                className="space-y-4 text-xs font-bold"
              >
                <input type="hidden" name="storeId" value={editingStore.id} />
                <label className="block">
                  Store Official Name
                  <input
                    required
                    type="text"
                    name="name"
                    defaultValue={editingStore.name}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    Store Manager / Representative
                    <input
                      type="text"
                      name="representativeName"
                      defaultValue={editingStore.representative_name || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block">
                    Contact Email
                    <input
                      type="email"
                      name="contactEmail"
                      defaultValue={editingStore.contact_email || ""}
                      className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <label className="block">
                  Business Hours
                  <input
                    type="text"
                    name="businessHours"
                    defaultValue={editingStore.business_hours || ""}
                    placeholder="e.g. Mon–Sun: 7am–10pm"
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <label className="block">
                  Store Street Address
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingStore.address || ""}
                    className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal"
                  />
                </label>
                <ImageUploadField
                  label="Store Logo / Front Image"
                  fileInputName="logoFile"
                  urlInputName="logoUrl"
                  initialUrl={editingStore.logo_url || null}
                  shape="square"
                  helpText="Optional · Max 5MB (Upload file or paste web image link)"
                />
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingStore.is_active}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span>Active Partner Store Status</span>
                </label>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="secondary" onClick={() => setEditingStore(null)} className="h-9 px-4 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 text-xs font-bold bg-navy text-white hover:bg-slate-800">
                    Save Store Details
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return null;
}
