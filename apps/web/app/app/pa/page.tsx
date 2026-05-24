import Link from "next/link";
import { EvidenceForm } from "@/app/app/pa/evidence-form";
import { getPaEvidences } from "@/lib/queries/pa";

export default async function PaPage() {
  const evidences = await getPaEvidences();

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" aria-labelledby="pa-page-title">
        <p className="eyebrow">จัดการหลักฐาน วPA</p>
        <h1 id="pa-page-title">เพิ่ม เก็บ ดูแล และอนุมัติหลักฐาน วPA</h1>
        <p className="lead">มีคำแนะนำต่อรายการ, workflow สถานะ, และคอมเมนต์ผู้ตรวจในหน้าเดียว</p>
        <div className="landing-actions">
          <Link className="landing-primary" href="/app/pa/preview" style={{ marginBottom: "5px" }}>
            📊 ดูแฟ้มสะสมงาน วPA / เตรียมพิมพ์ PDF
          </Link>
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <Link className="landing-secondary" href="/app" style={{ flex: 1, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "40px" }}>กลับ Dashboard</Link>
            <Link className="landing-secondary" href="/app/import-export" style={{ flex: 1, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "40px" }}>จัดการไฟล์</Link>
          </div>
        </div>
        <EvidenceForm evidences={evidences} />
      </section>
    </main>
  );
}
