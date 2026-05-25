"use client";

import { useState } from "react";
import { signOut } from "@/app/login/actions";
import type { AssignmentSummary } from "@/lib/demo-data";
import type { PaEvidence, TeacherDashboard } from "@/lib/database.types";

type ViewName = "home" | "class" | "work" | "pa";

type Props = {
  assignments: AssignmentSummary[];
  dashboard: TeacherDashboard;
  evidences: PaEvidence[];
  isDemoMode: boolean;
};

export function DashboardPrototype({ assignments, dashboard, evidences, isDemoMode }: Props) {
  const [view, setView] = useState<ViewName>("home");
  const [toast, setToast] = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  const navItems: Array<{ id: ViewName; emoji: string; label: string }> = [
    { id: "home",  emoji: "🏠", label: "หน้าแรก" },
    { id: "class", emoji: "📚", label: "ห้องเรียน" },
    { id: "work",  emoji: "📝", label: "งาน" },
    { id: "pa",    emoji: "📄", label: "ว PA" },
  ];

  return (
    <main style={s.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.15) !important; }
        .quick-btn:hover { filter: brightness(1.08); transform: translateY(-2px); }
        .nav-btn:hover { background: rgba(99,102,241,0.08) !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={s.header}>
        <div>
          <p style={s.headerSub}>โรงเรียนเทศบาล ๑ บ้านกลาง · ภาคเรียน 1/2569</p>
          <h1 style={s.headerTitle}>M Learning Ecosystem</h1>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <button style={s.notifBtn} type="button" onClick={() => notify("มีงานรอตรวจ และ วPA ใหม่")} aria-label="แจ้งเตือน">
            🔔<span style={s.badge}>3</span>
          </button>
          <a href="/app/admin" style={s.adminBtn} title="ผู้ดูแลระบบ">⚙️</a>
          <form action={signOut}>
            <button type="submit" style={s.signOutBtn} title="ออกจากระบบ">↩</button>
          </form>
        </div>
      </header>

      {/* ── Profile strip ── */}
      <div style={s.profileCard}>
        <div style={s.avatar}>{dashboard.teacherName?.charAt(0) ?? "ค"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin:0, fontWeight:700, color:"#1e293b", fontSize:"0.92rem" }}>{dashboard.teacherName}</p>
          <p style={{ margin:"0.1rem 0 0", color:"#64748b", fontSize:"0.75rem" }}>
            {dashboard.courseTitle} · {dashboard.classroomName}
          </p>
        </div>
        {isDemoMode && <span style={s.demoBadge}>Demo</span>}
      </div>

      {/* ── Views ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 1rem 1rem" }}>
        {view === "home"  && <HomeView  dashboard={dashboard} notify={notify} />}
        {view === "class" && <ClassView dashboard={dashboard} />}
        {view === "work"  && <WorkView  assignments={assignments} notify={notify} />}
        {view === "pa"    && <PaView    evidences={evidences} notify={notify} />}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={s.bottomNav} aria-label="เมนูหลัก">
        {navItems.map(item => (
          <button
            key={item.id}
            type="button"
            className="nav-btn"
            style={{ ...s.navBtn, ...(view === item.id ? s.navBtnActive : {}) }}
            onClick={() => setView(item.id)}
            aria-pressed={view === item.id}
          >
            <span style={{ fontSize:"1.3rem" }}>{item.emoji}</span>
            <span style={{ fontSize:"0.68rem", fontWeight: view === item.id ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Toast ── */}
      {toast && (
        <div style={s.toast} role="status" aria-live="polite">{toast}</div>
      )}
    </main>
  );
}

