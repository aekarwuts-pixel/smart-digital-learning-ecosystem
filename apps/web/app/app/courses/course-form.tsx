"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import type { CourseListItem } from "@/lib/queries/courses";
import type { CourseActionState } from "@/app/app/courses/actions";

const initialState: CourseActionState = { message: "" };

type CourseFormProps = {
  action: (state: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  mode: "create" | "edit";
  submitLabel: string;
  course?: CourseListItem;
};

export function CourseForm({ action, mode, submitLabel, course }: CourseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const subjectOptions = useMemo(
    () => [
      "วิทยาการคำนวณ",
      "คอมพิวเตอร์",
      "เทคโนโลยี",
      "วิทยาศาสตร์และเทคโนโลยี",
      "การใช้งานดิจิทัล",
      "การเขียนโปรแกรมพื้นฐาน"
    ],
    []
  );

  const subjectDefaults = {
    "วิทยาการคำนวณ": { code: "ว14101", description: "เรียนรู้การคิดเชิงคำนวณ การเขียนโปรแกรม และการแก้ปัญหา" },
    "คอมพิวเตอร์": { code: "ค14101", description: "พื้นฐานการใช้งานคอมพิวเตอร์และสื่อดิจิทัล" },
    "เทคโนโลยี": { code: "ท14101", description: "การประยุกต์ใช้เทคโนโลยีเพื่อการเรียนรู้และการทำงาน" },
    "วิทยาศาสตร์และเทคโนโลยี": { code: "วท14101", description: "บูรณาการวิทยาศาสตร์ เทคโนโลยี และทักษะดิจิทัล" },
    "การใช้งานดิจิทัล": { code: "ด14101", description: "ทักษะการใช้เครื่องมือดิจิทัลอย่างปลอดภัยและมีประสิทธิภาพ" },
    "การเขียนโปรแกรมพื้นฐาน": { code: "ป14101", description: "ฝึกคิดและสร้างชิ้นงานด้วยการเขียนโปรแกรมเบื้องต้น" }
  } as const;

  const [subjectName, setSubjectName] = useState(course?.title ?? "วิทยาการคำนวณ");
  const [code, setCode] = useState(course?.code ?? subjectDefaults[course?.title as keyof typeof subjectDefaults]?.code ?? "");
  const [gradeLevel, setGradeLevel] = useState(course?.grade_level ?? "ป.4");
  const [room, setRoom] = useState("1");
  const [description, setDescription] = useState(
    course?.description ?? subjectDefaults[course?.title as keyof typeof subjectDefaults]?.description ?? ""
  );

  useEffect(() => {
    if (!course) return;
    setSubjectName(course.title);
    setCode(course.code ?? "");
    setGradeLevel(course.grade_level);
    setDescription(course.description ?? "");
  }, [course]);

  useEffect(() => {
    const current = subjectDefaults[subjectName as keyof typeof subjectDefaults];
    if (current) {
      setCode((value) => value || current.code);
      setDescription((value) => value || current.description);
    }
  }, [subjectName]);

  return (
    <form className="course-form" action={formAction}>
      {mode === "edit" ? <input type="hidden" name="course_id" value={course?.id ?? ""} /> : null}
      <label>
        ชื่อวิชา
        <input
          name="subject_name"
          list="subject-options"
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
          placeholder="พิมพ์เพื่อค้นหาหรือเพิ่มรายวิชา"
          required
        />
        <datalist id="subject-options">
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </label>
      <label>
        ระดับชั้น
        <select name="grade_level" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} required>
          <option value="ป.1">ป.1</option>
          <option value="ป.2">ป.2</option>
          <option value="ป.3">ป.3</option>
          <option value="ป.4">ป.4</option>
          <option value="ป.5">ป.5</option>
          <option value="ป.6">ป.6</option>
        </select>
      </label>
      <label>
        ห้องเรียน
        <select name="room" value={room} onChange={(event) => setRoom(event.target.value)} required>
          <option value="1">ห้อง 1</option>
          <option value="2">ห้อง 2</option>
          <option value="3">ห้อง 3</option>
          <option value="4">ห้อง 4</option>
        </select>
      </label>
      <label>
        ชื่อห้องเรียน
        <input name="classroom_name" type="text" value={`${gradeLevel}/${room}`} readOnly />
      </label>
      <label>
        รหัสวิชา
        <input name="code" type="text" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ระบบจะช่วยแนะนำรหัสวิชา" />
      </label>
      <label>
        ชื่อแสดงเพิ่มเติม
        <input
          name="title"
          type="text"
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
          placeholder="ชื่อที่ใช้แสดงในระบบ"
        />
      </label>
      <label>
        ภาคเรียน
        <select name="semester" defaultValue={course?.semester ?? 1} required>
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </label>
      <label>
        ปีการศึกษา
        <input
          name="academic_year"
          type="number"
          min={2500}
          max={2700}
          defaultValue={course?.academic_year ?? 2569}
          required
        />
      </label>
      <label>
        คำอธิบาย
        <input name="description" type="text" value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <button className="wide-button" type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : submitLabel}
      </button>
      {state.message ? <p className="form-message">{state.message}</p> : null}
    </form>
  );
}
