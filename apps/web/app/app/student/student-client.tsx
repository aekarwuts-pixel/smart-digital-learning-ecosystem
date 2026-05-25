"use client";

import { useState, useTransition } from "react";
import { submitAssignment } from "./actions";
import type {
  StudentDashboardData,
  StudentCourse,
  StudentAssignmentItem,
  StudentAttendanceItem
} from "@/lib/queries/student";
import type { Quiz, QuizAttempt } from "@/lib/database.types";

type Props = {
  student: {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    grade_level: string;
    room: string;
  };
  dashData: StudentDashboardData;
  quizzes: Array<Quiz & { attempt: QuizAttempt | null }>;
  isDemo: boolean;
  signOutAction: () => Promise<void>;
};

// ─── Status helpers ───────────────────────────────────────────────────────────
function submissionLabel(status: string | null): { text: string; color: string } {
  switch (status) {
    case "submitted":
      return { text: "ส่งแล้ว", color: "#3b82f6" };
    case "reviewed":
      return { text: "ตรวจแล้ว", color: "#10b981" };
    case "returned":
      return { text: "ส่งคืน", color: "#f59e0b" };
    default:
      return { text: "ยังไม่ส่ง", color: "#ef4444" };
  }
}

function attendanceLabel(status: string): { text: string; color: string; icon: string } {
  switch (status) {
    case "present":
      return { text: "เข้าเรียน", color: "#10b981", icon: "✅" };
    case "late":
      return { text: "มาสาย", color: "#f59e0b", icon: "⏰" };
    case "leave":
      return { text: "ลา", color: "#3b82f6", icon: "📋" };
    case "absent":
      return { text: "ขาด", color: "#ef4444", icon: "❌" };
    default:
      return { text: status, color: "#64748b", icon: "?" };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "ไม่ระบุ";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function StudentClient({ student, dashData, quizzes, isDemo, signOutAction }: Props) {
  const { courses, recentAssignments, recentAttendance, stats } = dashData;

  // Selected assignment ID for submission form toggle
  const [activeFormAssignmentId, setActiveFormAssignmentId] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast states
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

  // Handle assignment submission
  async function handleSubmit(assignmentId: string) {
    if (!submissionContent.trim()) {
      showToast("กรุณากรอกคำตอบก่อนส่ง", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAssignment(assignmentId, submissionContent);
      if (res.success) {
        showToast(res.message, "success");
        setSubmissionContent("");
        setActiveFormAssignmentId(null);
        // Page reload
        window.location.reload();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("ส่งงานล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={style.container}>
      {/* Header */}
      <header style={style.header}>
        <div>
          <p style={style.headerSub}>
            {student.grade_level}/{student.room} · รหัส {student.student_code}
          </p>
          <h1 style={style.headerTitle}>สวัสดี, {student.first_name}! 👋</h1>
        </div>
        <button type="button" onClick={() => signOutAction()} style={style.signOutBtn}>
          ออกจากระบบ
        </button>
      </header>

      {isDemo && (
        <div className="notice-box" style={{ margin: "0.75rem 1rem 0" }}>
          📱 โหมด Demo — ข้อมูลที่แสดงเป็นข้อมูลตัวอย่าง
        </div>
      )}

      {/* Stats Grid */}
      <section style={style.statsSection}>
        <article style={{ ...style.statCard, borderTop: "3px solid #6366f1" }}>
          <span style={{ fontSize: "1.3rem" }}>📚</span>
          <p style={style.statValue}>{stats.totalCourses}</p>
          <p style={style.statLabel}>วิชาที่ลงทะเบียน</p>
        </article>

        <article
          style={{
            ...style.statCard,
            borderTop: `3px solid ${stats.pendingAssignments > 0 ? "#ef4444" : "#10b981"}`
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>📝</span>
          <p style={{ ...style.statValue, color: stats.pendingAssignments > 0 ? "#ef4444" : "#10b981" }}>
            {stats.pendingAssignments}
          </p>
          <p style={style.statLabel}>งานที่ยังไม่ส่ง</p>
        </article>

        <article style={{ ...style.statCard, borderTop: "3px solid #f59f00" }}>
          <span style={{ fontSize: "1.3rem" }}>⭐</span>
          <p style={style.statValue}>{stats.averageScore !== null ? `${stats.averageScore}%` : "–"}</p>
          <p style={style.statLabel}>คะแนนเฉลี่ย</p>
        </article>

        <article
          style={{
            ...style.statCard,
            borderTop: `3px solid ${(stats.attendanceRate ?? 0) >= 80 ? "#10b981" : "#ef4444"}`
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>🏫</span>
          <p
            style={{
              ...style.statValue,
              color: (stats.attendanceRate ?? 0) >= 80 ? "#10b981" : "#ef4444"
            }}
          >
            {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "–"}
          </p>
          <p style={style.statLabel}>อัตราเข้าเรียน</p>
        </article>
      </section>

      {/* Enrolled Courses */}
      <section style={style.section}>
        <h2 style={style.sectionTitle}>วิชาที่ลงทะเบียน</h2>
        <div style={style.list}>
          {courses.length === 0 ? (
            <div style={style.emptyState}>ยังไม่ได้ลงทะเบียนวิชาใด</div>
          ) : (
            courses.map((c) => (
              <div key={c.course_id} style={style.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                      {c.course_code ? `[${c.course_code}] ` : ""}
                      {c.course_title}
                    </strong>
                    <p style={{ color: "#64748b", fontSize: "0.78rem", margin: "0.2rem 0 0" }}>
                      ครู {c.teacher_name} · ห้อง {c.classroom_name}
                    </p>
                  </div>
                  <span style={style.badgeBlue}>{c.classroom_name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Assignments with Interactive Submissions */}
      <section style={style.section}>
        <h2 style={style.sectionTitle}>งานที่มอบหมาย (แตะรายการเพื่อเปิดส่งงาน)</h2>
        <div style={style.list}>
          {recentAssignments.length === 0 ? (
            <div style={style.emptyState}>ยังไม่มีงานที่มอบหมาย</div>
          ) : (
            recentAssignments.map((a) => {
              const sub = submissionLabel(a.submission_status);
              const isFormOpen = activeFormAssignmentId === a.assignment_id;
              
              return (
                <div
                  key={a.assignment_id}
                  style={{
                    ...style.card,
                    borderLeft: `4px solid ${sub.color}`,
                    cursor: "pointer"
                  }}
                  onClick={() =>
                    setActiveFormAssignmentId(
                      isFormOpen ? null : a.assignment_id
                    )
                  }
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#1e293b", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                        {a.title}
                      </p>
                      <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>
                        {a.course_title}
                        {a.due_at && (
                          <span style={{ color: "#64748b" }}>
                            {" · "}กำหนดส่ง {formatDate(a.due_at)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          background: sub.color + "22",
                          color: sub.color,
                          fontSize: "0.7rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.4rem",
                          fontWeight: 700
                        }}
                      >
                        {sub.text}
                      </span>
                      {a.total_score !== null && (
                        <p style={{ color: "#10b981", fontSize: "0.75rem", margin: "0.3rem 0 0", fontWeight: 700 }}>
                          {a.total_score}/{a.max_score}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission form area */}
                  {isFormOpen && (
                    <div
                      style={style.formPanel}
                      onClick={(e) => e.stopPropagation()} // Stop toggle when clicking inside form
                    >
                      {/* Submitting text/answer */}
                      <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", marginTop: "10px" }}>
                        <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 6px", fontWeight: "bold" }}>
                          คำชี้แจงการส่งงาน:
                        </p>
                        
                        {/* If reviewed, show score feedback */}
                        {a.submission_status === "reviewed" && (
                          <div style={style.feedbackBox}>
                            <p style={{ margin: 0, fontWeight: "bold", color: "#15803d" }}>
                              คะแนนที่ได้: {a.total_score} / {a.max_score} คะแนน
                            </p>
                            <p style={{ margin: "4px 0 0", color: "#475569", fontStyle: "italic" }}>
                              ฟีดแบ็กจากคุณครู: {a.teacher_feedback || "ไม่มีข้อเสนอแนะจากครู"}
                            </p>
                          </div>
                        )}

                        {/* Interactive Form */}
                        {a.submission_status !== "reviewed" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <textarea
                              style={style.textarea}
                              rows={3}
                              placeholder="กรอกคำตอบของคุณ หรือใส่ลิงก์ Google Drive/Canva ชิ้นงาน..."
                              value={submissionContent}
                              onChange={(e) => setSubmissionContent(e.target.value)}
                            />
                            <button
                              type="button"
                              style={style.submitBtn}
                              onClick={() => handleSubmit(a.assignment_id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "⏳ กำลังส่ง..." : "💾 กดส่งชิ้นงาน"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Online Quizzes */}
      <section style={style.section}>
        <h2 style={style.sectionTitle}>📝 แบบทดสอบออนไลน์</h2>
        <div style={style.list}>
          {quizzes.length === 0 ? (
            <div style={style.emptyState}>ยังไม่มีแบบทดสอบในขณะนี้</div>
          ) : (
            quizzes.map((q) => {
              const hasAttempted = q.attempt !== null;
              
              return (
                <div
                  key={q.id}
                  style={{
                    ...style.card,
                    borderLeft: `4px solid ${hasAttempted ? "#10b981" : "#4f46e5"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#1e293b", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                        {q.title}
                      </p>
                      <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>
                        {q.description || "ไม่มีรายละเอียดคำอธิบาย"}
                      </p>
                      <p style={{ color: "#94a3b8", fontSize: "0.7rem", margin: "0.25rem 0 0" }}>
                        คะแนนเต็ม: {q.max_score} คะแนน | จำกัดเวลา: {q.time_limit ? `${q.time_limit} นาที` : "ไม่จำกัด"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          background: hasAttempted ? "#dcfce7" : "#e0e7ff",
                          color: hasAttempted ? "#15803d" : "#4338ca",
                          fontSize: "0.7rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.4rem",
                          fontWeight: 700
                        }}
                      >
                        {hasAttempted ? "ทำแล้ว" : "ยังไม่ทำ"}
                      </span>
                      {hasAttempted && q.attempt && (
                        <p style={{ color: "#16a34a", fontSize: "0.85rem", margin: "0.3rem 0 0", fontWeight: 800 }}>
                          {q.attempt.score} / {q.max_score}
                        </p>
                      )}
                    </div>
                  </div>

                  {!hasAttempted && (
                    <div style={{ marginTop: "0.75rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.75rem" }}>
                      <a
                        href={`/app/student/quizzes/${q.id}`}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "center",
                          padding: "0.5rem",
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          color: "#fff",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 2px 8px rgba(79,70,229,0.25)"
                        }}
                      >
                        ✍️ เริ่มทำแบบทดสอบ
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Attendance List */}
      <section style={{ ...style.section, paddingBottom: "3rem" }}>
        <h2 style={style.sectionTitle}>การเข้าเรียนล่าสุด</h2>
        <div style={style.list}>
          {recentAttendance.length === 0 ? (
            <div style={style.emptyState}>ยังไม่มีบันทึกการเข้าเรียน</div>
          ) : (
            recentAttendance.map((a, i) => {
              const lbl = attendanceLabel(a.status);
              return (
                <div key={i} style={style.attendanceCard}>
                  <span style={{ fontSize: "1.1rem" }}>{lbl.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#1e293b", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>
                      {a.course_title}
                      {a.period_label ? ` · ${a.period_label}` : ""}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "0.72rem", margin: "0.1rem 0 0" }}>
                      {formatDate(a.session_date)}
                    </p>
                  </div>
                  <span
                    style={{
                      color: lbl.color,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: lbl.color + "18",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "0.35rem"
                    }}
                  >
                    {lbl.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            ...style.toast,
            background: toastType === "success" ? "#0f5132" : "#842029",
            color: "#fff"
          }}
        >
          {toastType === "success" ? "✅ " : "❌ "}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  header: {
    background: "linear-gradient(135deg, #1e40af, #7c3aed)",
    padding: "1rem 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "0 0 16px 16px",
    margin: "0 -16px",
    color: "#fff"
  },
  headerSub: {
    color: "#bfdbfe",
    fontSize: "0.72rem",
    margin: 0,
    fontWeight: "bold"
  },
  headerTitle: {
    fontSize: "1.1rem",
    color: "#fff",
    margin: 0,
    fontWeight: 800
  },
  signOutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.35rem 0.75rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontWeight: "bold"
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "8px"
  },
  statCard: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1e293b",
    margin: "4px 0 0"
  },
  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0
  },
  section: {
    marginTop: "4px"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 8px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  card: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  attendanceCard: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  badgeBlue: {
    background: "#dbeafe",
    color: "#1e40af",
    fontSize: "0.7rem",
    padding: "2px 6px",
    borderRadius: "6px",
    fontWeight: 700
  },
  emptyState: {
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px"
  },
  formPanel: {
    marginTop: "10px"
  },
  textarea: {
    width: "100%",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "8px",
    fontSize: "13px",
    outline: "none"
  },
  submitBtn: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "8px",
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(124,58,237,0.25)"
  },
  feedbackBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "10px"
  },
  toast: {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "bold",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
  }
};
