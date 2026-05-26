import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/supabase/student-session";
import { getStudentDashboard, type StudentDashboardData } from "@/lib/queries/student";
import { signOut } from "@/app/login/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { StudentClient } from "@/app/app/student/student-client";
import { getStudentQuizzes } from "@/lib/queries/quizzes";

const demoStudent = {
  id: "demo",
  student_code: "S001",
  first_name: "ปกรณ์",
  last_name: "ใจดี",
  grade_level: "ม.2",
  room: "1",
  school_id: ""
};

const demoCourses = [
  {
    course_id: "c1",
    course_title: "วิทยาการคำนวณ",
    course_code: "ว22103",
    classroom_name: "ม.2/1",
    teacher_name: "นางสาวสุนิสา เทคโนโลยี"
  }
];

const demoAssignments = [
  {
    assignment_id: "a1",
    title: "ใบงาน: แยกปัญหาเป็นขั้นตอน",
    due_at: new Date(Date.now() + 86400000).toISOString(),
    max_score: 20,
    course_title: "วิทยาการคำนวณ",
    submission_status: "reviewed" as const,
    total_score: 16,
    teacher_feedback: "ทำตามเกณฑ์ได้ครบถ้วน ชัดเจนดีมาก"
  },
  {
    assignment_id: "a2",
    title: "ใบงาน: ผังงาน Flowchart",
    due_at: new Date(Date.now() + 3600000 * 30).toISOString(),
    max_score: 20,
    course_title: "วิทยาการคำนวณ",
    submission_status: null,
    total_score: null,
    teacher_feedback: null
  }
];

const demoAttendance = [
  {
    session_date: new Date().toISOString().split("T")[0],
    status: "present" as const,
    course_title: "วิทยาการคำนวณ",
    period_label: "คาบที่ 1"
  },
  {
    session_date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    status: "late" as const,
    course_title: "วิทยาการคำนวณ",
    period_label: "คาบที่ 1"
  }
];

const demoDashboard: StudentDashboardData = {
  courses: demoCourses,
  recentAssignments: demoAssignments,
  recentAttendance: demoAttendance,
  behaviorLogs: [
    {
      id: "demo-b1",
      student_id: "demo",
      student_name: "ปกรณ์ ใจดี",
      teacher_id: "demo-teacher",
      category: "positive",
      title: "มีจิตสาธารณะช่วยครูจัดห้องเรียนคอมพิวเตอร์",
      description: "ช่วยทำความสะอาดและจัดระเบียบสายไฟเครื่องคอมพิวเตอร์ในห้องปฏิบัติการ 1",
      points: 10,
      log_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      is_exported_to_pa: true,
      pa_evidence_id: "demo-pa1",
      parent_acknowledged: true,
      parent_acknowledged_at: new Date(Date.now() - 86400000).toISOString(),
      parent_comment: "ภูมิใจในตัวลูกครับ",
      created_at: new Date().toISOString()
    },
    {
      id: "demo-b2",
      student_id: "demo",
      student_name: "ปกรณ์ ใจดี",
      teacher_id: "demo-teacher",
      category: "home_visit",
      title: "บันทึกการเยี่ยมบ้านนักเรียนภาคเรียนที่ 1",
      description: "ผู้ปกครองให้การต้อนรับอย่างดี ได้พูดคุยแนวทางดูแลเรื่องการทำงานค้างร่วมกัน",
      points: 0,
      log_date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
      is_exported_to_pa: true,
      pa_evidence_id: "demo-pa2",
      parent_acknowledged: false,
      parent_acknowledged_at: null,
      parent_comment: null,
      created_at: new Date().toISOString()
    }
  ],
  stats: {
    totalCourses: 1,
    pendingAssignments: 1,
    averageScore: 80,
    attendanceRate: 92,
    behaviorPoints: 10
  }
};

export default async function StudentDashboardPage() {
  const isDemo = !hasSupabaseEnv();

  let student = demoStudent;
  let dashData: StudentDashboardData = demoDashboard;

  if (!isDemo) {
    const sessionStudent = await getStudentSession();
    if (!sessionStudent) redirect("/login");
    student = sessionStudent;
    dashData = await getStudentDashboard(student.id);
  }

  const quizzes = await getStudentQuizzes(student.id);

  async function handleSignOut() {
    "use server";
    await signOut();
  }

  return (
    <main className="phone-shell cyber-shell">
      <StudentClient
        student={student}
        dashData={dashData}
        quizzes={quizzes}
        isDemo={isDemo}
        signOutAction={handleSignOut}
      />
    </main>
  );
}
