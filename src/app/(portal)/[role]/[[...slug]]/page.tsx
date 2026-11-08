import { notFound } from "next/navigation";
import { roles, type Role } from "@/types/domain";
import { requireRole } from "@/lib/permissions/access";
import { PortalShell } from "@/components/layout/portal-shell";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboardData } from "@/features/dashboard/service";
import { SectionView } from "@/features/dashboard/section-view";
import { AdminSectionView } from "@/features/dashboard/admin-section-view";
import { AdminManagementView } from "@/features/dashboard/admin-management-view";
import { AdminReportsView } from "@/features/dashboard/admin-reports-view";
import { AdminSettingsView } from "@/features/dashboard/admin-settings-view";
import { StoreCheckinView } from "@/features/dashboard/store-checkin-view";
import { AdminLegalView } from "@/features/legal/admin-legal-view";
import { RoleSectionView } from "@/features/dashboard/role-section-view";
import { StoreOperationsView } from "@/features/dashboard/store-operations-view";
import { StoreProductsView } from "@/features/dashboard/store-products-view";
import { TeacherStudentManageView } from "@/features/dashboard/teacher-student-manage-view";
import { TeacherClassesView } from "@/features/dashboard/teacher-classes-view";
import { ParentPortalView } from "@/features/dashboard/parent-portal-view";
import { MissionBuilderView } from "@/features/missions/mission-builder-view";
import { MissionLibraryView } from "@/features/missions/mission-library-view";

type Row = Record<string, any>;

