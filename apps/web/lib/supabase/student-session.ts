/**
 * lib/supabase/student-session.ts
 * Helper to resolve the current student from the session cookie.
 * Used in server components and server actions for student routes.
 */
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export type StudentSessionData = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  room: string;
  school_id: string;
};

/**
 * Returns the student record for the current session cookie,
 * or null if the cookie is missing / invalid.
 */
export async function getStudentSession(): Promise<StudentSessionData | null> {
  if (!hasSupabaseEnv()) return null;

  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_session_id")?.value;
  if (!studentId) return null;

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("students")
    .select("id, student_code, first_name, last_name, grade_level, room, school_id")
    .eq("id", studentId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StudentSessionData;
}
