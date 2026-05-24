"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserActionResponse = {
  success: boolean;
  message: string;
};

export async function updateUserStatus(
  profileId: string,
  status: "approved" | "rejected" | "pending"
): Promise<AdminUserActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: อัปเดตสถานะผู้ใช้จำลองสำเร็จ" };
  }

  try {
    const adminSb = createAdminClient();
    const { error } = await adminSb
      .from("profiles")
      .update({ approval_status: status })
      .eq("id", profileId);

    if (error) {
      return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
    }

    revalidatePath("/app/admin");
    revalidatePath("/app/admin/users");
    return { success: true, message: "อัปเดตสถานะอนุมัติเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function updateUserRole(
  profileId: string,
  role: "teacher" | "admin" | "leader" | "student" | "parent"
): Promise<AdminUserActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: เปลี่ยนสิทธิ์จำลองสำเร็จ" };
  }

  try {
    const adminSb = createAdminClient();
    const { error } = await adminSb
      .from("profiles")
      .update({ role })
      .eq("id", profileId);

    if (error) {
      return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
    }

    revalidatePath("/app/admin");
    revalidatePath("/app/admin/users");
    return { success: true, message: "เปลี่ยนบทบาทผู้ใช้งานเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function toggleUserActive(
  profileId: string,
  isActive: boolean
): Promise<AdminUserActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: ปรับสถานะใช้งานจำลองสำเร็จ" };
  }

  try {
    const adminSb = createAdminClient();
    const { error } = await adminSb
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", profileId);

    if (error) {
      return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
    }

    revalidatePath("/app/admin/users");
    return { success: true, message: "ปรับปรุงสถานะการใช้งานสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}

export async function deleteUserProfile(profileId: string): Promise<AdminUserActionResponse> {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "โหมด demo: ลบบัญชีจำลองสำเร็จ" };
  }

  try {
    const adminSb = createAdminClient();
    
    // Get auth_user_id first to delete from Auth too
    const { data: profile } = await adminSb
      .from("profiles")
      .select("auth_user_id")
      .eq("id", profileId)
      .maybeSingle<{ auth_user_id: string | null }>();

    if (profile?.auth_user_id) {
      await adminSb.auth.admin.deleteUser(profile.auth_user_id);
    }

    const { error } = await adminSb
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
    }

    revalidatePath("/app/admin");
    revalidatePath("/app/admin/users");
    return { success: true, message: "ลบบัญชีผู้ใช้งานออกจากระบบสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (error?.message ?? String(error)) };
  }
}
