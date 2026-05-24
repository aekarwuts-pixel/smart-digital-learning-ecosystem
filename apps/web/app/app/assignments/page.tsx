import Link from "next/link";
import { getTeacherCourses } from "@/lib/queries/courses";
import { getAssignmentSummaries, getAssignmentSubmissions } from "@/lib/queries/assignments";
import { AssignmentClient } from "@/app/app/assignments/assignment-client";
import { hasSupabaseEnv } from "@/lib/env";

type Props = {
  searchParams: Promise<{
    assignmentId?: string;
  }>;
};

export default async function AssignmentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const courses = await getTeacherCourses();
  const assignments = await getAssignmentSummaries();
  
  const selectedAssignmentId = params.assignmentId ?? assignments[0]?.id ?? "";
  const submissions = selectedAssignmentId 
    ? await getAssignmentSubmissions(selectedAssignmentId)
    : [];

  const isDemo = !hasSupabaseEnv();

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="assignments-title">
        <p className="eyebrow">ระบบจัดการงาน</p>
        <h1 id="assignments-title">มอบหมายงานและตรวจคะแนน</h1>
        <p className="lead">
          ครูสามารถสั่งงานใหม่ ตรวจรายการส่งงานของนักเรียน และให้ข้อเสนอแนะพร้อมบันทึกคะแนนจริง
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">
            กลับหน้า Dashboard
          </Link>
          <Link className="landing-secondary" href="/app/courses">
            จัดการรายวิชา
          </Link>
        </div>

        {isDemo && (
          <div className="notice-box" style={{ marginBottom: "1rem" }}>
            📱 โหมด Demo — ระบบจะบันทึกเป็นข้อมูลตัวอย่าง
          </div>
        )}

        <AssignmentClient
          courses={courses}
          assignments={assignments}
          selectedAssignmentId={selectedAssignmentId}
          submissions={submissions}
          isDemo={isDemo}
        />
      </section>
    </main>
  );
}
