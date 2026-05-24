"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminStudentActionResponse = {
  success: boolean;
  message: string;
};

export async function resetStudentPin(
  studentId: string,
  newPin: string
): Promise<AdminStudentActionResponse> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: `โหมด demo: รีเซ็ตรหัส PIN สำเร็จ (PIN ใหม่คือ: ${newPin})`
    };
  }

  if (!studentId || !newPin.trim()) {
    return { success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับรีเซ็ตรหัสผ่าน" };
  }

  try {
    const adminSb = createAdminClient();
    const hashed = await bcrypt.hash(newPin.trim(), 10);

    const { error } = await adminSb
      .from("students")
      .update({ secret_pin: hashed })
      .eq("id", studentId);

    if (error) {
      return { success: false, message: "รีเซ็ตรหัสผ่านล้มเหลว: " + error.message };
    }

    revalidatePath("/app/admin/students");
    return { success: true, message: `รีเซ็ตรหัส PIN สำเร็จ! รหัสผ่านเข้าใช้งานใหม่คือ: ${newPin}` };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function updateStudentDetails(
  studentId: string,
  studentCode: string,
  firstName: string,
  lastName: string,
  gradeLevel: string,
  room: string
): Promise<AdminStudentActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: บันทึกข้อมูลแก้ไขนักเรียนสำเร็จ" };
  }

  if (!studentId || !studentCode || !firstName || !lastName) {
    return { success: false, message: "กรุณากรอกข้อมูลนักเรียนให้ครบถ้วน" };
  }

  try {
    const adminSb = createAdminClient();
    
    const { error } = await adminSb
      .from("students")
      .update({
        student_code: studentCode.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        grade_level: gradeLevel,
        room
      })
      .eq("id", studentId);

    if (error) {
      return { success: false, message: "แก้ไขข้อมูลนักเรียนล้มเหลว: " + error.message };
    }

    revalidatePath("/app/admin/students");
    revalidatePath("/app/students");
    return { success: true, message: "แก้ไขข้อมูลนักเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function deleteStudent(studentId: string): Promise<AdminStudentActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: ลบข้อมูลนักเรียนสำเร็จ" };
  }

  try {
    const adminSb = createAdminClient();
    const { error } = await adminSb.from("students").delete().eq("id", studentId);

    if (error) {
      return { success: false, message: "ลบนักเรียนล้มเหลว: " + error.message };
    }

    revalidatePath("/app/admin/students");
    revalidatePath("/app/students");
    return { success: true, message: "ลบรายชื่อนักเรียนออกจากระบบสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
