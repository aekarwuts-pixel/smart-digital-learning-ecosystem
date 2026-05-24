import { demoAssignments, demoSubmission, type AssignmentSummary } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/database.types";

type AssignmentRow = {
  description: string | null;
  due_at: string | null;
  id: string;
  max_score: number;
  status: AssignmentSummary["status"];
  title: string;
};

export { demoAssignments, demoSubmission };
export type { AssignmentSummary };

export async function getAssignmentSummaries(): Promise<AssignmentSummary[]> {
  if (!hasSupabaseEnv()) {
    return demoAssignments;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return demoAssignments;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!profile) {
    return demoAssignments;
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();

  if (!teacher) {
    return demoAssignments;
  }

  const { data: rows } = await supabase
    .from("assignments")
    .select("id, title, description, max_score, due_at, status")
    .eq("created_by", teacher.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<AssignmentRow[]>();

  if (!rows?.length) {
    return demoAssignments;
  }

  return Promise.all(
    rows.map(async (assignment) => {
      const [{ count: submittedCount }, { count: pendingReviewCount }] = await Promise.all([
        supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("assignment_id", assignment.id)
          .in("status", ["submitted", "reviewed"]),
        supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("assignment_id", assignment.id)
          .eq("status", "submitted")
      ]);

      return {
        ...assignment,
        pendingReviewCount: pendingReviewCount ?? 0,
        studentCount: demoAssignments[0]?.studentCount ?? 0,
        submittedCount: submittedCount ?? 0
      };
    })
  );
}

export async function getDemoSubmission(): Promise<Submission> {
  return demoSubmission;
}

export type StudentSubmissionItem = {
  student_id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  submission_id: string | null;
  status: "not_submitted" | "submitted" | "reviewed" | "returned";
  content: string | null;
  teacher_feedback: string | null;
  total_score: number | null;
  submitted_at: string | null;
};

export async function getAssignmentSubmissions(
  assignmentId: string
): Promise<StudentSubmissionItem[]> {
  const defaultDemoSubmissions: StudentSubmissionItem[] = [
    { student_id: "ds1", first_name: "สมชาย", last_name: "ใจดี", student_code: "1001", submission_id: "sub1", status: "submitted", content: "ส่งรายงานเรื่องผลกระทบของเทคโนโลยีต่อมนุษย์เรียบร้อยครับ (ลิงก์: doc.google.com/123)", teacher_feedback: null, total_score: null, submitted_at: new Date(Date.now() - 3600000 * 3).toISOString() },
    { student_id: "ds2", first_name: "สมหญิง", last_name: "รักเรียน", student_code: "1002", submission_id: "sub2", status: "reviewed", content: "ผังงาน Flowchart อธิบายขั้นตอนการต้มบะหมี่สำเร็จรูปแนบมาตามข้อความนี้ค่ะ", teacher_feedback: "ทำตามเกณฑ์ได้ครบถ้วน ชัดเจนดีมาก", total_score: 18, submitted_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { student_id: "ds3", first_name: "สมพงษ์", last_name: "มุ่งมั่น", student_code: "1003", submission_id: null, status: "not_submitted", content: null, teacher_feedback: null, total_score: null, submitted_at: null }
  ];

  if (!hasSupabaseEnv() || !assignmentId) {
    return defaultDemoSubmissions;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch assignment details to get course_id
    const { data: assignment } = await supabase
      .from("assignments")
      .select("course_id")
      .eq("id", assignmentId)
      .maybeSingle<{ course_id: string }>();

    if (!assignment) return [];

    // 2. Fetch classroom(s) for this course
    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("id")
      .eq("course_id", assignment.course_id);
    const classroomIds = (classrooms ?? []).map((c) => c.id);
    if (!classroomIds.length) return [];

    // 3. Fetch students in these classrooms
    const { data: studentLinks } = await supabase
      .from("classroom_students")
      .select("student_id")
      .in("classroom_id", classroomIds);
    const studentIds = (studentLinks ?? []).map((x) => x.student_id);
    if (!studentIds.length) return [];

    // 4. Fetch students profiles
    const { data: students } = await supabase
      .from("students")
      .select("id, student_code, first_name, last_name")
      .in("id", studentIds)
      .order("student_code", { ascending: true })
      .returns<{ first_name: string; id: string; last_name: string; student_code: string }[]>();

    if (!students || !students.length) return [];

    // 5. Fetch submissions for this assignment
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, student_id, status, content, teacher_feedback, total_score, submitted_at")
      .eq("assignment_id", assignmentId)
      .returns<
        {
          content: string | null;
          id: string;
          status: "not_submitted" | "submitted" | "reviewed" | "returned";
          student_id: string;
          submitted_at: string | null;
          teacher_feedback: string | null;
          total_score: number | null;
        }[]
      >();

    const submissionMap = new Map(submissions?.map((s) => [s.student_id, s]));

    return students.map((s) => {
      const sub = submissionMap.get(s.id);
      return {
        student_id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        student_code: s.student_code,
        submission_id: sub?.id ?? null,
        status: sub?.status ?? "not_submitted",
        content: sub?.content ?? null,
        teacher_feedback: sub?.teacher_feedback ?? null,
        total_score: sub?.total_score ?? null,
        submitted_at: sub?.submitted_at ?? null
      };
    });
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    return defaultDemoSubmissions;
  }
}
