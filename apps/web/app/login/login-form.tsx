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
    <main style={styles.root} className="cyber-shell">
      {/* Background blobs */}
      <div style={styles.blob1} aria-hidden />
      <div style={styles.blob2} aria-hidden />

      <div style={styles.card} className="cyber-glass-card">
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <span style={styles.logoLetter}>M</span>
          </div>
          <div>
            <p style={styles.logoSub}>M Learning Ecosystem</p>
            <p style={styles.logoTitle} className="neon-text-indigo">ระบบการเรียนรู้ดิจิทัล</p>
          </div>
        </div>

        {/* Reason / Demo banners */}
        {reasonBanner && (
          <div style={{
            ...styles.banner,
            background: reasonBanner.type === "error"
              ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
            borderColor: reasonBanner.type === "error" ? "#f87171" : "#fbbf24",
            color: reasonBanner.type === "error" ? "#f87171" : "#fbbf24",
          }}>
            {reasonBanner.text}
          </div>
        )}
        {isDemoMode && (
          <div style={{ ...styles.banner, background: "rgba(99,102,241,0.15)", borderColor: "#818cf8", color: "#818cf8" }}>
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
            className="tab-btn"
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
            className="tab-btn"
          >
            <span style={styles.tabIcon}>🎒</span> นักเรียน & ผู้ปกครอง
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

            <button id="btn-staff-login" type="submit" disabled={pending} style={styles.submitBtn} className="btn-hover">
              {pending ? (
                <><span style={styles.spinner} /> กำลังเข้าสู่ระบบ...</>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          /* Student Form */
          <form action={formAction} style={styles.form} aria-label="เข้าสู่ระบบนักเรียนและผู้ปกครอง">
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

            <button id="btn-student-login" type="submit" disabled={pending} style={{ ...styles.submitBtn, background: "linear-gradient(135deg, #059669, #10b981)" }} className="btn-hover">
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
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(129,140,248,0.25) !important;
        }

        .btn-hover:not([disabled]):hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        .btn-hover:not([disabled]):active {
          transform: translateY(0);
        }

        .tab-btn:hover {
          color: #f1f5f9 !important;
          background: rgba(255,255,255,0.03) !important;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Cyber grid overlay on login */
        .cyber-shell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
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
    background: "var(--background)",
    color: "var(--on-surface)",
    fontFamily: "'Outfit', 'Sarabun', sans-serif",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,66,195,0.06) 0%, transparent 70%)",
    top: "-80px",
    left: "-100px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,118,80,0.05) 0%, transparent 70%)",
    bottom: "-60px",
    right: "-80px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "24px",
    padding: "2rem 2rem 1.5rem",
    boxShadow: "0 20px 25px -5px rgba(0, 66, 195, 0.04), 0 10px 10px -5px rgba(0, 66, 195, 0.02)",
    border: "1px solid rgba(195,197,216,0.3)",
    animation: "fadeSlideUp 0.4s ease both",
    zIndex: 1,
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
    background: "linear-gradient(135deg, #0042c3, #007650)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,66,195,0.15)",
    flexShrink: 0,
  },
  logoLetter: {
    color: "#fff",
    fontWeight: 900,
    fontSize: "1.4rem",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: "0.72rem",
    color: "var(--primary)",
    fontWeight: 600,
    margin: 0,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  logoTitle: {
    fontSize: "0.95rem",
    fontWeight: 800,
    margin: "0.1rem 0 0",
    color: "var(--on-surface)",
  },
  banner: {
    borderRadius: "10px",
    border: "1px solid",
    padding: "0.65rem 0.85rem",
    fontSize: "0.82rem",
    marginBottom: "1rem",
    lineHeight: 1.5,
    fontWeight: 600,
  },
  tabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
    background: "var(--surface-container-low)",
    borderRadius: "12px",
    padding: "0.3rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(195,197,216,0.3)",
  },
  tab: {
    border: "none",
    borderRadius: "9px",
    padding: "0.6rem 0.5rem",
    fontSize: "0.85rem",
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "var(--on-surface-variant)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
  },
  tabActive: {
    background: "rgba(0, 66, 195, 0.08)",
    color: "var(--primary)",
    fontWeight: 700,
    border: "1px solid rgba(0, 66, 195, 0.15)",
    boxShadow: "none",
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
    color: "var(--on-surface-variant)",
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
    border: "1.5px solid var(--outline-variant)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontFamily: "'Sarabun', sans-serif",
    background: "var(--surface)",
    color: "var(--on-surface)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  submitBtn: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.85rem",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #0042c3, #007650)",
    color: "#fff",
    fontSize: "0.95rem",
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(0,66,195,0.15)",
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
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "10px",
    color: "#ba1a1a",
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
    color: "var(--on-surface-variant)",
    textDecoration: "none",
    transition: "color 0.15s",
  },
  footerDot: {
    color: "rgba(195,197,216,0.3)",
    fontSize: "0.75rem",
  },
};
