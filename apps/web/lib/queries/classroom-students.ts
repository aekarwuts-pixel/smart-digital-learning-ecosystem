import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoClassrooms } from "@/lib/queries/classrooms";
import { getTeacherContext } from "@/lib/queries/courses";

export type ClassroomOption = {
  course_title: string;
  id: string;
  name: string;
};

export type ClassroomStudentItem = {
  classroom_id: string;
  classroom_name: string;
  first_name: string;
  grade_level: string;
  id: string;
  last_name: string;
  room: string;
  student_code: string;
};

export async function getTeacherClassroomOptions(): Promise<ClassroomOption[]> {
  if (!hasSupabaseEnv()) {
    return demoClassrooms.map((c) => ({ id: c.id, name: c.name, course_title: c.course_title }));
  }

  const context = await getTeacherContext();
  if (!context) return [];
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", context.teacherId)
    .returns<{ id: string; title: string }[]>();
  if (!courses?.length) return [];

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name, course_id")
    .in("course_id", [...courseMap.keys()])
    .order("name", { ascending: true })
    .returns<{ course_id: string; id: string; name: string }[]>();

  return (classrooms ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    course_title: courseMap.get(c.course_id) ?? "-"
  }));
}

export async function getClassroomStudents(classroomId: string): Promise<ClassroomStudentItem[]> {
  if (!hasSupabaseEnv()) return [];
  const context = await getTeacherContext();
  if (!context || !classroomId) return [];
  const supabase = await createClient();

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, course_id")
    .eq("id", classroomId)
    .maybeSingle<{ course_id: string; id: string; name: string }>();
  if (!classroom) return [];

  const { data: course } = await supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", classroom.course_id)
    .maybeSingle<{ id: string; teacher_id: string }>();
  if (!course || course.teacher_id !== context.teacherId) return [];

  const { data: links } = await supabase
    .from("classroom_students")
    .select("student_id")
    .eq("classroom_id", classroom.id)
    .returns<{ student_id: string }[]>();
  const ids = (links ?? []).map((x) => x.student_id);
  if (!ids.length) return [];

  const { data: students } = await supabase
    .from("students")
    .select("id, student_code, first_name, last_name, grade_level, room")
    .in("id", ids)
    .order("student_code", { ascending: true })
    .returns<
      {
        first_name: string;
        grade_level: string;
        id: string;
        last_name: string;
        room: string;
        student_code: string;
      }[]
    >();

  return (students ?? []).map((s) => ({
    id: s.id,
    student_code: s.student_code,
    first_name: s.first_name,
    last_name: s.last_name,
    grade_level: s.grade_level,
    room: s.room,
    classroom_id: classroom.id,
    classroom_name: classroom.name
  }));
}
