"use server";

import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";
import { getSchoolConfig } from "@/lib/school-config";

export type LessonPlanInput = {
  courseId: string;
  unitTitle: string;
  lessonTitle: string;
  gradeLevel: string;
  durationHours: number;
  teachingMethod: "5e" | "active6" | "pbl";
  alignmentIndicators: string[];
};

export type GeneratedLessonPlan = {
  title: string;
  gradeLevel: string;
  unitTitle: string;
  durationHours: number;
  teachingMethod: string;
  standardCode: string;
  indicatorCode: string;
  objectives: {
    k: string; // Knowledge
    p: string; // Process/Skill
    a: string; // Attitude
  };
  keyConcept: string;
  steps: Array<{
    name: string;
    detail: string;
  }>;
  media: string[];
  evaluation: Array<{
    method: string;
    tool: string;
    criteria: string;
  }>;
  paAlignmentScore: number;
  paAlignmentRemarks: string[];
};

export type LearningUnitItem = {
  id: string;
  title: string;
  standard_code: string | null;
  indicator_code: string | null;
};

// Paths for local JSON fallback persistence in Demo Mode
const localPaEvidencesPath = path.join(process.cwd(), "local-pa-evidences.json");
const localLessonsPath = path.join(process.cwd(), "local-lessons.json");

function readLocalJson<T>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data) as T[];
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return [];
}

function writeLocalJson<T>(filePath: string, data: T[]): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
}

export async function getLearningUnits(courseId: string): Promise<LearningUnitItem[]> {
  if (!hasSupabaseEnv() || courseId.startsWith("demo-")) {
    return [
      { id: "u1", title: "หน่วยที่ 1: แนวคิดเชิงคำนวณกับการแก้ปัญหา", standard_code: "ว 4.2", indicator_code: "ม.2/1" },
      { id: "u2", title: "หน่วยที่ 2: การเขียนโปรแกรมและการแก้โจทย์", standard_code: "ว 4.2", indicator_code: "ม.2/2" },
      { id: "u3", title: "หน่วยที่ 3: ความรู้เท่าทันเทคโนโลยีและสื่อ", standard_code: "ว 4.2", indicator_code: "ม.2/4" }
    ];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_units")
      .select("id, title, standard_code, indicator_code")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })
      .returns<LearningUnitItem[]>();

    if (error || !data) {
      console.warn("Failed to fetch units from DB, returning empty", error?.message);
      return [];
    }
    return data;
  } catch (err) {
    console.error("Error in getLearningUnits:", err);
    return [];
  }
}

