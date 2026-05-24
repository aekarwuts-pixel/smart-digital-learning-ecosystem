"use client";

import { useActionState, useState } from "react";
import { type LoginState, signIn } from "@/app/login/actions";

const initialState: LoginState = { message: "" };

type ReasonKey = "pending" | "rejected" | string | undefined;

function getReasonBanner(reason: ReasonKey) {
  if (reason === "pending") return {
    text: "⏳ บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ",
    type: "warning" as const
  };
  if (reason === "rejected") return {
    text: "🚫 บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ",
    type: "error" as const
  };
  return null;
}

export function LoginForm({ isDemoMode, reason }: { isDemoMode: boolean; reason?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [loginMode, setLoginMode] = useState<"staff" | "student">("staff");
  const reasonBanner = getReasonBanner(reason);

  return (
    <main style={styles.root}>
      {/* Background blobs */}
      <div style={styles.blob1} aria-hidden />
      <div style={styles.blob2} aria-hidden />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <span style={styles.logoLetter}>M</span>
          </div>
          <div>
            <p style={styles.logoSub}>M Learning Ecosystem</p>
            <p style={styles.logoTitle}>ระบบการเรียนรู้ดิจิทัล</p>
          </div>
        </div>

        {/* Reason / Demo banners */}
        {reasonBanner && (
          <div style={{
            ...styles.banner,
            background: reasonBanner.type === "error"
              ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.10)",
            borderColor: reasonBanner.type === "error" ? "#ef4444" : "#f59e0b",
            color: reasonBanner.type === "error" ? "#dc2626" : "#b45309",
          }}>
            {reasonBanner.text}
          </div>
        )}
        {isDemoMode && (
          <div style={{ ...styles.banner, background: "rgba(99,102,241,0.08)", borderColor: "#818cf8", color: "#4f46e5" }}>
            🎮 โหมด Demo — ข้อมูลเป็นตัวอย่างเท่านั้น
          </div>
        )}

        {/* Tab switcher */}
        <div style={styles.tabRow} role="tablist">
          <button
            id="tab-staff"
            type="button"
            role="tab"
            aria-selected={loginMode === "staff"}
            style={{ ...styles.tab, ...(loginMode === "staff" ? styles.tabActive : {}) }}
            onClick={() => setLoginMode("staff")}
          >
            <span style={styles.tabIcon}>🏫</span> บุคลากร
          </button>
          <button
            id="tab-student"
            type="button"
            role="tab"
            aria-selected={loginMode === "student"}
            style={{ ...styles.tab, ...(loginMode === "student" ? styles.tabActive : {}) }}
            onClick={() => setLoginMode("student")}
          >
            <span style={styles.tabIcon}>🎒</span> นักเรียน
          </button>
        </div>

        {/* Staff Form */}
        {loginMode === "staff" ? (
          <form action={formAction} style={styles.form} aria-label="เข้าสู่ระบบบุคลากร">
            <input type="hidden" name="login_type" value="staff" />

            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>อีเมล</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={isDemoMode ? "aekarwuts@gmail.com" : ""}
                  placeholder="your@email.com"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="password" style={styles.label}>รหัสผ่าน</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔑</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  defaultValue={isDemoMode ? "Masusp320" : ""}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button id="btn-staff-login" type="submit" disabled={pending} style={styles.submitBtn}>
              {pending ? (
                <><span style={styles.spinner} /> กำลังเข้าสู่ระบบ...</>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          /* Student Form */
          <form action={formAction} style={styles.form} aria-label="เข้าสู่ระบบนักเรียน">
            <input type="hidden" name="login_type" value="student" />

            <div style={styles.fieldGroup}>
              <label htmlFor="student-code" style={styles.label}>รหัสนักเรียน</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🪪</span>
                <input
                  id="student-code"
                  name="student_code"
                  type="text"
                  autoComplete="username"
                  placeholder="เช่น S001"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="student-pin" style={styles.label}>รหัส PIN</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="student-pin"
                  name="secret_pin"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••"
                  inputMode="numeric"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button id="btn-student-login" type="submit" disabled={pending} style={{ ...styles.submitBtn, background: "linear-gradient(135deg, #059669, #10b981)" }}>
              {pending ? (
                <><span style={styles.spinner} /> กำลังเข้าสู่ระบบ...</>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>
        )}

        {/* Error message */}
        {state.message && (
          <div style={styles.errorMsg} role="alert" aria-live="assertive">
            ⚠️ {state.message}
          </div>
        )}

        {/* Footer links */}
        <div style={styles.footerLinks}>
          <a id="link-register" href="/register" style={styles.footerLink}>
            ลงทะเบียนบุคลากรใหม่
          </a>
          <span style={styles.footerDot}>·</span>
          <a id="link-setup" href="/setup" style={styles.footerLink}>
            ตรวจสอบการตั้งค่า
          </a>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        input:focus {
          outline: none;
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        button:not([disabled]):hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        button:not([disabled]):active {
          transform: translateY(0);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #eff6ff 100%)",
    fontFamily: "'Sarabun', sans-serif",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(129,140,248,0.25) 0%, transparent 70%)",
    top: "-80px",
    left: "-100px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(52,211,153,0.20) 0%, transparent 70%)",
    bottom: "-60px",
    right: "-80px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "24px",
    padding: "2rem 2rem 1.5rem",
    boxShadow: "0 8px 40px rgba(99,102,241,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.9)",
    animation: "fadeSlideUp 0.4s ease both",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    marginBottom: "1.5rem",
  },
  logoCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
    flexShrink: 0,
  },
  logoLetter: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "1.4rem",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: "0.72rem",
    color: "#6366f1",
    fontWeight: 600,
    margin: 0,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  logoTitle: {
    fontSize: "0.95rem",
    color: "#1e293b",
    fontWeight: 700,
    margin: "0.1rem 0 0",
  },
  banner: {
    borderRadius: "10px",
    border: "1px solid",
    padding: "0.65rem 0.85rem",
    fontSize: "0.82rem",
    marginBottom: "1rem",
    lineHeight: 1.5,
    fontWeight: 500,
  },
  tabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "0.3rem",
    marginBottom: "1.5rem",
  },
  tab: {
    border: "none",
    borderRadius: "9px",
    padding: "0.6rem 0.5rem",
    fontSize: "0.85rem",
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    background: "transparent",
    color: "#64748b",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
  },
  tabActive: {
    background: "#fff",
    color: "#4f46e5",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tabIcon: {
    fontSize: "1rem",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
    letterSpacing: "0.02em",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "0.75rem",
    fontSize: "1rem",
    lineHeight: 1,
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.7rem 0.85rem 0.7rem 2.5rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontFamily: "'Sarabun', sans-serif",
    background: "#f8fafc",
    color: "#1e293b",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  submitBtn: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.85rem",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "0.95rem",
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    letterSpacing: "0.02em",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  errorMsg: {
    marginTop: "0.85rem",
    padding: "0.65rem 0.85rem",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "10px",
    color: "#dc2626",
    fontSize: "0.82rem",
    fontWeight: 500,
    lineHeight: 1.5,
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "1.25rem",
  },
  footerLink: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    textDecoration: "none",
    transition: "color 0.15s",
  },
  footerDot: {
    color: "#cbd5e1",
    fontSize: "0.75rem",
  },
};
