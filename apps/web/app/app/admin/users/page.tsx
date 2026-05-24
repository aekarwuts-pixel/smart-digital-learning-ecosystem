import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { AdminUsersClient } from "@/app/app/admin/users/users-client";

type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
  role: "teacher" | "admin" | "leader" | "student" | "parent";
  is_active: boolean;
  approval_status: "approved" | "rejected" | "pending";
  created_at: string;
};

// Fallback demo users when Supabase is not connected
const demoProfiles: UserProfile[] = [
  { id: "dp1", full_name: "ครู อติรุจ คอมพิวเตอร์", email: "teacher@school.ac.th", role: "teacher", is_active: true, approval_status: "approved", created_at: new Date().toISOString() },
  { id: "dp2", full_name: "ผอ. ยินดี รักการสอน", email: "director@school.ac.th", role: "leader", is_active: true, approval_status: "approved", created_at: new Date().toISOString() },
  { id: "dp3", full_name: "ผู้ดูแลระบบ (Aekarwut)", email: "aekarwuts@gmail.com", role: "admin", is_active: true, approval_status: "approved", created_at: new Date().toISOString() }
];

async function getAllProfiles(): Promise<UserProfile[]> {
  if (!hasSupabaseEnv()) {
    return demoProfiles;
  }

  try {
    const adminSb = createAdminClient();
    const { data } = await adminSb
      .from("profiles")
      .select("id, full_name, email, role, is_active, approval_status, created_at")
      .order("full_name", { ascending: true })
      .returns<UserProfile[]>();

    return data ?? [];
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return demoProfiles;
  }
}

export default async function AdminUsersPage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ role: string }>();

    if (profile?.role !== "admin") redirect("/app");
  }

  const profiles = await getAllProfiles();

  return (
    <main className="phone-shell" style={{ maxWidth: "600px" }}>
      <section className="auth-screen is-active" aria-labelledby="admin-users-title">
        <p className="eyebrow">ระบบควบคุมสิทธิ์</p>
        <h1 id="admin-users-title">จัดการบัญชีผู้ใช้งาน</h1>
        <p className="lead">
          ผู้ดูแลระบบสามารถปรับบทบาท อนุมัติการเข้าใช้งาน ระงับการใช้งาน หรือลบบัญชีครูและผู้บริหารออกจากระบบคลาวด์ได้
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app/admin">
            กลับแผงควบคุมหลัก
          </Link>
        </div>

        <AdminUsersClient initialProfiles={profiles} />
      </section>
    </main>
  );
}
