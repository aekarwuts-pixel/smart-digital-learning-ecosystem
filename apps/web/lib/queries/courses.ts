import { demoDashboard } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import type { Course } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type CourseFormInput = {
  academicYear: number;
  code: string;
  classroomName: string;
  description: string;
  gradeLevel: string;
  room: string;
  semester: number;
  subjectName: string;
  title: string;
};

export type CourseListItem = Pick<
  Course,
  "academic_year" | "code" | "description" | "grade_level" | "id" | "semester" | "title"
>;

export const demoCourses: CourseListItem[] = [
  {
    id: "demo-course-1",
    code: "ว14101",
    title: "วิทยาการคำนวณ",
    grade_level: "ป.4",
    semester: 1,
    academic_year: 2569,
    description: "รายวิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 4"
  },
  {
    id: "demo-course-2",
    code: "ค15101",
    title: "คอมพิวเตอร์",
    grade_level: "ป.5",
    semester: 1,
    academic_year: 2569,
    description: "รายวิชาคอมพิวเตอร์ ชั้นประถมศึกษาปีที่ 5"
  },
  {
    id: "demo-course-3",
    code: "ค16101",
    title: "คอมพิวเตอร์",
    grade_level: "ป.6",
    semester: 1,
    academic_year: 2569,
    description: "รายวิชาคอมพิวเตอร์ ชั้นประถมศึกษาปีที่ 6"
  }
];

type TeacherContext = {
  profileId: string;
  schoolId: string;
  teacherId: string;
};

export async function getTeacherContext() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string; role: string; school_id: string | null }>();

  if (!profile || profile.role !== "teacher" || !profile.school_id) return null;

  let { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();

  if (!teacher) {
    const { data: inserted, error } = await supabase
      .from("teachers")
      .insert({
        profile_id: profile.id,
        subject_group: "Science and Technology",
        position_name: "ครู",
        academic_rank: "ชำนาญการ"
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error || !inserted) return null;
    teacher = inserted;
  }

  const context: TeacherContext = {
    profileId: profile.id,
    schoolId: profile.school_id,
    teacherId: teacher.id
  };
  return context;
}

export async function getTeacherCourses(): Promise<CourseListItem[]> {
  if (!hasSupabaseEnv()) return demoCourses;
  const context = await getTeacherContext();
  if (!context) return demoCourses;

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, code, title, grade_level, semester, academic_year, description")
    .eq("teacher_id", context.teacherId)
    .order("academic_year", { ascending: false })
    .order("semester", { ascending: false })
    .returns<CourseListItem[]>();

  return data?.length ? data : demoCourses;
}

export function getDefaultCourseValues(): CourseFormInput {
  return {
    academicYear: 2569,
    code: "",
    classroomName: "ป.4/1",
    description: "",
    gradeLevel: demoDashboard.classroomName,
    room: "1",
    semester: 1,
    subjectName: "วิทยาการคำนวณ",
    title: demoDashboard.courseTitle
  };
}
