"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type AttendanceActionResponse = {
  success: boolean;
  message: string;
};

export async function saveAttendanceSession(
  classroomId: string,
  dateStr: string,
  periodLabel: string,
  records: Array<{ studentId: string; status: "present" | "late" | "leave" | "absent"; note?: string }>
): Promise<AttendanceActionResponse> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "โหมด demo: บันทึกข้อมูลเช็กชื่อตัวอย่างสำเร็จ (ไม่ได้เขียนลงฐานข้อมูลจริง)"
    };
  }

  const context = await getTeacherContext();
  if (!context) {
    return { success: false, message: "ไม่พบบัญชีครูในระบบ" };
  }

  if (!classroomId || !dateStr || !periodLabel || !records.length) {
    return { success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับบันทึก" };
  }

  try {
    const supabase = await createClient();

    // 1. Get course_id for the classroom
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("course_id")
      .eq("id", classroomId)
      .maybeSingle<{ course_id: string }>();

    if (!classroom) {
      return { success: false, message: "ไม่พบห้องเรียนที่ระบุ" };
    }

    // 2. Find or create attendance_session
    const { data: existingSession } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("session_date", dateStr)
      .eq("period_label", periodLabel)
      .limit(1)
      .maybeSingle<{ id: string }>();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from("attendance_sessions")
        .insert({
          classroom_id: classroomId,
          course_id: classroom.course_id,
          teacher_id: context.teacherId,
          session_date: dateStr,
          period_label: periodLabel,
          note: `เช็กชื่อโดย ${context.teacherId}`
        })
        .select("id")
        .maybeSingle<{ id: string }>();

      if (sessionError || !newSession) {
        return {
          success: false,
          message: "สร้างเซสชันเช็กชื่อล้มเหลว: " + (sessionError?.message ?? "ไม่ทราบสาเหตุ")
        };
      }
      sessionId = newSession.id;
    }

    // 3. Upsert attendance records
    const recordsToUpsert = records.map((r) => ({
      session_id: sessionId,
      student_id: r.studentId,
      status: r.status,
      note: r.note || null
    }));

    const { error: recordsError } = await supabase
      .from("attendance_records")
      .upsert(recordsToUpsert, { onConflict: "session_id,student_id" });

    if (recordsError) {
      return {
        success: false,
        message: "บันทึกข้อมูลการเข้าเรียนล้มเหลว: " + recordsError.message
      };
    }

    revalidatePath("/app");
    revalidatePath("/app/attendance");
    return {
      success: true,
      message: `บันทึกการเช็กชื่อห้องเรียนสำเร็จ (${records.length} รายการ)`
    };
  } catch (error: any) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดทางเทคนิค: " + (error?.message ?? String(error))
    };
  }
}
