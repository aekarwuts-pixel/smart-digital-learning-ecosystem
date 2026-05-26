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
    <main style={s.shell} className="cyber-shell">
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-card:hover { transform: translateY(-3px) scale(1.015) !important; border-color: rgba(99, 102, 241, 0.4) !important; box-shadow: 0 8px 30px rgba(99,102,241,0.25) !important; }
        .quick-btn:hover { filter: brightness(1.1); transform: translateY(-3px); box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4) !important; }
        .nav-btn:hover { background: rgba(99,102,241,0.08) !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={s.header} className="cyber-header">
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
      <div style={s.profileCard} className="cyber-glass-card">
        <div style={s.avatar}>{dashboard.teacherName?.charAt(0) ?? "ค"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin:0, fontWeight:700, color:"#f1f5f9", fontSize:"0.92rem", textShadow:"0 0 8px rgba(255,255,255,0.1)" }}>{dashboard.teacherName}</p>
          <p style={{ margin:"0.1rem 0 0", color:"#94a3b8", fontSize:"0.75rem" }}>
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
      <nav style={s.bottomNav} className="cyber-dock" aria-label="เมนูหลัก">
        {navItems.map(item => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn cyber-dock-btn ${view === item.id ? "cyber-dock-btn-active" : ""}`}
            style={{ ...s.navBtn, ...(view === item.id ? s.navBtnActive : {}) }}
            onClick={() => setView(item.id)}
            aria-pressed={view === item.id}
          >
            <span style={{ fontSize:"1.3rem" }}>{item.emoji}</span>
            <span style={{ fontSize:"0.68rem", fontWeight: view === item.id ? 800 : 500 }}>{item.label}</span>
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
          <div key={s.label} className="dash-card cyber-glass-card" style={card}>
            <div style={{ ...iconCircle, background: s.color + "22", border:`1px solid ${s.color}35` }}>
              <span style={{ fontSize:"1.1rem" }}>{s.emoji}</span>
            </div>
            <p style={{ margin:"0.4rem 0 0", fontSize:"1.5rem", fontWeight:900, color: s.color, textShadow: `0 0 10px ${s.color}40` }}>{s.value}</p>
            <p style={{ margin:0, fontSize:"0.72rem", color:"#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <SectionHeader title="เมนูลัด" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"1rem" }}>
        {quickActions.map(a => (
          <a key={a.label} href={a.href} className="quick-btn" style={{ ...quickCard, background: a.color }}>
            <span style={{ fontSize:"1.4rem" }}>{a.emoji}</span>
            <span style={{ fontSize:"0.73rem", fontWeight:800, color:"#fff", marginTop:"0.25rem", textShadow:"0 1px 4px rgba(0,0,0,0.2)" }}>{a.label}</span>
          </a>
        ))}
      </div>

      {/* AI Tools Banner */}
      <div className="dash-card cyber-ai-banner" style={{
        borderRadius: "14px",
        padding: "1rem",
        color: "#fff",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all 0.3s ease"
      }} onClick={() => window.location.href = "/app/lesson-generator"}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.75rem", animation: "aiPulse 2s infinite" }}>🤖</span>
          <div style={{ textAlign: "left" }}>
            <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 900, letterSpacing:"0.02em" }}>AI Lesson Plan Generator</h4>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.9)" }}>
              สร้างแผนการสอนเชิงรุก (Active Learning) และเชื่อมหลักฐาน วPA 1.2 ทันที
            </p>
          </div>
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>→</span>
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
          <div key={u.label} className="dash-card cyber-glass-card" style={{ ...card, flexDirection:"row", gap:"0.75rem", padding:"0.85rem" }}>
            <div style={{ ...iconCircle, background: u.color + "22", border:`1px solid ${u.color}35`, flexShrink:0 }}>
              <span style={{ fontSize:"1.1rem" }}>{u.emoji}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:"0 0 0.4rem", fontWeight:700, fontSize:"0.82rem", color:"#f1f5f9" }}>{u.label}</p>
              <div style={{ height:"6px", borderRadius:"9999px", background:"rgba(255, 255, 255, 0.1)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${u.progress}%`, background: u.color, borderRadius:"9999px", transition:"width 0.6s ease", boxShadow:`0 0 8px ${u.color}` }} />
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
        <div className="cyber-glass-card" style={{ ...card, marginBottom:"0.75rem", borderLeft:"4px solid #f43f5e" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
            <span style={{ background:"rgba(244,63,94,0.15)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.2)", fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.6rem", borderRadius:"9999px" }}>🔴 ต้องตรวจวันนี้</span>
            <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>ส่งแล้ว {main.submittedCount}/{main.studentCount}</span>
          </div>
          <p style={{ margin:"0 0 0.25rem", fontWeight:800, color:"#f1f5f9" }}>{main.title}</p>
          <p style={{ margin:"0 0 0.75rem", fontSize:"0.78rem", color:"#94a3b8" }}>{main.description}</p>
          <button
            style={{ ...gradBtn, background:"linear-gradient(135deg,#f43f5e,#f97316)", width:"100%", justifyContent:"center", boxShadow:"0 4px 14px rgba(244,63,94,0.3)" }}
            type="button"
            onClick={() => window.location.href = `/app/assignments?assignmentId=${main.id}`}
          >
            ตรวจงาน {main.pendingReviewCount} รายการ →
          </button>
        </div>
      ) : (
        <div className="cyber-glass-card" style={{ ...card, textAlign:"center", padding:"2rem", color:"#94a3b8", fontSize:"0.85rem" }}>✅ ไม่มีงานค้างตรวจ</div>
      )}

      {assignments.slice(1, 4).map(item => (
        <div
          key={item.id}
          className="dash-card cyber-glass-card"
          style={{ ...card, flexDirection:"row", gap:"0.75rem", marginBottom:"0.5rem", cursor:"pointer" }}
          onClick={() => window.location.href = `/app/assignments?assignmentId=${item.id}`}
        >
          <span style={{ fontSize:"1.2rem" }}>📝</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:"0.82rem", color:"#f1f5f9" }}>{item.title}</p>
            <p style={{ margin:"0.1rem 0 0", fontSize:"0.72rem", color:"#94a3b8" }}>ส่งแล้ว {item.submittedCount}/{item.studentCount} · รอตรวจ {item.pendingReviewCount}</p>
          </div>
          <span style={{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)", fontSize:"0.68rem", fontWeight:800, padding:"0.15rem 0.5rem", borderRadius:"9999px", alignSelf:"flex-start", whiteSpace:"nowrap" }}>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.3rem", background:"rgba(15, 23, 42, 0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"0.25rem", marginBottom:"0.85rem" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            style={{
              borderRadius:"9px", padding:"0.5rem",
              fontSize:"0.75rem", fontFamily:"Sarabun,sans-serif",
              fontWeight: filter === t.key ? 800 : 500,
              background: filter === t.key ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: filter === t.key ? "#818cf8" : "#94a3b8",
              border: filter === t.key ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
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
          <div key={ev.id} className="dash-card cyber-glass-card" style={{ ...card, flexDirection:"row", gap:"0.75rem" }}>
            <div style={{
              width:"40px", height:"40px", borderRadius:"10px", flexShrink:0,
              background: ev.category === "learning_design"
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : "linear-gradient(135deg,#f59e0b,#f97316)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem",
              boxShadow: ev.category === "learning_design"
                ? "0 0 10px rgba(99,102,241,0.4)"
                : "0 0 10px rgba(245,158,11,0.4)"
            }}>
              {ev.category === "learning_design" ? "📋" : "🏆"}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:700, fontSize:"0.82rem", color:"#f1f5f9" }}>{ev.title}</p>
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
      <h2 style={{ margin:0, fontSize:"0.9rem", fontWeight:800, color:"#f1f5f9" }}>{title}</h2>
      {action && <button type="button" style={{ border:"none", background:"none", color:"#818cf8", fontWeight:800, fontSize:"0.78rem", cursor:"pointer", fontFamily:"Sarabun,sans-serif" }} onClick={onAction}>{action}</button>}
    </div>
  );
}

