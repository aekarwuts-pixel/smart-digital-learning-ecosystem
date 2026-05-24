/**
 * lib/queries/student.ts
 * Server-side database queries for the Student Dashboard.
 */
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentCourse = {
  course_id: string;
  course_title: string;
  course_code: string | null;
  classroom_name: string;
  teacher_name: string;
};

export type StudentAssignmentItem = {
  assignment_id: string;
  title: string;
  due_at: string | null;
  max_score: number;
  course_title: string;
  submission_status: "not_submitted" | "submitted" | "reviewed" | "returned" | null;
  total_score: number | null;
  teacher_feedback: string | null;
};

export type StudentAttendanceItem = {
  session_date: string;
  status: "present" | "late" | "leave" | "absent";
  course_title: string;
  period_label: string | null;
};

export type StudentDashboardData = {
  courses: StudentCourse[];
  recentAssignments: StudentAssignmentItem[];
  recentAttendance: StudentAttendanceItem[];
  stats: {
    totalCourses: number;
    pendingAssignments: number;
    averageScore: number | null;
    attendanceRate: number | null;
  };
};

// ─── Query Functions ──────────────────────────────────────────────────────────

export async function getStudentDashboard(studentId: string): Promise<StudentDashboardData> {
  const supabase = createAdminClient();

  // 1. Fetch enrolled courses
  const { data: classroomStudents } = await supabase
    .from("classroom_students")
    .select(`
      classrooms (
        id,
        name,
        courses (
          id,
          title,
          code,
          teachers (
            profiles ( full_name )
          )
        )
      )
    `)
    .eq("student_id", studentId);

  const courses: StudentCourse[] = (classroomStudents ?? []).map((cs: any) => {
    const classroom = cs.classrooms;
    const course = classroom?.courses;
    const teacher = course?.teachers?.profiles;
    return {
      course_id: course?.id ?? "",
      course_title: course?.title ?? "ไม่ระบุ",
      course_code: course?.code ?? null,
      classroom_name: classroom?.name ?? "ไม่ระบุ",
      teacher_name: teacher?.full_name ?? "ไม่ระบุ"
    };
  }).filter((c: StudentCourse) => c.course_id);

  const courseIds = courses.map(c => c.course_id);

  // 2. Fetch recent assignments + submission status
  const { data: assignments } = courseIds.length > 0
    ? await supabase
        .from("assignments")
        .select(`
          id, title, due_at, max_score, status,
          courses ( title ),
          submissions!left (
            status, total_score, teacher_feedback,
            student_id
          )
        `)
        .in("course_id", courseIds)
        .eq("status", "published")
        .order("due_at", { ascending: true })
        .limit(10)
    : { data: [] };

  const recentAssignments: StudentAssignmentItem[] = (assignments ?? []).map((a: any) => {
    // Find this student's submission (submissions is an array due to left join)
    const studentSub = Array.isArray(a.submissions)
      ? a.submissions.find((s: any) => s.student_id === studentId)
      : null;

    return {
      assignment_id: a.id,
      title: a.title,
      due_at: a.due_at,
      max_score: a.max_score,
      course_title: a.courses?.title ?? "ไม่ระบุ",
      submission_status: studentSub?.status ?? null,
      total_score: studentSub?.total_score ?? null,
      teacher_feedback: studentSub?.teacher_feedback ?? null
    };
  });

  // 3. Fetch recent attendance (last 10)
  const { data: attendance } = await supabase
    .from("attendance_records")
    .select(`
      status,
      attendance_sessions (
        session_date, period_label,
        courses ( title )
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentAttendance: StudentAttendanceItem[] = (attendance ?? []).map((r: any) => ({
    session_date: r.attendance_sessions?.session_date ?? "",
    status: r.status,
    course_title: r.attendance_sessions?.courses?.title ?? "ไม่ระบุ",
    period_label: r.attendance_sessions?.period_label ?? null
  }));

  // 4. Compute stats
  const pendingAssignments = recentAssignments.filter(
    a => !a.submission_status || a.submission_status === "not_submitted"
  ).length;

  const reviewedAssignments = recentAssignments.filter(
    a => a.submission_status === "reviewed" && a.total_score !== null
  );
  const averageScore =
    reviewedAssignments.length > 0
      ? reviewedAssignments.reduce((sum, a) => sum + (a.total_score ?? 0), 0) /
        reviewedAssignments.length
      : null;

  const totalAttendance = recentAttendance.length;
  const attendedCount = recentAttendance.filter(
    a => a.status === "present" || a.status === "late" || a.status === "leave"
  ).length;
  const attendanceRate =
    totalAttendance > 0 ? Math.round((attendedCount / totalAttendance) * 100) : null;

  return {
    courses,
    recentAssignments,
    recentAttendance,
    stats: {
      totalCourses: courses.length,
      pendingAssignments,
      averageScore: averageScore !== null ? Math.round(averageScore * 10) / 10 : null,
      attendanceRate
    }
  };
}
