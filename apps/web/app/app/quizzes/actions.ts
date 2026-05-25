"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type QuizActionState = { message: string; success?: boolean; data?: any };

const successState: QuizActionState = { message: "บันทึกข้อมูลเรียบร้อย", success: true };

/**
 * Create a new Quiz
 */
export async function createQuiz(
  _previousState: QuizActionState,
  formData: FormData
): Promise<QuizActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "โหมด demo: ต้องเชื่อม Supabase ก่อนจึงจะบันทึกจริงได้", success: false };
  }

  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ", success: false };

  const courseId = String(formData.get("course_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const timeLimitVal = formData.get("time_limit");
  const timeLimit = timeLimitVal ? Number(timeLimitVal) : null;
  const maxScore = Number(formData.get("max_score") ?? 10);
  const isPublished = formData.get("is_published") === "true";

  if (!courseId || !title) {
    return { message: "กรุณากรอกข้อมูลวิชาและหัวข้อข้อสอบ", success: false };
  }

  const payload = {
    course_id: courseId,
    title,
    description: description || null,
    max_score: maxScore,
    time_limit: timeLimit && timeLimit > 0 ? timeLimit : null,
    is_published: isPublished,
    created_by: context.teacherId
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    revalidatePath("/app/quizzes");
    revalidatePath(`/app/courses`);
    return { ...successState, data };
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    return { message: error.message || "เกิดข้อผิดพลาดในการสร้างข้อสอบ", success: false };
  }
}

/**
 * Update an existing Quiz
 */
export async function updateQuiz(
  _previousState: QuizActionState,
  formData: FormData
): Promise<QuizActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "โหมด demo: ไม่สามารถอัปเดตบน Supabase ได้", success: false };
  }

  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ", success: false };

  const quizId = String(formData.get("quiz_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const timeLimitVal = formData.get("time_limit");
  const timeLimit = timeLimitVal ? Number(timeLimitVal) : null;
  const maxScore = Number(formData.get("max_score") ?? 10);
  const isPublished = formData.get("is_published") === "true";

  if (!quizId || !title) {
    return { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", success: false };
  }

  const payload = {
    title,
    description: description || null,
    max_score: maxScore,
    time_limit: timeLimit && timeLimit > 0 ? timeLimit : null,
    is_published: isPublished
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quizzes")
      .update(payload)
      .eq("id", quizId)
      .eq("created_by", context.teacherId);

    if (error) throw error;

    revalidatePath("/app/quizzes");
    revalidatePath(`/app/quizzes/${quizId}`);
    return successState;
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return { message: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อสอบ", success: false };
  }
}

/**
 * Delete a Quiz
 */
export async function deleteQuiz(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) return;

  const context = await getTeacherContext();
  if (!context) return;

  const quizId = String(formData.get("quiz_id") ?? "");
  if (!quizId) return;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq("created_by", context.teacherId);

    if (error) throw error;

    revalidatePath("/app/quizzes");
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
  }
}

/**
 * Save questions for a Quiz
 */
export async function saveQuizQuestions(
  quizId: string,
  questions: Array<{
    question_text: string;
    options: string[];
    correct_option_index: number;
    points: number;
    sort_order: number;
  }>
): Promise<QuizActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "โหมด demo: บันทึกไม่ได้", success: false };
  }

  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ", success: false };

  try {
    const supabase = await createClient();

    // 1. Double check ownership
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .eq("created_by", context.teacherId)
      .maybeSingle();

    if (!quiz) return { message: "ไม่สิทธิ์แก้ไขข้อสอบชุดนี้", success: false };

    // 2. Clear old questions
    await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);

    // 3. Insert new questions (if any)
    if (questions.length > 0) {
      const payload = questions.map((q, idx) => ({
        quiz_id: quizId,
        question_text: q.question_text.trim(),
        question_type: "multiple_choice",
        options: q.options.map(opt => opt.trim()),
        correct_option_index: q.correct_option_index,
        points: q.points,
        sort_order: q.sort_order || idx + 1
      }));

      const { error: insertError } = await supabase.from("quiz_questions").insert(payload);
      if (insertError) throw insertError;
    }

    revalidatePath(`/app/quizzes/${quizId}`);
    revalidatePath(`/app/quizzes/${quizId}/questions`);
    return successState;
  } catch (error: any) {
    console.error("Error saving quiz questions:", error);
    return { message: error.message || "เกิดข้อผิดพลาดในการบันทึกโจทย์", success: false };
  }
}
