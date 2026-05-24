"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type AssignmentActionResponse = {
  success: boolean;
  message: string;
};

export async function createAssignment(
  courseId: string,
  title: string,
  description: string,
  maxScore: number,
  dueAt: string
): Promise<AssignmentActionResponse> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "โหมด demo: สร้างงานจำลองสำเร็จ (ไม่ได้บันทึกลงฐานข้อมูลจริง)"
    };
  }

  const context = await getTeacherContext();
  if (!context) {
    return { success: false, message: "ไม่พบบัญชีครูในระบบ" };
  }

  if (!courseId || !title || maxScore <= 0) {
    return { success: false, message: "กรุณากรอกข้อมูลงานให้ครบถ้วน" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("assignments").insert({
      course_id: courseId,
      title,
      description: description || null,
      max_score: maxScore,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      status: "published",
      created_by: context.teacherId
    });

    if (error) {
      return { success: false, message: "สร้างงานล้มเหลว: " + error.message };
    }

    revalidatePath("/app");
    revalidatePath("/app/assignments");
    revalidatePath("/app/student");
    return { success: true, message: "สร้างงานและมอบหมายเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function gradeSubmission(
  submissionId: string,
  totalScore: number,
  feedback: string,
  exportToPa?: boolean
): Promise<AssignmentActionResponse> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "โหมด demo: ให้คะแนนจำลองสำเร็จ (ไม่ได้บันทึกลงฐานข้อมูลจริง)"
    };
  }

  const context = await getTeacherContext();
  if (!context) {
    return { success: false, message: "ไม่พบบัญชีครูในระบบ" };
  }

  if (!submissionId || totalScore < 0) {
    return { success: false, message: "กรุณาระบุคะแนนให้ถูกต้อง" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("submissions")
      .update({
        status: "reviewed",
        total_score: totalScore,
        teacher_feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.teacherId
      })
      .eq("id", submissionId);

    if (error) {
      return { success: false, message: "บันทึกผลคะแนนล้มเหลว: " + error.message };
    }

    // Auto-export to PA evidence if checked
    if (exportToPa) {
      const { data: sub } = await supabase
        .from("submissions")
        .select("assignment_id, student_id, content, assignments(title, course_id)")
        .eq("id", submissionId)
        .maybeSingle<{
          assignment_id: string;
          assignments: { course_id: string; title: string } | null;
          content: string | null;
          student_id: string;
        }>();

      if (sub && sub.assignments) {
        await supabase.from("pa_evidences").insert({
          teacher_id: context.teacherId,
          course_id: sub.assignments.course_id,
          assignment_id: sub.assignment_id,
          submission_id: submissionId,
          category: "student_outcome",
          title: `ผลสัมฤทธิ์รายบุคคล: ${sub.assignments.title}`,
          description: `คะแนนประเมิน: ${totalScore} คะแนน\n\nคำตอบนักเรียน:\n${sub.content || "-"}\n\nข้อเสนอแนะครู:\n${feedback || "-"}`,
          indicator_code: "วPA 1.5",
          academic_year: 2569,
          evidence_date: new Date().toISOString().slice(0, 10)
        });
      }
    }

    revalidatePath("/app");
    revalidatePath("/app/assignments");
    revalidatePath("/app/pa");
    revalidatePath("/app/student");
    return { success: true, message: "บันทึกผลการตรวจและให้คะแนนสำเร็จ" + (exportToPa ? " และเชื่อมโยง วPA เรียบร้อย" : "") };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
