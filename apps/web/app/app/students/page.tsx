import Link from "next/link";
import { StudentsClient } from "@/app/app/students/students-client";
import { getClassroomStudents, getTeacherClassroomOptions } from "@/lib/queries/classroom-students";

type StudentsPageProps = {
  searchParams: Promise<{ classroomId?: string }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const classroomOptions = await getTeacherClassroomOptions();
  const classroomId = params.classroomId ?? classroomOptions[0]?.id ?? "";
  const students = classroomId ? await getClassroomStudents(classroomId) : [];

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="students-title">
        <p className="eyebrow">จัดการนักเรียนรายห้อง</p>
        <h1 id="students-title">ย้ายห้องและจัดการรายชื่อนักเรียน</h1>
        <p className="lead">รองรับการค้นหา ย้ายห้อง และนำออกจากห้องเรียนของคุณ</p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">กลับหน้า Dashboard</Link>
          <Link className="landing-secondary" href="/app/import-export">Import/Export</Link>
        </div>

        <form className="course-form" method="get">
          <label>
            เลือกห้องเรียน
            <select name="classroomId" defaultValue={classroomId}>
              {classroomOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} | {c.course_title}
                </option>
              ))}
            </select>
          </label>
          <button className="landing-secondary" type="submit">
            โหลดรายชื่อห้องนี้
          </button>
        </form>

        <StudentsClient classroomId={classroomId} classroomOptions={classroomOptions} students={students} />
      </section>
    </main>
  );
}
