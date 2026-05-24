import { getTeacherCourses } from "@/lib/queries/courses";
import { getCourseReportData } from "@/lib/queries/reports";
import { ReportsClient } from "./reports-client";
import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/env";

type Props = {
  searchParams: Promise<{
    courseId?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const courses = await getTeacherCourses();
  const selectedCourseId = params.courseId ?? courses[0]?.id ?? "";

  const reportData = selectedCourseId
    ? await getCourseReportData(selectedCourseId)
    : null;

  const isDemo = !hasSupabaseEnv();

  return (
    <main className="phone-shell" style={{ maxWidth: "800px" }}>
      <section className="auth-screen is-active" aria-labelledby="reports-title" style={{ minHeight: "auto", paddingTop: "12px" }}>
        <p className="eyebrow">รายงานความก้าวหน้าผู้เรียน</p>
        <h1 id="reports-title">วิเคราะห์และรายงานผลลัพธ์ผู้เรียน</h1>
        <p className="lead">
          กราฟพัฒนาการ Pre/Post-Test สรุปการเข้าเรียน รายงานผลการประเมินแยกตามนักเรียน และจัดทำเอกสารแนบ วPA
        </p>

        <div className="landing-actions" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          <Link className="landing-secondary" href="/app">
            กลับหน้า Dashboard
          </Link>
        </div>

        {isDemo && (
          <div className="notice-box" style={{ marginBottom: "1.25rem" }}>
            📱 โหมด Demo — ข้อมูลที่แสดงเป็นชุดข้อมูลตัวอย่างวิเคราะห์การเรียนรู้
          </div>
        )}

        {reportData && (
          <ReportsClient
            courses={courses}
            selectedCourseId={selectedCourseId}
            reportData={reportData}
          />
        )}
      </section>
    </main>
  );
}
