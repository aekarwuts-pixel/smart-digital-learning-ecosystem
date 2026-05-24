import Link from "next/link";
import { getTeacherClassroomOptions, getClassroomStudents } from "@/lib/queries/classroom-students";
import { getClassroomAttendance } from "@/lib/queries/attendance";
import { AttendanceClient } from "@/app/app/attendance/attendance-client";
import { hasSupabaseEnv } from "@/lib/env";

type Props = {
  searchParams: Promise<{
    classroomId?: string;
    date?: string;
    period?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: Props) {
  const params = await searchParams;
  const classroomOptions = await getTeacherClassroomOptions();
  const classroomId = params.classroomId ?? classroomOptions[0]?.id ?? "";
  
  // Date default: local Thailand time (GMT+7)
  const tzOffset = 7 * 60 * 60 * 1000;
  const localTime = new Date(Date.now() + tzOffset);
  const defaultDateStr = localTime.toISOString().slice(0, 10);
  const selectedDate = params.date ?? defaultDateStr;
  
  const selectedPeriod = params.period ?? "คาบที่ 1";

  const students = classroomId ? await getClassroomStudents(classroomId) : [];
  const existingAttendance = classroomId 
    ? await getClassroomAttendance(classroomId, selectedDate, selectedPeriod)
    : {};

  const isDemo = !hasSupabaseEnv();

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="attendance-title">
        <p className="eyebrow">ระบบเช็กชื่อเข้าเรียน</p>
        <h1 id="attendance-title">บันทึกการเข้าเรียนรายคาบ</h1>
        <p className="lead">
          เลือกห้องเรียน วันที่ และคาบเรียนเพื่อทำการบันทึกข้อมูลการเข้าชั้นเรียนของนักเรียน
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">
            กลับหน้า Dashboard
          </Link>
          <Link className="landing-secondary" href="/app/students">
            จัดการนักเรียน
          </Link>
        </div>

        {isDemo && (
          <div className="notice-box" style={{ marginBottom: "1rem" }}>
            📱 โหมด Demo — ระบบจะบันทึกเป็นข้อมูลตัวอย่าง
          </div>
        )}

        <AttendanceClient
          classroomId={classroomId}
          classroomOptions={classroomOptions}
          selectedDate={selectedDate}
          selectedPeriod={selectedPeriod}
          students={students}
          existingAttendance={existingAttendance}
          isDemo={isDemo}
        />
      </section>
    </main>
  );
}
