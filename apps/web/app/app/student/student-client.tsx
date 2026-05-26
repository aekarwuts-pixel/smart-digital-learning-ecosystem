"use client";

import { useState, useTransition } from "react";
import { submitAssignment, acknowledgeBehaviorLog } from "./actions";
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
  const { courses, recentAssignments, recentAttendance, stats, behaviorLogs = [] } = dashData;

  // Selected assignment ID for submission form toggle
  const [activeFormAssignmentId, setActiveFormAssignmentId] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast states
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Tab & Parent Mode states
  const [activeTab, setActiveTab] = useState<"learning" | "behavior">("learning");
  const [parentMode, setParentMode] = useState(false);
  const [parentComments, setParentComments] = useState<Record<string, string>>({});
  const [submittingAck, setSubmittingAck] = useState<string | null>(null);

  const behaviorCategoryLabel: Record<string, string> = {
    positive: "พฤติกรรมเชิงบวก 👍",
    negative: "พฤติกรรมควรปรับปรุง ⚠️",
    home_visit: "เยี่ยมบ้านนักเรียน 🏠",
    counseling: "ให้คำปรึกษาแนะแนว 💬",
    parent_contact: "ประสานงานผู้ปกครอง 📞"
  };

  const behaviorCategoryColor: Record<string, string> = {
    positive: "#10b981", // green
    negative: "#ef4444", // red
    home_visit: "#3b82f6", // blue
    counseling: "#8b5cf6", // purple
    parent_contact: "#06b6d4" // cyan
  };

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleToggleForm(assignmentId: string) {
    if (activeFormAssignmentId === assignmentId) {
      setActiveFormAssignmentId(null);
      setSubmissionContent("");
      setSelectedFile(null);
    } else {
      setActiveFormAssignmentId(assignmentId);
      setSubmissionContent("");
      setSelectedFile(null);
    }
  }

  // Handle assignment submission
  async function handleSubmit(assignmentId: string) {
    if (!submissionContent.trim() && !selectedFile) {
      showToast("กรุณากรอกคำตอบหรือแนบไฟล์ก่อนส่ง", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("content", submissionContent);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await submitAssignment(formData);
      if (res.success) {
        showToast(res.message, "success");
        setSubmissionContent("");
        setSelectedFile(null);
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

  // Handle behavior log parent acknowledgment
  async function handleAcknowledge(logId: string) {
    const comment = parentComments[logId] || "";
    setSubmittingAck(logId);
    try {
      const res = await acknowledgeBehaviorLog(logId, comment);
      if (res.success) {
        showToast(res.message, "success");
        setParentComments(prev => {
          const updated = { ...prev };
          delete updated[logId];
          return updated;
        });
        window.location.reload();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + (err?.message ?? String(err)), "error");
    } finally {
      setSubmittingAck(null);
    }
  }

  return (
    <div style={style.container}>
      <style>{`
        * { box-sizing: border-box; }
        .dash-card:hover { transform: translateY(-3px) scale(1.015) !important; border-color: rgba(99, 102, 241, 0.4) !important; box-shadow: 0 8px 30px rgba(99,102,241,0.25) !important; }
        .btn-hover:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .tab-btn:hover { background: rgba(255,255,255,0.03) !important; color: #f1f5f9 !important; }
      `}</style>

      {/* Header */}
      <header style={style.header} className="cyber-header">
        <div>
          <p style={style.headerSub}>
            {student.grade_level}/{student.room} · รหัส {student.student_code}
          </p>
          <h1 style={style.headerTitle} className="neon-text-indigo">สวัสดี, {student.first_name}! 👋</h1>
        </div>
        <button type="button" onClick={() => signOutAction()} style={style.signOutBtn} className="btn-hover">
          ออกจากระบบ
        </button>
      </header>

      {isDemo && (
        <div className="notice-box" style={{ margin: "0.75rem 1rem 0", background: "rgba(6, 182, 212, 0.15)", borderColor: "rgba(6, 182, 212, 0.3)", color: "#22d3ee" }}>
          📱 โหมด Demo — ข้อมูลที่แสดงเป็นข้อมูลตัวอย่าง
        </div>
      )}

      {/* Tab Switcher */}
      <div style={style.tabBar}>
        <button
          type="button"
          className="tab-btn"
          style={{ ...style.tabBtn, ...(activeTab === "learning" ? style.tabBtnActive : {}) }}
          onClick={() => setActiveTab("learning")}
        >
          📚 กิจกรรมการเรียน
        </button>
        <button
          type="button"
          className="tab-btn"
          style={{ ...style.tabBtn, ...(activeTab === "behavior" ? style.tabBtnActive : {}) }}
          onClick={() => setActiveTab("behavior")}
        >
          🛡️ ความประพฤติ & การดูแล
        </button>
      </div>

      {activeTab === "learning" ? (
        <>
          {/* Stats Grid */}
          <section style={style.statsSection}>
            <article style={{ ...style.statCard, borderTop: "3px solid #6366f1" }} className="cyber-glass-card dash-card">
              <span style={{ fontSize: "1.3rem" }}>📚</span>
              <p style={style.statValue}>{stats.totalCourses}</p>
              <p style={style.statLabel}>วิชาที่ลงทะเบียน</p>
            </article>

            <article
              style={{
                ...style.statCard,
                borderTop: `3px solid ${stats.pendingAssignments > 0 ? "#ef4444" : "#10b981"}`
              }}
              className="cyber-glass-card dash-card"
            >
              <span style={{ fontSize: "1.3rem" }}>📝</span>
              <p style={{ ...style.statValue, color: stats.pendingAssignments > 0 ? "#ef4444" : "#10b981" }}>
                {stats.pendingAssignments}
              </p>
              <p style={style.statLabel}>งานที่ยังไม่ส่ง</p>
            </article>

            <article style={{ ...style.statCard, borderTop: "3px solid #f59f00" }} className="cyber-glass-card dash-card">
              <span style={{ fontSize: "1.3rem" }}>⭐</span>
              <p style={style.statValue}>{stats.averageScore !== null ? `${stats.averageScore}%` : "–"}</p>
              <p style={style.statLabel}>คะแนนเฉลี่ย</p>
            </article>

            <article
              style={{
                ...style.statCard,
                borderTop: `3px solid ${(stats.attendanceRate ?? 0) >= 80 ? "#10b981" : "#ef4444"}`
              }}
              className="cyber-glass-card dash-card"
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
            <h2 style={style.sectionTitle} className="neon-text-indigo">วิชาที่ลงทะเบียน</h2>
            <div style={style.list}>
              {courses.length === 0 ? (
                <div style={style.emptyState}>ยังไม่ได้ลงทะเบียนวิชาใด</div>
              ) : (
                courses.map((c) => (
                  <div key={c.course_id} className="cyber-glass-card dash-card" style={style.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ color: "#f1f5f9", fontSize: "0.9rem" }}>
                          {c.course_code ? `[${c.course_code}] ` : ""}
                          {c.course_title}
                        </strong>
                        <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "0.2rem 0 0" }}>
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
            <h2 style={style.sectionTitle} className="neon-text-indigo">งานที่มอบหมาย (แตะรายการเพื่อเปิดส่งงาน)</h2>
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
                      className="cyber-glass-card dash-card"
                      style={{
                        ...style.card,
                        borderLeft: `4px solid ${sub.color}`,
                        cursor: "pointer"
                      }}
                      onClick={() => handleToggleForm(a.assignment_id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "#f1f5f9", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                            {a.title}
                          </p>
                          <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>
                            {a.course_title}
                            {a.due_at && (
                              <span style={{ color: "#94a3b8" }}>
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
                          <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: "10px", marginTop: "10px" }}>
                            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 6px", fontWeight: "bold" }}>
                              คำชี้แจงการส่งงาน:
                            </p>
                            
                            {/* If reviewed, show score feedback */}
                            {a.submission_status === "reviewed" && (
                              <div style={style.feedbackBox}>
                                <p style={{ margin: 0, fontWeight: "bold", color: "#34d399" }}>
                                  คะแนนที่ได้: {a.total_score} / {a.max_score} คะแนน
                                </p>
                                <p style={{ margin: "4px 0 0", color: "#a7f3d0", fontStyle: "italic", fontSize: "12px" }}>
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

                                <label style={{ fontSize: "11px", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                  แนบไฟล์ส่งงาน (รูปภาพ หรือ PDF)
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        setSelectedFile(e.target.files[0]);
                                      } else {
                                        setSelectedFile(null);
                                      }
                                    }}
                                    style={{
                                      background: "rgba(15, 23, 42, 0.4)",
                                      color: "#fff",
                                      border: "1.5px dashed rgba(255,255,255,0.15)",
                                      borderRadius: "8px",
                                      padding: "6px",
                                      fontSize: "12px",
                                      cursor: "pointer"
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  style={style.submitBtn}
                                  onClick={() => handleSubmit(a.assignment_id)}
                                  disabled={isSubmitting}
                                  className="btn-hover"
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
            <h2 style={style.sectionTitle} className="neon-text-indigo">📝 แบบทดสอบออนไลน์</h2>
            <div style={style.list}>
              {quizzes.length === 0 ? (
                <div style={style.emptyState}>ยังไม่มีแบบทดสอบในขณะนี้</div>
              ) : (
                quizzes.map((q) => {
                  const hasAttempted = q.attempt !== null;
                  
                  return (
                    <div
                      key={q.id}
                      className="cyber-glass-card dash-card"
                      style={{
                        ...style.card,
                        borderLeft: `4px solid ${hasAttempted ? "#10b981" : "#4f46e5"}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "#f1f5f9", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                            {q.title}
                          </p>
                          <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>
                            {q.description || "ไม่มีรายละเอียดคำอธิบาย"}
                          </p>
                          <p style={{ color: "#94a3b8", fontSize: "0.7rem", margin: "0.25rem 0 0" }}>
                            คะแนนเต็ม: {q.max_score} คะแนน | จำกัดเวลา: {q.time_limit ? `${q.time_limit} นาที` : "ไม่จำกัด"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span
                            style={{
                              background: hasAttempted ? "rgba(16, 185, 129, 0.15)" : "rgba(79, 70, 229, 0.15)",
                              color: hasAttempted ? "#34d399" : "#818cf8",
                              fontSize: "0.7rem",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.4rem",
                              fontWeight: 700,
                              border: hasAttempted ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(79, 70, 229, 0.25)"
                            }}
                          >
                            {hasAttempted ? "ทำแล้ว" : "ยังไม่ทำ"}
                          </span>
                          {hasAttempted && q.attempt && (
                            <p style={{ color: "#34d399", fontSize: "0.85rem", margin: "0.3rem 0 0", fontWeight: 800 }}>
                              {q.attempt.score} / {q.max_score}
                            </p>
                          )}
                        </div>
                      </div>

                      {!hasAttempted && (
                        <div style={{ marginTop: "0.75rem", borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: "0.75rem" }}>
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
                            className="btn-hover"
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
            <h2 style={style.sectionTitle} className="neon-text-indigo">การเข้าเรียนล่าสุด</h2>
            <div style={style.list}>
              {recentAttendance.length === 0 ? (
                <div style={style.emptyState}>ยังไม่มีบันทึกการเข้าเรียน</div>
              ) : (
                recentAttendance.map((a, i) => {
                  const lbl = attendanceLabel(a.status);
                  return (
                    <div key={i} className="cyber-glass-card dash-card" style={style.attendanceCard}>
                      <span style={{ fontSize: "1.1rem" }}>{lbl.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "#f1f5f9", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>
                          {a.course_title}
                          {a.period_label ? ` · ${a.period_label}` : ""}
                        </p>
                        <p style={{ color: "#94a3b8", fontSize: "0.72rem", margin: "0.1rem 0 0" }}>
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
        </>
      ) : (
        /* Behavior Log & Acknowledgment Tab View */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "3rem" }}>
          
          {/* Behavior Points Dashboard Card */}
          <div style={style.behaviorCard} className="cyber-glass-card">
            <div style={style.pointsRing}>
              <strong style={{ fontSize: "24px", color: "#818cf8", fontWeight: 800 }}>
                {stats.behaviorPoints >= 0 ? "+" : ""}{stats.behaviorPoints}
              </strong>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>คะแนนพฤติกรรม</span>
            </div>
            
            <div>
              <h3 style={{ margin: "0.25rem 0 0.15rem", fontSize: "15px", fontWeight: 800, color: "#f1f5f9" }}>
                สมุดพกความประพฤติดิจิทัล
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "20px",
                  background:
                    stats.behaviorPoints >= 50 ? "rgba(16, 185, 129, 0.15)" :
                    stats.behaviorPoints >= 0 ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color:
                    stats.behaviorPoints >= 50 ? "#34d399" :
                    stats.behaviorPoints >= 0 ? "#60a5fa" : "#f87171",
                  display: "inline-block",
                  marginTop: "4px",
                  border: `1px solid ${
                    stats.behaviorPoints >= 50 ? "rgba(16, 185, 129, 0.3)" :
                    stats.behaviorPoints >= 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"
                  }`
                }}
              >
                {stats.behaviorPoints >= 50 ? "พฤติกรรมยอดเยี่ยม 🌟" :
                 stats.behaviorPoints >= 0 ? "พฤติกรรมปกติ 👍" : "ควรได้รับคำปรึกษาเป็นพิเศษ ⚠️"}
              </span>
            </div>
          </div>

          {/* Mode Switcher: Student vs Parent View */}
          <div style={style.modeSelectorCard} className="cyber-glass-card">
            <div>
              <strong style={{ fontSize: "13px", color: "#f1f5f9", display: "block" }}>
                สลับโหมดการเข้าใช้งาน
              </strong>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                สำหรับผู้ปกครองเข้ามาร่วมตรวจสอบและรับทราบพฤติกรรม
              </span>
            </div>
            
            <label style={style.modeToggleLabel}>
              <input
                type="checkbox"
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                checked={parentMode}
                onChange={(e) => setParentMode(e.target.checked)}
              />
              <span style={{ fontWeight: 800, color: parentMode ? "#818cf8" : "#94a3b8" }}>
                โหมดผู้ปกครอง
              </span>
            </label>
          </div>

          {/* Behavior Timeline Logs */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9", margin: "0 0 10px" }} className="neon-text-indigo">
              📜 ประวัติความประพฤติและการดูแลช่วยเหลือ
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {behaviorLogs.length === 0 ? (
                <div style={style.emptyState}>ยังไม่มีประวัติบันทึกพฤติกรรมของนักเรียนในวิชาใด</div>
              ) : (
                behaviorLogs.map((log) => {
                  const isAck = log.parent_acknowledged;
                  return (
                    <div
                      key={log.id}
                      className="cyber-glass-card"
                      style={{
                        ...style.timelineLogItem,
                        borderLeft: `4px solid ${behaviorCategoryColor[log.category] ?? "#cbd5e1"}`
                      }}
                    >
                      <div style={style.logHeaderRow}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                          <span
                            style={{
                              ...style.logCategoryBadge,
                              background: (behaviorCategoryColor[log.category] ?? "#cbd5e1") + "18",
                              color: behaviorCategoryColor[log.category] ?? "#94a3b8"
                            }}
                          >
                            {behaviorCategoryLabel[log.category] ?? log.category}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {formatDate(log.log_date)}
                          </span>
                        </div>

                        <span
                          style={{
                            ...style.logPointsBadge,
                            background: log.points >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: log.points >= 0 ? "#34d399" : "#f87171"
                          }}
                        >
                          {log.points >= 0 ? "+" : ""}{log.points} คะแนน
                        </span>
                      </div>

                      <strong style={{ fontSize: "13px", color: "#f1f5f9", margin: "2px 0 0" }}>
                        {log.title}
                      </strong>

                      {log.description && (
                        <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#94a3b8", whiteSpace: "pre-line" }}>
                          {log.description}
                        </p>
                      )}

                      {/* Parent Acknowledgment Status Section */}
                      <div style={style.logAcknowledgeStatus}>
                        {isAck ? (
                          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "6px 8px", borderRadius: "8px" }}>
                            <span style={{ fontWeight: 800, color: "#34d399", fontSize: "11px" }}>
                              🟢 ผู้ปกครองยืนยันรับทราบแล้ว
                            </span>
                            <span style={{ fontSize: "10.5px", color: "#94a3b8", display: "block", marginTop: "1px" }}>
                              วันที่รับทราบ: {formatDate(log.parent_acknowledged_at)}
                            </span>
                            {log.parent_comment && (
                              <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#f1f5f9", fontStyle: "italic", background: "rgba(15, 23, 42, 0.4)", padding: "4px 6px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                💬 ความเห็นผู้ปกครอง: "{log.parent_comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 800, color: "#f87171", fontSize: "11px", display: "block", marginBottom: "4px" }}>
                              🔴 รอผู้ปกครองลงชื่อรับทราบ
                            </span>
                            
                            {/* If in parent mode, show the signature action */}
                            {parentMode && (
                              <div style={style.parentPanel}>
                                <textarea
                                  style={style.textarea}
                                  placeholder="พิมพ์ข้อความตอบกลับครูสั้นๆ (ไม่บังคับ)..."
                                  rows={2}
                                  value={parentComments[log.id] || ""}
                                  onChange={(e) =>
                                    setParentComments(prev => ({
                                      ...prev,
                                      [log.id]: e.target.value
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  style={style.btnAck}
                                  disabled={submittingAck === log.id}
                                  onClick={() => handleAcknowledge(log.id)}
                                  className="btn-hover"
                                >
                                  {submittingAck === log.id ? "⏳ กำลังลงชื่อ..." : "✍️ กดปุ่มยืนยันลงชื่อรับทราบ"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            ...style.toast,
            background: toastType === "success" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
            color: "#fff",
            border: toastType === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
            backdropFilter: "blur(8px)"
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
  tabBar: {
    display: "flex",
    background: "var(--surface-container-low)",
    borderRadius: "12px",
    padding: "0.25rem",
    gap: "0.25rem",
    marginTop: "0.5rem",
    border: "1px solid rgba(195, 197, 216, 0.3)"
  },
  tabBtn: {
    flex: 1,
    border: "none",
    borderRadius: "9px",
    padding: "0.6rem",
    fontSize: "0.82rem",
    fontFamily: "Sarabun, sans-serif",
    fontWeight: 600,
    background: "transparent",
    color: "var(--on-surface-variant)",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  tabBtnActive: {
    background: "rgba(0, 66, 195, 0.08)",
    color: "var(--primary)",
    border: "1px solid rgba(0, 66, 195, 0.15)",
    boxShadow: "none"
  },
  behaviorCard: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center"
  },
  pointsRing: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    border: "4px solid rgba(0, 66, 195, 0.1)",
    borderTopColor: "var(--primary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 66, 195, 0.05)"
  },
  modeSelectorCard: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "12px",
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)"
  },
  modeToggleLabel: {
    fontSize: "12.5px",
    fontWeight: 700,
    color: "var(--on-surface-variant)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  parentPanel: {
    marginTop: "8px",
    background: "var(--surface)",
    border: "1.5px dashed var(--outline-variant)",
    borderRadius: "10px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  btnAck: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #007650, #005b3d)",
    color: "#fff",
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,118,80,0.15)"
  },
  timelineLogItem: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  logHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem"
  },
  logCategoryBadge: {
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block"
  },
  logPointsBadge: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: "6px"
  },
  logAcknowledgeStatus: {
    marginTop: "6px",
    borderTop: "1px dashed rgba(195, 197, 216, 0.3)",
    paddingTop: "6px",
    fontSize: "11.5px",
    color: "var(--on-surface-variant)",
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  header: {
    background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(195, 197, 216, 0.3)",
    padding: "1rem 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "0 0 16px 16px",
    margin: "0 -16px",
    color: "#fff"
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: "0.72rem",
    margin: 0,
    fontWeight: "bold"
  },
  headerTitle: {
    fontSize: "1.1rem",
    color: "#fff",
    margin: 0,
    fontWeight: 800,
    textShadow: "none"
  },
  signOutBtn: {
    background: "rgba(255, 255, 255, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.35rem 0.75rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s"
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "8px"
  },
  statCard: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "var(--on-surface)",
    margin: "4px 0 0"
  },
  statLabel: {
    fontSize: "11px",
    color: "var(--on-surface-variant)",
    margin: 0
  },
  section: {
    marginTop: "4px"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "var(--on-surface)",
    margin: "0 0 8px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  card: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
  },
  attendanceCard: {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(195, 197, 216, 0.3)",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 10px 25px -5px rgba(0, 66, 195, 0.03), 0 5px 10px -5px rgba(0, 66, 195, 0.01)"
  },
  badgeBlue: {
    background: "rgba(0, 66, 195, 0.08)",
    color: "var(--primary)",
    fontSize: "0.7rem",
    padding: "2px 6px",
    borderRadius: "6px",
    fontWeight: 700,
    border: "1px solid rgba(0, 66, 195, 0.15)"
  },
  emptyState: {
    background: "rgba(255, 255, 255, 0.4)",
    border: "1px dashed rgba(195, 197, 216, 0.4)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "var(--on-surface-variant)",
    fontSize: "13px"
  },
  formPanel: {
    marginTop: "10px"
  },
  textarea: {
    width: "100%",
    borderRadius: "8px",
    border: "1.5px solid var(--outline-variant)",
    background: "var(--surface)",
    color: "var(--on-surface)",
    padding: "8px",
    fontSize: "13px",
    outline: "none"
  },
  submitBtn: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0, 66, 195, 0.15)"
  },
  feedbackBox: {
    background: "rgba(0, 118, 80, 0.05)",
    border: "1px solid rgba(0, 118, 80, 0.15)",
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
  }
};;
