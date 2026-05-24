"use server";

import { revalidatePath } from "next/cache";
import { updateSchoolConfig } from "@/lib/school-config";

export type SchoolActionResponse = {
  success: boolean;
  message: string;
};

export async function saveSchoolSettings(
  prevState: any,
  formData: FormData
): Promise<SchoolActionResponse> {
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const academicYear = Number(formData.get("academicYear") ?? 2569);
  const semester = Number(formData.get("semester") ?? 1);

  if (!schoolName || !province || !district) {
    return { success: false, message: "กรุณากรอกข้อมูลโรงเรียนให้ครบถ้วน" };
  }

  try {
    const res = await updateSchoolConfig({
      schoolName,
      province,
      district,
      academicYear,
      semester
    });

    if (res.success) {
      revalidatePath("/app/admin/school");
      revalidatePath("/app/admin");
      revalidatePath("/app");
    }
    
    return res;
  } catch (err: any) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + (err?.message ?? String(err)) };
  }
}
