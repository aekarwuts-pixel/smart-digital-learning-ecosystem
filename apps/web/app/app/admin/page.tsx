import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { signOut } from "@/app/login/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { verifyAdminOverride } from "@/lib/admin-auth";


// ─── Types ────────────────────────────────────────────────────────────────────

type PendingProfile = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  created_at: string;
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPendingProfiles(): Promise<PendingProfile[]> {
  const adminSb = createAdminClient();
  const { data } = await adminSb
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as PendingProfile[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  // Guard: must be logged in as admin
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const cookieStore = await cookies();
    const hasOverride = await verifyAdminOverride(cookieStore.get("admin_override")?.value);

    if (profile?.role !== "admin" && !hasOverride) redirect("/app");
  }

  const pending = await getPendingProfiles();

  return (
    <main style={pageStyles.root}>
      {/* Header */}
      <header style={pageStyles.header}>
        <div>
          <p style={pageStyles.headerSub}>M Learning Ecosystem</p>
          <h1 style={pageStyles.headerTitle}>⚙️ แผงผู้ดูแลระบบ</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a href="/app" style={pageStyles.navBtn}>📊 Dashboard ครู</a>
          <form action={signOut}>
            <button type="submit" style={pageStyles.signOutBtn}>ออกจากระบบ</button>
          </form>
        </div>
      </header>

      {/* Stats row */}
      <div style={pageStyles.statsRow}>
        <StatCard icon="⏳" label="รออนุมัติ" value={pending.length} color="#f59e0b" />
        <StatCard icon="🏫" label="ระบบพร้อมใช้งาน" value="✓" color="#10b981" />
        <StatCard icon="🔐" label="โหมดความปลอดภัย" value="สูง" color="#6366f1" />
      </div>

      {/* Pending approvals */}
      <section style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>
          🔔 คำขอลงทะเบียนรออนุมัติ ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div style={pageStyles.emptyState}>
            ✅ ไม่มีคำขอรออนุมัติในขณะนี้
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pending.map(p => (
              <PendingCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>🛠️ เมนูจัดการ</h2>
        <div style={pageStyles.menuGrid}>
          {[
            { icon: "👥", label: "จัดการผู้ใช้", desc: "เพิ่ม แก้ไข ลบบัญชีผู้ใช้", href: "/app/admin/users" },
            { icon: "🎒", label: "จัดการนักเรียน", desc: "ดู แก้ไข reset PIN", href: "/app/admin/students" },
            { icon: "🏫", label: "ข้อมูลโรงเรียน", desc: "ชื่อโรงเรียน ปีการศึกษา", href: "/app/admin/school" },
            { icon: "📊", label: "รายงานระบบ", desc: "สถิติการใช้งาน", href: "/app/admin/reports" },
          ].map(item => (
            <a key={item.href} href={item.href} style={pageStyles.menuCard}>
              <span style={{ fontSize: "1.75rem" }}>{item.icon}</span>
              <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>{item.label}</strong>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{item.desc}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div style={{ ...pageStyles.statCard, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <p style={{ fontSize: "1.4rem", fontWeight: 700, color, margin: "0.25rem 0 0" }}>{value}</p>
      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{label}</p>
    </div>
  );
}

function PendingCard({ profile }: { profile: PendingProfile }) {
  const roleLabel: Record<string, string> = {
    teacher: "ครู", admin: "ผู้ดูแล", leader: "ผู้บริหาร"
  };
  const date = new Date(profile.created_at).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <div style={pageStyles.pendingCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1 }}>
        <div style={pageStyles.avatar}>
          {profile.full_name.charAt(0)}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>
            {profile.full_name}
          </p>
          <p style={{ margin: "0.15rem 0 0", color: "#64748b", fontSize: "0.78rem" }}>
            {profile.email ?? "ไม่มีอีเมล"} · {roleLabel[profile.role] ?? profile.role} · สมัคร {date}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <ApproveButton profileId={profile.id} action="approved" />
        <ApproveButton profileId={profile.id} action="rejected" />
      </div>
    </div>
  );
}

function ApproveButton({ profileId, action }: { profileId: string; action: "approved" | "rejected" }) {
  const isApprove = action === "approved";
  return (
    <form action={async () => {
      "use server";
      const adminSb = createAdminClient();
      await adminSb.from("profiles").update({ approval_status: action }).eq("id", profileId);
      redirect("/app/admin");
    }}>
      <button
        type="submit"
        style={{
          padding: "0.4rem 0.9rem",
          border: "none",
          borderRadius: "8px",
          fontSize: "0.78rem",
          fontWeight: 600,
          cursor: "pointer",
          background: isApprove ? "#dcfce7" : "#fee2e2",
          color: isApprove ? "#15803d" : "#dc2626",
        }}
      >
        {isApprove ? "✓ อนุมัติ" : "✗ ปฏิเสธ"}
      </button>
    </form>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "#f8fafc",
    fontFamily: "'Sarabun', sans-serif",
    paddingBottom: "2rem",
  },
  header: {
    background: "linear-gradient(135deg, #1e293b, #334155)",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  headerSub: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    margin: 0,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#f1f5f9",
    fontSize: "1.15rem",
    margin: "0.1rem 0 0",
    fontWeight: 700,
  },
  navBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#e2e8f0",
    borderRadius: "8px",
    padding: "0.4rem 0.85rem",
    textDecoration: "none",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  signOutBtn: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    borderRadius: "8px",
    padding: "0.4rem 0.85rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontFamily: "'Sarabun', sans-serif",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    padding: "1.25rem 1.5rem 0",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  section: {
    margin: "1.25rem 1.5rem 0",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 0.85rem",
  },
  emptyState: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "1.25rem",
    textAlign: "center",
    color: "#15803d",
    fontSize: "0.9rem",
  },
  pendingCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.85rem 1rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    flexShrink: 0,
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
  },
  menuCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    textDecoration: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "box-shadow 0.2s",
  },
};