export default async function PortalPage({
  params,
  searchParams
}: {
  params: Promise<{ role: string; slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { role: inputRole, slug = [] } = await params;
  const query = searchParams ? await searchParams : {};
  const requestedMissionId = typeof query.id === "string" ? query.id : undefined;
  if (!roles.includes(inputRole as Role)) notFound();
  const role = inputRole as Role;
  const access = await requireRole(role);

  if (access.unavailable || !access.profile || !access.supabase) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <section className="panel max-w-lg p-7">
          <h1 className="text-2xl font-extrabold">Supabase needs configuration</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Add the project URL and publishable key to a local <code>.env.local</code> file, apply the repository migrations, and restart the app.
          </p>
        </section>
      </main>
    );
  }

  const supabase = access.supabase;
  const currentSlug = slug[0];

  let content: React.ReactNode = null;

  if (!currentSlug) {
    // Overview Dashboard
    const data = await getDashboardData(supabase, role, access.profile.id);
    content = <DashboardView role={role} displayName={access.profile.display_name} {...data} />;
  } else if (role === "admin") {
    if (["users", "schools", "stores", "reports"].includes(currentSlug)) {
      const [
        { data: profiles },
        { data: memberships },
        { data: students },
        { data: schools },
        { data: classes },
        { data: stores },
        { data: rewards },
        { data: parentLinks },
        { data: teacherLinks }
      ] = await Promise.all([
        supabase.from("profiles").select("id,display_name,account_status,avatar_url").order("display_name"),
        supabase.from("role_memberships").select("user_id,role"),
        supabase.from("students").select("id,first_name,last_initial,grade_level,class_id,parent_invite_code,card_code,is_active,avatar_url").order("first_name"),
        supabase.from("schools").select("*").order("name"),
        supabase.from("classes").select("id,school_id,name,grade_level,school_year,reward_title,confirmed_stars,target_stars,is_active").order("grade_level"),
        supabase.from("stores").select("id,name,contact_email,address,representative_name,business_hours,is_active,logo_url").order("name"),
        supabase.from("reward_goals").select("id,title,current_stars,target_stars,status,class_id,store_id").order("created_at", { ascending: false }),
        supabase.from("parent_student_relationships").select("parent_user_id,student_id,is_active"),
        supabase.from("teacher_class_assignments").select("teacher_user_id,class_id,is_active")
      ]);

      let resolvedProfiles: Row[] | null = profiles as Row[] | null;
      if (!resolvedProfiles) {
        const { data: fb } = await supabase.from("profiles").select("id,display_name,account_status").order("display_name");
        resolvedProfiles = fb as Row[] | null;
      }
      let resolvedStudents: Row[] | null = students as Row[] | null;
      if (!resolvedStudents) {
        const { data: fb } = await supabase.from("students").select("id,first_name,last_initial,grade_level,class_id,parent_invite_code,card_code,is_active").order("first_name");
        resolvedStudents = fb as Row[] | null;
      }
      let resolvedStores: Row[] | null = stores as Row[] | null;
      if (!resolvedStores) {
        const { data: fb } = await supabase.from("stores").select("id,name,contact_email,address,representative_name,business_hours,is_active").order("name");
        resolvedStores = fb as Row[] | null;
      }

      const roleByUser = new Map((memberships ?? []).map((m) => [m.user_id, m.role]));
      const className = new Map((classes ?? []).map((c) => [c.id, c.name]));
      const profileNameById = new Map((resolvedProfiles ?? []).map((p) => [p.id, p.display_name]));

      // Active parent link lookup
      const parentMap = new Map<string, { parentId: string; parentName: string }>();
      for (const link of parentLinks ?? []) {
        if (link.is_active && link.student_id) {
          parentMap.set(link.student_id, {
            parentId: link.parent_user_id,
            parentName: profileNameById.get(link.parent_user_id) ?? "Linked Parent"
          });
        }
      }

      // Teacher assignment lookup
      const teacherMap = new Map<string, string>();
      for (const link of teacherLinks ?? []) {
        if (link.is_active && link.class_id) {
          teacherMap.set(link.class_id, profileNameById.get(link.teacher_user_id) ?? "Assigned Teacher");
        }
      }

      const enrichedProfiles = (resolvedProfiles ?? []).map((p) => ({
        ...p,
        role: roleByUser.get(p.id) ?? "—"
      }));

      const enrichedStudents = (resolvedStudents ?? []).map((st) => {
        const parentInfo = parentMap.get(st.id);
        return {
          ...st,
          class_name: className.get(st.class_id) ?? "Unassigned",
          linked_parent_id: parentInfo?.parentId ?? null,
          linked_parent_name: parentInfo?.parentName ?? null
        };
      });

      const enrichedClasses = (classes ?? []).map((c) => ({
        ...c,
        assigned_teacher: teacherMap.get(c.id) ?? "Not assigned yet",
        enrolled_count: (resolvedStudents ?? []).filter((st) => st.class_id === c.id && st.is_active).length
      }));

      if (currentSlug === "reports") {
        content = (
          <AdminReportsView
            schools={schools ?? []}
            classes={enrichedClasses}
            students={enrichedStudents}
            stores={resolvedStores ?? []}
            rewards={rewards ?? []}
            profiles={enrichedProfiles}
          />
        );
      } else {
        content = (
          <AdminManagementView
            slug={currentSlug}
            profiles={enrichedProfiles}
            students={enrichedStudents}
            schools={schools ?? []}
            classes={enrichedClasses}
            stores={resolvedStores ?? []}
            rewards={rewards ?? []}
          />
        );
      }
    } else if (currentSlug === "settings") {
      const { data: orgs } = await supabase.from("organizations").select("*").order("name");
      content = <AdminSettingsView organizations={orgs ?? []} />;
    } else if (["legal", "deletion-requests", "audit-logs"].includes(currentSlug)) {
      content = <AdminLegalView slug={currentSlug as "legal" | "deletion-requests" | "audit-logs"} supabase={supabase} />;
    } else if (currentSlug === "library") {
      const [
        { data: missions },
        { data: attempts },
        { data: assignments },
        { data: students },
        { data: classes },
        { data: stores }
      ] = await Promise.all([
        supabase.from("missions").select("*").order("updated_at", { ascending: false }),
        supabase.from("mission_attempts").select("*").order("started_at", { ascending: false }),
        supabase.from("mission_assignments").select("*"),
        supabase.from("students").select("id,first_name,last_initial,grade_level,class_id"),
        supabase.from("classes").select("id,name,grade_level"),
        supabase.from("stores").select("id,name")
      ]);

      content = (
        <MissionLibraryView
          missions={missions ?? []}
          attempts={attempts ?? []}
          assignments={assignments ?? []}
          students={students ?? []}
          classes={classes ?? []}
          stores={stores ?? []}
          role="admin"
        />
      );
    } else {
      content = <AdminSectionView slug={currentSlug} supabase={supabase} />;
    }
  } else if (role === "parent") {
    if (["children", "progress", "recordings", "leaderboard"].includes(currentSlug)) {
      const [
        { data: students },
        { data: assignments },
        { data: attempts },
        { data: recordings },
        { data: rewardGoals },
        { data: classes },
        { data: schools },
        { data: attemptsLog }
      ] = await Promise.all([
        supabase.from("students").select("id,first_name,last_initial,grade_level,class_id,parent_invite_code,card_code,is_active,avatar_url").order("first_name"),
        supabase.from("mission_assignments").select("id,status,available_at,due_at,mission:missions(id,title,description,estimated_minutes),class:classes(id,name,grade_level)").order("created_at", { ascending: false }),
        supabase.from("mission_attempts").select("id,student_id,status,completed_at,stars_earned,assignment_id,started_at").order("started_at", { ascending: false }),
        supabase.from("reading_recordings").select("id,student_id,storage_path,review_status,reviewer_feedback,recorded_at").order("recorded_at", { ascending: false }),
        supabase.from("reward_goals").select("id,class_id,title,current_stars,target_stars,status"),
        supabase.from("classes").select("id,name,school_id,grade_level"),
        supabase.from("schools").select("id,name"),
        supabase.from("question_attempts").select("id,student_id,prompt,answer_given,is_correct,answered_at").order("answered_at", { ascending: false }).limit(20)
      ]);

      let teacherStudents: Row[] | null = students as Row[] | null;
      if (!teacherStudents) {
        const { data: fb } = await supabase.from("students").select("id,first_name,last_initial,grade_level,class_id,parent_invite_code,card_code,is_active").order("first_name");
        teacherStudents = fb as Row[] | null;
      }

      const classById = new Map((classes ?? []).map((c) => [c.id, c]));
      const schoolById = new Map((schools ?? []).map((s) => [s.id, s.name]));

      const enrichedStudents = (teacherStudents ?? []).map((st) => {
        const cls = classById.get(st.class_id);
        const schoolName = cls?.school_id ? schoolById.get(cls.school_id) : "Oak Grove Elementary";
        return {
          ...st,
          class_name: cls?.name ?? "Kindergarten A",
          school_name: schoolName ?? "Oak Grove Elementary"
        };
      });

      // Generate signed URLs for recordings if available
      const recordingsWithUrls = await Promise.all(
        (recordings ?? []).map(async (rec) => {
          let playbackUrl: string | null = null;
          if (rec.storage_path) {
            const { data } = await supabase.storage.from("reading-recordings").createSignedUrl(rec.storage_path, 3600);
            playbackUrl = data?.signedUrl || null;
          }
          return { ...rec, playback_url: playbackUrl };
        })
      );

      content = (
        <ParentPortalView
          slug={currentSlug as "children" | "progress" | "recordings" | "leaderboard"}
          students={enrichedStudents}
          assignments={assignments ?? []}
          attempts={attempts ?? []}
          recordings={recordingsWithUrls}
          rewardGoals={rewardGoals ?? []}
          questionAttempts={attemptsLog ?? []}
        />
      );
    } else {
      content = <RoleSectionView role={role} slug={currentSlug} supabase={supabase} />;
    }
  } else if (role === "teacher") {
    if (currentSlug === "library") {
      const [
        { data: missions },
        { data: attempts },
        { data: assignments },
        { data: students },
        { data: classes },
        { data: stores }
      ] = await Promise.all([
        supabase.from("missions").select("*").order("updated_at", { ascending: false }),
        supabase.from("mission_attempts").select("*").order("started_at", { ascending: false }),
        supabase.from("mission_assignments").select("*"),
        supabase.from("students").select("id,first_name,last_initial,grade_level,class_id"),
        supabase.from("classes").select("id,name,grade_level"),
        supabase.from("stores").select("id,name")
      ]);

      content = (
        <MissionLibraryView
          missions={missions ?? []}
          attempts={attempts ?? []}
          assignments={assignments ?? []}
          students={students ?? []}
          classes={classes ?? []}
          stores={stores ?? []}
          role="teacher"
        />
      );
    } else if (currentSlug === "missions") {
      // Find the mission to edit (either requested by id, or first/default mission)
      let mission: Row;
      if (requestedMissionId) {
        const { data: m } = await supabase
          .from("missions")
          .select("*")
          .eq("id", requestedMissionId)
          .single();

        mission = m || {
          id: requestedMissionId,
          title: "Custom Grocery Mission",
          description: "Standards-aligned learning mission",
          grade_min: 0,
          grade_max: 2,
          estimated_minutes: 12,
          stars: 5,
          status: "draft",
          sharing_status: "community"
        };
      } else {
        const { data: missions } = await supabase
          .from("missions")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);

        mission = missions?.[0] || {
          id: "00000000-0000-0000-0000-000000000051",
          title: "Fruit & Veggie Hunt",
          description: "A little shopping. A lot of discovery!",
          grade_min: 0,
          grade_max: 2,
          estimated_minutes: 12,
          stars: 5,
          status: "published",
          sharing_status: "approved"
        };
      }

      const [
        { data: versions },
        { data: products },
        { data: assets },
        { data: stores }
      ] = await Promise.all([
        supabase.from("mission_versions").select("id").eq("mission_id", mission.id).limit(1),
        supabase.from("mission_products").select("*").eq("mission_id", mission.id).order("order_index"),
        supabase.from("mission_assets").select("*").or(`mission_id.eq.${mission.id},mission_id.is.null`),
        supabase.from("stores").select("id,name").order("name")
      ]);

      const versionId = versions?.[0]?.id;
      let stages: Row[] = [];
      let questionsByStage: Record<string, Row[]> = {};

      if (versionId) {
        const { data: stagesData } = await supabase
          .from("mission_stages")
          .select("*")
          .eq("mission_version_id", versionId)
          .order("stage_order");

        stages = stagesData ?? [];

        if (stages.length > 0) {
          const stageIds = stages.map((s) => s.id);
          const { data: questions } = await supabase
            .from("mission_questions")
            .select("*")
            .in("stage_id", stageIds)
            .order("question_order");

          for (const q of questions ?? []) {
            if (!questionsByStage[q.stage_id]) questionsByStage[q.stage_id] = [];
            questionsByStage[q.stage_id].push(q);
          }
        }
      }

      content = (
        <main className="page-shell">
          <MissionBuilderView
            mission={mission}
            stages={stages}
            questionsByStage={questionsByStage}
            products={products ?? []}
            assets={assets ?? []}
            stores={stores ?? []}
          />
        </main>
      );
    } else if (currentSlug === "classes") {
      const [
        { data: classes },
        { data: students },
        { data: missions },
        { data: stores },
        { data: assignments },
        { data: rewardGoals }
      ] = await Promise.all([
        supabase.from("classes").select("id,name,grade_level,school_year,reward_title,confirmed_stars,target_stars").order("grade_level"),
        supabase.from("students").select("id,class_id,first_name,last_initial,grade_level,is_active"),
        supabase.from("missions").select("id,title,grade_min,grade_max,status,sharing_status").order("title"),
        supabase.from("stores").select("id,name").order("name"),
        supabase.from("mission_assignments").select("id,class_id,mission_id,status,available_at,due_at,mission:missions(title)").order("created_at", { ascending: false }),
        supabase.from("reward_goals").select("id,class_id,title,current_stars,target_stars,status")
      ]);

      content = (
        <TeacherClassesView
          classes={classes ?? []}
          students={students ?? []}
          missions={missions ?? []}
          stores={stores ?? []}
          assignments={assignments ?? []}
          rewardGoals={rewardGoals ?? []}
        />
      );
    } else if (currentSlug === "students") {
      content = <TeacherStudentManageView supabase={supabase} />;
    } else {
      content = <RoleSectionView role={role} slug={currentSlug} supabase={supabase} />;
    }
  } else if (role === "store") {
    if (currentSlug === "check-in") {
      content = <StoreCheckinView supabase={supabase} />;
    } else if (currentSlug === "products") {
      content = <StoreProductsView supabase={supabase} />;
    } else if (["participation", "rewards", "profile", "notifications", "settings"].includes(currentSlug)) {
      content = (
        <StoreOperationsView
          slug={currentSlug as "participation" | "rewards" | "profile" | "notifications" | "settings"}
          supabase={supabase}
          profileName={access.profile.display_name}
        />
      );
    } else {
      content = <RoleSectionView role={role} slug={currentSlug} supabase={supabase} />;
    }
  } else {
    content = <SectionView role={role} slug={currentSlug} />;
  }

  return (
    <PortalShell role={role} profile={access.profile}>
      {content}
    </PortalShell>
  );
}
