import Link from "next/link";
import { getTeacherClassroomOptions, getClassroomStudents } from "@/lib/queries/classroom-students";
import { fetchBehaviorLogs } from "./actions";
import { BehaviorClient } from "./behavior-client";

type PageProps = {
  searchParams: Promise<{ classroomId?: string }>;
};

export default async function BehaviorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // 1. Get teacher classrooms
  const classroomOptions = await getTeacherClassroomOptions();
  const classroomId = params.classroomId ?? classroomOptions[0]?.id ?? "";
  
  // 2. Fetch classroom students
  const students = classroomId ? await getClassroomStudents(classroomId) : [];
  
  // 3. Fetch behavior logs for all students in this classroom
  const studentIds = students.map((s) => s.id);
  const logs = await fetchBehaviorLogs(studentIds);

  return (
    <main className="phone-shell" style={{ maxWidth: "768px" }}>
      <section className="auth-screen is-active" aria-labelledby="behavior-title" style={{ padding: "1.25rem" }}>
        <p className="eyebrow">ระบบดูแลช่วยเหลือผู้เรียน</p>
        <h1 id="behavior-title" style={{ fontSize: "1.5rem", margin: "4px 0 2px" }}>🏫 บันทึกพฤติกรรม & เยี่ยมบ้าน</h1>
        <p className="lead" style={{ fontSize: "12.5px", margin: "0 0 12px" }}>
          บันทึกสารสนเทศเยี่ยมบ้าน ให้คำปรึกษา แนะนำพฤติกรรมเชิงบวก/แก้ไข และเชื่อมตรงหลักฐานเข้า วPA 2.2
        </p>

        <div className="landing-actions" style={{ marginBottom: "12px" }}>
          <Link className="landing-secondary" href="/app" style={{ padding: "6px 12px", fontSize: "12.5px" }}>
            กลับหน้า Dashboard ครู
          </Link>
        </div>

        {/* Classroom selector form */}
        <form className="course-form" method="get" style={{ padding: "10px", marginBottom: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", display: "flex", flexDirection: "column", gap: "6px" }}>
            กรุณาเลือกห้องเรียนที่ดูแล:
            <select 
              name="classroomId" 
              defaultValue={classroomId}
              style={{ minHeight: "38px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            >
              {classroomOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} | {c.course_title}
                </option>
              ))}
            </select>
          </label>
          <button 
            className="landing-secondary" 
            type="submit"
            style={{ width: "100%", minHeight: "36px", fontSize: "12.5px", fontWeight: "bold", marginTop: "8px" }}
          >
            🔄 โหลดข้อมูลห้องเรียนนี้
          </button>
        </form>

        {/* Behavior logs client container */}
        {classroomId ? (
          <BehaviorClient 
            students={students} 
            classroomId={classroomId} 
            initialLogs={logs} 
          />
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "13px" }}>
            ❌ คุณยังไม่มีห้องเรียนที่สอนในระบบ หรือยังไม่มีรายชื่อห้องเรียน กรุณาเพิ่มห้องเรียนก่อนหน้า
          </div>
        )}
      </section>
    </main>
  );
}
