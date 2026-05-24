import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="landing-root">
      <section className="landing-shell">
        <p className="eyebrow">M Learning Ecosystem</p>
        <h1>ลงทะเบียนบุคลากรใหม่</h1>
        <p>สำหรับครูและผู้บริหารที่ต้องการใช้งานระบบ (ต้องรอการอนุมัติจากผู้ดูแลระบบหลังลงทะเบียน)</p>
        <RegisterForm />
        <div style={{ marginTop: '2rem' }}>
          <Link href="/login" className="ghost-link">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </section>
    </main>
  );
}
