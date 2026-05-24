"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export type LoginState = {
  message: string;
};

export async function signIn(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  if (!hasSupabaseEnv()) {
    return {
      message: "ยังไม่ได้ตั้งค่า Supabase env ตอนนี้ใช้โหมด demo ได้จากปุ่มทดลองเข้าใช้งาน"
    };
  }

  const loginType = String(formData.get("login_type") ?? "staff");

  // ─────────────────────────────────────────────────────────────
  // STUDENT / PARENT LOGIN (Cookie Session + bcrypt PIN verify)
  // ─────────────────────────────────────────────────────────────
  if (loginType === "student") {
    const studentCode = String(formData.get("student_code") ?? "").trim();
    const secretPin   = String(formData.get("secret_pin")   ?? "").trim();

    if (!studentCode || !secretPin) {
      return { message: "กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบถ้วน" };
    }

    try {
      const adminSupabase = createAdminClient();
      const { data: student, error } = await adminSupabase
        .from("students")
        .select("id, secret_pin")
        .eq("student_code", studentCode)
        .maybeSingle();

      if (error || !student || !student.secret_pin) {
        return { message: "รหัสนักเรียน หรือรหัสผ่านไม่ถูกต้อง" };
      }

      // Support both bcrypt-hashed PINs and legacy plain-text PINs
      // (legacy path is automatically removed once hash_pins_migration.js is run)
      const pin = student.secret_pin as string;
      const isHashed = pin.startsWith("$2a$") || pin.startsWith("$2b$");
      const isMatch = isHashed
        ? await bcrypt.compare(secretPin, pin)
        : pin === secretPin; // plain-text fallback (pre-migration)

      if (!isMatch) {
        return { message: "รหัสนักเรียน หรือรหัสผ่านไม่ถูกต้อง" };
      }

      // Set secure session cookie (7 days)
      const cookieStore = await cookies();
      cookieStore.set("student_session_id", student.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });
    } catch {
      return { message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" };
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — /app/student exists but typed-routes registry needs a rebuild
    redirect("/app/student");
  }

  // ─────────────────────────────────────────────────────────────
  // STAFF LOGIN (Supabase Auth — email + password)
  // ─────────────────────────────────────────────────────────────
  const email    = String(formData.get("email")    ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน" };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { message: "อีเมล หรือรหัสผ่านไม่ถูกต้อง" };
    }
    return { message: error.message };
  }

  // Redirect based on role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — /app/admin exists but typed-routes registry needs rebuild
    redirect("/app/admin");
  }

  redirect("/app");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("student_session_id");

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
