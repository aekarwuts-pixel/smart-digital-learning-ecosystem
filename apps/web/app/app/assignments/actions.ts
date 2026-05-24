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
  exportToPa?: boolean,
  studentId?: string,
  assignmentId?: string
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

  if (!submissionId && (!studentId || !assignmentId)) {
    return { success: false, message: "กรุณาระบุข้อมูลการส่งงานหรือนักเรียนให้ถูกต้อง" };
  }

  if (totalScore < 0) {
    return { success: false, message: "กรุณาระบุคะแนนให้ถูกต้อง" };
  }

  try {
    const supabase = await createClient();
    let targetSubmissionId = submissionId;

    // Support offline grading: if student hasn't submitted in database yet
    if (!targetSubmissionId && studentId && assignmentId) {
      // Check if a submission already exists
      const { data: existingSub } = await supabase
        .from("submissions")
        .select("id")
        .eq("assignment_id", assignmentId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existingSub) {
        targetSubmissionId = existingSub.id;
      } else {
        // Create new submission record for offline work
        const { data: newSub, error: insertError } = await supabase
          .from("submissions")
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            status: "reviewed",
            total_score: totalScore,
            teacher_feedback: feedback || null,
            content: "บันทึกคะแนนโดยครูผู้สอน (ตรวจชิ้นงานออฟไลน์)",
            submitted_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: context.teacherId
          })
          .select("id")
          .single();

        if (insertError) {
          return { success: false, message: "สร้างบันทึกการส่งงานออฟไลน์ล้มเหลว: " + insertError.message };
        }
        targetSubmissionId = newSub.id;
      }
    }

    if (targetSubmissionId) {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "reviewed",
          total_score: totalScore,
          teacher_feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: context.teacherId
        })
        .eq("id", targetSubmissionId);

      if (error) {
        return { success: false, message: "บันทึกผลคะแนนล้มเหลว: " + error.message };
      }
    } else {
      return { success: false, message: "ไม่พบรายการส่งงานหรือข้อมูลนักเรียน" };
    }

    // Auto-export to PA evidence if checked
    if (exportToPa && targetSubmissionId) {
      const { data: sub } = await supabase
        .from("submissions")
        .select("assignment_id, student_id, content, assignments(title, course_id)")
        .eq("id", targetSubmissionId)
        .maybeSingle<{
          assignment_id: string;
          assignments: { course_id: string; title: string } | null;
          content: string | null;
          student_id: string;
        }>();

      if (sub && sub.assignments) {
        // Prevent duplicate PA evidences for the same submission
        const { data: existingEvidence } = await supabase
          .from("pa_evidences")
          .select("id")
          .eq("submission_id", targetSubmissionId)
          .maybeSingle();

        if (!existingEvidence) {
          await supabase.from("pa_evidences").insert({
            teacher_id: context.teacherId,
            course_id: sub.assignments.course_id,
            assignment_id: sub.assignment_id,
            submission_id: targetSubmissionId,
            category: "student_outcome",
            title: `ผลสัมฤทธิ์รายบุคคล: ${sub.assignments.title}`,
            description: `คะแนนประเมิน: ${totalScore} คะแนน\n\nคำตอบนักเรียน:\n${sub.content || "-"}\n\nข้อเสนอแนะครู:\n${feedback || "-"}`,
            indicator_code: "วPA 1.5",
            academic_year: 2569,
            evidence_date: new Date().toISOString().slice(0, 10)
          });
        } else {
          // Update the existing evidence
          await supabase.from("pa_evidences").update({
            description: `คะแนนประเมิน: ${totalScore} คะแนน\n\nคำตอบนักเรียน:\n${sub.content || "-"}\n\nข้อเสนอแนะครู:\n${feedback || "-"}`,
            evidence_date: new Date().toISOString().slice(0, 10)
          }).eq("id", existingEvidence.id);
        }
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
