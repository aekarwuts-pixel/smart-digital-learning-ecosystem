"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterState = {
  message: string;
  success?: boolean;
};

export async function registerStaff(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const role = String(formData.get("role") ?? "teacher");

  if (!email || !password || !fullName) {
    return { message: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: fullName,
        role: role
      }
    }
  });

  if (error) {
    return { message: error.message };
  }

  if (data.user) {
    const adminSupabase = createAdminClient();
    await adminSupabase.from("profiles").insert({
      auth_user_id: data.user.id,
      full_name: fullName,
      email: email,
      role: role,
      approval_status: 'pending'
    });
  }

  return { message: "ลงทะเบียนสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติบัญชีของคุณ", success: true };
}
