"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveQuizQuestions } from "../../actions";
import type { QuizQuestion } from "@/lib/database.types";
import Link from "next/link";

type Props = {
  quizId: string;
  initialQuestions: QuizQuestion[];
  maxScore: number;
};

/**
 * Client component to manage the list of questions dynamically
 */
export function QuestionsClient({ quizId, initialQuestions, maxScore }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>(
    initialQuestions.length > 0
      ? initialQuestions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options.length === 4 ? q.options : [...q.options, "", "", "", ""].slice(0, 4),
          correct_option_index: q.correct_option_index,
          points: Number(q.points)
        }))
      : [
          {
            id: "new-1",
            question_text: "",
            options: ["", "", "", ""],
            correct_option_index: 0,
            points: 1
          }
        ]
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
  const pointsMatch = totalPoints === maxScore;

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        id: `new-${Date.now()}`,
        question_text: "",
        options: ["", "", "", ""],
        correct_option_index: 0,
        points: 1
      }
    ]);
  }

  function deleteQuestion(id: string) {
    setQuestions(questions.filter(q => q.id !== id));
  }

  function handleQuestionChange(id: string, field: string, value: any) {
    setQuestions(
      questions.map(q => {
        if (q.id !== id) return q;
        return { ...q, [field]: value };
      })
    );
  }

  function handleOptionChange(id: string, optionIdx: number, value: string) {
    setQuestions(
      questions.map(q => {
        if (q.id !== id) return q;
        const newOpts = [...q.options];
        newOpts[optionIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  }

  async function handleSave() {
    // Validation
    if (questions.length === 0) {
      setMessage("⚠️ ต้องมีคำถามอย่างน้อย 1 ข้อ");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setMessage(`⚠️ กรุณากรอกโจทย์คำถามในข้อที่ ${i + 1}`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setMessage(`⚠️ กรุณากรอกตัวเลือกที่ ${j + 1} ในข้อที่ ${i + 1}`);
          return;
        }
      }
      if (q.points <= 0) {
        setMessage(`⚠️ คะแนนของข้อที่ ${i + 1} ต้องมากกว่า 0`);
        return;
      }
    }

    setSaving(false);
    setMessage("");

    try {
      setSaving(true);
      const formatted = questions.map((q, idx) => ({
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        points: Number(q.points),
        sort_order: idx + 1
      }));

      const res = await saveQuizQuestions(quizId, formatted);
      if (res.success) {
        setMessage("✅ บันทึกคำถามทั้งหมดเรียบร้อยแล้ว!");
        router.push(`/app/quizzes/${quizId}` as any);
        router.refresh();
      } else {
        setMessage(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
      
      {/* Target Points Indicator */}
      <div
        style={{
          background: pointsMatch ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${pointsMatch ? "#bbf7d0" : "#fef3c7"}`,
          borderRadius: "12px",
          padding: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.82rem"
        }}
      >
        <div>
          <span style={{ color: "#475569" }}>คะแนนรวมคำถามปัจจุบัน: </span>
          <strong style={{ color: pointsMatch ? "#16a34a" : "#d97706", fontSize: "1rem" }}>
            {totalPoints} / {maxScore}
          </strong>
        </div>
        {!pointsMatch && (
          <span style={{ color: "#b45309", fontSize: "0.72rem" }}>
            ⚠️ คะแนนไม่ตรงกับเกณฑ์วิชา ({maxScore} คะแนน)
          </span>
        )}
      </div>

      {/* Questions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {questions.map((q, index) => (
          <div
            key={q.id}
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              position: "relative"
            }}
          >
            {/* Header / Number */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "9999px" }}>
                ข้อที่ {index + 1}
              </span>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🗑️ ลบคำถามนี้
              </button>
            </div>

            {/* Question Text */}
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>โจทย์คำถาม</span>
              <textarea
                value={q.question_text}
                onChange={e => handleQuestionChange(q.id, "question_text", e.target.value)}
                placeholder="เช่น ข้อใดจัดอยู่ในกลุ่ม Decomposition?"
                rows={2}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                  fontFamily: "'Sarabun', sans-serif"
                }}
              />
            </label>

            {/* Options */}
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
              ตัวเลือกคำตอบ และทำเครื่องหมายเฉลยข้อที่ถูกต้อง (Correct Option)
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {q.options.map((opt: string, optIdx: number) => (
                <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    name={`correct-option-${q.id}`}
                    checked={q.correct_option_index === optIdx}
                    onChange={() => handleQuestionChange(q.id, "correct_option_index", optIdx)}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => handleOptionChange(q.id, optIdx, e.target.value)}
                    placeholder={`กรอกตัวเลือก ${String.fromCharCode(65 + optIdx)}`}
                    required
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.6rem",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontFamily: "'Sarabun', sans-serif"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Points */}
            <label style={{ display: "block", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>คะแนนของข้อนี้</span>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={q.points}
                onChange={e => handleQuestionChange(q.id, "points", Number(e.target.value))}
                required
                style={{
                  width: "100px",
                  padding: "0.4rem 0.6rem",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  marginTop: "0.25rem",
                  display: "block"
                }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* Add New Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        style={{
          width: "100%",
          padding: "0.75rem",
          background: "#fff",
          border: "2px dashed #4f46e5",
          borderRadius: "12px",
          color: "#4f46e5",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
          transition: "background 0.2s"
        }}
      >
        ➕ เพิ่มคำถามใหม่
      </button>

      {/* Feedback Message */}
      {message && (
        <div style={{
          padding: "0.75rem",
          borderRadius: "8px",
          fontSize: "0.82rem",
          background: message.startsWith("✅") ? "#f0fdf4" : "#fee2e2",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fca5a5"}`,
          color: message.startsWith("✅") ? "#15803d" : "#b91c1c"
        }}>
          {message}
        </div>
      )}

      {/* Save / Cancel buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
        <Link
          href={`/app/quizzes/${quizId}` as any}
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
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
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
          {saving ? "กำลังบันทึก..." : "💾 บันทึกคำถามทั้งหมด"}
        </button>
      </div>
    </div>
  );
}
