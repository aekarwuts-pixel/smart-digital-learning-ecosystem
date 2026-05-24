import Link from "next/link";
import { ImportExportClient } from "@/app/app/import-export/import-export-client";
import { getTeacherClassrooms } from "@/lib/queries/classrooms";

export default async function ImportExportPage() {
  const classrooms = await getTeacherClassrooms();

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="import-export-title">
        <p className="eyebrow">นำเข้าและส่งออกข้อมูล</p>
        <h1 id="import-export-title">Import/Export ข้อมูลรายห้องเรียน</h1>
        <p className="lead">
          รองรับงานจริงของโรงเรียนสำหรับเพิ่มรายชื่อนักเรียนรายห้อง และส่งออกรายชื่อเพื่อใช้งานต่อ
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">กลับหน้า Dashboard</Link>
          <Link className="landing-secondary" href="/app/courses">จัดการรายวิชา</Link>
          <Link className="landing-secondary" href="/app/students">จัดการนักเรียน</Link>
        </div>

        <ImportExportClient classrooms={classrooms} />
      </section>
    </main>
  );
}
