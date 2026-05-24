"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type StudentManageState = {
  message: string;
};

const defaultState: StudentManageState = { message: "" };

export async function upsertStudentProfile(
  _prev: StudentManageState,
  formData: FormData
): Promise<StudentManageState> {
  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ" };

  const classroomId = String(formData.get("classroom_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const studentCode = String(formData.get("student_code") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const gradeLevel = String(formData.get("grade_level") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();

  if (!classroomId || !studentCode || !firstName || !lastName || !gradeLevel || !room) {
    return { message: "กรุณากรอกข้อมูลนักเรียนให้ครบ" };
  }

  const supabase = await createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("course_id")
    .eq("id", classroomId)
    .maybeSingle<{ course_id: string }>();
  if (!classroom) return { message: "ไม่พบห้องเรียน" };

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id, school_id")
    .eq("id", classroom.course_id)
    .maybeSingle<{ school_id: string; teacher_id: string }>();
  if (!course || course.teacher_id !== context.teacherId) {
    return { message: "ไม่มีสิทธิ์จัดการนักเรียนห้องนี้" };
  }

  let resolvedStudentId = studentId;
  if (!resolvedStudentId) {
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", course.school_id)
      .eq("student_code", studentCode)
      .maybeSingle<{ id: string }>();
    resolvedStudentId = existing?.id ?? "";
  }

  if (resolvedStudentId) {
    const { error } = await supabase
      .from("students")
      .update({
        student_code: studentCode,
        first_name: firstName,
        last_name: lastName,
        grade_level: gradeLevel,
        room
      })
      .eq("id", resolvedStudentId)
      .eq("school_id", course.school_id);
    if (error) return { message: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("students")
      .insert({
        school_id: course.school_id,
        student_code: studentCode,
        first_name: firstName,
        last_name: lastName,
        grade_level: gradeLevel,
        room
      })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error || !inserted) return { message: error?.message ?? "เพิ่มนักเรียนไม่สำเร็จ" };
    resolvedStudentId = inserted.id;
  }

  const { error: linkError } = await supabase
    .from("classroom_students")
    .upsert(
      {
        classroom_id: classroomId,
        student_id: resolvedStudentId
      },
      { onConflict: "classroom_id,student_id" }
    );
  if (linkError) return { message: linkError.message };

  revalidatePath("/app");
  revalidatePath("/app/students");
  revalidatePath("/app/import-export");
  return { message: "บันทึกข้อมูลนักเรียนเรียบร้อย" };
}

export async function moveStudentClassroom(
  _prev: StudentManageState,
  formData: FormData
): Promise<StudentManageState> {
  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ" };

  const studentId = String(formData.get("student_id") ?? "");
  const fromClassroomId = String(formData.get("from_classroom_id") ?? "");
  const toClassroomId = String(formData.get("to_classroom_id") ?? "");
  if (!studentId || !fromClassroomId || !toClassroomId) return { message: "ข้อมูลไม่ครบสำหรับย้ายห้อง" };

  const supabase = await createClient();
  const { data: toClassroom } = await supabase
    .from("classrooms")
    .select("id, course_id")
    .eq("id", toClassroomId)
    .maybeSingle<{ course_id: string; id: string }>();
  if (!toClassroom) return { message: "ไม่พบห้องปลายทาง" };

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id")
    .eq("id", toClassroom.course_id)
    .maybeSingle<{ teacher_id: string }>();
  if (!course || course.teacher_id !== context.teacherId) {
    return { message: "ไม่มีสิทธิ์ย้ายนักเรียนเข้าห้องนี้" };
  }

  await supabase
    .from("classroom_students")
    .delete()
    .eq("classroom_id", fromClassroomId)
    .eq("student_id", studentId);

  const { error } = await supabase
    .from("classroom_students")
    .upsert(
      {
        classroom_id: toClassroomId,
        student_id: studentId
      },
      { onConflict: "classroom_id,student_id" }
    );
  if (error) return { message: error.message };

  revalidatePath("/app");
  revalidatePath("/app/students");
  revalidatePath("/app/import-export");
  return { message: "ย้ายนักเรียนเรียบร้อย" };
}

export async function unlinkStudentFromClassroom(
  _prev: StudentManageState,
  formData: FormData
): Promise<StudentManageState> {
  return removeStudentFromClassroom(_prev, formData);
}

export async function removeStudentFromClassroom(
  _prev: StudentManageState,
  formData: FormData
): Promise<StudentManageState> {
  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ" };

  const studentId = String(formData.get("student_id") ?? "");
  const classroomId = String(formData.get("classroom_id") ?? "");
  if (!studentId || !classroomId) return { message: "ข้อมูลไม่ครบสำหรับลบนักเรียนออกจากห้อง" };

  const supabase = await createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("course_id")
    .eq("id", classroomId)
    .maybeSingle<{ course_id: string }>();
  if (!classroom) return { message: "ไม่พบห้องเรียน" };

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id")
    .eq("id", classroom.course_id)
    .maybeSingle<{ teacher_id: string }>();
  if (!course || course.teacher_id !== context.teacherId) {
    return { message: "ไม่มีสิทธิ์จัดการห้องเรียนนี้" };
  }

  const { error } = await supabase
    .from("classroom_students")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", studentId);
  if (error) return { message: error.message };

  revalidatePath("/app");
  revalidatePath("/app/students");
  revalidatePath("/app/import-export");
  return { message: "นำออกจากห้องเรียนเรียบร้อย" };
}

export { defaultState };
