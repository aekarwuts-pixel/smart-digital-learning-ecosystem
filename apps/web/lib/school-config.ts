import fs from "fs";
import path from "path";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type SchoolConfig = {
  schoolName: string;
  province: string;
  district: string;
  academicYear: number;
  semester: number;
};

const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "โรงเรียนตัวอย่างดิจิทัล",
  province: "กรุงเทพมหานคร",
  district: "เขตตัวอย่าง",
  academicYear: 2569,
  semester: 1
};

const configFilePath = path.join(process.cwd(), "school-config.json");

export function getSchoolConfig(): SchoolConfig {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, "utf8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading school config file, using defaults:", err);
  }
  return DEFAULT_CONFIG;
}

export async function getMergedSchoolConfig(): Promise<SchoolConfig> {
  const localConfig = getSchoolConfig();
  
  if (!hasSupabaseEnv()) {
    return localConfig;
  }

  try {
    const adminSb = createAdminClient();
    // Default seed school ID is '00000000-0000-0000-0000-000000000001'
    const { data, error } = await adminSb
      .from("schools")
      .select("name, province, district")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle<{ name: string; province: string | null; district: string | null }>();

    if (data && !error) {
      return {
        ...localConfig,
        schoolName: data.name,
        province: data.province ?? localConfig.province,
        district: data.district ?? localConfig.district,
      };
    }
  } catch (err) {
    console.error("Error merging database school config:", err);
  }

  return localConfig;
}

export async function updateSchoolConfig(newConfig: SchoolConfig): Promise<{ success: boolean; message: string }> {
  // 1. Write to local JSON file
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), "utf8");
  } catch (err: any) {
    console.error("Error writing school config file:", err);
  }

  // 2. Write to Supabase if connected
  if (hasSupabaseEnv()) {
    try {
      const adminSb = createAdminClient();
      
      // Update school details in Supabase
      const { error } = await adminSb
        .from("schools")
        .update({
          name: newConfig.schoolName.trim(),
          province: newConfig.province.trim(),
          district: newConfig.district.trim(),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) {
        return {
          success: false,
          message: "บันทึกข้อมูลในไฟล์สำเร็จ แต่ไม่สามารถอัปเดตข้อมูลบนระบบคลาวด์ได้: " + error.message
        };
      }
      
      return {
        success: true,
        message: "บันทึกตั้งค่าโรงเรียนและปีการศึกษาสำเร็จเสร็จสิ้น!"
      };
    } catch (err: any) {
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์: " + (err?.message ?? String(err))
      };
    }
  }

  return {
    success: true,
    message: "บันทึกตั้งค่าโรงเรียนในโหมด Demo สำเร็จ!"
  };
}
