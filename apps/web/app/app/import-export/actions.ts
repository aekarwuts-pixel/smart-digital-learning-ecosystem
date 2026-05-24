"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

type ImportStudentRow = {
  first_name: string;
  grade_level: string;
  last_name: string;
  room: string;
  student_code: string;
};

export type ImportPreviewState = {
  classroomId: string;
  errors: string[];
  parsedRows: ImportStudentRow[];
};

export type ImportCommitState = {
  message: string;
  successRows: number;
};

const allowedGrades = new Set(["ป.4", "ป.5", "ป.6"]);

function parseCsv(content: string) {
  const lines = content.replace(/\r/g, "").split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { errors: ["ไฟล์ไม่มีข้อมูลนักเรียน"], rows: [] as ImportStudentRow[] };

  const header = lines[0].split(",").map((v) => v.trim().toLowerCase());
  const required = ["student_code", "first_name", "last_name", "grade_level", "room"];
  const missing = required.filter((key) => !header.includes(key));
  if (missing.length) {
    return { errors: [`หัวคอลัมน์ไม่ครบ: ${missing.join(", ")}`], rows: [] as ImportStudentRow[] };
  }

  const index = Object.fromEntries(required.map((key) => [key, header.indexOf(key)])) as Record<string, number>;
  const errors: string[] = [];
  const rows: ImportStudentRow[] = [];
  const codeSet = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((v) => v.trim());
    const row: ImportStudentRow = {
      student_code: cols[index.student_code] ?? "",
      first_name: cols[index.first_name] ?? "",
      last_name: cols[index.last_name] ?? "",
      grade_level: cols[index.grade_level] ?? "",
      room: cols[index.room] ?? ""
    };

    const rowNo = i + 1;
    if (!row.student_code || !row.first_name || !row.last_name || !row.grade_level || !row.room) {
      errors.push(`แถว ${rowNo}: ข้อมูลไม่ครบ`);
      continue;
    }
    if (!allowedGrades.has(row.grade_level)) {
      errors.push(`แถว ${rowNo}: grade_level ต้องเป็น ป.4, ป.5 หรือ ป.6`);
      continue;
    }
    if (codeSet.has(row.student_code)) {
      errors.push(`แถว ${rowNo}: student_code ซ้ำในไฟล์`);
      continue;
    }
    codeSet.add(row.student_code);
    rows.push(row);
  }

  return { errors, rows };
}

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");
}

export async function downloadStudentTemplateCsv() {
  const content = toCsv([
    ["student_code", "first_name", "last_name", "grade_level", "room"],
    ["S401", "สมชาย", "ใจดี", "ป.4", "1"],
    ["S402", "สมหญิง", "เรียนดี", "ป.4", "1"]
  ]);
  return content;
}

export async function previewStudentImport(formData: FormData): Promise<ImportPreviewState> {
  const file = formData.get("csv_file");
  const classroomId = String(formData.get("classroom_id") ?? "");
  if (!(file instanceof File)) {
    return { classroomId, errors: ["ไม่พบไฟล์ CSV"], parsedRows: [] };
  }

  const content = await file.text();
  const { errors, rows } = parseCsv(content);
  return { classroomId, errors, parsedRows: rows };
}

