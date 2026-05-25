"use client";

import { useActionState } from "react";
import { verifyAdminPassword } from "./actions";
import Link from "next/link";

const initialState = { message: "" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(verifyAdminPassword, initialState);

  return (
    <main style={styles.root}>
      {/* Background decoration */}
      <div style={styles.blob1} aria-hidden />
      <div style={styles.blob2} aria-hidden />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <span style={styles.logoLetter}>⚙️</span>
          </div>
          <div>
            <p style={styles.subTitle}>M Learning Ecosystem</p>
            <h1 style={styles.title}>สิทธิ์ผู้ดูแลระบบ</h1>
          </div>
        </div>

        <p style={styles.description}>
          คุณกำลังเข้าสู่พื้นที่จำกัดสำหรับผู้ดูแลระบบ (Admin) กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
        </p>

        {/* Form */}
        <form action={formAction} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="admin_password" style={styles.label}>
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                id="admin_password"
                name="admin_password"
                type="password"
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                required
                autoFocus
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={pending} style={styles.submitBtn}>
            {pending ? "กำลังตรวจสอบ..." : "ยืนยันรหัสผ่าน"}
          </button>
        </form>

        {/* Error Message */}
        {state.message && (
          <div style={styles.errorMsg} role="alert">
            ⚠️ {state.message}
          </div>
        )}

        {/* Footer Link */}
        <div style={styles.footer}>
          <Link href="/app" style={styles.cancelLink}>
            ← กลับไปแดชบอร์ดครู
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
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
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
    fontFamily: "'Sarabun', sans-serif",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
    top: "-50px",
    left: "-50px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
    bottom: "-50px",
    right: "-50px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "380px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)",
    border: "1px solid rgba(255,255,255,0.8)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  logoCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
    fontSize: "1.25rem",
    flexShrink: 0,
  },
  logoLetter: {
    lineHeight: 1,
  },
  subTitle: {
    fontSize: "0.7rem",
    color: "#6366f1",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.05rem",
    color: "#1e293b",
    fontWeight: 800,
    margin: "0.05rem 0 0",
  },
  description: {
    fontSize: "0.82rem",
    color: "#475569",
    lineHeight: 1.5,
    margin: "0 0 1.5rem",
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
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#334155",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "0.75rem",
    fontSize: "0.95rem",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.85rem 0.65rem 2.25rem",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "0.88rem",
    fontFamily: "'Sarabun', sans-serif",
    background: "#f8fafc",
    color: "#0f172a",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  submitBtn: {
    width: "100%",
    padding: "0.75rem",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    fontSize: "0.88rem",
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  },
  errorMsg: {
    marginTop: "1rem",
    padding: "0.6rem 0.8rem",
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    color: "#b91c1c",
    fontSize: "0.78rem",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  cancelLink: {
    fontSize: "0.78rem",
    color: "#64748b",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.15s",
  },
};
