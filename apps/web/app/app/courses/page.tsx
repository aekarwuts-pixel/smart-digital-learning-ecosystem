import Link from "next/link";
import { CourseForm } from "@/app/app/courses/course-form";
import { createCourse, deleteCourse, updateCourse } from "@/app/app/courses/actions";
import { getTeacherCourses } from "@/lib/queries/courses";

export default async function CoursesPage() {
  const courses = await getTeacherCourses();

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="courses-title">
        <p className="eyebrow">จัดการรายวิชา</p>
        <h1 id="courses-title">เพิ่ม ลบ และแก้ไขรายวิชาของฉัน</h1>
        <p className="lead">
          เมื่อบันทึกสำเร็จ หน้า Dashboard ที่ <code>/app</code> จะอัปเดตข้อมูลอัตโนมัติ
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">กลับหน้า Dashboard</Link>
        </div>

        <h2 className="setup-heading">เพิ่มรายวิชาใหม่</h2>
        <CourseForm action={createCourse} mode="create" submitLabel="เพิ่มรายวิชา" />

        <h2 className="setup-heading">รายวิชาที่มีอยู่</h2>
        <div className="course-list">
          {courses.map((course) => (
            <article key={course.id} className="course-item">
              <div className="course-item-header">
                <strong>{course.title}</strong>
                <span>{course.grade_level}</span>
              </div>
              <p>
                {course.code || "ไม่มีรหัสวิชา"} | ภาคเรียน {course.semester} | ปีการศึกษา {course.academic_year}
              </p>
              <p>{course.description || "ไม่มีคำอธิบายรายวิชา"}</p>
              <CourseForm action={updateCourse} mode="edit" submitLabel="บันทึกการแก้ไข" course={course} />
              <form action={deleteCourse}>
                <input type="hidden" name="course_id" value={course.id} />
                <button className="danger-button" type="submit">ลบรายวิชา</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
