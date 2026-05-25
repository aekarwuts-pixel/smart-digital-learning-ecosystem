import Link from "next/link";
import { getTeacherCourses } from "@/lib/queries/courses";
import { getTeacherQuizzes } from "@/lib/queries/quizzes";
import { QuizForm } from "./quiz-form";
import { createQuiz, deleteQuiz, updateQuiz } from "./actions";

export default async function QuizzesPage() {
  const courses = await getTeacherCourses();

  // Load quizzes for all courses
  const quizzesByCourse = await Promise.all(
    courses.map(async (course) => {
      const list = await getTeacherQuizzes(course.id);
      return {
        course,
        quizzes: list
      };
    })
  );

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="quizzes-title">
        <p className="eyebrow">ระบบประเมินผล</p>
        <h1 id="quizzes-title">แบบทดสอบออนไลน์ (Quizzes)</h1>
        <p className="lead">
          สร้างและจัดการแบบทดสอบออนไลน์สำหรับรายวิชาต่าง ๆ ดึงโจทย์คำถามและผลการประเมินมาใช้สะสมใน ว PA ได้
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app">กลับหน้า Dashboard</Link>
        </div>

        <h2 className="setup-heading">➕ สร้างแบบทดสอบใหม่</h2>
        <QuizForm
          action={createQuiz}
          mode="create"
          submitLabel="สร้างแบบทดสอบ"
          courses={courses.map(c => ({ id: c.id, title: c.title, grade_level: c.grade_level }))}
        />

        <h2 className="setup-heading">📋 แบบทดสอบในรายวิชาของคุณ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {quizzesByCourse.map(({ course, quizzes }) => (
            <div
              key={course.id}
              style={{
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "0.92rem", color: "#4f46e5" }}>{course.title} ({course.grade_level})</strong>
                <span style={{ fontSize: "0.72rem", color: "#64748b", background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                  {quizzes.length} แบบทดสอบ
                </span>
              </div>

              {quizzes.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", margin: "1rem 0" }}>
                  ยังไม่มีแบบทดสอบในวิชานี้
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      style={{
                        background: "#f8fafc",
                        borderRadius: "12px",
                        padding: "0.85rem",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                        <Link
                          href={`/app/quizzes/${quiz.id}` as any}
                          style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b", textDecoration: "none" }}
                        >
                          📝 {quiz.title}
                        </Link>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            background: quiz.is_published ? "#dcfce7" : "#fee2e2",
                            color: quiz.is_published ? "#15803d" : "#b91c1c"
                          }}
                        >
                          {quiz.is_published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                        </span>
                      </div>
                      
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                        {quiz.description || "ไม่มีรายละเอียดคำอธิบาย"}
                      </p>
                      
                      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#94a3b8" }}>
                        คะแนนเต็ม: {quiz.max_score} | จำกัดเวลา: {quiz.time_limit ? `${quiz.time_limit} นาที` : "ไม่จำกัด"}
                      </p>

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link
                          href={`/app/quizzes/${quiz.id}/questions` as any}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            padding: "0.35rem",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          ✍️ จัดการคำถาม
                        </Link>
                        
                        <Link
                          href={`/app/quizzes/${quiz.id}` as any}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            background: "#f0fdf4",
                            color: "#15803d",
                            padding: "0.35rem",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          📊 คะแนนผู้เรียน
                        </Link>
                      </div>

                      <div style={{ marginTop: "0.5rem", borderTop: "1px dashed #e2e8f0", paddingTop: "0.5rem" }}>
                        <QuizForm action={updateQuiz} mode="edit" submitLabel="แก้ไขข้อความ" quiz={quiz} />
                        <form action={deleteQuiz} style={{ marginTop: "0.35rem" }}>
                          <input type="hidden" name="quiz_id" value={quiz.id} />
                          <button className="danger-button" type="submit" style={{ padding: "0.35rem", fontSize: "0.7rem", borderRadius: "8px" }}>
                            ลบแบบทดสอบ
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
