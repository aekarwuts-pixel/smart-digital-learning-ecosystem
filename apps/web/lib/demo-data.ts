import type { Assignment, PaEvidence, Submission, TeacherDashboard } from "@/lib/database.types";

export const demoDashboard: TeacherDashboard = {
  teacherName: "นายเอกอาวุธ สุริยะเจริญ",
  courseTitle: "วิทยาการคำนวณ",
  classroomName: "ป.4",
  studentCount: 36,
  pendingReviews: 5,
  attendanceRate: 91,
  evidenceCount: 18,
  nextLesson: {
    time: "10:20",
    title: "อัลกอริทึมและการแก้ปัญหาเบื้องต้น",
    activity: "กิจกรรมการคิดเป็นขั้นตอนด้วยโจทย์รอบตัว",
    readiness: 78
  }
};

export type AssignmentSummary = Pick<
  Assignment,
  "id" | "title" | "description" | "max_score" | "due_at" | "status"
> & {
  pendingReviewCount: number;
  studentCount: number;
  submittedCount: number;
};

export const demoAssignments: AssignmentSummary[] = [
  {
    id: "80000000-0000-0000-0000-000000000001",
    title: "ใบงาน: การคิดเป็นขั้นตอน (ป.4)",
    description: "ประเมินด้วย rubric 4 ระดับและเชื่อมหลักฐานเข้า ว PA ได้ทันที",
    max_score: 20,
    due_at: new Date().toISOString(),
    status: "published",
    submittedCount: 31,
    studentCount: 36,
    pendingReviewCount: 5
  }
];

export const demoSubmission: Submission = {
  id: "90000000-0000-0000-0000-000000000001",
  assignment_id: "80000000-0000-0000-0000-000000000001",
  student_id: "30000000-0000-0000-0000-000000000001",
  status: "submitted",
  submitted_at: new Date().toISOString(),
  content: "algorithm_steps_pakorn.pdf",
  teacher_feedback: "ทำได้ดีขึ้น ลองเพิ่มเหตุผลในแต่ละขั้นตอนให้ชัดขึ้นอีกนิด",
  total_score: null,
  reviewed_at: null,
  reviewed_by: null
};

export const demoEvidences: PaEvidence[] = [
  {
    id: "pa-1",
    teacher_id: "20000000-0000-0000-0000-000000000001",
    course_id: "40000000-0000-0000-0000-000000000001",
    assignment_id: null,
    submission_id: null,
    lesson_id: "70000000-0000-0000-0000-000000000001",
    category: "learning_design",
    title: "แผนการสอนวิทยาการคำนวณ ป.4",
    description: "หมวด: การออกแบบการเรียนรู้ | โรงเรียนเทศบาล ๑ บ้านกลาง",
    indicator_code: "ว 4.2 ป.4",
    academic_year: 2569,
    evidence_date: new Date().toISOString()
  },
  {
    id: "pa-2",
    teacher_id: "20000000-0000-0000-0000-000000000001",
    course_id: "40000000-0000-0000-0000-000000000001",
    assignment_id: "80000000-0000-0000-0000-000000000001",
    submission_id: "90000000-0000-0000-0000-000000000001",
    lesson_id: null,
    category: "student_outcome",
    title: "กราฟคะแนนก่อน-หลังเรียน รายวิชาคอมพิวเตอร์",
    description: "หมวด: ผลลัพธ์ผู้เรียน | ป.4-ป.6 ค่าเฉลี่ยเพิ่ม 21%",
    indicator_code: "ว 4.2 ป.4-ป.6",
    academic_year: 2569,
    evidence_date: new Date().toISOString()
  }
];
