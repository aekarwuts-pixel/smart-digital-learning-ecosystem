"use client";

import { useActionState } from "react";
import type { QuizActionState } from "@/app/app/quizzes/actions";
import type { Quiz } from "@/lib/database.types";

const initialState: QuizActionState = { message: "" };

type QuizFormProps = {
  action: (state: QuizActionState, formData: FormData) => Promise<QuizActionState>;
  mode: "create" | "edit";
  submitLabel: string;
  quiz?: Quiz;
  courses?: Array<{ id: string; title: string; grade_level: string }>;
};

/**
 * Client form component to add or edit quiz configurations
 */
export function QuizForm({ action, mode, submitLabel, quiz, courses }: QuizFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="course-form" action={formAction} style={{ marginTop: "1rem" }}>
      {mode === "edit" ? <input type="hidden" name="quiz_id" value={quiz?.id ?? ""} /> : null}

      {mode === "create" && courses && (
        <label>
          เลือกรายวิชา
          <select name="course_id" required defaultValue={quiz?.course_id ?? ""}>
            <option value="" disabled>-- เลือกวิชาเรียน --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.grade_level})</option>
            ))}
          </select>
        </label>
      )}

      <label>
        หัวข้อแบบทดสอบ
        <input
          name="title"
          type="text"
          defaultValue={quiz?.title ?? ""}
          placeholder="เช่น แบบทดสอบกลางภาค หน่วยที่ 1"
          required
        />
      </label>

      <label>
        คำอธิบายแบบย่อ
        <input
          name="description"
          type="text"
          defaultValue={quiz?.description ?? ""}
          placeholder="รายละเอียดเกี่ยวกับข้อสอบชุดนี้"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <label>
          จำกัดเวลาทำ (นาที)
          <input
            name="time_limit"
            type="number"
            min={0}
            defaultValue={quiz?.time_limit ?? 0}
            placeholder="0 = ไม่จำกัดเวลา"
          />
        </label>

        <label>
          คะแนนเต็ม
          <input
            name="max_score"
            type="number"
            min={1}
            defaultValue={quiz?.max_score ?? 10}
            required
          />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", cursor: "pointer" }}>
        <input
          name="is_published"
          type="checkbox"
          value="true"
          defaultChecked={quiz?.is_published ?? false}
          style={{ width: "auto", margin: 0 }}
        />
        <span style={{ fontSize: "0.85rem", color: "#374151" }}>เผยแพร่แบบทดสอบให้นักเรียนทำทันที</span>
      </label>

      <button className="wide-button" type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : submitLabel}
      </button>
      {state.message ? <p className="form-message">{state.message}</p> : null}
    </form>
  );
}
