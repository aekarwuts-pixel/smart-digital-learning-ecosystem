import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/lib/database.types";

// ============================================================
// Demo Data (Fallback Mode)
// ============================================================

export const demoQuizzes: Quiz[] = [
  {
    id: "demo-quiz-1",
    course_id: "demo-course-1",
    title: "แบบทดสอบก่อนเรียน: หน่วยที่ 1 แนวคิดเชิงคำนวณ",
    description: "แบบทดสอบวัดความรู้พื้นฐานเรื่องการย่อยปัญหาและการคิดเชิงนามธรรม",
    max_score: 10,
    time_limit: 15,
    is_published: true,
    created_by: "demo-teacher-1",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-quiz-2",
    course_id: "demo-course-1",
    title: "แบบทดสอบหลังเรียน: บทที่ 1 การแยกส่วนประกอบ",
    description: "แบบทดสอบท้ายบทเรียนเรื่อง Decomposition และการเขียนผังงาน",
    max_score: 5,
    time_limit: 10,
    is_published: true,
    created_by: "demo-teacher-1",
    created_at: new Date().toISOString()
  }
];

export const demoQuestions: Record<string, QuizQuestion[]> = {
  "demo-quiz-1": [
    {
      id: "q1",
      quiz_id: "demo-quiz-1",
      question_text: "การแบ่งปัญหาใหญ่ออกเป็นปัญหาย่อยๆ ตรงกับหลักการข้อใดของแนวคิดเชิงคำนวณ?",
      question_type: "multiple_choice",
      options: ["Decomposition (การย่อยปัญหา)", "Pattern Recognition (การจดจำรูปแบบ)", "Abstraction (การคิดเชิงนามธรรม)", "Algorithm (ขั้นตอนวิธี)"],
      correct_option_index: 0,
      points: 5,
      sort_order: 1
    },
    {
      id: "q2",
      quiz_id: "demo-quiz-1",
      question_text: "การมุ่งเน้นความสำคัญของปัญหาโดยละทิ้งรายละเอียดที่ไม่จำเป็น ตรงกับหลักการข้อใด?",
      question_type: "multiple_choice",
      options: ["Decomposition (การย่อยปัญหา)", "Pattern Recognition (การจดจำรูปแบบ)", "Abstraction (การคิดเชิงนามธรรม)", "Algorithm (ขั้นตอนวิธี)"],
      correct_option_index: 2,
      points: 5,
      sort_order: 2
    }
  ],
  "demo-quiz-2": [
    {
      id: "q3",
      quiz_id: "demo-quiz-2",
      question_text: "หากต้องการซ่อมจักรยาน ขั้นตอนแรกตามหลัก Decomposition คืออะไร?",
      question_type: "multiple_choice",
      options: ["ถอดชิ้นส่วนระบบโซ่และล้อออกมาแยกตรวจ", "ซื้อจักรยานคันใหม่", "นำไปร้านซ่อมจักรยาน", "ขี่ไปเรื่อยๆ จนกว่าจะพัง"],
      correct_option_index: 0,
      points: 5,
      sort_order: 1
    }
  ]
};

export interface QuizAttemptWithStudent extends QuizAttempt {
  student_name: string;
  student_code: string;
}

export const demoAttempts: Record<string, QuizAttemptWithStudent[]> = {
  "demo-quiz-1": [
    {
      id: "a1",
      quiz_id: "demo-quiz-1",
      student_id: "demo-student-1",
      score: 10,
      submitted_at: new Date().toISOString(),
      answers: [{ question_id: "q1", selected_index: 0 }, { question_id: "q2", selected_index: 2 }],
      student_name: "ด.ช.ปกรณ์ ใจดี",
      student_code: "S001"
    },
    {
      id: "a2",
      quiz_id: "demo-quiz-1",
      student_id: "demo-student-2",
      score: 5,
      submitted_at: new Date().toISOString(),
      answers: [{ question_id: "q1", selected_index: 0 }, { question_id: "q2", selected_index: 1 }],
      student_name: "ด.ญ.ณิชา เรียนดี",
      student_code: "S002"
    }
  ],
  "demo-quiz-2": []
};

// ============================================================
// Database Queries
// ============================================================

/**
 * Fetch quizzes for a course (Teacher View)
 */
