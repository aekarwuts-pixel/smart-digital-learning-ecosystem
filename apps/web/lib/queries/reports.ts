import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "./courses";

export type ReportStudentOutcomes = {
  studentId: string;
  studentCode: string;
  fullName: string;
  attendanceRate: number; // percentage
  submittedCount: number;
  totalAssignments: number;
  averageScorePercent: number;
  scores: Record<string, number | null>; // assignmentId -> score
};

export type ReportAssignmentSummary = {
  id: string;
  title: string;
  maxScore: number;
  averageScore: number;
  averagePercent: number;
  type: "pre" | "post" | "normal";
};

export type CourseReportData = {
  courseTitle: string;
  courseCode: string;
  classroomName: string;
  studentCount: number;
  overallAttendanceRate: number;
  assignments: ReportAssignmentSummary[];
  students: ReportStudentOutcomes[];
};

// Generate high quality demo data for reports
export function getDemoReportData(courseId: string): CourseReportData {
  const studentsList = [
    { id: "s1", code: "1001", first: "ปกรณ์", last: "สุขใจ", attendance: 89, s1: 4, s2: 15, s3: 17, s4: 8 },
    { id: "s2", code: "1002", first: "ณิชา", last: "ใจกว้าง", attendance: 83, s1: 3, s2: 12, s3: 14, s4: 7 },
    { id: "s3", code: "1003", first: "ธันวา", last: "ยอดดี", attendance: 97, s1: 5, s2: 18, s3: 19, s4: 10 },
    { id: "s4", code: "1004", first: "มนัส", last: "รุ่งเรือง", attendance: 95, s1: 4, s2: 16, s3: 16, s4: 9 },
    { id: "s5", code: "1005", first: "วิภา", last: "งามตา", attendance: 92, s1: 3, s2: 14, s3: 15, s4: 8 },
    { id: "s6", code: "1006", first: "สิริ", last: "ศรีสุข", attendance: 94, s1: 5, s2: 17, s3: 18, s4: 9 },
    { id: "s7", code: "1007", first: "อนันต์", last: "ปัญญาดี", attendance: 90, s1: 2, s2: 11, s3: 13, s4: 6 },
    { id: "s8", code: "1008", first: "เกศรา", last: "พูนสุข", attendance: 96, s1: 6, s2: 19, s3: 19, s4: 10 }
  ];

  const assignmentsList: ReportAssignmentSummary[] = [
    { id: "s1", title: "Pre-test: แนวคิดเชิงคำนวณ", maxScore: 10, averageScore: 4.0, averagePercent: 40, type: "pre" },
    { id: "s2", title: "ใบงานที่ 1: แยกแยะปัญหาเป็นส่วนๆ", maxScore: 20, averageScore: 15.2, averagePercent: 76, type: "normal" },
    { id: "s3", title: "ใบงานที่ 2: การเขียนผังงานแก้โจทย์", maxScore: 20, averageScore: 16.3, averagePercent: 81.5, type: "normal" },
    { id: "s4", title: "Post-test: แนวคิดเชิงคำนวณ", maxScore: 10, averageScore: 8.4, averagePercent: 84, type: "post" }
  ];

  const processedStudents: ReportStudentOutcomes[] = studentsList.map(s => {
    const scores: Record<string, number | null> = {
      s1: s.s1,
      s2: s.s2,
      s3: s.s3,
      s4: s.s4
    };

    let totalPointsEarned = 0;
    let totalMaxPoints = 0;
    let submittedCount = 0;

    assignmentsList.forEach(a => {
      const score = scores[a.id];
      if (score !== null) {
        totalPointsEarned += score;
        totalMaxPoints += a.maxScore;
        submittedCount++;
      }
    });

    const averageScorePercent = totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0;

    return {
      studentId: s.id,
      studentCode: s.code,
      fullName: `${s.first} ${s.last}`,
      attendanceRate: s.attendance,
      submittedCount,
      totalAssignments: assignmentsList.length,
      averageScorePercent,
      scores
    };
  });

  return {
    courseTitle: "วิทยาการคำนวณ",
    courseCode: "ว22101",
    classroomName: "ม.2/1",
    studentCount: 36,
    overallAttendanceRate: 91,
    assignments: assignmentsList,
    students: processedStudents
  };
}

