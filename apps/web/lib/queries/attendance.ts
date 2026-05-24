import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type StudentAttendanceState = {
  student_id: string;
  status: "present" | "late" | "leave" | "absent";
  note: string | null;
};

export async function getClassroomAttendance(
  classroomId: string,
  dateStr: string,
  periodLabel: string
): Promise<Record<string, StudentAttendanceState>> {
  if (!hasSupabaseEnv() || !classroomId || !dateStr || !periodLabel) {
    return {};
  }

  try {
    const supabase = await createClient();

    // 1. Find session ID
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("session_date", dateStr)
      .eq("period_label", periodLabel)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (!session) {
      return {};
    }

    // 2. Fetch records for this session
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status, note")
      .eq("session_id", session.id)
      .returns<StudentAttendanceState[]>();

    if (!records || !records.length) {
      return {};
    }

    // Convert to map for easy lookup
    const map: Record<string, StudentAttendanceState> = {};
    for (const r of records) {
      map[r.student_id] = r;
    }
    return map;
  } catch (error) {
    console.error("Error fetching classroom attendance:", error);
    return {};
  }
}
