"use client";

import { useState } from "react";
import { signOut } from "@/app/login/actions";
import type { AssignmentSummary } from "@/lib/demo-data";
import type { PaEvidence, TeacherDashboard } from "@/lib/database.types";

type ViewName = "home" | "class" | "portfolio" | "pa" | "work";

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

  const navItems: Array<{ id: ViewName; icon: string; label: string }> = [
    { id: "home",      icon: "dashboard",     label: "หน้าแรก" },
    { id: "class",     icon: "school",        label: "ห้องเรียน" },
    { id: "portfolio", icon: "folder_shared",  label: "แฟ้มสะสมงาน" },
    { id: "pa",        icon: "verified",       label: "ว PA" },
    { id: "work",      icon: "quiz",           label: "การประเมิน" },
  ];

  const formattedDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="app-layout-container cyber-shell">
      {/* ── Desktop Sidebar Navigation ── */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div>
            <h2 className="headline-font font-bold text-primary text-base leading-tight">EduVibrant</h2>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Teacher Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${view === item.id ? "sidebar-link-active" : ""}`}
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
              style={{ padding: "0.5rem" }}
            >
              <div className="glass-icon-container" style={{ width: "2.5rem", height: "2.5rem" }}>
                <div className={`glass-icon-bg-shape ${item.id === 'home' ? 'blue' : item.id === 'class' ? 'green' : item.id === 'portfolio' ? 'orange' : item.id === 'pa' ? 'pink' : 'indigo'}`}></div>
                <div className="glass-icon-foreground" style={{ borderRadius: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", fontVariationSettings: view === item.id ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                </div>
              </div>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="new-module-btn font-semibold text-xs flex items-center justify-center gap-2"
            onClick={() => notify("สร้างโมดูลหลักสูตรใหม่แล้ว")}
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Module
          </button>
        </div>
      </aside>

      {/* ── Main Canvas Content ── */}
      <div className="app-main-content">
        {/* Top Navbar */}
        <header className="clean-header-wrap cyber-header">
          <div className="flex flex-col">
            <p className="text-[10px] text-primary font-bold tracking-wider uppercase leading-none">
              โรงเรียนเทศบาล ๑ บ้านกลาง · ภาคเรียน 1/2569
            </p>
            <h1 className="headline-font font-bold text-on-surface text-base md:text-lg mt-1 leading-tight">
              M Learning Ecosystem
            </h1>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              className="relative p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant flex items-center justify-center"
              type="button"
              onClick={() => notify("มีแจ้งเตือนใหม่: แบบข้อตกลง วPA ได้รับการอนุมัติ")}
              aria-label="การแจ้งเตือน"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border border-white" style={{ boxShadow: "0 0 5px rgba(186,26,26,0.5)" }} />
            </button>

            <a
              href="/app/admin"
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant flex items-center justify-center"
              title="ผู้ดูแลระบบ"
            >
              <span className="material-symbols-outlined">settings</span>
            </a>

            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/30">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-xs text-on-surface leading-tight">{dashboard.teacherName}</p>
                <p className="text-[10px] text-on-surface-variant font-medium uppercase mt-0.5">{dashboard.classroomName === "ป.4" ? "ครูชำนาญการ" : "ครูชำนาญการพิเศษ"}</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="p-2 rounded-full hover:bg-error-container hover:text-error transition-colors text-on-surface-variant flex items-center justify-center"
                  title="ออกจากระบบ"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Dynamic Inner View */}
        <main className="main-content-canvas">
          {view === "home"      && <HomeView dashboard={dashboard} notify={notify} formattedDate={formattedDate} />}
          {view === "class"     && <ClassView dashboard={dashboard} notify={notify} />}
          {view === "portfolio" && <StudentPortfolioView dashboard={dashboard} notify={notify} />}
          {view === "pa"        && <PaView evidences={evidences} notify={notify} />}
          {view === "work"      && <WorkView assignments={assignments} notify={notify} />}
        </main>

        {/* Mobile Bottom Dock Menu */}
        <nav className="cyber-dock bottom-nav md:hidden" aria-label="เมนูหลักสำหรับมือถือ">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`cyber-dock-btn flex flex-col items-center justify-center gap-1 ${view === item.id ? "cyber-dock-btn-active" : ""}`}
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: view === item.id ? "'FILL' 1" : "'FILL' 0", fontSize: "20px" }}>
                {item.icon}
              </span>
              <span style={{ fontSize: "9px", fontWeight: view === item.id ? 800 : 500 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast is-visible flex items-center gap-2" role="status" aria-live="polite">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   1. DASHBOARD VIEW (Home Tab)
   ────────────────────────────────────────────────────────────────────────── */
function HomeView({ dashboard, notify, formattedDate }: { dashboard: TeacherDashboard; notify: (m: string) => void; formattedDate: string }) {
  const stats = [
    { icon: "groups",          label: "นักเรียนทั้งหมด", value: dashboard.studentCount,   color: "indigo" },
    { icon: "analytics",       label: "ความคืบหน้าเฉลี่ย", value: "82.5%",                 color: "green", hasProgress: true },
    { icon: "assignment_late", label: "งานที่รอตรวจ",   value: dashboard.pendingReviews, color: "orange" },
    { icon: "verified",        label: "สถานะ วPA",      value: "ดีเยี่ยม",               color: "violet" },
  ];

  return (
    <section style={{ animation: "fadeUp 0.3s ease both" }} className="space-y-6">
      {/* Hero Header */}
      <div className="hero-gradient-box flex items-center justify-between min-h-[12rem] relative">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white rounded-full blur-2xl" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white rounded-full blur-xl" />
        </div>
        <div className="relative z-10 max-w-xl">
          <h2 className="headline-font text-2xl md:text-3xl font-extrabold text-white">สวัสดีครับ, {dashboard.teacherName}</h2>
          <p className="text-white/90 text-sm md:text-base mt-2">
            ยินดีต้อนรับสู่ Digital Learning Ecosystem ของวันนี้ มีข้อมูลความประพฤติและการจัดกิจกรรมสอนรอการตรวจสอบ
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 rounded-full border border-white/30 text-white text-xs font-semibold backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formattedDate}
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 rounded-full border border-white/30 text-white text-xs font-semibold backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px]">online_prediction</span>
              กำลังออนไลน์ {dashboard.studentCount + 88} คน
            </div>
          </div>
        </div>
      </div>

      {/* Stats Layered Layout mimicking Soft UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12 mb-8">
        
        {/* Big Circle Chart Card (Overlapping layout) */}
        <div className="layered-glass-card lg:col-span-2 flex flex-col justify-center min-h-[14rem]" style={{ marginRight: '2rem' }}>
          <div className="glass-circle-chart">
            <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <path strokeDasharray="82.5, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#gradientGreen)" strokeWidth="4" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-on-surface">82.5%</span>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase">ความคืบหน้า</span>
            </div>
            {/* Small overlapping indicator */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-emerald-500 border-2 border-emerald-100 text-[10px] font-bold">
              +5%
            </div>
          </div>
          
          <div className="max-w-[60%]">
            <h3 className="headline-font font-black text-2xl text-on-surface">ภาพรวมความก้าวหน้า</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-4 leading-relaxed">
              อัตราความสำเร็จของนักเรียนโดยรวมดีขึ้นอย่างต่อเนื่องในสัปดาห์นี้
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-md text-sm">groups</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">นักเรียนทั้งหมด</p>
                  <p className="font-bold text-sm">{dashboard.studentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-500/10 p-1 rounded-md text-sm">verified</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">สถานะ วPA</p>
                  <p className="font-bold text-sm text-emerald-700">ดีเยี่ยม</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Side Cards Stacked */}
        <div className="flex flex-col gap-6 relative" style={{ marginTop: '-2rem' }}>
          
          {/* Card 1 */}
          <div className="layered-glass-card !p-4 flex items-center gap-4 z-10 transform hover:translate-x-2 transition-transform">
            <div className="floating-badge bg-orange-100 text-orange-600">
              <span className="material-symbols-outlined text-xl">assignment_late</span>
            </div>
            <div className="ml-6">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">งานที่รอตรวจ</p>
              <h3 className="headline-font text-2xl font-black text-orange-500 leading-none">{dashboard.pendingReviews}</h3>
            </div>
            <div className="ml-auto">
              <button className="text-orange-500 hover:bg-orange-50 p-2 rounded-full transition-colors" onClick={() => notify("เปิดรายการรอตรวจ")}>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="layered-glass-card !p-4 flex items-center gap-4 z-0 transform translate-x-4 hover:translate-x-6 transition-transform">
            <div className="floating-badge bg-indigo-100 text-indigo-600">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
            <div className="ml-6">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">บทเรียนพร้อมใช้</p>
              <h3 className="headline-font text-2xl font-black text-indigo-500 leading-none">16+</h3>
            </div>
             <div className="ml-auto">
              <button className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-full transition-colors" onClick={() => notify("เปิดคลังบทเรียน")}>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bento Grid */}
      <div className="bento-layout">
        {/* Left Side: AI Insights */}
        <div className="bento-col-8 clean-card-lowest space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <div>
              <h3 className="headline-font font-bold text-lg text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI Learning Insights
              </h3>
              <p className="text-xs text-on-surface-variant">บทวิเคราะห์พฤติกรรมการเรียนรู้สัปดาห์นี้</p>
            </div>
            <button className="text-primary font-bold text-xs flex items-center gap-1 hover:underline" onClick={() => notify("เปิดรายงานฉบับเต็ม")}>
              ดูรายงานเต็ม <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group 1 */}
            <div className="p-4 bg-surface-container-low rounded-xl space-y-3 flex flex-col justify-between border border-outline-variant/10">
              <div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">Fast Learners</span>
                <h4 className="font-bold text-sm text-on-surface mt-2">กลุ่มเรียนรู้ไว</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">กลุ่มที่เรียนรู้ไปข้างหน้าอย่างรวดเร็ว แนะนำเนื้อหาเสริม (Enrichment Content)</p>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-slate-300 border border-white text-[9px] flex items-center justify-center font-bold text-slate-700">สม</div>
                  <div className="w-6 h-6 rounded-full bg-indigo-200 border border-white text-[9px] flex items-center justify-center font-bold text-indigo-700">สท</div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-bold">+12 คน</span>
              </div>
            </div>

            {/* Group 2 */}
            <div className="p-4 bg-emerald-500/5 rounded-xl space-y-3 flex flex-col justify-between border border-emerald-500/10">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 rounded-full text-[10px] font-bold">Needs Support</span>
                <h4 className="font-bold text-sm text-on-surface mt-2">กลุ่มต้องการดูแล</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">นักเรียนที่อาจติดปัญหาบทที่ 4 ควรได้รับการแนะนำเพิ่มเติมหรือทบทวน</p>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-red-200 border border-white text-[9px] flex items-center justify-center font-bold text-red-700">จด</div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-bold">+5 คน</span>
              </div>
            </div>

            {/* Group 3 */}
            <div className="p-4 bg-orange-500/5 rounded-xl space-y-3 flex flex-col justify-between border border-orange-500/10">
              <div>
                <span className="px-2 py-0.5 bg-orange-500/15 text-orange-700 rounded-full text-[10px] font-bold">Inconsistent</span>
                <h4 className="font-bold text-sm text-on-surface mt-2">กลุ่มไม่สม่ำเสมอ</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">นักเรียนที่มีการเข้าสู่ระบบไม่สม่ำเสมอในช่วง 3 วันที่ผ่านมา</p>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-yellow-200 border border-white text-[9px] flex items-center justify-center font-bold text-yellow-700">ธว</div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-bold">+3 คน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Activity & Support */}
        <div className="bento-col-4 space-y-6">
          <div className="clean-card-lowest space-y-4">
            <h3 className="headline-font font-bold text-sm text-on-surface border-b border-outline-variant/20 pb-2">
              กิจกรรมล่าสุด
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold leading-normal">
                    <span className="text-primary">ปกรณ์</span> ส่งใบงาน "แยกปัญหาเป็นขั้นตอน"
                  </p>
                  <p className="text-[9.5px] text-on-surface-variant mt-0.5">2 นาทีที่แล้ว</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">forum</span>
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold leading-normal">
                    มีคำถามใหม่ในบอร์ดเรียนเรื่อง Scratch
                  </p>
                  <p className="text-[9.5px] text-on-surface-variant mt-0.5">15 นาทีที่แล้ว</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">warning</span>
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold leading-normal">
                    แจ้งเตือน: อัตราเข้าคลาสลดลงในคลาส ป.5
                  </p>
                  <p className="text-[9.5px] text-on-surface-variant mt-0.5">1 ชั่วโมงที่แล้ว</p>
                </div>
              </div>
            </div>
            <button className="w-full py-1.5 text-xs text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors mt-2" onClick={() => notify("เปิดดูประวัติกิจกรรมทั้งหมด")}>
              ดูประวัติทั้งหมด
            </button>
          </div>

          <div className="clean-card-lowest bg-surface-container-low border border-outline-variant/30 flex items-center justify-between p-4 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-bold text-xs text-on-surface">ต้องการความช่วยเหลือ?</h4>
              <p className="text-[10px] text-on-surface-variant mt-0.5 mb-3">แอดมินระบบการศึกษาพร้อมดูแล 24/7</p>
              <button 
                className="px-3 py-1.5 bg-on-surface text-white rounded-full text-[10px] font-bold hover:bg-on-surface-variant transition-colors"
                onClick={() => notify("ส่งข้อมูลติดต่อฝ่ายบริการลูกค้าแล้ว")}
              >
                ติดต่อแอดมิน
              </button>
            </div>
            <span className="material-symbols-outlined absolute -bottom-3 -right-3 text-6xl text-on-surface-variant/5 group-hover:scale-105 transition-transform">
              support_agent
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. LEARNING MANAGEMENT VIEW (Class Tab)
   ────────────────────────────────────────────────────────────────────────── */
function ClassView({ dashboard, notify }: { dashboard: TeacherDashboard; notify: (m: string) => void }) {
  const courses = [
    { title: "วิทยาการคำนวณ (ป.4)", code: "active", progress: 75, count: 32, icon: "code", color: "emerald" },
    { title: "วิทยาการคำนวณ (ป.5)", code: "queue", progress: 42, count: 28, icon: "robot_2", color: "coral" },
    { title: "วิทยาการคำนวณ (ป.6)", code: "next", progress: 90, count: 35, icon: "terminal", color: "blue" },
  ];

  return (
    <section style={{ animation: "fadeUp 0.3s ease both" }} className="space-y-6">
      {/* Title section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="headline-font font-bold text-xl text-on-surface">ระบบจัดการการเรียนรู้</h2>
          <p className="text-xs text-on-surface-variant">ยินดีต้อนรับกลับ ครูเอกอาวุธ วันนี้คุณมี 3 คลาสที่ต้องดำเนินการสอน</p>
        </div>
        <button 
          className="px-3 py-1.5 bg-purple-500/10 text-purple-700 rounded-lg text-xs font-bold border border-purple-500/20 flex items-center gap-1 hover:bg-purple-500/20"
          onClick={() => notify("เข้าสู่ระบบช่วยคิดแผนการเรียน AI Design Assistance")}
        >
          <span className="material-symbols-outlined text-xs">auto_awesome</span>
          AI Design Assistance
        </button>
      </div>

      {/* Courses Cards Grid - Staggered Layering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-12">
        {courses.map((c, idx) => (
          <div key={c.title} className={`layered-glass-card subject-card subject-card-${c.color} transform transition-transform hover:scale-105`} style={{ padding: 0, marginTop: idx === 1 ? '1.5rem' : idx === 2 ? '3rem' : '0', zIndex: 3 - idx }}>
            <div className={`subject-header-bg bg-gradient-${c.color} relative overflow-hidden`} style={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase relative z-10 ${
                c.code === "active" ? "bg-[#00C38B]" : c.code === "queue" ? "bg-slate-400" : "bg-[#3B82F6]"
              }`}>
                {c.code === "active" ? "Active" : c.code === "queue" ? "Queue" : "Next Session"}
              </span>
              <span className={`material-symbols-outlined absolute -right-2 -bottom-4 text-8xl opacity-20 text-white`}>{c.icon}</span>
              <span className={`material-symbols-outlined text-4xl text-${c.color} relative z-10`} style={{ color: c.color === "emerald" ? "#00C38B" : c.color === "coral" ? "#FF6B6B" : "#3B82F6" }}>{c.icon}</span>
            </div>
            <div className="p-5 space-y-3 relative">
              {/* Floating Badge */}
              <div className="absolute -top-6 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center font-bold text-sm text-on-surface">
                {c.progress}%
              </div>

              <h3 className="headline-font font-bold text-base text-on-surface leading-tight">{c.title}</h3>
              <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[16px]">groups</span>
                {c.count} นักเรียน
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-on-surface-variant">ความคืบหน้าการส่งงาน</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ 
                    width: `${c.progress}%`,
                    background: c.color === "emerald" ? "#00C38B" : c.color === "coral" ? "#FF6B6B" : "#3B82F6"
                  }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills & Resources Bento Grid */}
      <div className="bento-layout">
        {/* Skill Tracking (8 Cols) */}
        <div className="bento-col-8 clean-card-lowest space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
            <h3 className="headline-font font-bold text-sm text-on-surface">สรุปทักษะนักเรียน (Skill Tracking)</h3>
            <select className="bg-surface-container border-none rounded-lg text-xs font-semibold py-1.5 px-3 focus:ring-0 cursor-pointer">
              <option>ทุกระดับชั้น</option>
              <option>ป.4</option>
              <option>ป.5</option>
              <option>ป.6</option>
            </select>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                <span>ตรรกะและการแก้ปัญหา (Logic & Problem Solving)</span>
                <span className="text-emerald-600">88% (EXCELLENT)</span>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                <div className="h-full bg-emerald-500 flex items-center px-3 text-white text-[9px] font-bold" style={{ width: "88%" }}>
                  EXCELLENT
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                <span>พื้นฐานการเขียนโปรแกรม (Basic Coding)</span>
                <span className="text-sky-600">64% (PROFICIENT)</span>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                <div className="h-full bg-sky-500 flex items-center px-3 text-white text-[9px] font-bold" style={{ width: "64%" }}>
                  PROFICIENT
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                <span>จริยธรรมในโลกดิจิทัล (Digital Ethics)</span>
                <span className="text-orange-600">92% (OUTSTANDING)</span>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                <div className="h-full bg-orange-500 flex items-center px-3 text-white text-[9px] font-bold" style={{ width: "92%" }}>
                  OUTSTANDING
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Library (4 Cols) */}
        <div className="bento-col-4 clean-card-lowest flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
              <h3 className="headline-font font-bold text-sm text-on-surface">คลังสื่อการสอน</h3>
              <a className="text-primary font-bold text-xs hover:underline" href="#" onClick={(e) => { e.preventDefault(); notify("เปิดเมนูสื่อการสอนทั้งหมด"); }}>ดูทั้งหมด</a>
            </div>
            <div className="space-y-2 mt-3">
              <div className="flex gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:bg-surface-container transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                  <span className="material-symbols-outlined text-xl">video_library</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">Intro to Python for G6</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">วิดีโอ • 15 นาที</p>
                </div>
              </div>

              <div className="flex gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:bg-surface-container transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">ใบงานตรรกะเบื้องต้น ป.4</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">PDF • 2.4 MB</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            className="w-full py-2 border border-dashed border-outline-variant rounded-xl text-xs text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
            onClick={() => notify("เปิดหน้าต่างอัปโหลดสื่อหลักสูตรใหม่")}
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            อัปโหลดสื่อใหม่
          </button>
        </div>
      </div>

      {/* Featured Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-on-background p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary rounded-full blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-secondary rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Featured Module
            </span>
            <h2 className="headline-font font-black text-2xl md:text-3xl leading-tight">สร้างสรรค์ AI สำหรับนักเรียนชั้น ป.6</h2>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed">
              สอนพื้นฐานของระบบปัญญาประดิษฐ์และ Machine Learning ผ่านแบบจำลองและการทดลองที่สนุกสนาน ออกแบบบทเรียนร่วมกับ AI Assistant
            </p>
            <div className="flex gap-2 pt-1">
              <button className="px-4 py-2.5 bg-white text-on-background rounded-full text-xs font-bold hover:bg-surface-container-high transition-colors" onClick={() => notify("เริ่มสร้างแผนการเรียนรู้ AI G6")}>
                เริ่มสร้างบทเรียน
              </button>
              <button className="px-4 py-2.5 bg-transparent border border-white/30 text-white rounded-full text-xs font-bold hover:bg-white/10 transition-colors" onClick={() => notify("เปิดคู่มือเอกสารแผนหลักสูตร AI")}>
                ดูคู่มือการสอน
              </button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 aspect-video overflow-hidden">
              <div className="w-full h-full bg-slate-800/80 rounded-xl flex items-center justify-center text-white/50 text-xs flex-col gap-2">
                <span className="material-symbols-outlined text-4xl">robot</span>
                AI & Robotics Workspace Mockup
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. STUDENT PORTFOLIO VIEW (New Student Portfolio Tab)
   ────────────────────────────────────────────────────────────────────────── */
function StudentPortfolioView({ dashboard, notify }: { dashboard: TeacherDashboard; notify: (m: string) => void }) {
  return (
    <section style={{ animation: "fadeUp 0.3s ease both" }} className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="headline-font font-bold text-xl text-on-surface">แฟ้มสะสมผลงานนักเรียน</h2>
          <p className="text-xs text-on-surface-variant">ติดตามความก้าวหน้าประเมินสมรรถนะและความประพฤติรายบุคคล</p>
        </div>
        <button 
          className="px-3 py-2 bg-surface border border-outline-variant/30 text-primary rounded-lg text-xs font-bold hover:bg-surface-container transition-colors"
          onClick={() => notify("เปิดตัวกรองข้อมูลห้องเรียน")}
        >
          ตัวกรองสมรรถนะ
        </button>
      </div>

      <div className="bento-layout">
        {/* AI Feedback Assistant (4 Cols) */}
        <div className="bento-col-4 clean-card-lowest text-white flex flex-col justify-between min-h-[16rem]" style={{ background: "linear-gradient(135deg, #0042c3 0%, #705d00 100%)" }}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-yellow-300 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="headline-font font-bold text-sm text-white">AI Feedback Assistant</h3>
            </div>
            <p className="text-white/90 text-xs leading-relaxed">
              "ภาพรวมของนักเรียนกลุ่ม ป.4/1 มีการพัฒนาสมรรถนะการวิเคราะห์และแก้ไขปัญหาที่ดีมาก แต่ยังต้องการปรับปรุงทักษะการทำงานร่วมกันและการสื่อสารหน้าชั้นเรียน"
            </p>
          </div>
          <div className="space-y-3 mt-4">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">คำแนะนำสัปดาห์นี้</p>
              <p className="text-[11px] text-white/90 mt-1">มอบหมายกิจกรรมแบบจับคู่ (Pair Programming) ในสัปดาห์นี้เพื่อส่งเสริมทีมเวิร์ค</p>
            </div>
            <button 
              className="w-full py-2 bg-[#fcd400] text-[#6e5c00] rounded-xl text-xs font-bold hover:bg-yellow-300 transition-colors"
              onClick={() => notify("เปิดฟังก์ชันถาม AI เพิ่มเติม")}
            >
              ถาม AI เพิ่มเติม
            </button>
          </div>
        </div>

        {/* SVG Performance Chart (8 Cols) */}
        <div className="bento-col-8 clean-card-lowest flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-4 w-full">
            <h3 className="headline-font font-bold text-sm text-on-surface">ภาพรวมสมรรถนะคลาส {dashboard.classroomName}</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0042c3]" />
                <span className="text-xs text-on-surface-variant">ความรู้ทางวิชาการ (Academic)</span>
                <span className="ml-auto font-bold text-xs text-primary">85%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#705d00]" />
                <span className="text-xs text-on-surface-variant">ทักษะการสื่อสาร (Communication)</span>
                <span className="ml-auto font-bold text-xs text-[#705d00]">62%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#005b3d]" />
                <span className="text-xs text-on-surface-variant">การคิดวิเคราะห์ (Critical Thinking)</span>
                <span className="ml-auto font-bold text-xs text-emerald-700">91%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
                <span className="text-xs text-on-surface-variant">การทำงานร่วมกัน (Collaboration)</span>
                <span className="ml-auto font-bold text-xs text-red-600">54%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center">
            {/* SVG Radar Chart */}
            <svg className="overflow-visible" height="150" viewBox="0 0 100 100" width="150">
              <polygon className="fill-none stroke-slate-300" strokeDasharray="3" points="50,10 90,50 50,90 10,50" />
              <polygon className="fill-none stroke-slate-300" strokeDasharray="3" points="50,25 75,50 50,75 25,50" />
              {/* Data Shape */}
              <polygon fill="rgba(0, 66, 195, 0.15)" points="50,15 80,50 50,82 30,50" stroke="#0042c3" strokeWidth="1.5" />
              <circle cx="50" cy="15" fill="#0042c3" r="2.5" />
              <circle cx="80" cy="50" fill="#705d00" r="2.5" />
              <circle cx="50" cy="82" fill="#005b3d" r="2.5" />
              <circle cx="30" cy="50" fill="#ba1a1a" r="2.5" />
              {/* Labels */}
              <text className="text-[7px] font-bold fill-primary" textAnchor="middle" x="50" y="5">วิชาการ</text>
              <text className="text-[7px] font-bold fill-secondary" textAnchor="start" x="93" y="52">สื่อสาร</text>
              <text className="text-[7px] font-bold fill-tertiary" textAnchor="middle" x="50" y="97">คิดวิเคราะห์</text>
              <text className="text-[7px] font-bold fill-error" textAnchor="end" x="7" y="52">ทีมเวิร์ค</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Outstanding Students Grid */}
      <h3 className="headline-font font-bold text-sm text-on-surface mt-6 mb-3">สรุปผลการประเมินรายบุคคลล่าสุด</h3>
      <div className="grid-4-col">
        {/* Student 1 */}
        <div className="clean-card-lowest border-t-4 border-emerald-500 flex flex-col justify-between min-h-[9rem] group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs">
              สมชาย
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">90% PROGRESS</span>
          </div>
          <div className="mt-3">
            <h4 className="font-bold text-xs text-on-surface">ด.ช.สมชาย รักเรียน</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">เกรดเฉลี่ยสะสม: 3.95</p>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="text-[8.5px] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full font-bold">MATH EXPERT</span>
            <span className="text-[8.5px] px-2 py-0.5 bg-indigo-500/10 text-indigo-700 rounded-full font-bold">LOGIC</span>
          </div>
        </div>

        {/* Student 2 */}
        <div className="clean-card-lowest border-t-4 border-[#705d00] flex flex-col justify-between min-h-[9rem] group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 text-xs">
              สมศรี
            </div>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold">65% PROGRESS</span>
          </div>
          <div className="mt-3">
            <h4 className="font-bold text-xs text-on-surface">ด.ญ.สมศรี มีสุข</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">เกรดเฉลี่ยสะสม: 3.20</p>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="text-[8.5px] px-2 py-0.5 bg-yellow-500/10 text-yellow-700 rounded-full font-bold">CREATIVE</span>
            <span className="text-[8.5px] px-2 py-0.5 bg-purple-500/10 text-purple-700 rounded-full font-bold">ART</span>
          </div>
        </div>

        {/* Student 3 */}
        <div className="clean-card-lowest border-t-4 border-error flex flex-col justify-between min-h-[9rem] group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700 text-xs">
              ใจดี
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-bold">35% PROGRESS</span>
          </div>
          <div className="mt-3">
            <h4 className="font-bold text-xs text-on-surface">ด.ช.ใจดี จริงใจ</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">เกรดเฉลี่ยสะสม: 2.15</p>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="text-[8.5px] px-2 py-0.5 bg-red-500/10 text-red-700 rounded-full font-bold">NEEDS FOCUS</span>
            <span className="text-[8.5px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold">READING</span>
          </div>
        </div>

        {/* Add Student Card Button */}
        <button 
          className="clean-card-lowest border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 hover:border-primary group transition-colors min-h-[9rem]"
          onClick={() => notify("เปิดหน้าต่างเพื่อระบุรหัสและเชิญนักเรียนใหม่")}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-sm">add</span>
          </div>
          <span className="font-bold text-xs text-on-surface-variant group-hover:text-primary">เพิ่มนักเรียนใหม่</span>
        </button>
      </div>

      {/* Submissions Table */}
      <div className="submissions-table-wrap mt-6">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex justify-between items-center bg-slate-50">
          <h3 className="headline-font font-bold text-xs text-on-surface">ประวัติการส่งงานล่าสุดของห้องเรียน</h3>
          <button className="text-primary font-bold text-xs hover:underline" onClick={() => notify("เปิดประวัติชิ้นงานทั้งหมด")}>ดูทั้งหมด</button>
        </div>
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>นักเรียน</th>
              <th style={{ width: "30%" }}>ชื่อผลงาน</th>
              <th style={{ width: "15%" }}>ประเภทงาน</th>
              <th style={{ width: "15%", textAlign: "center" }}>สถานะการประเมิน</th>
              <th style={{ width: "10%", textAlign: "right" }}>คะแนนที่ได้</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">สม</div>
                  <span className="font-semibold text-xs text-on-surface">สมชาย รักเรียน</span>
                </div>
              </td>
              <td>โครงงานวิทยาการคำนวณเบื้องต้น</td>
              <td className="text-xs text-on-surface-variant font-mono">Project</td>
              <td style={{ textAlign: "center" }}>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-500/10">ประเมินแล้ว</span>
              </td>
              <td style={{ textAlign: "right" }} className="font-bold text-xs text-primary">28/30</td>
            </tr>

            <tr>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-[10px] flex items-center justify-center font-bold">สี</div>
                  <span className="font-semibold text-xs text-on-surface">สมศรี มีสุข</span>
                </div>
              </td>
              <td>แบบทดสอบตรรกะ Scratch</td>
              <td className="text-xs text-on-surface-variant font-mono">Quiz</td>
              <td style={{ textAlign: "center" }}>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded-full border border-yellow-500/10">รอตรวจ</span>
              </td>
              <td style={{ textAlign: "right" }} className="font-bold text-xs text-slate-400">-</td>
            </tr>

            <tr>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 text-[10px] flex items-center justify-center font-bold">จี</div>
                  <span className="font-semibold text-xs text-on-surface">ใจดี จริงใจ</span>
                </div>
              </td>
              <td>ใบงาน: อัลกอริทึมแก้โจทย์</td>
              <td className="text-xs text-on-surface-variant font-mono">Homework</td>
              <td style={{ textAlign: "center" }}>
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full border border-red-500/10">ยังไม่ส่ง</span>
              </td>
              <td style={{ textAlign: "right" }} className="font-bold text-xs text-error">0/10</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4. PA PORTFOLIO VIEW (PA Tab)
   ────────────────────────────────────────────────────────────────────────── */
function PaView({ evidences, notify }: { evidences: PaEvidence[]; notify: (m: string) => void }) {
  const steps = [
    { title: "ยื่นข้อตกลง", date: "(ต.ค. 68)", done: true, current: false, icon: "check_circle" },
    { title: "อนุมัติข้อตกลง", date: "(พ.ย. 68)", done: true, current: false, icon: "check_circle" },
    { title: "จัดทำหลักฐาน", date: "(ปัจจุบัน)", done: false, current: true, icon: "edit_document" },
    { title: "ประเมินตนเอง", date: "(ส.ค. 69)", done: false, current: false, icon: "calendar_today" },
    { title: "กรรมการประเมิน", date: "(ก.ย. 69)", done: false, current: false, icon: "groups" },
  ];

  return (
    <section style={{ animation: "fadeUp 0.3s ease both" }} className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="headline-font font-bold text-xl text-on-surface">ระบบบันทึกข้อตกลงในการพัฒนางาน (วPA)</h2>
          <p className="text-xs text-on-surface-variant">รอบการประเมินประจำปีงบประมาณ พ.ศ. 2569</p>
        </div>
        <div 
          className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => notify("เรียกเครื่องมือช่วยเหลือ AI PA Helper")}
        >
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div>
            <p className="text-[8px] font-bold opacity-80 uppercase leading-none">Powered by Smart-AI</p>
            <p className="text-xs font-bold mt-0.5">AI PA Helper</p>
          </div>
        </div>
      </div>

      {/* Progress & Timeline Bento Grid */}
      <div className="bento-layout">
        {/* Progress Card (4 Cols) */}
        <div className="bento-col-4 clean-card-lowest flex flex-col justify-between min-h-[14rem]">
          <div>
            <h3 className="headline-font font-bold text-sm text-on-surface">ความก้าวหน้าโดยรวม</h3>
            <p className="text-xs text-on-surface-variant mt-1">คุณจัดทำชิ้นงานสะสมผลงานสำเร็จแล้ว 4 จาก 6 ตัวบ่งชี้</p>
          </div>

          <div className="my-4">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: "65%", 
                  background: "linear-gradient(90deg, #0042c3 0%, #10b981 100%)",
                  boxShadow: "0 0 10px rgba(16,185,129,0.5)" 
                }} 
              />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-primary leading-none">65%</span>
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full border border-white bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shadow-sm">PA1</div>
              <div className="w-7 h-7 rounded-full border border-white bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shadow-sm">PA2</div>
              <div className="w-7 h-7 rounded-full border border-white bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-[9px] shadow-sm">PA3</div>
            </div>
          </div>
        </div>

        {/* Timeline (8 Cols) */}
        <div className="bento-col-8 clean-card-lowest space-y-4">
          <h3 className="headline-font font-bold text-sm text-on-surface">ไทม์ไลน์การดำเนินงาน วPA</h3>
          <div className="timeline-track">
            <div className="timeline-line" />
            {steps.map((s, idx) => (
              <div key={idx} className="timeline-node">
                <div className={`timeline-circle ${
                  s.done ? "timeline-circle-completed" : s.current ? "timeline-circle-active" : ""
                }`}>
                  {s.done ? (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">{s.icon}</span>
                  )}
                </div>
                <div>
                  <p className={`text-[10px] font-bold leading-tight ${
                    s.done ? "text-emerald-700" : s.current ? "text-primary" : "text-on-surface-variant"
                  }`}>
                    {s.title}
                  </p>
                  <p className="text-[8px] text-on-surface-variant mt-0.5">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bento-layout">
        {/* Left List (7 Cols) */}
        <div className="bento-col-7 clean-card-lowest space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
            <h3 className="headline-font font-bold text-sm text-on-surface">รายการหลักฐานประกอบ</h3>
            <button className="text-primary font-bold text-xs flex items-center gap-1 hover:underline" onClick={() => notify("เปิดการกรองเอกสาร")}>
              <span className="material-symbols-outlined text-sm">filter_list</span> ตัวกรองข้อมูล
            </button>
          </div>

          <div className="space-y-3">
            {evidences.map((e, idx) => (
              <div key={e.id || idx} className="p-3 bg-surface border border-outline-variant/15 hover:border-primary/50 transition-colors rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    e.category === "learning_design" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {e.category === "learning_design" ? "picture_as_pdf" : "image"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{e.title}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{e.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    e.category === "learning_design" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {e.category === "learning_design" ? "ตรวจสอบแล้ว" : "รอการตรวจ"}
                  </span>
                  <button className="material-symbols-outlined text-on-surface-variant hover:text-primary text-sm" onClick={() => notify("ตั้งค่าเอกสาร")}>more_vert</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Advice (5 Cols) */}
        <div className="bento-col-5 space-y-4">
          <div className="p-5 rounded-3xl bg-primary-container/5 border border-primary-container/10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <h3 className="headline-font font-bold text-sm text-primary">AI แนะนำระบบ วPA</h3>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              "คุณครูขาดเอกสาร <strong>บันทึกสะท้อนผลการเรียนรู้รายเดือน (ก.พ.)</strong> แนะนำให้อัปโหลดไฟล์สรุปผลเพิ่มเติมเพื่อให้ชุดข้อมูล วPA ครบถ้วนตามตัวชี้วัด 1.2"
            </p>
            <div 
              className="bg-white p-3 rounded-xl border border-primary/5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => notify("เปิดหน้าต่างอัปโหลดด่วน")}
            >
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                <span className="text-[11px] font-bold">อัปโหลดไฟล์สะท้อนผล</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
            </div>
          </div>

          <div className="clean-card-lowest p-4 space-y-3">
            <h4 className="font-bold text-xs text-on-surface border-b border-outline-variant/20 pb-2">ชั่วโมงภาระงานตาม วPA</h4>
            <div className="space-y-2 text-[11px] font-semibold text-on-surface-variant">
              <div className="flex justify-between">
                <span>ชั่วโมงสอนตามตารางสอน</span>
                <span className="text-on-surface">18 ชม./สัปดาห์</span>
              </div>
              <div className="flex justify-between">
                <span>ชั่วโมงงานสนับสนุน/ตอบสนอง</span>
                <span className="text-emerald-700">2 ชม./สัปดาห์</span>
              </div>
              <div className="h-[1px] bg-slate-200 mt-2" />
              <div className="flex justify-between text-xs font-bold text-primary pt-1">
                <span>รวมทั้งหมด</span>
                <span>24 ชม./สัปดาห์</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="w-full py-3 text-sm text-white font-bold hover:shadow-lg transition-shadow flex items-center justify-center gap-1.5"
        style={{
          background: "linear-gradient(135deg, #0042c3 0%, #10b981 100%)",
          borderRadius: "0.75rem",
          border: "none",
          cursor: "pointer"
        }}
        onClick={() => window.location.href = "/app/pa/preview"}
      >
        <span className="material-symbols-outlined text-sm">bar_chart</span>
        เปิดดูตัวอย่างแฟ้มสะสมงาน วPA / เตรียมพิมพ์สรุปรายงาน PDF
      </button>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   5. ASSESSMENTS / TASKS VIEW (Work Tab)
   ────────────────────────────────────────────────────────────────────────── */
function WorkView({ assignments, notify }: { assignments: AssignmentSummary[]; notify: (m: string) => void }) {
  const [filter, setFilter] = useState<"pending" | "published" | "completed">("pending");

  return (
    <section style={{ animation: "fadeUp 0.3s ease both" }} className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="headline-font font-bold text-xl text-on-surface">รายการภาระงานและการประเมิน</h2>
          <p className="text-xs text-on-surface-variant">จัดการส่งงาน ตรวจสอบคะแนน และRubric การส่งงาน</p>
        </div>
        <button 
          className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:shadow-md transition-shadow border-none cursor-pointer"
          onClick={() => window.location.href = "/app/assignments"}
        >
          <span className="material-symbols-outlined text-xs">add_circle</span>
          สร้างชิ้นงานประเมิน
        </button>
      </div>

      {/* Segmented Controller Tab */}
      <div className="segmented w-full max-w-sm mb-4">
        <button 
          type="button" 
          className={filter === "pending" ? "is-selected" : ""} 
          onClick={() => setFilter("pending")}
        >
          รอการตรวจสอบ
        </button>
        <button 
          type="button" 
          className={filter === "published" ? "is-selected" : ""} 
          onClick={() => setFilter("published")}
        >
          กำลังเปิดรับส่ง
        </button>
        <button 
          type="button" 
          className={filter === "completed" ? "is-selected" : ""} 
          onClick={() => setFilter("completed")}
        >
          ประเมินเสร็จสิ้น
        </button>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.map(a => (
          <div key={a.id} className="clean-card-lowest border-l-4 border-error space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant">
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full uppercase">ครบกำหนดวันนี้</span>
              <span>นักเรียนส่งชิ้นงานแล้ว {a.submittedCount} จาก {a.studentCount} คน</span>
            </div>
            <h3 className="headline-font font-bold text-sm text-on-surface mt-1">{a.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{a.description}</p>
            <div className="pt-2 border-t border-outline-variant/10 flex justify-between items-center">
              <span className="text-[10px] text-on-surface-variant font-bold">Rubrics: 4 ระดับคุณภาพ</span>
              <button 
                className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:shadow-sm transition-shadow border-none cursor-pointer"
                onClick={() => window.location.href = `/app/assignments?assignmentId=${a.id}`}
              >
                ตรวจผลงาน ({a.pendingReviewCount} รายการรอตรวจ) →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