export async function getCourseReportData(courseId: string): Promise<CourseReportData> {
  const demoData = getDemoReportData(courseId);
  
  if (!hasSupabaseEnv() || !courseId) {
    return demoData;
  }

  try {
    const supabase = await createClient();

    // 1. Get Course details
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, code")
      .eq("id", courseId)
      .maybeSingle<{ id: string; title: string; code: string | null }>();

    if (!course) return demoData;

    // 2. Get Classrooms for this course
    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("id, name")
      .eq("course_id", courseId);

    const classroomIds = (classrooms ?? []).map(c => c.id);
    const classroomName = classrooms?.[0]?.name ?? "ม.2/1";
    if (!classroomIds.length) return { ...demoData, courseTitle: course.title, courseCode: course.code ?? "" };

    // 3. Get students
    const { data: classStudents } = await supabase
      .from("classroom_students")
      .select("student_id")
      .in("classroom_id", classroomIds);

    const studentIds = (classStudents ?? []).map(cs => cs.student_id);
    if (!studentIds.length) return { ...demoData, courseTitle: course.title, courseCode: course.code ?? "" };

    const { data: students } = await supabase
      .from("students")
      .select("id, student_code, first_name, last_name")
      .in("id", studentIds)
      .order("student_code", { ascending: true })
      .returns<{ id: string; student_code: string; first_name: string; last_name: string }[]>();

    if (!students || !students.length) return { ...demoData, courseTitle: course.title, courseCode: course.code ?? "" };

    // 4. Get assignments
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, title, max_score")
      .eq("course_id", courseId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .returns<{ id: string; title: string; max_score: number }[]>();

    if (!assignments || !assignments.length) {
      return {
        courseTitle: course.title,
        courseCode: course.code ?? "",
        classroomName,
        studentCount: students.length,
        overallAttendanceRate: 100,
        assignments: [],
        students: students.map(s => ({
          studentId: s.id,
          studentCode: s.student_code,
          fullName: `${s.first_name} ${s.last_name}`,
          attendanceRate: 100,
          submittedCount: 0,
          totalAssignments: 0,
          averageScorePercent: 0,
          scores: {}
        }))
      };
    }

    // 5. Get submissions for all these assignments
    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, assignment_id, student_id, total_score, status")
      .in("assignment_id", assignmentIds)
      .returns<{ id: string; assignment_id: string; student_id: string; total_score: number | null; status: string }[]>();

    // Map submissions by assignmentId and studentId
    const subMap = new Map<string, number | null>(); // key: `assignmentId_studentId` -> score
    submissions?.forEach(sub => {
      if (sub.status === "reviewed" && sub.total_score !== null) {
        subMap.set(`${sub.assignment_id}_${sub.student_id}`, Number(sub.total_score));
      }
    });

    // 6. Get Attendance stats
    const { data: attendanceRecords } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .in("student_id", studentIds);

    const attendanceMap = new Map<string, { present: number; total: number }>();
    studentIds.forEach(id => attendanceMap.set(id, { present: 0, total: 0 }));

    attendanceRecords?.forEach(record => {
      const current = attendanceMap.get(record.student_id) || { present: 0, total: 0 };
      const isPresent = record.status === "present" || record.status === "late";
      attendanceMap.set(record.student_id, {
        present: current.present + (isPresent ? 1 : 0),
        total: current.total + 1
      });
    });

    // Compute overall course attendance rate
    let totalAttendanceCount = 0;
    let presentAttendanceCount = 0;

    attendanceMap.forEach(v => {
      totalAttendanceCount += v.total;
      presentAttendanceCount += v.present;
    });

    const overallAttendanceRate = totalAttendanceCount > 0
      ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100)
      : 95; // Default fallback

    // 7. Process Assignment Averages
    const reportAssignments: ReportAssignmentSummary[] = assignments.map(a => {
      let sum = 0;
      let count = 0;

      studentIds.forEach(sid => {
        const score = subMap.get(`${a.id}_${sid}`);
        if (score !== undefined && score !== null) {
          sum += score;
          count++;
        }
      });

      const averageScore = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      const averagePercent = a.max_score > 0 ? Math.round((averageScore / a.max_score) * 100) : 0;

      // Classify type
      let type: "pre" | "post" | "normal" = "normal";
      const titleLower = a.title.toLowerCase();
      if (titleLower.includes("ก่อนเรียน") || titleLower.includes("pre")) {
        type = "pre";
      } else if (titleLower.includes("หลังเรียน") || titleLower.includes("post")) {
        type = "post";
      }

      return {
        id: a.id,
        title: a.title,
        maxScore: a.max_score,
        averageScore,
        averagePercent,
        type
      };
    });

    // 8. Process Students Scores
    const reportStudents: ReportStudentOutcomes[] = students.map(s => {
      const scores: Record<string, number | null> = {};
      let totalEarned = 0;
      let totalMax = 0;
      let submittedCount = 0;

      assignments.forEach(a => {
        const score = subMap.get(`${a.id}_${s.id}`) ?? null;
        scores[a.id] = score;
        if (score !== null) {
          totalEarned += score;
          totalMax += a.max_score;
          submittedCount++;
        }
      });

      const averageScorePercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
      const att = attendanceMap.get(s.id);
      const attendanceRate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;

      return {
        studentId: s.id,
        studentCode: s.student_code,
        fullName: `${s.first_name} ${s.last_name}`,
        attendanceRate,
        submittedCount,
        totalAssignments: assignments.length,
        averageScorePercent,
        scores
      };
    });

    return {
      courseTitle: course.title,
      courseCode: course.code ?? "",
      classroomName,
      studentCount: students.length,
      overallAttendanceRate,
      assignments: reportAssignments,
      students: reportStudents
    };
  } catch (error) {
    console.error("Error generating course report data:", error);
    return demoData;
  }
}