/* ─── Home Tab ────────────────────────────────────────────────────────── */
function HomeView({ dashboard, notify }: { dashboard: TeacherDashboard; notify: (m: string) => void }) {
  const stats = [
    { emoji:"👥", label:"นักเรียน",    value: dashboard.studentCount,   color:"#6366f1" },
    { emoji:"📝", label:"งานรอตรวจ",   value: dashboard.pendingReviews, color:"#f59e0b" },
    { emoji:"✅", label:"เข้าเรียน",   value: `${dashboard.attendanceRate}%`, color:"#10b981" },
    { emoji:"📄", label:"หลักฐาน วPA", value: dashboard.evidenceCount,  color:"#8b5cf6" },
  ];
  const quickActions = [
    { emoji:"📋", label:"เช็คชื่อเข้าเรียน",    color:"linear-gradient(135deg,#6366f1,#8b5cf6)", href:"/app/attendance" },
    { emoji:"➕", label:"สั่งงาน & ตรวจงาน",    color:"linear-gradient(135deg,#f59e0b,#f97316)", href:"/app/assignments" },
    { emoji:"📝", label:"แบบทดสอบออนไลน์",  color:"linear-gradient(135deg,#8b5cf6,#ec4899)", href:"/app/quizzes" },
    { emoji:"👥", label:"ดูแลช่วยเหลือ",   color:"linear-gradient(135deg,#06b6d4,#0891b2)", href:"/app/students/behavior" },
    { emoji:"📄", label:"รายงาน วPA",  color:"linear-gradient(135deg,#10b981,#059669)", href:"/app/pa" },
    { emoji:"🏫", label:"ข้อมูลรายวิชา",    color:"linear-gradient(135deg,#3b82f6,#06b6d4)", href:"/app/courses" },
  ];

  return (
    <section style={{ animation:"fadeUp 0.3s ease both" }}>
      <SectionHeader title="ภาพรวมวันนี้" action="ดูรายงาน" onAction={() => window.location.href = "/app/reports"} />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"1rem" }}>
        {stats.map(s => (
          <div key={s.label} className="dash-card" style={card}>
            <div style={{ ...iconCircle, background: s.color + "18" }}>
              <span style={{ fontSize:"1.1rem" }}>{s.emoji}</span>
            </div>
            <p style={{ margin:"0.4rem 0 0", fontSize:"1.5rem", fontWeight:800, color: s.color }}>{s.value}</p>
            <p style={{ margin:0, fontSize:"0.72rem", color:"#64748b" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <SectionHeader title="เมนูลัด" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"1rem" }}>
        {quickActions.map(a => (
          <a key={a.label} href={a.href} className="quick-btn" style={{ ...quickCard, background: a.color }}>
            <span style={{ fontSize:"1.4rem" }}>{a.emoji}</span>
            <span style={{ fontSize:"0.73rem", fontWeight:700, color:"#fff", marginTop:"0.25rem" }}>{a.label}</span>
          </a>
        ))}
      </div>


      {/* To-do */}
      <SectionHeader title="งานค้าง" />
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        <TodoItem color="#f59e0b" emoji="⚠️" title={`ตรวจงานค้าง ${dashboard.pendingReviews} รายการ`} sub="เข้าเมนูงานเพื่อตรวจให้ครบวันนี้" />
        <TodoItem color="#ef4444" emoji="🔴" title="อัปเดตหลักฐาน วPA" sub="บันทึกกิจกรรมการสอนรอบล่าสุด" />
      </div>
    </section>
  );
}

/* ─── Class Tab ───────────────────────────────────────────────────────── */
function ClassView({ dashboard }: { dashboard: TeacherDashboard }) {
  const units = [
    { emoji:"💻", label:"เทคโนโลยีและการคำนวณ", color:"#6366f1", progress: 65 },
    { emoji:"📊", label:"การวิเคราะห์และจัดการข้อมูล", color:"#10b981", progress: 40 },
    { emoji:"🛡️", label:"ความปลอดภัยทางดิจิทัล", color:"#8b5cf6", progress: 20 },
  ];

  return (
    <section style={{ animation:"fadeUp 0.3s ease both" }}>
      {/* Hero */}
      <div style={{ ...heroCard, marginBottom:"1rem" }}>
        <p style={{ margin:"0 0 0.25rem", fontSize:"0.72rem", color:"rgba(255,255,255,0.75)", letterSpacing:"0.05em", textTransform:"uppercase" }}>รายวิชาที่รับผิดชอบ</p>
        <h2 style={{ margin:"0 0 0.25rem", fontSize:"1.05rem", color:"#fff", fontWeight:800 }}>{dashboard.courseTitle}</h2>
        <p style={{ margin:0, fontSize:"0.8rem", color:"rgba(255,255,255,0.8)" }}>{dashboard.classroomName} · {dashboard.studentCount} คน</p>
      </div>

      <SectionHeader title="หน่วยการเรียนรู้" />
      <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
        {units.map(u => (
          <div key={u.label} className="dash-card" style={{ ...card, flexDirection:"row", gap:"0.75rem", padding:"0.85rem" }}>
            <div style={{ ...iconCircle, background: u.color + "18", flexShrink:0 }}>
              <span style={{ fontSize:"1.1rem" }}>{u.emoji}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:"0 0 0.4rem", fontWeight:600, fontSize:"0.82rem", color:"#1e293b" }}>{u.label}</p>
              <div style={{ height:"6px", borderRadius:"9999px", background:"#e2e8f0", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${u.progress}%`, background: u.color, borderRadius:"9999px", transition:"width 0.6s ease" }} />
              </div>
              <p style={{ margin:"0.25rem 0 0", fontSize:"0.7rem", color:"#94a3b8" }}>{u.progress}% ดำเนินการแล้ว</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Work Tab ────────────────────────────────────────────────────────── */
function WorkView({ assignments, notify }: { assignments: AssignmentSummary[]; notify: (m: string) => void }) {
  const main = assignments[0];
  return (
    <section style={{ animation:"fadeUp 0.3s ease both" }}>
      <SectionHeader title="งานและการประเมิน" action="+ สร้างงาน" onAction={() => window.location.href = "/app/assignments"} />

      {main ? (
        <div style={{ ...card, marginBottom:"0.75rem", borderLeft:"3px solid #ef4444" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
            <span style={{ background:"#fee2e2", color:"#dc2626", fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.6rem", borderRadius:"9999px" }}>🔴 ต้องตรวจวันนี้</span>
            <span style={{ fontSize:"0.75rem", color:"#64748b" }}>ส่งแล้ว {main.submittedCount}/{main.studentCount}</span>
          </div>
          <p style={{ margin:"0 0 0.25rem", fontWeight:700, color:"#1e293b" }}>{main.title}</p>
          <p style={{ margin:"0 0 0.75rem", fontSize:"0.78rem", color:"#64748b" }}>{main.description}</p>
          <button
            style={{ ...gradBtn, background:"linear-gradient(135deg,#ef4444,#f97316)", width:"100%", justifyContent:"center" }}
            type="button"
            onClick={() => window.location.href = `/app/assignments?assignmentId=${main.id}`}
          >
            ตรวจงาน {main.pendingReviewCount} รายการ →
          </button>
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"2rem", color:"#94a3b8", fontSize:"0.85rem" }}>✅ ไม่มีงานค้างตรวจ</div>
      )}

      {assignments.slice(1, 4).map(item => (
        <div
          key={item.id}
          className="dash-card"
          style={{ ...card, flexDirection:"row", gap:"0.75rem", marginBottom:"0.5rem", cursor:"pointer" }}
          onClick={() => window.location.href = `/app/assignments?assignmentId=${item.id}`}
        >
          <span style={{ fontSize:"1.2rem" }}>📝</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:600, fontSize:"0.82rem", color:"#1e293b" }}>{item.title}</p>
            <p style={{ margin:"0.1rem 0 0", fontSize:"0.72rem", color:"#94a3b8" }}>ส่งแล้ว {item.submittedCount}/{item.studentCount} · รอตรวจ {item.pendingReviewCount}</p>
          </div>
          <span style={{ background:"#fef9c3", color:"#a16207", fontSize:"0.68rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:"9999px", alignSelf:"flex-start", whiteSpace:"nowrap" }}>
            {item.pendingReviewCount} รอ
          </span>
        </div>
      ))}
    </section>
  );
}

/* ─── PA Tab ──────────────────────────────────────────────────────────── */
function PaView({ evidences, notify }: { evidences: PaEvidence[]; notify: (m: string) => void }) {
  const [filter, setFilter] = useState<"all" | "learning_design" | "student_outcome">("all");
  const filtered = filter === "all" ? evidences : evidences.filter(e => e.category === filter);
  const tabs: Array<{ key: typeof filter; label: string }> = [
    { key:"all",             label:"ทั้งหมด" },
    { key:"learning_design", label:"แผนการสอน" },
    { key:"student_outcome", label:"ผลลัพธ์" },
  ];

  return (
    <section style={{ animation:"fadeUp 0.3s ease both" }}>
      <SectionHeader title="ว PA Portfolio" />

      {/* Filter tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.3rem", background:"#f1f5f9", borderRadius:"12px", padding:"0.25rem", marginBottom:"0.85rem" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            style={{
              border:"none", borderRadius:"9px", padding:"0.5rem",
              fontSize:"0.75rem", fontFamily:"Sarabun,sans-serif",
              fontWeight: filter === t.key ? 700 : 500,
              background: filter === t.key ? "#fff" : "transparent",
              color: filter === t.key ? "#6366f1" : "#64748b",
              boxShadow: filter === t.key ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              cursor:"pointer", transition:"all 0.15s",
            }}
            onClick={() => setFilter(t.key)}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1rem" }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign:"center", color:"#94a3b8", fontSize:"0.85rem", padding:"1.5rem 0" }}>ยังไม่มีหลักฐาน</p>
        ) : filtered.map(ev => (
          <div key={ev.id} className="dash-card" style={{ ...card, flexDirection:"row", gap:"0.75rem" }}>
            <div style={{
              width:"40px", height:"40px", borderRadius:"10px", flexShrink:0,
              background: ev.category === "learning_design"
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : "linear-gradient(135deg,#f59e0b,#f97316)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem",
            }}>
              {ev.category === "learning_design" ? "📋" : "🏆"}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:600, fontSize:"0.82rem", color:"#1e293b" }}>{ev.title}</p>
              <p style={{ margin:"0.1rem 0 0", fontSize:"0.72rem", color:"#94a3b8" }}>{ev.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        style={{ ...gradBtn, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", width:"100%", justifyContent:"center" }}
        type="button"
        onClick={() => window.location.href = "/app/pa/preview"}
      >
        📊 Preview รายงาน วPA
      </button>
    </section>
  );
}

/* ─── Shared sub-components ──────────────────────────────────────────── */
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"0.75rem 0 0.5rem" }}>
      <h2 style={{ margin:0, fontSize:"0.9rem", fontWeight:800, color:"#1e293b" }}>{title}</h2>
      {action && <button type="button" style={{ border:"none", background:"none", color:"#6366f1", fontWeight:700, fontSize:"0.78rem", cursor:"pointer", fontFamily:"Sarabun,sans-serif" }} onClick={onAction}>{action}</button>}
    </div>
  );
}

function TodoItem({ color, emoji, title, sub }: { color: string; emoji: string; title: string; sub: string }) {
  return (
    <div className="dash-card" style={{ ...card, flexDirection:"row", gap:"0.75rem", borderLeft:`3px solid ${color}` }}>
      <span style={{ fontSize:"1.1rem", flexShrink:0 }}>{emoji}</span>
      <div>
        <p style={{ margin:0, fontWeight:600, fontSize:"0.82rem", color:"#1e293b" }}>{title}</p>
        <p style={{ margin:"0.1rem 0 0", fontSize:"0.72rem", color:"#64748b" }}>{sub}</p>
      </div>
    </div>
  );
}

/* ─── Shared styles ──────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  shell: {
    display:"flex", flexDirection:"column",
    minHeight:"100dvh", maxWidth:"430px",
    margin:"0 auto",
    background:"linear-gradient(180deg,#eef2ff 0%,#f8fafc 30%)",
    fontFamily:"'Sarabun',sans-serif",
    position:"relative",
  },
  header: {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"1rem 1rem 0.75rem",
    background:"linear-gradient(135deg,#1e293b,#334155)",
    flexWrap:"wrap", gap:"0.5rem",
  },
  headerSub: { margin:0, fontSize:"0.68rem", color:"#94a3b8", letterSpacing:"0.04em" },
  headerTitle: { margin:"0.1rem 0 0", fontSize:"1rem", fontWeight:800, color:"#f1f5f9" },
  notifBtn: {
    position:"relative", border:"none", background:"rgba(255,255,255,0.12)",
    borderRadius:"10px", width:"38px", height:"38px", cursor:"pointer",
    fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center",
  },
  badge: {
    position:"absolute", top:"-4px", right:"-4px",
    background:"#ef4444", color:"#fff",
    fontSize:"0.6rem", fontWeight:800,
    width:"16px", height:"16px", borderRadius:"9999px",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  signOutBtn: {
    border:"none", background:"rgba(255,255,255,0.1)",
    color:"#e2e8f0", borderRadius:"10px",
    width:"38px", height:"38px", cursor:"pointer", fontSize:"1rem",
    fontFamily:"Sarabun,sans-serif",
  },
  adminBtn: {
    border:"none", background:"rgba(255,255,255,0.1)",
    color:"#e2e8f0", borderRadius:"10px",
    width:"38px", height:"38px", cursor:"pointer", fontSize:"1.1rem",
    fontFamily:"Sarabun,sans-serif",
    display:"flex", alignItems:"center", justifyContent:"center",
    textDecoration:"none",
  },
  profileCard: {
    display:"flex", alignItems:"center", gap:"0.75rem",
    margin:"0.75rem 1rem",
    padding:"0.85rem",
    background:"rgba(255,255,255,0.85)",
    backdropFilter:"blur(16px)",
    WebkitBackdropFilter:"blur(16px)",
    borderRadius:"16px",
    border:"1px solid rgba(255,255,255,0.9)",
    boxShadow:"0 4px 16px rgba(99,102,241,0.1)",
  },
  avatar: {
    width:"44px", height:"44px", borderRadius:"12px",
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
    color:"#fff", fontWeight:800, fontSize:"1.2rem",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
  },
  demoBadge: {
    background:"rgba(99,102,241,0.1)", color:"#6366f1",
    fontSize:"0.65rem", fontWeight:700, padding:"0.15rem 0.5rem",
    borderRadius:"9999px", border:"1px solid rgba(99,102,241,0.2)",
  },
  bottomNav: {
    display:"grid", gridTemplateColumns:"repeat(4,1fr)",
    borderTop:"1px solid rgba(226,232,240,0.8)",
    background:"rgba(255,255,255,0.9)",
    backdropFilter:"blur(20px)",
    WebkitBackdropFilter:"blur(20px)",
    padding:"0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))",
    gap:"0.25rem",
  },
  navBtn: {
    border:"none", background:"transparent",
    cursor:"pointer", fontFamily:"Sarabun,sans-serif",
    display:"flex", flexDirection:"column",
    alignItems:"center", gap:"0.15rem",
    padding:"0.4rem 0.5rem", borderRadius:"10px",
    transition:"all 0.15s", color:"#94a3b8",
  },
  navBtnActive: {
    background:"rgba(99,102,241,0.10)",
    color:"#6366f1",
  },
  toast: {
    position:"fixed", bottom:"80px", left:"50%",
    transform:"translateX(-50%)",
    background:"#1e293b", color:"#f1f5f9",
    padding:"0.65rem 1.25rem", borderRadius:"9999px",
    fontSize:"0.82rem", fontWeight:600,
    boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
    zIndex:100, whiteSpace:"nowrap",
    animation:"fadeUp 0.25s ease both",
  },
};

const card: React.CSSProperties = {
  background:"rgba(255,255,255,0.9)",
  backdropFilter:"blur(12px)",
  WebkitBackdropFilter:"blur(12px)",
  borderRadius:"16px",
  border:"1px solid rgba(255,255,255,0.9)",
  boxShadow:"0 2px 12px rgba(99,102,241,0.07)",
  padding:"0.85rem",
  display:"flex", flexDirection:"column",
  transition:"all 0.2s ease",
};

const iconCircle: React.CSSProperties = {
  width:"40px", height:"40px", borderRadius:"10px",
  display:"flex", alignItems:"center", justifyContent:"center",
};

const quickCard: React.CSSProperties = {
  display:"flex", flexDirection:"column",
  alignItems:"center", justifyContent:"center",
  padding:"0.85rem 0.5rem",
  borderRadius:"16px",
  border:"none", cursor:"pointer",
  textDecoration:"none",
  gap:"0.1rem",
  boxShadow:"0 4px 14px rgba(0,0,0,0.15)",
  transition:"all 0.2s ease",
};

const gradBtn: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:"0.5rem",
  padding:"0.75rem 1rem", border:"none",
  borderRadius:"12px", cursor:"pointer",
  color:"#fff", fontWeight:700, fontSize:"0.85rem",
  fontFamily:"Sarabun,sans-serif",
  boxShadow:"0 4px 14px rgba(99,102,241,0.3)",
  transition:"all 0.2s ease",
};

const heroCard: React.CSSProperties = {
  background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
  borderRadius:"20px",
  padding:"1.25rem",
  boxShadow:"0 8px 24px rgba(99,102,241,0.35)",
};