function TodoItem({ color, emoji, title, sub }: { color: string; emoji: string; title: string; sub: string }) {
  return (
    <div className="dash-card cyber-glass-card" style={{ ...card, flexDirection:"row", gap:"0.75rem", borderLeft:`4px solid ${color}` }}>
      <span style={{ fontSize:"1.1rem", flexShrink:0 }}>{emoji}</span>
      <div>
        <p style={{ margin:0, fontWeight:700, fontSize:"0.82rem", color:"#f1f5f9" }}>{title}</p>
        <p style={{ margin:"0.1rem 0 0", fontSize:"0.72rem", color:"#94a3b8" }}>{sub}</p>
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
    background:"radial-gradient(circle at top, #0f172a 0%, #030712 100%)",
    fontFamily:"'Outfit', 'Sarabun', sans-serif",
    position:"relative",
  },
  header: {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"1rem 1rem 0.75rem",
    background:"rgba(15, 23, 42, 0.6)",
    backdropFilter:"blur(20px)",
    WebkitBackdropFilter:"blur(20px)",
    borderBottom:"1px solid rgba(255, 255, 255, 0.08)",
    flexWrap:"wrap", gap:"0.5rem",
  },
  headerSub: { margin:0, fontSize:"0.68rem", color:"#818cf8", letterSpacing:"0.06em", fontWeight: 600 },
  headerTitle: { margin:"0.1rem 0 0", fontSize:"1.05rem", fontWeight:900, color:"#f1f5f9", textShadow: "0 0 10px rgba(99, 102, 241, 0.4)" },
  notifBtn: {
    position:"relative", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)",
    borderRadius:"10px", width:"38px", height:"38px", cursor:"pointer",
    fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center",
    transition: "all 0.2s",
  },
  badge: {
    position:"absolute", top:"-4px", right:"-4px",
    background:"#f43f5e", color:"#fff",
    fontSize:"0.6rem", fontWeight:800,
    width:"16px", height:"16px", borderRadius:"9999px",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow: "0 0 8px rgba(244,63,94,0.6)",
  },
  signOutBtn: {
    border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)",
    color:"#e2e8f0", borderRadius:"10px",
    width:"38px", height:"38px", cursor:"pointer", fontSize:"1rem",
    fontFamily:"Sarabun,sans-serif",
    transition: "all 0.2s",
  },
  adminBtn: {
    border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)",
    color:"#e2e8f0", borderRadius:"10px",
    width:"38px", height:"38px", cursor:"pointer", fontSize:"1.1rem",
    fontFamily:"Sarabun,sans-serif",
    display:"flex", alignItems:"center", justifyContent:"center",
    textDecoration:"none",
    transition: "all 0.2s",
  },
  profileCard: {
    display:"flex", alignItems:"center", gap:"0.75rem",
    margin:"0.75rem 1rem",
    padding:"0.85rem",
    background:"rgba(30, 41, 59, 0.45)",
    backdropFilter:"blur(16px)",
    WebkitBackdropFilter:"blur(16px)",
    borderRadius:"16px",
    border:"1px solid rgba(255,255,255,0.07)",
    boxShadow:"0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  avatar: {
    width:"44px", height:"44px", borderRadius:"12px",
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
    color:"#fff", fontWeight:900, fontSize:"1.2rem",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
    boxShadow: "0 0 12px rgba(99, 102, 241, 0.5)",
  },
  demoBadge: {
    background:"rgba(99,102,241,0.15)", color:"#818cf8",
    fontSize:"0.65rem", fontWeight:700, padding:"0.15rem 0.5rem",
    borderRadius:"9999px", border:"1px solid rgba(99,102,241,0.25)",
  },
  bottomNav: {
    display:"grid", gridTemplateColumns:"repeat(4,1fr)",
    borderTop:"1px solid rgba(255,255,255,0.08)",
    background:"rgba(15, 23, 42, 0.7)",
    backdropFilter:"blur(24px)",
    WebkitBackdropFilter:"blur(24px)",
    padding:"0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))",
    gap:"0.25rem",
    boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.4)",
  },
  navBtn: {
    border:"none", background:"transparent",
    cursor:"pointer", fontFamily:"Sarabun,sans-serif",
    display:"flex", flexDirection:"column",
    alignItems:"center", gap:"0.15rem",
    padding:"0.4rem 0.5rem", borderRadius:"10px",
    transition:"all 0.2s", color:"#94a3b8",
  },
  navBtnActive: {
    background:"rgba(99,102,241,0.15)",
    color:"#818cf8",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    boxShadow: "inset 0 0 10px rgba(99,102,241,0.1)",
  },
  toast: {
    position:"fixed", bottom:"80px", left:"50%",
    transform:"translateX(-50%)",
    background:"rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
    color:"#f1f5f9",
    padding:"0.65rem 1.25rem", borderRadius:"9999px",
    fontSize:"0.82rem", fontWeight:600,
    boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
    zIndex:100, whiteSpace:"nowrap",
    animation:"fadeUp 0.25s ease both",
  },
};

const card: React.CSSProperties = {
  background:"rgba(30, 41, 59, 0.45)",
  backdropFilter:"blur(12px)",
  WebkitBackdropFilter:"blur(12px)",
  borderRadius:"16px",
  border:"1px solid rgba(255, 255, 255, 0.08)",
  boxShadow:"0 4px 20px rgba(0, 0, 0, 0.2)",
  padding:"0.85rem",
  display:"flex", flexDirection:"column",
  transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
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
  boxShadow:"0 4px 14px rgba(0,0,0,0.25)",
  transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
};

const gradBtn: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:"0.5rem",
  padding:"0.75rem 1rem", border:"none",
  borderRadius:"12px", cursor:"pointer",
  color:"#fff", fontWeight:700, fontSize:"0.85rem",
  fontFamily:"Sarabun,sans-serif",
  boxShadow:"0 4px 14px rgba(99,102,241,0.25)",
  transition:"all 0.2s ease",
};

const heroCard: React.CSSProperties = {
  background:"linear-gradient(135deg,rgba(99,102,241,0.7),rgba(139,92,246,0.7))",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius:"20px",
  padding:"1.25rem",
  boxShadow:"0 8px 24px rgba(99,102,241,0.25)",
};
