import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { approveUser, rejectUser } from "./actions";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if current user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return (
      <main className="phone-shell">
        <section className="view is-active">
          <h2>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <Link href="/app" className="wide-button">กลับหน้าแรก</Link>
        </section>
      </main>
    );
  }

  // Fetch pending profiles
  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main className="phone-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ระบบผู้ดูแล (Admin)</p>
          <h1>รายการขออนุมัติผู้ใช้งาน</h1>
        </div>
      </header>

      <section className="view is-active">
        <div className="section-heading">
          <h2>บุคลากรที่รอการอนุมัติ</h2>
        </div>

        {!pendingUsers || pendingUsers.length === 0 ? (
          <div className="notice-box">ไม่มีผู้ใช้งานที่รอการอนุมัติ</div>
        ) : (
          <div className="follow-list">
            {pendingUsers.map((pUser) => (
              <article key={pUser.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong>{pUser.full_name} ({pUser.role})</strong>
                  <p>{pUser.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <form action={approveUser} style={{ flex: 1 }}>
                    <input type="hidden" name="profile_id" value={pUser.id} />
                    <button type="submit" className="wide-button" style={{ background: '#10b981' }}>
                      อนุมัติ
                    </button>
                  </form>
                  <form action={rejectUser} style={{ flex: 1 }}>
                    <input type="hidden" name="profile_id" value={pUser.id} />
                    <button type="submit" className="wide-button" style={{ background: '#ef4444' }}>
                      ปฏิเสธ
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Link href="/app" className="landing-secondary">กลับหน้า Dashboard หลัก</Link>
        </div>
      </section>
    </main>
  );
}
