import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizDetails, getQuizAttempts } from "@/lib/queries/quizzes";

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizDetailPage({ params }: Props) {
  const { quizId } = await params;
  const quiz = await getQuizDetails(quizId);

  if (!quiz) {
    notFound();
  }

  const attempts = await getQuizAttempts(quizId);

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="quiz-detail-title">
        <p className="eyebrow">รายละเอียดแบบทดสอบ</p>
        <h1 id="quiz-detail-title">{quiz.title}</h1>
        <p style={{ margin: "0.25rem 0 1rem", fontSize: "0.85rem", color: "#64748b" }}>
          {quiz.description || "ไม่มีคำอธิบายเพิ่มเติม"}
        </p>

        <div
          style={{
            background: "#eff6ff",
            borderRadius: "12px",
            padding: "0.85rem",
            border: "1px solid #bfdbfe",
            marginBottom: "1.25rem",
            fontSize: "0.78rem",
            color: "#1e3a8a"
          }}
        >
          <p style={{ margin: "0 0 0.25rem" }}>
            <strong>สถานะ:</strong> {quiz.is_published ? "🟢 เผยแพร่แล้ว (เปิดให้นักเรียนทำสอบ)" : "🔴 ฉบับร่าง"}
          </p>
          <p style={{ margin: "0 0 0.25rem" }}>
            <strong>คะแนนเต็ม:</strong> {quiz.max_score} คะแนน
          </p>
          <p style={{ margin: 0 }}>
            <strong>จำกัดเวลา:</strong> {quiz.time_limit ? `${quiz.time_limit} นาที` : "ไม่จำกัดเวลา"}
          </p>
        </div>

        <div className="landing-actions" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Link className="landing-secondary" href={"/app/quizzes" as any} style={{ flex: 1, textAlign: "center" }}>
            ← กลับหน้ารายการ
          </Link>
          
          <Link
            className="landing-primary"
            href={`/app/quizzes/${quiz.id}/questions` as any}
            style={{ flex: 1, textAlign: "center", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }}
          >
            ✍️ จัดการโจทย์คำถาม
          </Link>
        </div>

        <h2 className="setup-heading">📊 คะแนนผู้เรียนที่ส่งแล้ว ({attempts.length})</h2>

        {attempts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.85rem", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            📭 ยังไม่มีนักเรียนส่งคำตอบสำหรับแบบทดสอบนี้
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
            {attempts.map((attempt) => {
              const dateStr = new Date(attempt.submitted_at).toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              });
              
              // Calculate percentage
              const percent = quiz.max_score > 0 ? Math.round((attempt.score / quiz.max_score) * 100) : 0;
              const isPassed = percent >= 50; // simple pass criteria at 50%

              return (
                <div
                  key={attempt.id}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "0.85rem",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.88rem", color: "#1e293b", display: "block" }}>
                      {attempt.student_name}
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      รหัส: {attempt.student_code} · ส่งเมื่อ: {dateStr}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: isPassed ? "#16a34a" : "#dc2626",
                        display: "block"
                      }}
                    >
                      {attempt.score}/{quiz.max_score}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.35rem",
                        borderRadius: "4px",
                        background: isPassed ? "#dcfce7" : "#fee2e2",
                        color: isPassed ? "#15803d" : "#b91c1c"
                      }}
                    >
                      {isPassed ? "ผ่านเกณฑ์" : "ไม่ผ่าน"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