export async function commitStudentImport(formData: FormData): Promise<ImportCommitState> {
  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ", successRows: 0 };

  const classroomId = String(formData.get("classroom_id") ?? "");
  const payloadJson = String(formData.get("payload_json") ?? "[]");
  if (!classroomId) return { message: "กรุณาเลือกห้องเรียน", successRows: 0 };

  let rows: ImportStudentRow[] = [];
  try {
    rows = JSON.parse(payloadJson) as ImportStudentRow[];
  } catch {
    return { message: "ข้อมูล payload ไม่ถูกต้อง", successRows: 0 };
  }
  if (!rows.length) return { message: "ไม่มีข้อมูลสำหรับบันทึก", successRows: 0 };

  const supabase = await createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, grade_level, room, course_id")
    .eq("id", classroomId)
    .maybeSingle<{ course_id: string; grade_level: string; id: string; room: string }>();
  if (!classroom) return { message: "ไม่พบห้องเรียนที่เลือก", successRows: 0 };

  const { data: course } = await supabase
    .from("courses")
    .select("id, school_id, teacher_id")
    .eq("id", classroom.course_id)
    .maybeSingle<{ id: string; school_id: string; teacher_id: string }>();
  if (!course || course.teacher_id !== context.teacherId) {
    return { message: "ไม่มีสิทธิ์แก้ไขห้องเรียนนี้", successRows: 0 };
  }

  let successRows = 0;
  const rowErrors: string[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.grade_level !== classroom.grade_level || row.room !== classroom.room) {
      rowErrors.push(`แถว ${i + 2}: ชั้นหรือห้องไม่ตรงกับห้องเรียนที่เลือก`);
      continue;
    }

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", course.school_id)
      .eq("student_code", row.student_code)
      .maybeSingle<{ id: string }>();

    let studentId = existingStudent?.id ?? "";
    if (!studentId) {
      const { data: inserted, error } = await supabase
        .from("students")
        .insert({
          school_id: course.school_id,
          student_code: row.student_code,
          first_name: row.first_name,
          last_name: row.last_name,
          grade_level: row.grade_level,
          room: row.room
        })
        .select("id")
        .maybeSingle<{ id: string }>();
      if (error || !inserted) {
        rowErrors.push(`แถว ${i + 2}: เพิ่มนักเรียนไม่สำเร็จ`);
        continue;
      }
      studentId = inserted.id;
    } else {
      await supabase
        .from("students")
        .update({
          first_name: row.first_name,
          last_name: row.last_name,
          grade_level: row.grade_level,
          room: row.room
        })
        .eq("id", studentId);
    }

    await supabase
      .from("classroom_students")
      .upsert(
        {
          classroom_id: classroomId,
          student_id: studentId
        },
        { onConflict: "classroom_id,student_id" }
      );

    successRows += 1;
  }

  revalidatePath("/app");
  revalidatePath("/app/courses");
  revalidatePath("/app/import-export");

  if (rowErrors.length) {
    return {
      message: `นำเข้าสำเร็จ ${successRows} รายการ | มีข้อผิดพลาด ${rowErrors.length} รายการ`,
      successRows
    };
  }
  return { message: `นำเข้าสำเร็จ ${successRows} รายการ`, successRows };
}

export async function exportClassroomStudentsCsv(formData: FormData) {
  const context = await getTeacherContext();
  if (!context) return { content: "", fileName: "students.csv", message: "ไม่พบบัญชีครูในระบบ" };

  const classroomId = String(formData.get("classroom_id") ?? "");
  if (!classroomId) return { content: "", fileName: "students.csv", message: "กรุณาเลือกห้องเรียน" };

  const supabase = await createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, room, grade_level, course_id")
    .eq("id", classroomId)
    .maybeSingle<{ course_id: string; grade_level: string; id: string; name: string; room: string }>();

  if (!classroom) return { content: "", fileName: "students.csv", message: "ไม่พบห้องเรียน" };

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id, title")
    .eq("id", classroom.course_id)
    .maybeSingle<{ teacher_id: string; title: string }>();

  if (!course || course.teacher_id !== context.teacherId) {
    return { content: "", fileName: "students.csv", message: "ไม่มีสิทธิ์ส่งออกห้องเรียนนี้" };
  }

  const { data: links } = await supabase
    .from("classroom_students")
    .select("student_id")
    .eq("classroom_id", classroomId)
    .returns<{ student_id: string }[]>();

  const ids = (links ?? []).map((x) => x.student_id);
  if (!ids.length) {
    return { content: "", fileName: "students.csv", message: "ห้องเรียนนี้ยังไม่มีรายชื่อนักเรียน" };
  }

  const { data: students } = await supabase
    .from("students")
    .select("student_code, first_name, last_name, grade_level, room")
    .in("id", ids)
    .order("student_code", { ascending: true })
    .returns<{ first_name: string; grade_level: string; last_name: string; room: string; student_code: string }[]>();

  const rows = [
    ["student_code", "first_name", "last_name", "grade_level", "room"],
    ...(students ?? []).map((s) => [s.student_code, s.first_name, s.last_name, s.grade_level, s.room])
  ];
  const content = toCsv(rows);
  const fileName = `students_${classroom.name.replace(/\s+/g, "_")}.csv`;
  return { content, fileName, message: `ส่งออกสำเร็จ ${students?.length ?? 0} รายการ` };
}
