"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/supabase/student-session";

export type StudentActionResponse = {
  success: boolean;
  message: string;
};

export async function submitAssignment(
  assignmentId: string,
  content: string
): Promise<StudentActionResponse> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "โหมด demo: ส่งงานจำลองสำเร็จ (ไม่ได้บันทึกลงฐานข้อมูลจริง)"
    };
  }

  const student = await getStudentSession();
  if (!student) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำการส่งงาน" };
  }

  if (!assignmentId || !content.trim()) {
    return { success: false, message: "ข้อมูลชิ้นงานหรือคำตอบไม่ครบถ้วน" };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("submissions")
      .upsert(
        {
          assignment_id: assignmentId,
          student_id: student.id,
          content: content.trim(),
          status: "submitted",
          submitted_at: new Date().toISOString()
        },
        { onConflict: "assignment_id,student_id" }
      );

    if (error) {
      return { success: false, message: "บันทึกการส่งงานล้มเหลว: " + error.message };
    }

    revalidatePath("/app");
    revalidatePath("/app/assignments");
    revalidatePath("/app/student");
    return { success: true, message: "ส่งงานของคุณเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
