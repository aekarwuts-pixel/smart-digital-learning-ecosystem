"use client";

import { useActionState } from "react";
import { type RegisterState, registerStaff } from "./actions";

const initialState: RegisterState = {
  message: "",
  success: false
};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerStaff, initialState);

  if (state.success) {
    return (
      <div className="notice-box" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <strong>{state.message}</strong>
      </div>
    );
  }

  return (
    <form className="login-form" action={formAction}>
      <label>
        ชื่อ-นามสกุล
        <input name="full_name" type="text" placeholder="ระบุชื่อ-นามสกุล" required />
      </label>
      <label>
        ตำแหน่ง (บทบาท)
        <select name="role" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}>
          <option value="teacher">ครูผู้สอน (Teacher)</option>
          <option value="leader">ผู้บริหาร (Leader)</option>
        </select>
      </label>
      <label>
        อีเมล (ใช้สำหรับเข้าสู่ระบบ)
        <input name="email" type="email" placeholder="example@school.ac.th" required />
      </label>
      <label>
        รหัสผ่าน
        <input name="password" type="password" placeholder="ตั้งรหัสผ่าน 8 ตัวอักษรขึ้นไป" required minLength={8} />
      </label>
      <button className="wide-button" type="submit" disabled={pending}>
        {pending ? "กำลังลงทะเบียน..." : "ลงทะเบียนขอใช้งาน"}
      </button>
      
      {state.message ? <p className="form-message">{state.message}</p> : null}
    </form>
  );
}
