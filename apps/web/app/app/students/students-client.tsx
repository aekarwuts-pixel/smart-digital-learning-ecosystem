"use client";

import { useActionState, useMemo, useState } from "react";
import type { ClassroomOption, ClassroomStudentItem } from "@/lib/queries/classroom-students";
import {
  defaultState,
  moveStudentClassroom,
  removeStudentFromClassroom,
  upsertStudentProfile
} from "@/app/app/students/actions";

type StudentsClientProps = {
  classroomId: string;
  classroomOptions: ClassroomOption[];
  students: ClassroomStudentItem[];
};

type StudentDraft = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  room: string;
  classroom_id: string;
};

function StudentRow({
  classroomId,
  classroomOptions,
  student,
  onEdit
}: {
  classroomId: string;
  classroomOptions: ClassroomOption[];
  student: ClassroomStudentItem;
  onEdit: (draft: StudentDraft) => void;
}) {
  const [moveState, moveAction, movePending] = useActionState(moveStudentClassroom, defaultState);
  const [removeState, removeAction, removePending] = useActionState(removeStudentFromClassroom, defaultState);

  return (
    <article className="course-item">
      <div className="course-item-header">
        <strong>
          {student.first_name} {student.last_name}
        </strong>
        <span>{student.student_code}</span>
      </div>
      <p>
        ชั้น {student.grade_level} ห้อง {student.room}
      </p>

      <div className="landing-actions">
        <button
          className="landing-secondary"
          type="button"
          onClick={() =>
            onEdit({
              id: student.id,
              student_code: student.student_code,
              first_name: student.first_name,
              last_name: student.last_name,
              grade_level: student.grade_level,
              room: student.room,
              classroom_id: classroomId
            })
          }
        >
          แก้ไข
        </button>
      </div>

      <form className="course-form" action={moveAction}>
        <input type="hidden" name="student_id" value={student.id} />
        <input type="hidden" name="from_classroom_id" value={classroomId} />
        <label>
          ย้ายไปห้องเรียน
          <select name="to_classroom_id" defaultValue={classroomId}>
            {classroomOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} | {c.course_title}
              </option>
            ))}
          </select>
        </label>
        <button className="wide-button" type="submit" disabled={movePending}>
          {movePending ? "กำลังย้าย..." : "ย้ายห้อง"}
        </button>
        {moveState.message ? <p className="form-message">{moveState.message}</p> : null}
      </form>

      <form action={removeAction}>
        <input type="hidden" name="student_id" value={student.id} />
        <input type="hidden" name="classroom_id" value={classroomId} />
        <button className="danger-button" type="submit" disabled={removePending}>
          {removePending ? "กำลังลบ..." : "นำออกจากห้อง"}
        </button>
        {removeState.message ? <p className="form-message">{removeState.message}</p> : null}
      </form>
    </article>
  );
}

export function StudentsClient({ classroomId, classroomOptions, students }: StudentsClientProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentDraft | null>(null);
  const [saveState, saveAction, savePending] = useActionState(upsertStudentProfile, defaultState);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const full = `${s.first_name} ${s.last_name}`.toLowerCase();
      return full.includes(q) || s.student_code.toLowerCase().includes(q);
    });
  }, [query, students]);

  return (
    <div className="import-export-grid">
      <article className="course-item">
        <div className="course-item-header">
          <h3>{selected ? "แก้ไขนักเรียนรายคน" : "เพิ่มนักเรียนรายคน"}</h3>
          <span>{selected ? selected.student_code : "ใหม่"}</span>
        </div>
        <form action={saveAction} className="course-form">
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="student_id" value={selected?.id ?? ""} />
          <label>
            รหัสนักเรียน
            <input
              name="student_code"
              defaultValue={selected?.student_code ?? ""}
              placeholder="ใช้รหัสนักเรียนเป็นตัวหลัก"
              required
            />
          </label>
          <label>
            ชื่อ
            <input name="first_name" defaultValue={selected?.first_name ?? ""} required />
          </label>
          <label>
            นามสกุล
            <input name="last_name" defaultValue={selected?.last_name ?? ""} required />
          </label>
          <label>
            ระดับชั้น
            <select name="grade_level" defaultValue={selected?.grade_level ?? "ป.4"} required>
              <option value="ป.1">ป.1</option>
              <option value="ป.2">ป.2</option>
              <option value="ป.3">ป.3</option>
              <option value="ป.4">ป.4</option>
              <option value="ป.5">ป.5</option>
              <option value="ป.6">ป.6</option>
            </select>
          </label>
          <label>
            ห้อง
            <select name="room" defaultValue={selected?.room ?? "1"} required>
              <option value="1">ห้อง 1</option>
              <option value="2">ห้อง 2</option>
              <option value="3">ห้อง 3</option>
              <option value="4">ห้อง 4</option>
            </select>
          </label>
          <button className="wide-button" type="submit" disabled={savePending}>
            {savePending ? "กำลังบันทึก..." : selected ? "บันทึกการแก้ไข" : "เพิ่มนักเรียน"}
          </button>
          <button className="landing-secondary" type="button" onClick={() => setSelected(null)}>
            ล้างฟอร์ม
          </button>
          {saveState.message ? <p className="form-message">{saveState.message}</p> : null}
        </form>
      </article>

      <label>
        ค้นหานักเรียนในห้อง
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="พิมพ์ชื่อหรือรหัสนักเรียน"
        />
      </label>

      <p className="lead">พบ {filtered.length} รายการ</p>

      <div className="course-list">
        {filtered.map((student) => (
          <StudentRow
            key={student.id}
            classroomId={classroomId}
            classroomOptions={classroomOptions}
            student={student}
            onEdit={setSelected}
          />
        ))}
      </div>
    </div>
  );
}
