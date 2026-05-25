"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/supabase/student-session";
import { getQuizQuestions } from "@/lib/queries/quizzes";

export type StudentQuizResponse = {
  success: boolean;
  message: string;
  score?: number;
};

/**
 * Server action to process quiz submission, calculate score on server,
 * and register the attempt.
 */
export async function submitQuizAttempt(
  quizId: string,
  answers: Array<{ question_id: string; selected_index: number }>
): Promise<StudentQuizResponse> {
  const student = await getStudentSession();
  if (!student) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำการทำข้อสอบ" };
  }

  // If in Demo Mode (No Supabase connected)
  if (!hasSupabaseEnv()) {
    const questions = await getQuizQuestions(quizId, false);
    let score = 0;
    const answerMap = new Map(answers.map(a => [a.question_id, a.selected_index]));
    
    questions.forEach(q => {
      const selected = answerMap.get(q.id);
      if (selected === q.correct_option_index) {
        score += Number(q.points);
      }
    });

    return {
      success: true,
      message: "โหมด demo: ส่งแบบทดสอบจำลองสำเร็จ (ไม่ได้บันทึกลงฐานข้อมูล)",
      score
    };
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch questions to evaluate score (including points and correct index)
    const { data: questions, error: qError } = await supabase
      .from("quiz_questions")
      .select("id, correct_option_index, points")
      .eq("quiz_id", quizId);

    if (qError || !questions) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลข้อสอบเพื่อตรวจคะแนนได้" };
    }

    // 2. Check if student already submitted an attempt
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", quizId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existing) {
      return { success: false, message: "คุณเคยส่งคำตอบแบบทดสอบนี้ไปแล้ว" };
    }

    // 3. Calculate score
    let score = 0;
    const answerMap = new Map(answers.map(a => [a.question_id, a.selected_index]));

    questions.forEach(q => {
      const selected = answerMap.get(q.id);
      if (selected === q.correct_option_index) {
        score += Number(q.points);
      }
    });

    // 4. Save attempt
    const { error: insertError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        student_id: student.id,
        score,
        answers,
        submitted_at: new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    revalidatePath("/app");
    revalidatePath("/app/student");
    revalidatePath(`/app/quizzes/${quizId}`);

    return {
      success: true,
      message: "ส่งแบบทดสอบเรียบร้อยแล้ว",
      score
    };
  } catch (error: any) {
    console.error("Error submitting quiz attempt:", error);
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
