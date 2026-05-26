import fs from "fs";
import path from "path";
import { demoEvidences } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { PaEvidence } from "@/lib/database.types";

export { demoEvidences };


function getLocalBehaviorEvidences(): PaEvidence[] {
  const list: PaEvidence[] = [];
  try {
    const filePath = path.join(process.cwd(), "behavior-logs.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      const logs = JSON.parse(fileData);
      const exported = logs.filter((l: any) => l.is_exported_to_pa);
      
      const categoryLabel: Record<string, string> = {
        positive: "พฤติกรรมเชิงบวก 👍",
        negative: "พฤติกรรมควรปรับปรุง ⚠️",
        home_visit: "เยี่ยมบ้านนักเรียน 🏠",
        counseling: "ให้คำปรึกษาแนะแนว 💬",
        parent_contact: "ประสานงานผู้ปกครอง 📞"
      };

      exported.forEach((l: any) => {
        list.push({
          id: l.pa_evidence_id || l.id,
          teacher_id: l.teacher_id,
          course_id: null,
          assignment_id: null,
          submission_id: null,
          lesson_id: null,
          category: "student_support",
          title: `[ระบบดูแลช่วยเหลือผู้เรียน] ${l.title}`,
          description: `นักเรียน: ${l.student_name || "ไม่ระบุ"}\nประเภท: ${categoryLabel[l.category] || l.category}\nคะแนนพฤติกรรม: ${l.points > 0 ? "+" : ""}${l.points} คะแนน\nรายละเอียด: ${l.description || "ไม่มีรายละเอียดเพิ่มเติม"}`,
          indicator_code: "วPA 2.2",
          academic_year: 2569,
          evidence_date: l.log_date
        });
      });
    }
  } catch (err) {
    console.error("Error reading local behavior logs for PA:", err);
  }
  return list;
}

function getLocalPaEvidences(): PaEvidence[] {
  try {
    const filePath = path.join(process.cwd(), "local-pa-evidences.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileData) as PaEvidence[];
    }
  } catch (err) {
    console.error("Error reading local PA evidences:", err);
  }
  return [];
}

export async function getPaEvidences(): Promise<PaEvidence[]> {
  const localBehaviorEvidences = getLocalBehaviorEvidences();
  const localPaEvidences = getLocalPaEvidences();
  const allLocal = [...localBehaviorEvidences, ...localPaEvidences];

  if (!hasSupabaseEnv()) {
    return [...allLocal, ...demoEvidences];
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [...localBehaviorEvidences, ...demoEvidences];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!profile) {
    return [...localBehaviorEvidences, ...demoEvidences];
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();

  if (!teacher) {
    return [...allLocal, ...demoEvidences];
  }

  const { data } = await supabase
    .from("pa_evidences")
    .select(
      "id, teacher_id, course_id, assignment_id, submission_id, lesson_id, category, title, description, indicator_code, academic_year, evidence_date"
    )
    .eq("teacher_id", teacher.id)
    .order("evidence_date", { ascending: false })
    .limit(20)
    .returns<PaEvidence[]>();

  const dbEvidences = data?.length ? data : demoEvidences;
  // Merge dynamic local evidences with database ones
  return [...allLocal, ...dbEvidences];
}


export type TeacherPaProfile = {
  fullName: string;
  positionName: string;
  academicRank: string;
  subjectGroup: string;
  schoolName: string;
};

export async function getTeacherProfileForPa(): Promise<TeacherPaProfile> {
  const defaultProfile: TeacherPaProfile = {
    fullName: "คุณครู ผู้สอนคอมพิวเตอร์",
    positionName: "ครู",
    academicRank: "ชำนาญการพิเศษ",
    subjectGroup: "วิทยาศาสตร์และเทคโนโลยี",
    schoolName: "โรงเรียนเทศบาล ๑ บ้านกลาง"
  };

  if (!hasSupabaseEnv()) {
    return defaultProfile;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultProfile;

    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        full_name,
        schools ( name ),
        teachers ( position_name, academic_rank, subject_group )
      `)
      .eq("auth_user_id", user.id)
      .maybeSingle<any>();

    if (!profile) return defaultProfile;

    const schoolName = profile.schools?.name ?? defaultProfile.schoolName;
    const teacher = Array.isArray(profile.teachers) ? profile.teachers[0] : profile.teachers;

    return {
      fullName: profile.full_name || defaultProfile.fullName,
      positionName: teacher?.position_name || defaultProfile.positionName,
      academicRank: teacher?.academic_rank || defaultProfile.academicRank,
      subjectGroup: teacher?.subject_group || defaultProfile.subjectGroup,
      schoolName: schoolName
    };
  } catch (error) {
    console.error("Error fetching teacher profile for PA:", error);
    return defaultProfile;
  }
}
