"use client";

import { useState, useEffect, startTransition } from "react";
import { submitQuizAttempt } from "./actions";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/lib/database.types";
import Link from "next/link";

type Props = {
  quiz: Quiz;
  questions: QuizQuestion[];
  attempt: QuizAttempt | null;
  studentName: string;
};

/**
 * Interactive test taking component for students
 */
export function TakeQuizClient({ quiz, questions, attempt, studentName }: Props) {
  const [localAttempt, setLocalAttempt] = useState<QuizAttempt | null>(attempt);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.time_limit && !localAttempt ? quiz.time_limit * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft === null || localAttempt) return;

    if (timeLeft <= 0) {
      // Time is up! Trigger auto-submit
      handleAutoSubmit();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, localAttempt]);

  function handleSelect(questionId: string, choiceIdx: number) {
    if (submitting || localAttempt) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choiceIdx
    }));
  }

  async function handleAutoSubmit() {
    setErrorMsg("⏰ หมดเวลาทำข้อสอบแล้ว! ระบบกำลังส่งคำตอบอัตโนมัติ...");
    await performSubmit();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || localAttempt) return;

    // Validate that all questions are answered
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0) {
      setErrorMsg(`⚠️ กรุณาตอบคำถามให้ครบทุกข้อ (ยังไม่ได้ทำอีก ${unansweredCount} ข้อ)`);
      return;
    }

    setErrorMsg("");
    await performSubmit();
  }

  async function performSubmit() {
    setSubmitting(true);
    const answersPayload = questions.map(q => ({
      question_id: q.id,
      selected_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    }));

    try {
      const res = await submitQuizAttempt(quiz.id, answersPayload);
      if (res.success && res.score !== undefined) {
        setLocalAttempt({
          id: "new-attempt",
          quiz_id: quiz.id,
          student_id: "student",
          score: res.score,
          submitted_at: new Date().toISOString(),
          answers: answersPayload
        });
      } else {
        setErrorMsg(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setErrorMsg(`❌ เกิดข้อผิดพลาดในการส่งคำตอบ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Format timer string MM:SS
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Render Result Screen
  if (localAttempt) {
    const percent = quiz.max_score > 0 ? Math.round((localAttempt.score / quiz.max_score) * 100) : 0;
    const isPassed = percent >= 50;

    return (
      <div style={{ animation: "fadeUp 0.3s ease both", textAlign: "center", padding: "1rem 0" }}>
        <h1 id="take-quiz-title" style={{ fontSize: "1.25rem", color: "#1e293b", fontWeight: 800 }}>
          {quiz.title}
        </h1>
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.25rem 0 1.5rem" }}>
          ผู้เข้าสอบ: {studentName}
        </p>

        {/* Score Ring / Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "2rem 1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            maxWidth: "340px",
            margin: "0 auto 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
            {isPassed ? "🎉" : "💪"}
          </span>
          
          <h2 style={{ fontSize: "1.1rem", color: isPassed ? "#15803d" : "#b45309", margin: 0, fontWeight: 700 }}>
            {isPassed ? "ทำแบบทดสอบเรียบร้อย!" : "พยายามอีกนิดนะ!"}
          </h2>

          <div style={{ margin: "1.5rem 0" }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, color: isPassed ? "#16a34a" : "#dc2626", lineHeight: 1 }}>
              {localAttempt.score}
            </span>
            <span style={{ fontSize: "1.25rem", color: "#94a3b8", fontWeight: 700 }}>
              {" "}/ {quiz.max_score}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
            คิดเป็น {percent}% ของคะแนนเต็ม
          </p>

          <span
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              background: isPassed ? "#dcfce7" : "#fee2e2",
              color: isPassed ? "#15803d" : "#b91c1c",
              border: `1px solid ${isPassed ? "#bbf7d0" : "#fca5a5"}`
            }}
          >
            {isPassed ? "ผ่านเกณฑ์การประเมิน" : "ยังไม่ผ่านเกณฑ์"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/app"
            style={{
              padding: "0.85rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "0.88rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "block",
              boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
            }}
          >
            กลับหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Render Test-Taking Screen
  return (
    <form onSubmit={handleSubmit} style={{ animation: "fadeUp 0.3s ease both" }}>
      
      {/* Sticky Header with Timer */}
      <div
        style={{
          position: "sticky",
          top: "0.5rem",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "0.85rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem"
        }}
      >
        <div>
          <h1 id="take-quiz-title" style={{ fontSize: "0.92rem", color: "#1e293b", fontWeight: 800, margin: 0 }}>
            {quiz.title}
          </h1>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", color: "#64748b" }}>
            ข้อคำถามทั้งหมด: {questions.length} ข้อ
          </p>
        </div>

        {timeLeft !== null && (
          <div
            style={{
              background: timeLeft <= 60 ? "#fee2e2" : "#f1f5f9",
              border: `1px solid ${timeLeft <= 60 ? "#fca5a5" : "#cbd5e1"}`,
              padding: "0.35rem 0.65rem",
              borderRadius: "8px",
              textAlign: "center"
            }}
          >
            <span style={{ fontSize: "0.6rem", display: "block", color: timeLeft <= 60 ? "#dc2626" : "#64748b", fontWeight: 700 }}>
              เวลาที่เหลือ
            </span>
            <strong
              style={{
                fontSize: "0.95rem",
                color: timeLeft <= 60 ? "#ef4444" : "#0f172a",
                fontFamily: "monospace"
              }}
            >
              {formatTime(timeLeft)}
            </strong>
          </div>
        )}
      </div>

      {/* Quiz Description */}
      {quiz.description && (
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 1.25rem", padding: "0 0.5rem" }}>
          ℹ️ {quiz.description}
        </p>
      )}

      {/* Questions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}
          >
            <span style={{ background: "#e0e7ff", color: "#3730a3", fontWeight: 700, fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", marginBottom: "0.75rem", display: "inline-block" }}>
              ข้อที่ {idx + 1} ({q.points} คะแนน)
            </span>
            
            <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.5 }}>
              {q.question_text}
            </p>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {q.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[q.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelect(q.id, optIdx)}
                    disabled={submitting}
                    style={{
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      border: `1.5px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`,
                      borderRadius: "10px",
                      padding: "0.75rem",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                      width: "100%",
                      fontFamily: "'Sarabun', sans-serif"
                    }}
                  >
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        border: `1.5px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`,
                        background: isSelected ? "#3b82f6" : "#fff",
                        color: isSelected ? "#fff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: isSelected ? "#1e40af" : "#334155", fontWeight: isSelected ? 600 : 500 }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div style={{
          padding: "0.75rem",
          borderRadius: "10px",
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          color: "#b91c1c",
          fontSize: "0.78rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          {errorMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link
          href="/app"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "0.85rem",
            background: "#94a3b8",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "0.88rem",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 2,
            padding: "0.85rem",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79,70,229,0.3)"
          }}
        >
          {submitting ? "กำลังส่งคำตอบ..." : "ส่งคำตอบสอบ"}
        </button>
      </div>
    </form>
  );
}
