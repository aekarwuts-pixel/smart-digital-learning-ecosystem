"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminHash } from "@/lib/admin-auth";

export type AdminLoginState = {
  message: string;
};

/**
 * Server Action to verify the admin password and set the override cookie.
 */
export async function verifyAdminPassword(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const password = String(formData.get("admin_password") ?? "");
  const expectedPassword = process.env.ADMIN_PASSWORD || "Aekarwut";

  if (!password) {
    return { message: "กรุณากรอกรหัสผ่านผู้ดูแลระบบ" };
  }

  if (password !== expectedPassword) {
    return { message: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง" };
  }

  try {
    const hash = await getAdminHash();
    const cookieStore = await cookies();
    
    // Set cookie for 2 hours
    cookieStore.set("admin_override", hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2 // 2 hours
    });
  } catch (error) {
    console.error("Failed to set admin override cookie:", error);
    return { message: "เกิดข้อผิดพลาดในการตั้งค่าสิทธิ์ผู้ดูแลระบบ" };
  }

  redirect("/app/admin");
}
