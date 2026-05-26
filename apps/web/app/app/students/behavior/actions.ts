"use server";

import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";
import { getSchoolConfig } from "@/lib/school-config";

export type BehaviorLogInput = {
  studentId: string;
  studentName: string;
  category: "positive" | "negative" | "home_visit" | "counseling" | "parent_contact";
  title: string;
  description: string;
  points: number;
  logDate: string;
  isExportedToPa: boolean;
};

export type BehaviorLogItem = {
  id: string;
  student_id: string;
  student_name?: string;
  teacher_id: string;
  category: "positive" | "negative" | "home_visit" | "counseling" | "parent_contact";
  title: string;
  description: string | null;
  points: number;
  log_date: string;
  is_exported_to_pa: boolean;
  pa_evidence_id: string | null;
  parent_acknowledged: boolean;
  parent_acknowledged_at: string | null;
  parent_comment: string | null;
  created_at: string;
};

const localLogsPath = path.join(process.cwd(), "behavior-logs.json");

// Read local logs helper
function readLocalLogs(): BehaviorLogItem[] {
  try {
    if (fs.existsSync(localLogsPath)) {
      const data = fs.readFileSync(localLogsPath, "utf8");
      return JSON.parse(data) as BehaviorLogItem[];
    }
  } catch (err) {
    console.error("Error reading local behavior logs:", err);
  }
  return [];
}

// Write local logs helper
function writeLocalLogs(logs: BehaviorLogItem[]): boolean {
  try {
    fs.writeFileSync(localLogsPath, JSON.stringify(logs, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing local behavior logs:", err);
    return false;
  }
}

export async function fetchBehaviorLogs(studentIds: string[]): Promise<BehaviorLogItem[]> {
  if (!studentIds || studentIds.length === 0) return [];

  // If Supabase env is not active, fallback to local JSON
  if (!hasSupabaseEnv()) {
    const local = readLocalLogs();
    return local.filter((l) => studentIds.includes(l.student_id));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_behavior_logs")
      .select("*")
      .in("student_id", studentIds)
      .order("log_date", { ascending: false })
      .returns<BehaviorLogItem[]>();

    if (error) {
      console.warn("Table student_behavior_logs may not exist on Supabase yet. Falling back to local JSON:", error.message);
      const local = readLocalLogs();
      return local.filter((l) => studentIds.includes(l.student_id));
    }

    return data ?? [];
  } catch (error) {
    console.error("Error fetching behavior logs:", error);
    const local = readLocalLogs();
    return local.filter((l) => studentIds.includes(l.student_id));
  }
}

export async function saveBehaviorLog(input: BehaviorLogInput): Promise<{ success: boolean; message: string }> {
  const context = await getTeacherContext();
  const schoolConfig = getSchoolConfig();
  const activeYear = schoolConfig.academicYear;
  
  const teacherId = context?.teacherId ?? "demo-teacher-id";
  const newLogId = crypto.randomUUID();
  let paEvidenceId: string | null = null;

  // 1. If exported to PA, create PA Evidence first
  if (input.isExportedToPa) {
    paEvidenceId = crypto.randomUUID();
    
    if (hasSupabaseEnv()) {
      try {
        const supabase = await createClient();
        const { error: paError } = await supabase.from("pa_evidences").insert({
          id: paEvidenceId,
          teacher_id: teacherId,
          category: "student_support",
          title: `[ระบบดูแลช่วยเหลือผู้เรียน] ${input.title}`,
          description: `นักเรียน: ${input.studentName}\nประเภท: ${getCategoryLabel(input.category)}\nคะแนนพฤติกรรม: ${input.points > 0 ? "+" : ""}${input.points} คะแนน\nรายละเอียด: ${input.description || "ไม่มีรายละเอียด"}`,
          indicator_code: "วPA 2.2",
          academic_year: activeYear,
          evidence_date: input.logDate
        });

        if (paError) {
          console.error("Error inserting PA evidence:", paError.message);
          paEvidenceId = null; // Reset if error
        }
      } catch (err) {
        console.error("Error in PA evidence insertion catch:", err);
        paEvidenceId = null;
      }
    }
  }

  // 2. Insert to student_behavior_logs
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("student_behavior_logs").insert({
        id: newLogId,
        student_id: input.studentId,
        teacher_id: teacherId,
        category: input.category,
        title: input.title.trim(),
        description: input.description.trim() || null,
        points: input.points,
        log_date: input.logDate,
        is_exported_to_pa: input.isExportedToPa && paEvidenceId !== null,
        pa_evidence_id: paEvidenceId
      });

      if (!error) {
        revalidatePath("/app/students/behavior");
        revalidatePath("/app/pa");
        revalidatePath("/app");
        return { success: true, message: "บันทึกข้อมูลพฤติกรรมบนระบบคลาวด์สำเร็จ" };
      }
      
      console.warn("Failed to save to Supabase table. Falling back to local JSON:", error.message);
    } catch (err: any) {
      console.warn("Catch block for Supabase save. Falling back to local JSON:", err?.message);
    }
  }

  // 3. Fallback to local JSON saving
  const local = readLocalLogs();
  const newLog: BehaviorLogItem = {
    id: newLogId,
    student_id: input.studentId,
    student_name: input.studentName,
    teacher_id: teacherId,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim() || null,
    points: input.points,
    log_date: input.logDate,
    is_exported_to_pa: input.isExportedToPa,
    pa_evidence_id: paEvidenceId ?? (input.isExportedToPa ? crypto.randomUUID() : null),
    parent_acknowledged: false,
    parent_acknowledged_at: null,
    parent_comment: null,
    created_at: new Date().toISOString()
  };

  local.push(newLog);
  const success = writeLocalLogs(local);

  revalidatePath("/app/students/behavior");
  revalidatePath("/app/pa");
  revalidatePath("/app");

  if (success) {
    return { success: true, message: "บันทึกพฤติกรรมในระบบสำเร็จ (โหมดจำลองไฟล์)" };
  } else {
    return { success: false, message: "ล้มเหลวในการบันทึกข้อมูลพฤติกรรม" };
  }
}

