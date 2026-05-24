import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type ClassroomListItem = {
  course_title: string;
  grade_level: string;
  id: string;
  name: string;
  room: string;
};

export const demoClassrooms: ClassroomListItem[] = [
  {
    id: "demo-classroom-1",
    name: "ป.4/1",
    grade_level: "ป.4",
    room: "1",
    course_title: "วิทยาการคำนวณ"
  },
  {
    id: "demo-classroom-2",
    name: "ป.5/1",
    grade_level: "ป.5",
    room: "1",
    course_title: "คอมพิวเตอร์"
  },
  {
    id: "demo-classroom-3",
    name: "ป.6/1",
    grade_level: "ป.6",
    room: "1",
    course_title: "คอมพิวเตอร์"
  }
];

export async function getTeacherClassrooms(): Promise<ClassroomListItem[]> {
  if (!hasSupabaseEnv()) return demoClassrooms;
  const context = await getTeacherContext();
  if (!context) return demoClassrooms;

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", context.teacherId)
    .returns<{ id: string; title: string }[]>();

  const courseById = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const ids = [...courseById.keys()];
  if (!ids.length) return demoClassrooms;

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name, grade_level, room, course_id")
    .in("course_id", ids)
    .order("grade_level", { ascending: true })
    .returns<{ course_id: string; grade_level: string; id: string; name: string; room: string }[]>();

  if (!classrooms?.length) return demoClassrooms;

  return classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    grade_level: c.grade_level,
    room: c.room,
    course_title: courseById.get(c.course_id) ?? "-"
  }));
}
