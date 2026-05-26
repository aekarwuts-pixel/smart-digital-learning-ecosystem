"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/supabase/student-session";
import fs from "fs";
import path from "path";

// For demo mode fallback
const localLogsPath = path.join(process.cwd(), "behavior-logs.json");

function readLocalLogs() {
  try {
    if (fs.existsSync(localLogsPath)) {
      const data = fs.readFileSync(localLogsPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local behavior logs:", err);
  }
  return [];
}

function writeLocalLogs(logs: any[]) {
  try {
    fs.writeFileSync(localLogsPath, JSON.stringify(logs, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing local behavior logs:", err);
    return false;
  }
}

import { uploadFileToStorage } from "@/lib/supabase/storage";

export type StudentActionResponse = {
  success: boolean;
  message: string;
};

export async function submitAssignment(
  formData: FormData
): Promise<StudentActionResponse> {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const content = String(formData.get("content") ?? "");
  const file = formData.get("file") as File | null;

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

  if (!assignmentId || (!content.trim() && (!file || file.size === 0))) {
    return { success: false, message: "ข้อมูลชิ้นงาน คำตอบ หรือไฟล์แนบไม่ครบถ้วน" };
  }

  try {
    const supabase = createAdminClient();

    const { data: submissionRow, error: submissionError } = await supabase
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
      )
      .select("id")
      .single<{ id: string }>();

    if (submissionError || !submissionRow) {
      return { success: false, message: "บันทึกการส่งงานล้มเหลว: " + (submissionError?.message ?? "ไม่พบข้อมูลที่ตอบกลับ") };
    }

    if (file && file.size > 0) {
      const uploadRes = await uploadFileToStorage(
        "submissions",
        `students/${student.id}`,
        file,
        student.profile_id
      );

      if (uploadRes.success && uploadRes.fileId) {
        const { error: linkError } = await supabase
          .from("submission_files")
          .upsert({
            submission_id: submissionRow.id,
            file_id: uploadRes.fileId
          }, { onConflict: "submission_id,file_id" });

        if (linkError) {
          console.error("Failed to link file to submission:", linkError.message);
        }
      } else {
        console.warn("Storage upload warning/failure:", uploadRes.message);
      }
    }

    revalidatePath("/app");
    revalidatePath("/app/assignments");
    revalidatePath("/app/student");
    return { success: true, message: "ส่งงานของคุณเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function acknowledgeBehaviorLog(
  logId: string,
  comment: string
): Promise<StudentActionResponse> {
  const student = await getStudentSession();

  if (!hasSupabaseEnv()) {
    // Demo Mode: Update local JSON
    try {
      const logs = readLocalLogs();
      const logIdx = logs.findIndex((l: any) => l.id === logId);
      if (logIdx === -1) {
        return { success: false, message: "ไม่พบบันทึกพฤติกรรมที่ระบุ" };
      }

      logs[logIdx].parent_acknowledged = true;
      logs[logIdx].parent_acknowledged_at = new Date().toISOString();
      logs[logIdx].parent_comment = comment.trim() || null;

      writeLocalLogs(logs);

      revalidatePath("/app");
      revalidatePath("/app/student");
      revalidatePath("/app/students/behavior");
      return { success: true, message: "ลงชื่อรับทราบสำเร็จ (โหมดจำลอง)" };
    } catch (err: any) {
      return { success: false, message: "ล้มเหลวในการบันทึกข้อมูล: " + err.message };
    }
  }

  // Real Mode: Update database
  if (!student) {
    return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำการยืนยัน" };
  }

  try {
    const supabase = createAdminClient();

    // First, verify that the log belongs to this student
    const { data: log, error: checkError } = await supabase
      .from("student_behavior_logs")
      .select("id, student_id")
      .eq("id", logId)
      .single();

    if (checkError || !log) {
      return { success: false, message: "ไม่พบข้อมูลบันทึกพฤติกรรม" };
    }

    if (log.student_id !== student.id) {
      return { success: false, message: "ไม่มีสิทธิ์ลงชื่อรับทราบข้อมูลนักเรียนคนอื่น" };
    }

    // Perform update
    const { error: updateError } = await supabase
      .from("student_behavior_logs")
      .update({
        parent_acknowledged: true,
        parent_acknowledged_at: new Date().toISOString(),
        parent_comment: comment.trim() || null
      })
      .eq("id", logId);

    if (updateError) {
      return { success: false, message: "บันทึกข้อมูลล้มเหลว: " + updateError.message };
    }

    revalidatePath("/app");
    revalidatePath("/app/student");
    revalidatePath("/app/students/behavior");
    return { success: true, message: "ลงชื่อรับทราบพฤติกรรมสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
