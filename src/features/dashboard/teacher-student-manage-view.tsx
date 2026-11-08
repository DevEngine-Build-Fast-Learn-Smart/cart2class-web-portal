import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkQrSheetButton, QrExportButton } from "@/components/shared/code-export";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { deactivateTeacherStudent, saveTeacherStudent } from "./workflow-actions";

type Student = {
  id: string;
  first_name: string;
  last_initial: string | null;
  grade_level: number;
  class_id: string | null;
  parent_invite_code?: string | null;
  card_code?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
};

type Classroom = { id: string; name: string; grade_level: number };
const label = (student: Student) => `${student.first_name} ${student.last_initial ?? ""}`.trim();

function StudentForm({ classes, student }: { classes: Classroom[]; student?: Student }) {
  return (
    <form action={saveTeacherStudent} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="studentId" value={student?.id ?? ""} />
      <label className="text-sm font-bold">
        First name
        <input required name="firstName" defaultValue={student?.first_name ?? ""} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 font-normal" />
      </label>
      <label className="text-sm font-bold">
        Last initial
        <input name="lastInitial" maxLength={1} defaultValue={student?.last_initial ?? ""} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 font-normal uppercase" />
      </label>
      <label className="text-sm font-bold">
        Class
        <select required name="classId" defaultValue={student?.class_id ?? ""} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 font-normal">
          {classes.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Grade
        <select name="gradeLevel" defaultValue={String(student?.grade_level ?? classes[0]?.grade_level ?? 0)} className="mt-1 block h-10 w-full rounded-lg border bg-white px-3 font-normal">
          <option value="0">Kindergarten</option>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <ImageUploadField
          label="Student Photo (Optional)"
          fileInputName="avatarFile"
          urlInputName="avatarUrl"
          initialUrl={student?.avatar_url || null}
          shape="circle"
          helpText="Optional · Max 5MB"
        />
      </div>
      <button className="w-fit rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white">
        {student ? "Save student" : "Add student"}
      </button>
    </form>
  );
}

export async function TeacherStudentManageView({ supabase }: { supabase: SupabaseClient }) {
  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase
      .from("students")
      .select("id,first_name,last_initial,grade_level,class_id,parent_invite_code,card_code,avatar_url,is_active")
      .order("first_name"),
    supabase.from("classes").select("id,name,grade_level").order("grade_level")
  ]);

  const roster = (students ?? []) as Student[];
  const classrooms = (classes ?? []) as Classroom[];
  const names = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]));

  return (
    <main className="page-shell">
      <p className="eyebrow">Teacher portal</p>
      <h1 className="mt-1 text-3xl font-extrabold">Students & QR Cards</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        Manage rosters for your assigned classes. Each student receives an offline QR card login and a parent invite code for home tracking.
      </p>

      {classrooms.length ? (
        <>
          <details className="panel mt-7 p-5">
            <summary className="cursor-pointer font-extrabold text-navy">Add a student</summary>
            <div className="mt-5">
              <StudentForm classes={classrooms} />
            </div>
          </details>

          {roster.length ? (
            <>
              <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roster.map((student) => (
                  <article className="panel p-5 space-y-3" key={student.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          src={student.avatar_url}
                          alt={label(student)}
                          kind="student"
                          size="md"
                          shape="circle"
                        />
                        <div>
                          <h2 className="font-extrabold text-lg text-ink">{label(student)}</h2>
                          <p className="text-xs text-muted">
                            {names.get(student.class_id ?? "") ?? "Unassigned"} · Grade {student.grade_level}
                          </p>
                        </div>
                      </div>
                      <Badge tone={student.is_active ? "green" : "slate"}>
                        {student.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {student.parent_invite_code && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border text-xs">
                        <span className="text-muted font-bold block mb-1">Parent Invite Code:</span>
                        <code className="font-mono font-bold text-brand">{student.parent_invite_code}</code>
                      </div>
                    )}

                    {student.is_active && (
                      <div className="mt-2">
                        <QrExportButton
                          type="student"
                          target={{
                            id: student.id,
                            label: label(student),
                            subtitle: `${names.get(student.class_id ?? "") ?? "Class"} · Grade ${student.grade_level}`
                          }}
                        />
                      </div>
                    )}

                    <details className="rounded-xl border bg-slate-50 p-3">
                      <summary className="cursor-pointer text-xs font-bold text-brand">Edit student</summary>
                      <div className="mt-3">
                        <StudentForm classes={classrooms} student={student} />
                      </div>
                    </details>

                    {student.is_active && (
                      <form action={deactivateTeacherStudent} className="pt-2">
                        <input type="hidden" name="studentId" value={student.id} />
                        <button className="text-xs font-bold text-red-700 hover:underline">
                          Deactivate student access
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </section>

              <section className="panel mt-6 p-5">
                <h2 className="font-extrabold">Printable class QR card sheets</h2>
                <p className="mt-1 text-sm text-muted">Only active students in your assigned classes are included.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {classrooms.map((classroom) => (
                    <BulkQrSheetButton
                      key={classroom.id}
                      type="student"
                      label={`${classroom.name} student QR cards`}
                      targets={roster
                        .filter((student) => student.class_id === classroom.id && student.is_active)
                        .map((student) => ({
                          id: student.id,
                          label: label(student),
                          subtitle: `${classroom.name} · Grade ${student.grade_level}`
                        }))}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="mt-7">
              <EmptyState title="No students in your classes" description="Use Add a student to create the first authorized learner record." />
            </div>
          )}
        </>
      ) : (
        <div className="mt-7">
          <EmptyState title="No assigned classes" description="An administrator must assign a class before you can manage a roster." />
        </div>
      )}
    </main>
  );
}
