"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type CourseActionState = { message: string };

const successState: CourseActionState = { message: "บันทึกข้อมูลเรียบร้อย" };

export async function createCourse(
  _previousState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "โหมด demo: ต้องเชื่อม Supabase ก่อนจึงจะบันทึกจริงได้" };
  }

  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ" };

  const payload = {
    school_id: context.schoolId,
    teacher_id: context.teacherId,
    code: String(formData.get("code") ?? ""),
    title: String(formData.get("subject_name") ?? formData.get("title") ?? ""),
    grade_level: String(formData.get("grade_level") ?? ""),
    semester: Number(formData.get("semester") ?? 1),
    academic_year: Number(formData.get("academic_year") ?? 2569),
    description: String(formData.get("description") ?? "")
  };

  const supabase = await createClient();
  const { data: insertedCourse, error } = await supabase
    .from("courses")
    .insert(payload)
    .select("id, grade_level")
    .maybeSingle<{ grade_level: string; id: string }>();
  if (error) return { message: error.message };

  if (insertedCourse) {
    const classroomName = String(formData.get("classroom_name") ?? `${insertedCourse.grade_level}/1`);
    const room = String(formData.get("room") ?? "1");
    await supabase.from("classrooms").insert({
      course_id: insertedCourse.id,
      name: classroomName,
      grade_level: insertedCourse.grade_level,
      room
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/courses");
  return successState;
}

export async function updateCourse(
  _previousState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "โหมด demo: ยังไม่บันทึกข้อมูลจริง" };
  }

  const context = await getTeacherContext();
  if (!context) return { message: "ไม่พบบัญชีครูในระบบ" };

  const courseId = String(formData.get("course_id") ?? "");
  if (!courseId) return { message: "ไม่พบ course_id สำหรับแก้ไข" };

  const payload = {
    code: String(formData.get("code") ?? ""),
    title: String(formData.get("subject_name") ?? formData.get("title") ?? ""),
    grade_level: String(formData.get("grade_level") ?? ""),
    semester: Number(formData.get("semester") ?? 1),
    academic_year: Number(formData.get("academic_year") ?? 2569),
    description: String(formData.get("description") ?? "")
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", courseId)
    .eq("teacher_id", context.teacherId);

  if (error) return { message: error.message };

  const classroomName = String(formData.get("classroom_name") ?? `${payload.grade_level}/1`);
  const room = String(formData.get("room") ?? "1");
  const { data: existingClassroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("course_id", courseId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingClassroom) {
    await supabase
      .from("classrooms")
      .update({
        name: classroomName,
        grade_level: payload.grade_level,
        room
      })
      .eq("id", existingClassroom.id);
  } else {
    await supabase.from("classrooms").insert({
      course_id: courseId,
      name: classroomName,
      grade_level: payload.grade_level,
      room
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/courses");
  return successState;
}

export async function deleteCourse(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const context = await getTeacherContext();
  if (!context) return;

  const courseId = String(formData.get("course_id") ?? "");
  if (!courseId) return;

  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", courseId).eq("teacher_id", context.teacherId);
  revalidatePath("/app");
  revalidatePath("/app/courses");
}
