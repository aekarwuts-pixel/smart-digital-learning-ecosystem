"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export type StudentAttendanceDetail = {
  present: number;
  late: number;
  leave: number;
  absent: number;
  total: number;
  records: Array<{
    date: string;
    status: string;
    note: string | null;
  }>;
};

export async function getStudentAttendanceDetail(studentId: string): Promise<StudentAttendanceDetail> {
  // Demo Mode: Return randomized mock details for demonstration
  if (!hasSupabaseEnv() || studentId === "s1" || studentId === "s2" || studentId === "s3" || studentId === "s4" || studentId === "s5" || studentId === "s6" || studentId === "s7" || studentId === "s8") {
    // Generate slight variations based on studentId to make it look realistic
    const seed = studentId.charCodeAt(studentId.length - 1) % 4;
    const present = 8 + (seed % 3);
    const late = seed === 1 ? 1 : 0;
    const leave = seed === 2 ? 1 : 0;
    const absent = seed === 3 ? 1 : 0;
    const total = present + late + leave + absent;

    const records = [];
    for (let i = 0; i < total; i++) {
      const dateStr = new Date(Date.now() - 86400000 * i * 2).toISOString().split("T")[0];
      let status = "present";
      let note = "";
      
      if (i === 2 && late > 0) {
        status = "late";
        note = "รถติด/ตื่นสาย";
      } else if (i === 4 && leave > 0) {
        status = "leave";
        note = "ลากิจไปธุระกับครอบครัว";
      } else if (i === 1 && absent > 0) {
        status = "absent";
        note = "ขาดเรียน ไม่แจ้งสาเหตุ";
      }
      
      records.push({ date: dateStr, status, note: note || null });
    }

    return {
      present,
      late,
      leave,
      absent,
      total,
      records
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .select(`
        status,
        note,
        attendance_sessions ( session_date )
      `)
      .eq("student_id", studentId);

    if (error || !data) {
      console.error("Error querying attendance records:", error?.message);
      return { present: 0, late: 0, leave: 0, absent: 0, total: 0, records: [] };
    }

    const records = data.map((r: any) => ({
      date: r.attendance_sessions?.session_date ?? "",
      status: r.status,
      note: r.note
    })).sort((a, b) => b.date.localeCompare(a.date));

    const counts = { present: 0, late: 0, leave: 0, absent: 0, total: records.length };
    records.forEach(r => {
      if (r.status === "present") counts.present++;
      else if (r.status === "late") counts.late++;
      else if (r.status === "leave") counts.leave++;
      else if (r.status === "absent") counts.absent++;
    });

    return {
      ...counts,
      records
    };
  } catch (err) {
    console.error("Error fetching detailed attendance:", err);
    return { present: 0, late: 0, leave: 0, absent: 0, total: 0, records: [] };
  }
}
