import { demoDashboard } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { TeacherDashboard } from "@/lib/database.types";

type ProfileRow = {
  full_name: string;
  id: string;
  role: string;
};

type TeacherRow = {
  id: string;
  profile_id: string;
};

type CourseRow = {
  id: string;
  title: string;
};

type ClassroomRow = {
  id: string;
  name: string;
};

type LessonRow = {
  activity_summary: string | null;
  lesson_date: string | null;
  title: string;
};

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  if (!hasSupabaseEnv()) {
    return demoDashboard;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return demoDashboard;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle<ProfileRow>();

  // Admin can also use teacher features (they may have a linked teacher record)
  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return demoDashboard;
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, profile_id")
    .eq("profile_id", profile.id)
    .maybeSingle<TeacherRow>();

  if (!teacher) {
    return demoDashboard;
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", teacher.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CourseRow>();

  if (!course) {
    return {
      ...demoDashboard,
      teacherName: profile.full_name
    };
  }

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("course_id", course.id)
    .limit(1)
    .maybeSingle<ClassroomRow>();

  const [{ count: studentCount }, { count: pendingReviews }, { count: evidenceCount }, { data: nextLesson }] =
    await Promise.all([
      classroom
        ? supabase
            .from("classroom_students")
            .select("id", { count: "exact", head: true })
            .eq("classroom_id", classroom.id)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("submissions")
        .select("id, assignments!inner(created_by)", { count: "exact", head: true })
        .eq("status", "submitted")
        .eq("assignments.created_by", teacher.id),
      supabase
        .from("pa_evidences")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacher.id),
      supabase
        .from("lessons")
        .select("title, activity_summary, lesson_date")
        .order("lesson_date", { ascending: false })
        .limit(1)
        .maybeSingle<LessonRow>()
    ]);

  // Calculate actual attendance rate from database records
  let attendanceRate = demoDashboard.attendanceRate;
  if (classroom) {
    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("classroom_id", classroom.id);
    const sessionIds = (sessions ?? []).map(s => s.id);

    if (sessionIds.length > 0) {
      const { data: records } = await supabase
        .from("attendance_records")
        .select("status")
        .in("session_id", sessionIds);

      if (records && records.length > 0) {
        const attendedCount = records.filter(
          r => r.status === "present" || r.status === "late" || r.status === "leave"
        ).length;
        attendanceRate = Math.round((attendedCount / records.length) * 100);
      } else {
        attendanceRate = 100;
      }
    } else {
      attendanceRate = 100;
    }
  }

  return {
    teacherName: profile.full_name,
    courseTitle: course.title,
    classroomName: classroom?.name ?? demoDashboard.classroomName,
    studentCount: studentCount ?? 0,
    pendingReviews: pendingReviews ?? 0,
    attendanceRate,
    evidenceCount: evidenceCount ?? 0,
    nextLesson: {
      time: demoDashboard.nextLesson.time,
      title: nextLesson?.title ?? demoDashboard.nextLesson.title,
      activity: nextLesson?.activity_summary ?? demoDashboard.nextLesson.activity,
      readiness: demoDashboard.nextLesson.readiness
    }
  };
}