export async function generateLessonPlanAction(input: LessonPlanInput): Promise<GeneratedLessonPlan> {
  // Simulate network delay for AI processing
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { lessonTitle, unitTitle, gradeLevel, durationHours, teachingMethod, alignmentIndicators } = input;

  // Determine key science / coding words to customize the AI response
  const titleLower = lessonTitle.toLowerCase();
  let isCoding = titleLower.includes("เขียนโปรแกรม") || titleLower.includes("โค้ด") || titleLower.includes("เงื่อนไข") || titleLower.includes("program") || titleLower.includes("loop") || titleLower.includes("algorithm");
  let isDecomp = titleLower.includes("แยกแยะ") || titleLower.includes("ย่อย") || titleLower.includes("decomposition") || titleLower.includes("คำนวณ");
  
  // Set default standards based on gradeLevel
  const stdCode = "ว 4.2";
  const indCode = gradeLevel.includes("ม.2") ? "ม.2/1" : gradeLevel.includes("ม.1") ? "ม.1/1" : "ป.4/1";

  // Customize objectives based on input keywords
  let kObj = `ผู้เรียนเข้าใจกระบวนการทำงานและสามารถอธิบายหลักการของเรื่อง ${lessonTitle} ได้อย่างถูกต้อง`;
  let pObj = `ผู้เรียนสามารถออกแบบอัลกอริทึมและเขียนผังงานเพื่อประยุกต์ใช้วิเคราะห์เรื่อง ${lessonTitle} ในสถานการณ์ที่กำหนดได้`;
  let aObj = `ผู้เรียนแสดงพฤติกรรมการมีส่วนร่วม การทำงานเป็นทีม และมีความรับผิดชอบต่อชิ้นงานที่ได้รับมอบหมาย`;
  let concept = `กระบวนการจัดการเรียนรู้นี้มุ่งพัฒนาให้ผู้เรียนเข้าใจองค์ประกอบและวิธีการแก้ปัญหาด้วยหลักวิทยาการคำนวณเชิงลึก`;

  if (isCoding) {
    kObj = `ผู้เรียนสามารถอธิบายโครงสร้าง ลำดับการทำงาน และหลักการเขียนโปรแกรมเชิงตรรกะเรื่อง ${lessonTitle} ได้`;
    pObj = `ผู้เรียนสามารถพัฒนาโปรแกรมคอมพิวเตอร์อย่างง่ายตามเงื่อนไขที่กำหนดเพื่อแก้ปัญหาในการเรียนรู้ได้`;
    concept = `การเรียนรู้โครงสร้างและเงื่อนไขการเขียนโปรแกรม ช่วยเสริมสร้างกระบวนการคิดเชิงตรรกะ (Logical Thinking) และการพัฒนานวัตกรรมดิจิทัล`;
  } else if (isDecomp) {
    kObj = `ผู้เรียนอธิบายหลักการแบ่งแยกปัญหาขนาดใหญ่ออกเป็นปัญหาย่อย (Decomposition) เรื่อง ${lessonTitle} ได้`;
    pObj = `ผู้เรียนวิเคราะห์แบ่งแยกองค์ประกอบของสถานการณ์ปัญหาซับซ้อนเพื่อหาแนวทางการแก้ปัญหาทีละส่วนได้`;
    concept = `การแบ่งย่อยปัญหาเป็นทักษะหลักในการคิดเชิงคำนวณ ช่วยลดความซับซ้อนของข้อมูลและจัดระเบียบวิธีการแก้ปัญหาอย่างเป็นระบบ`;
  }

  // Generate pedagogical steps
  let steps: Array<{ name: string; detail: string }> = [];

  if (teachingMethod === "5e") {
    steps = [
      {
        name: "1. ขั้นกระตุ้นความสนใจ (Engagement)",
        detail: `ครูนำเข้าสู่บทเรียนโดยเปิดภาพจำลองหรือตั้งคำถามเชื่อมโยงชีวิตประจำวันเกี่ยวกับ ${lessonTitle} เพื่อกระตุ้นความคิดผู้เรียน ครูชวนสังเกตสัญลักษณ์และประเด็นที่น่าสนใจ`
      },
      {
        name: "2. ขั้นสำรวจและค้นหา (Exploration)",
        detail: `แบ่งกลุ่มผู้เรียนเป็นกลุ่มละ 4 คน ร่วมกันศึกษาใบกิจกรรมและทบทวนข้อมูลเกี่ยวกับ ${lessonTitle} นักเรียนลงมือปฏิบัติกิจกรรมกลุ่มโดยใช้อุปกรณ์สื่อการเรียนรู้เชิงโต้ตอบ`
      },
      {
        name: "3. ขั้นอธิบายและลงข้อสรุป (Explanation)",
        detail: `ตัวแทนนักเรียนแต่ละกลุ่มนำเสนอโครงสร้างผลงานจากการเรียนรู้ ครูชวนนักเรียนวิเคราะห์วิจารณ์ร่วมกัน และครูสรุปความรู้ผ่านสื่อสไลด์เชื่อมโยงตัวอย่างเพื่อให้เห็นภาพ`
      },
      {
        name: "4. ขั้นขยายความรู้ (Elaboration)",
        detail: `นักเรียนทำแบบฝึกหัดท้าทายเพิ่มเติม โดยประยุกต์ใช้ความรู้เรื่อง ${lessonTitle} มาแก้โจทย์ใหม่ที่มีระดับความซับซ้อนมากขึ้น นักเรียนแลกเปลี่ยนคำแนะนำข้ามกลุ่ม`
      },
      {
        name: "5. ขั้นประเมินผล (Evaluation)",
        detail: `นักเรียนทำแบบทดสอบหลังเรียนสั้นๆ ครูตรวจชิ้นงานกลุ่มโดยใช้เกณฑ์การประเมินรูบริกส์ (Rubrics) และให้นักเรียนร่วมประเมินความพึงพอใจและสะท้อนคิดท้ายบทเรียน`
      }
    ];
  } else if (teachingMethod === "active6") {
    steps = [
      {
        name: "1. ขั้นนำเข้าสู่บทเรียนและท้าทายความคิด (Warm Up & Challenge)",
        detail: `ครูใช้กิจกรรมสั้นๆ หรือปริศนาตรรกะกระตุ้นความสนใจ แจ้งเป้าหมายกิจกรรม และประเด็นคะแนนสะสมพิเศษสำหรับกลุ่มที่วิเคราะห์สถานการณ์ได้ยอดเยี่ยม`
      },
      {
        name: "2. ขั้นคิดวิเคราะห์เดี่ยว (Individual Thinking)",
        detail: `นักเรียนแต่ละคนได้รับโจทย์ปัญหาเกี่ยวกับ ${lessonTitle} และใช้เวลา 5 นาทีกระดาษร่างความคิดเชิงตรรกะของตนเองอย่างเป็นอิสระ`
      },
      {
        name: "3. ขั้นแลกเปลี่ยนเรียนรู้คู่คิด (Think-Pair-Share)",
        detail: `นักเรียนจับคู่กันอภิปรายเปรียบเทียบแนวคิดส่วนตัว ปรับปรุงความเข้าใจและรวบรวมแนวคิดที่ดีที่สุดเข้าด้วยกัน`
      },
      {
        name: "4. ขั้นกิจกรรมกลุ่มลงมือปฏิบัติ (Group Practice)",
        detail: `นักเรียนทำงานกลุ่มสร้างชิ้นงานเชิงนวัตกรรมตามแนวคิดที่ตกลงกัน ร่วมมือแก้ปัญหาระหว่างเรียนโดยมีครูคอยเป็นโค้ช (Facilitator) ชี้แนะ`
      },
      {
        name: "5. ขั้นสรุปบทเรียนและเชื่อมโยง (Reflection & Consolidation)",
        detail: `นักเรียนนำเสนอชิ้นงาน ครูสรุปแก่นความรู้เรื่อง ${lessonTitle} และเชื่อมโยงทักษะที่ใช้เข้ากับการทำงานจริงในอนาคต`
      },
      {
        name: "6. ขั้นประเมินและสะท้อนกลับ (Assessment & Feedback)",
        detail: `ประเมินชิ้นงานกลุ่มและพฤติกรรมทำงานร่วมกัน ครูให้คำแนะนำป้อนกลับทันทีเพื่อให้ผู้เรียนแก้ไขข้อผิดพลาดในบทเรียนถัดไป`
      }
    ];
  } else {
    // PBL
    steps = [
      {
        name: "1. ขั้นกำหนดปัญหา (Identify the Problem)",
        detail: `ครูนำเสนอสถานการณ์ปัญหาชีวิตจริง (Real-world Scenario) ที่เกี่ยวข้องกับ ${lessonTitle} ชวนให้นักเรียนเกิดความท้าทายและอยากหาคำตอบ`
      },
      {
        name: "2. ขั้นทำความเข้าใจปัญหา (Understand the Problem)",
        detail: `นักเรียนร่วมกันวิเคราะห์วิจารณ์ว่าโจทย์นี้ต้องการอะไร มีตัวแปรหรือข้อมูลอะไรบ้างที่เกี่ยวข้อง แบ่งหน้าที่รับผิดชอบในกลุ่ม`
      },
      {
        name: "3. ขั้นดำเนินการศึกษาค้นคว้า (Investigation & Research)",
        detail: `นักเรียนสืบค้นข้อมูลจากแหล่งการเรียนรู้ สื่อเทคโนโลยี หรืออินเทอร์เน็ต เพื่อค้นหาทางเลือกและวิธีการที่จะตอบคำถามปัญหาที่เลือก`
      },
      {
        name: "4. ขั้นสังเคราะห์และหาทางออก (Synthesize Solutions)",
        detail: `นักเรียนนำข้อมูลมารวบรวม สรุปสร้างเป็นโมเดล แผนภาพ หรือแนวคิดแก้ไขปัญหาเรื่อง ${lessonTitle} อย่างสมบูรณ์`
      },
      {
        name: "5. ขั้นนำเสนอและประเมินผลงาน (Presentation & Peer Evaluation)",
        detail: `นำเสนอวิธีการแก้ปัญหาในชั้นเรียน เปิดโอกาสให้เพื่อนนักเรียนและครูสอบถาม ประเมินความเหมาะสมและความคุ้มค่าของแนวทางแก้ปัญหานั้น`
      }
    ];
  }

  // Calculate simulated วPA alignment score
  const scoreBase = alignmentIndicators.length * 20;
  const paAlignmentScore = Math.min(scoreBase + 20, 100);

  const remarks = [
    `สอดคล้องกับ ตัวชี้วัด 1.1 ด้านหลักสูตร โดยมีการอิงมาตรฐานวิทยาการคำนวณและปรับให้เข้ากับบริบทผู้เรียน`,
    `สอดคล้องกับ ตัวชี้วัด 1.2 ด้านการออกแบบการเรียนรู้ โดยใช้กระบวนการ Active Learning ที่เน้นผู้เรียนเป็นสำคัญ`,
    alignmentIndicators.includes("1.3") ? `สอดคล้องกับ ตัวชี้วัด 1.3 ด้านการจัดกิจกรรมที่กระตุ้นการคิดวิเคราะห์และแก้ปัญหา` : null,
    alignmentIndicators.includes("1.4") ? `สอดคล้องกับ ตัวชี้วัด 1.4 ด้านการสร้างหรือพัฒนาสื่อนวัตกรรมในการขับเคลื่อนการสอน` : null
  ].filter(Boolean) as string[];

  return {
    title: lessonTitle,
    gradeLevel,
    unitTitle,
    durationHours,
    teachingMethod: teachingMethod === "5e" ? "Inquiry (5E)" : teachingMethod === "active6" ? "Active Learning (6 ขั้น)" : "Problem-based Learning (PBL)",
    standardCode: stdCode,
    indicatorCode: indCode,
    objectives: {
      k: kObj,
      p: pObj,
      a: aObj
    },
    keyConcept: concept,
    steps,
    media: [
      "เครื่องคอมพิวเตอร์สำหรับการเรียนรู้รายบุคคล",
      "ระบบ Smart Digital Learning Platform ของทางโรงเรียน",
      "ใบกิจกรรมความตระหนักรู้และสไลด์ประกอบคำอธิบายบทเรียน"
    ],
    evaluation: [
      { method: "ตรวจใบกิจกรรมและชิ้นงานกลุ่ม", tool: "แบบประเมินรูบริกส์ชิ้นงานและทักษะกระบวนการ", criteria: "คะแนนร้อยละ 60 ขึ้นไป ถือว่าผ่านเกณฑ์" },
      { method: "สังเกตพฤติกรรมการทำงานกลุ่มและการร่วมกิจกรรม", tool: "แบบประเมินพฤติกรรมการทำงานร่วมกัน", criteria: "ระดับคุณภาพ ดี ขึ้นไป ถือว่าผ่านเกณฑ์" }
    ],
    paAlignmentScore,
    paAlignmentRemarks: remarks
  };
}

