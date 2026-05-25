import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { AdminStudentsClient } from "./students-client";
import { cookies } from "next/headers";
import { verifyAdminOverride } from "@/lib/admin-auth";

type AdminStudentItem = {
// ... (omitted types since they are exactly the same, but let's make sure target matches exactly)

  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  room: string;
  school_id: string;
  school_name?: string;
  created_at: string;
  schools?: {
    name: string;
  } | null;
};

const demoStudents: AdminStudentItem[] = [
  { id: "ds1", student_code: "S401", first_name: "สมชาย", last_name: "ใจดี", grade_level: "ป.4", room: "1", school_id: "sc1", school_name: "โรงเรียนตัวอย่างดิจิทัล", created_at: new Date().toISOString() },
  { id: "ds2", student_code: "S402", first_name: "สมหญิง", last_name: "เรียนดี", grade_level: "ป.4", room: "1", school_id: "sc1", school_name: "โรงเรียนตัวอย่างดิจิทัล", created_at: new Date().toISOString() },
  { id: "ds3", student_code: "S501", first_name: "กิตติเดช", last_name: "มั่งคั่ง", grade_level: "ป.5", room: "2", school_id: "sc1", school_name: "โรงเรียนตัวอย่างดิจิทัล", created_at: new Date().toISOString() },
  { id: "ds4", student_code: "S601", first_name: "ธนาวุฒิ", last_name: "ก้าวหน้า", grade_level: "ป.6", room: "3", school_id: "sc1", school_name: "โรงเรียนตัวอย่างดิจิทัล", created_at: new Date().toISOString() }
];

async function getAllStudents(): Promise<AdminStudentItem[]> {
  if (!hasSupabaseEnv()) {
    return demoStudents;
  }

  try {
    const adminSb = createAdminClient();
    const { data, error } = await adminSb
      .from("students")
      .select(`
        id,
        student_code,
        first_name,
        last_name,
        grade_level,
        room,
        school_id,
        created_at,
        schools (
          name
        )
      `)
      .order("student_code", { ascending: true });

    if (error) {
      console.error("Error query students:", error);
      return demoStudents;
    }

    return (data ?? []) as unknown as AdminStudentItem[];
  } catch (error) {
    console.error("Error catch query students:", error);
    return demoStudents;
  }
}

export default async function AdminStudentsPage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ role: string }>();

    const cookieStore = await cookies();
    const hasOverride = await verifyAdminOverride(cookieStore.get("admin_override")?.value);

    if (profile?.role !== "admin" && !hasOverride) redirect("/app");
  }

  const students = await getAllStudents();

  return (
    <main className="phone-shell" style={{ maxWidth: "600px" }}>
      <section className="auth-screen is-active" aria-labelledby="admin-students-title">
        <p className="eyebrow">ระบบควบคุมนักเรียน</p>
        <h1 id="admin-students-title">จัดการข้อมูลนักเรียน</h1>
        <p className="lead">
          ผู้ดูแลระบบสามารถค้นหานักเรียนรายห้อง ปรับปรุงข้อมูลส่วนตัว ลบบัญชี และทำการรีเซ็ต PIN สำหรับเข้าใช้งานระบบคลาวด์ได้
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app/admin">
            กลับแผงควบคุมหลัก
          </Link>
        </div>

        <AdminStudentsClient initialStudents={students} />
      </section>
    </main>
  );
}
