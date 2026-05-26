import { getTeacherCourses } from "@/lib/queries/courses";
import { LessonGeneratorClient } from "./lesson-generator-client";
import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LessonGeneratorPage() {
  const courses = await getTeacherCourses();
  const isDemo = !hasSupabaseEnv();

  return (
    <main className="phone-shell" style={{ maxWidth: "800px" }}>
      <section className="auth-screen is-active" aria-labelledby="generator-title" style={{ minHeight: "auto", paddingTop: "12px" }}>
        <p className="eyebrow">ระบบปัญญาประดิษฐ์ช่วยสอน</p>
        <h1 id="generator-title">สร้างแผนการจัดการเรียนรู้ วPA</h1>
        <p className="lead">
          ออกแบบแผนการสอน Active Learning สรุปเป้าหมาย KPA และวัดประเมินผลสอดคล้องหลักเกณฑ์ วPA
        </p>

        <div className="landing-actions" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          <Link className="landing-secondary" href="/app">
            กลับหน้า Dashboard
          </Link>
        </div>

        {isDemo && (
          <div className="notice-box" style={{ marginBottom: "1.25rem" }}>
            📱 โหมด Demo — ระบบจำลองสืบค้นข้อมูลและจัดทำแผนจำลองสอดคล้องสาระสำคัญ
          </div>
        )}

        <LessonGeneratorClient courses={courses} />
      </section>
    </main>
  );
}