export async function getTeacherQuizzes(courseId: string): Promise<Quiz[]> {
  if (!hasSupabaseEnv()) return demoQuizzes.filter(q => q.course_id === courseId);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return demoQuizzes.filter(q => q.course_id === courseId);
  }
}

/**
 * Fetch a single quiz details
 */
export async function getQuizDetails(quizId: string): Promise<Quiz | null> {
  if (!hasSupabaseEnv()) return demoQuizzes.find(q => q.id === quizId) ?? null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    return demoQuizzes.find(q => q.id === quizId) ?? null;
  }
}

/**
 * Fetch quiz questions.
 * If isForStudent is true, the correct_option_index is stripped (hidden) for security.
 */
export async function getQuizQuestions(quizId: string, isForStudent = false): Promise<QuizQuestion[]> {
  if (!hasSupabaseEnv()) {
    const questions = demoQuestions[quizId] ?? [];
    if (isForStudent) {
      return questions.map(q => ({ ...q, correct_option_index: -1 }));
    }
    return questions;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    const questions = data ?? [];
    if (isForStudent) {
      // Security: Strip the correct answer index before returning to student browser
      return questions.map(q => ({
        ...q,
        correct_option_index: -1
      }));
    }
    return questions;
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    const questions = demoQuestions[quizId] ?? [];
    if (isForStudent) {
      return questions.map(q => ({ ...q, correct_option_index: -1 }));
    }
    return questions;
  }
}

/**
 * Fetch attempts for a quiz (Teacher View)
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttemptWithStudent[]> {
  if (!hasSupabaseEnv()) return demoAttempts[quizId] ?? [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        quiz_id,
        student_id,
        score,
        submitted_at,
        answers,
        students (
          first_name,
          last_name,
          student_code
        )
      `)
      .eq("quiz_id", quizId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      quiz_id: row.quiz_id,
      student_id: row.student_id,
      score: Number(row.score),
      submitted_at: row.submitted_at,
      answers: row.answers,
      student_name: row.students ? `ด.ช./ด.ญ. ${row.students.first_name} ${row.students.last_name}` : "ไม่ระบุชื่อ",
      student_code: row.students?.student_code ?? "ไม่ระบุรหัส"
    }));
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return demoAttempts[quizId] ?? [];
  }
}

/**
 * Check if student has already completed the quiz
 */
export async function getStudentQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
  if (!hasSupabaseEnv()) {
    const attempts = demoAttempts[quizId] ?? [];
    return attempts.find(a => a.student_id === studentId) ?? null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error checking student quiz attempt:", error);
    const attempts = demoAttempts[quizId] ?? [];
    return attempts.find(a => a.student_id === studentId) ?? null;
  }
}

/**
 * Fetch quizzes available for a student (published quizzes in their enrolled courses)
 */
export async function getStudentQuizzes(studentId: string): Promise<Array<Quiz & { attempt: QuizAttempt | null }>> {
  if (!hasSupabaseEnv()) {
    return demoQuizzes.map(q => {
      const attempts = demoAttempts[q.id] ?? [];
      const attempt = attempts.find(a => a.student_id === studentId) ?? null;
      return { ...q, attempt };
    });
  }

  try {
    const supabase = await createClient();
    
    // 1. Fetch classrooms the student is in
    const { data: classMemberships } = await supabase
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", studentId);
    
    const classroomIds = (classMemberships ?? []).map(m => m.classroom_id);
    if (!classroomIds.length) return [];

    // 2. Fetch courses for these classrooms
    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("course_id")
      .in("id", classroomIds);
    
    const courseIds = (classrooms ?? []).map(c => c.course_id);
    if (!courseIds.length) return [];

    // 3. Fetch published quizzes for these courses
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .in("course_id", courseIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const quizList = quizzes ?? [];
    
    // 4. Fetch attempts by this student for these quizzes
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("student_id", studentId)
      .in("quiz_id", quizList.map(q => q.id));

    const attemptMap = new Map(attempts?.map(a => [a.quiz_id, a]));

    return quizList.map(q => ({
      ...q,
      attempt: attemptMap.get(q.id) ?? null
    }));
  } catch (error) {
    console.error("Error fetching student quizzes:", error);
    return demoQuizzes.map(q => {
      const attempts = demoAttempts[q.id] ?? [];
      const attempt = attempts.find(a => a.student_id === studentId) ?? null;
      return { ...q, attempt };
    });
  }
}
