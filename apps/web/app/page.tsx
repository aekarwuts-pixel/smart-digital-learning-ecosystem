import Link from "next/link";
import { InstallAppButton } from "@/components/install-app-button";

export default function HomePage() {
  return (
    <main className="landing-root">
      <section className="landing-shell cyber-glass-card" style={{ padding: "3rem 2.5rem" }}>

        {/* Logo — same style as login page */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          marginBottom: "1.75rem",
          justifyContent: "center",
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "15px",
            background: "linear-gradient(135deg, #22c55e, #15803d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(34,197,94,0.25)",
            flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.5rem" }}>M</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{
              fontSize: "0.7rem",
              color: "#15803d",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>M Learning Ecosystem</p>
            <p style={{
              fontSize: "0.95rem",
              color: "#1e293b",
              fontWeight: 700,
              margin: "0.1rem 0 0",
            }}>ระบบการเรียนรู้ดิจิทัล</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)",
          marginBottom: "1.75rem",
        }} />

        {/* Actions */}
        <div className="landing-actions">
          <Link href="/login" className="landing-primary">
            เข้าสู่ระบบ
          </Link>
        </div>

        <InstallAppButton className="landing-install" />

      </section>
    </main>
  );
}
