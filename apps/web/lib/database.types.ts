export type UserRole = "teacher" | "student" | "parent" | "admin" | "leader";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AttendanceStatus = "present" | "late" | "leave" | "absent";

export type AssignmentStatus = "draft" | "published" | "closed";

export type SubmissionStatus = "not_submitted" | "submitted" | "reviewed" | "returned";

export type EvidenceCategory =
  | "learning_design"
  | "learning_activity"
  | "student_outcome"
  | "student_support"
  | "professional_development";

export type Profile = {
  id: string;
  auth_user_id: string | null;
  school_id: string | null;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
};

export type Teacher = {
  id: string;
  profile_id: string;
  teacher_code: string | null;
  subject_group: string;
  position_name: string | null;
  academic_rank: string | null;
};

export type Course = {
  id: string;
  school_id: string;
  teacher_id: string;
  code: string | null;
  title: string;
  grade_level: string;
  semester: number;
  academic_year: number;
  description: string | null;
};

export type Assignment = {
  id: string;
  course_id: string;
  unit_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  max_score: number;
  due_at: string | null;
  status: AssignmentStatus;
  created_by: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  content: string | null;
  teacher_feedback: string | null;
  total_score: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type PaEvidence = {
  id: string;
  teacher_id: string;
  course_id: string | null;
  assignment_id: string | null;
  submission_id: string | null;
  lesson_id: string | null;
  category: EvidenceCategory;
  title: string;
  description: string | null;
  indicator_code: string | null;
  academic_year: number;
  evidence_date: string;
};

export type TeacherDashboard = {
  teacherName: string;
  courseTitle: string;
  classroomName: string;
  studentCount: number;
  pendingReviews: number;
  attendanceRate: number;
  evidenceCount: number;
  nextLesson: {
    time: string;
    title: string;
    activity: string;
    readiness: number;
  };
};
