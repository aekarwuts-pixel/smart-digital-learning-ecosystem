import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getMergedSchoolConfig } from "@/lib/school-config";
import { AdminSchoolClient } from "./school-client";
import { cookies } from "next/headers";
import { verifyAdminOverride } from "@/lib/admin-auth";

export default async function AdminSchoolPage() {
  // Guard: must be logged in as admin
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

  const config = await getMergedSchoolConfig();

  return (
    <main className="phone-shell" style={{ maxWidth: "600px" }}>
      <section className="auth-screen is-active" aria-labelledby="admin-school-title">
        <p className="eyebrow">ระบบตั้งค่าโรงเรียน</p>
        <h1 id="admin-school-title">ข้อมูลโรงเรียน & ปีการศึกษา</h1>
        <p className="lead">
          ผู้ดูแลระบบสามารถปรับปรุงข้อมูลพื้นฐานของโรงเรียน และกำหนดเทอม/ปีการศึกษาทำงานหลักของระบบสำหรับจัดเก็บข้อมูลครูและนักเรียน
        </p>

        <div className="landing-actions">
          <Link className="landing-secondary" href="/app/admin">
            กลับแผงควบคุมหลัก
          </Link>
        </div>

        <AdminSchoolClient initialConfig={config} />
      </section>
    </main>
  );
}