export async function deleteBehaviorLog(logId: string, paEvidenceId: string | null): Promise<{ success: boolean; message: string }> {
  // 1. Delete from Supabase if connected
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      
      // If there is linked PA evidence, delete it too
      if (paEvidenceId) {
        await supabase.from("pa_evidences").delete().eq("id", paEvidenceId);
      }

      const { error } = await supabase.from("student_behavior_logs").delete().eq("id", logId);
      
      if (!error) {
        revalidatePath("/app/students/behavior");
        revalidatePath("/app/pa");
        revalidatePath("/app");
        return { success: true, message: "ลบบันทึกพฤติกรรมบนคลาวด์สำเร็จ" };
      }
    } catch (err: any) {
      console.warn("Failed to delete from Supabase, trying local fallback:", err?.message);
    }
  }

  // 2. Local fallback delete
  const local = readLocalLogs();
  const updated = local.filter((l) => l.id !== logId);
  const success = writeLocalLogs(updated);

  revalidatePath("/app/students/behavior");
  revalidatePath("/app/pa");
  revalidatePath("/app");

  if (success) {
    return { success: true, message: "ลบบันทึกพฤติกรรมสำเร็จ" };
  } else {
    return { success: false, message: "ล้มเหลวในการลบข้อมูล" };
  }
}

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case "positive": return "พฤติกรรมเชิงบวก";
    case "negative": return "พฤติกรรมควรปรับปรุง";
    case "home_visit": return "การเยี่ยมบ้านนักเรียน";
    case "counseling": return "การให้คำปรึกษาแนะแนว";
    case "parent_contact": return "การประสานงานผู้ปกครอง";
    default: return cat;
  }
}