export type SaveLessonInput = {
  courseId: string;
  unitTitle: string;
  lessonTitle: string;
  objectiveText: string;
  activitySummary: string;
  fullPlanJson: string;
  exportToPa: boolean;
};

export async function saveLessonPlanAction(input: SaveLessonInput): Promise<{ success: boolean; message: string }> {
  const { courseId, unitTitle, lessonTitle, objectiveText, activitySummary, fullPlanJson, exportToPa } = input;
  const schoolConfig = getSchoolConfig();
  const activeYear = schoolConfig.academicYear;

  let teacherId = "demo-teacher-id";
  let profileId = "demo-profile-id";

  if (hasSupabaseEnv()) {
    const context = await getTeacherContext();
    if (context) {
      teacherId = context.teacherId;
      profileId = context.profileId;
    }
  }

  const newUnitId = crypto.randomUUID();
  const newLessonId = crypto.randomUUID();
  const newPaEvidenceId = crypto.randomUUID();

  // 1. If Supabase database env is connected
  if (hasSupabaseEnv() && !courseId.startsWith("demo-")) {
    try {
      const supabase = await createClient();

      // Find or insert learning unit
      const { data: existingUnit } = await supabase
        .from("learning_units")
        .select("id")
        .eq("course_id", courseId)
        .eq("title", unitTitle)
        .maybeSingle<{ id: string }>();

      let unitId = existingUnit?.id;

      if (!unitId) {
        const { data: newUnit, error: unitError } = await supabase
          .from("learning_units")
          .insert({
            id: newUnitId,
            course_id: courseId,
            title: unitTitle,
            standard_code: "ว 4.2",
            indicator_code: "ม.2/1",
            sort_order: 10
          })
          .select("id")
          .maybeSingle<{ id: string }>();

        if (unitError || !newUnit) {
          console.error("Error creating unit:", unitError?.message);
          return { success: false, message: `ล้มเหลวในการจัดทำหน่วยการเรียนรู้: ${unitError?.message}` };
        }
        unitId = newUnit.id;
      }

      // Insert lesson record
      const { error: lessonError } = await supabase.from("lessons").insert({
        id: newLessonId,
        unit_id: unitId,
        title: lessonTitle,
        objective: objectiveText,
        activity_summary: activitySummary,
        lesson_date: new Date().toISOString().slice(0, 10)
      });

      if (lessonError) {
        console.error("Error creating lesson:", lessonError.message);
        return { success: false, message: `ล้มเหลวในการบันทึกแผนการสอน: ${lessonError.message}` };
      }

      // Create PA evidence if ticked
      if (exportToPa) {
        const plan = JSON.parse(fullPlanJson) as GeneratedLessonPlan;
        const paTitle = `[แผนการจัดการเรียนรู้] ${lessonTitle}`;
        const paDescription = `แผนการจัดการเรียนรู้เชิงรุก (Active Learning) เรื่อง ${lessonTitle}\n\nวัตถุประสงค์ (KPA):\n- K: ${plan.objectives.k}\n- P: ${plan.objectives.p}\n- A: ${plan.objectives.a}\n\nวิธีการสอน: ${plan.teachingMethod}\n\n[workflow]\nstatus=draft\nreviewer_comment=`;

        const { error: paError } = await supabase.from("pa_evidences").insert({
          id: newPaEvidenceId,
          teacher_id: teacherId,
          course_id: courseId,
          lesson_id: newLessonId,
          category: "learning_design",
          title: paTitle,
          description: paDescription,
          indicator_code: "วPA 1.2",
          academic_year: activeYear,
          evidence_date: new Date().toISOString().slice(0, 10)
        });

        if (paError) {
          console.error("Error inserting PA evidence:", paError.message);
        }
      }

      revalidatePath("/app/pa");
      revalidatePath("/app");
      return { success: true, message: "บันทึกแผนการสอนและส่งออกเป็นหลักฐาน วPA สำเร็จ!" };
    } catch (err: any) {
      console.error("Database connection catch block error:", err);
      return { success: false, message: `ล้มเหลวในโหมดคลาวด์: ${err?.message || err}` };
    }
  }

  // 2. Fallback to Local JSON persistence for Demo Mode
  try {
    // Persistence for local lessons
    const localLessons = readLocalJson<any>(localLessonsPath);
    localLessons.push({
      id: newLessonId,
      course_id: courseId,
      unit_title: unitTitle,
      title: lessonTitle,
      objective: objectiveText,
      activity_summary: activitySummary,
      created_at: new Date().toISOString()
    });
    writeLocalJson(localLessonsPath, localLessons);

    // Persistence for PA evidences if exported
    if (exportToPa) {
      const plan = JSON.parse(fullPlanJson) as GeneratedLessonPlan;
      const paTitle = `[แผนการจัดการเรียนรู้] ${lessonTitle}`;
      const paDescription = `แผนการจัดการเรียนรู้เชิงรุก (Active Learning) เรื่อง ${lessonTitle}\n\nวัตถุประสงค์ (KPA):\n- K: ${plan.objectives.k}\n- P: ${plan.objectives.p}\n- A: ${plan.objectives.a}\n\nวิธีการสอน: ${plan.teachingMethod}\n\n[workflow]\nstatus=draft\nreviewer_comment=`;

      const localEvidences = readLocalJson<any>(localPaEvidencesPath);
      localEvidences.push({
        id: newPaEvidenceId,
        teacher_id: teacherId,
        course_id: courseId,
        lesson_id: newLessonId,
        category: "learning_design",
        title: paTitle,
        description: paDescription,
        indicator_code: "วPA 1.2",
        academic_year: activeYear,
        evidence_date: new Date().toISOString().slice(0, 10)
      });
      writeLocalJson(localPaEvidencesPath, localEvidences);
    }

    revalidatePath("/app/pa");
    revalidatePath("/app");
    return { success: true, message: "บันทึกข้อมูลแผนการสอนสำเร็จ (จำลองในไฟล์โหมด Demo)" };
  } catch (err: any) {
    console.error("Error in local file persistence fallback:", err);
    return { success: false, message: "ล้มเหลวในการบันทึกข้อมูลแบบจำลอง" };
  }
}
