"use client";

import { useState } from "react";
import type { CourseListItem } from "@/lib/queries/courses";
import { generateLessonPlanAction, saveLessonPlanAction } from "./actions";
import type { GeneratedLessonPlan } from "./actions";

type Props = {
  courses: CourseListItem[];
};

export function LessonGeneratorClient({ courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [unitTitle, setUnitTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [teachingMethod, setTeachingMethod] = useState<"5e" | "active6" | "pbl">("active6");
  
  // Target วPA indicators
  const [alignments, setAlignments] = useState<string[]>(["1.1", "1.2", "1.3"]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);
  
  const [activeTab, setActiveTab] = useState<"plan" | "pa">("plan");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleIndicatorChange = (code: string) => {
    if (alignments.includes(code)) {
      setAlignments(alignments.filter((item) => item !== code));
    } else {
      setAlignments([...alignments, code]);
    }
  };

  const handleGenerate = async () => {
    if (!lessonTitle.trim()) {
      alert("กรุณาระบุหัวข้อ/เรื่องของแผนการสอน");
      return;
    }
    if (!unitTitle.trim()) {
      alert("กรุณาระบุหน่วยการเรียนรู้");
      return;
    }

    setIsGenerating(true);
    setSaveMessage("");
    
    // Simulate smart AI status loading stages
    const stages = [
      "วิเคราะห์มาตรฐานการเรียนรู้ ว 4.2...",
      "วิเคราะห์หลักการศึกษาเชิงรุก (Active Learning)...",
      "พัฒนาจุดประสงค์เชิงพฤติกรรม (KPA Objectives)...",
      "จัดทำกระบวนการสอนตามแนวทางวิชาการ...",
      "เสร็จเรียบร้อย! กำลังแสดงผลแผงรายงานความสอดคล้อง วPA..."
    ];

    let currentStageIdx = 0;
    setLoadingStage(stages[0]);

    const stageInterval = setInterval(() => {
      currentStageIdx = (currentStageIdx + 1) % stages.length;
      setLoadingStage(stages[currentStageIdx]);
    }, 400);

    try {
      const plan = await generateLessonPlanAction({
        courseId: selectedCourseId,
        unitTitle: unitTitle.trim(),
        lessonTitle: lessonTitle.trim(),
        gradeLevel: selectedCourse?.grade_level ?? "ม.2",
        durationHours,
        teachingMethod,
        alignmentIndicators: alignments
      });
      setGeneratedPlan(plan);
      setActiveTab("plan");
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างแผนการสอน");
    } finally {
      clearInterval(stageInterval);
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan) return;
    
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await saveLessonPlanAction({
        courseId: selectedCourseId,
        unitTitle: generatedPlan.unitTitle,
        lessonTitle: generatedPlan.title,
        objectiveText: `K: ${generatedPlan.objectives.k} | P: ${generatedPlan.objectives.p} | A: ${generatedPlan.objectives.a}`,
        activitySummary: generatedPlan.steps.map(s => s.name).join(" -> "),
        fullPlanJson: JSON.stringify(generatedPlan),
        exportToPa: true
      });
      
      if (res.success) {
        setSaveMessage("✅ " + res.message);
      } else {
        setSaveMessage("❌ " + res.message);
      }
    } catch (err) {
      console.error("Save Error:", err);
      setSaveMessage("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWord = () => {
    if (!generatedPlan) return;

    const title = `แผนการจัดการเรียนรู้_${generatedPlan.title}_วPA`;

    // Generate active steps HTML
    let stepsHtml = "";
    generatedPlan.steps.forEach((step) => {
      stepsHtml += `
        <div style="margin-top: 10px; margin-bottom: 15px; page-break-inside: avoid;">
          <p style="font-size: 12pt; font-weight: bold; color: #1e293b; margin: 0 0 4px;">${step.name}</p>
          <p style="font-size: 11pt; color: #334155; line-height: 1.5; margin: 0; text-indent: 1.5cm;">${step.detail}</p>
        </div>
      `;
    });

    // Generate evaluation steps HTML
    let evalRows = "";
    generatedPlan.evaluation.forEach((item) => {
      evalRows += `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${item.method}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${item.tool}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${item.criteria}</td>
        </tr>
      `;
    });

    // Generate media list HTML
    let mediaListHtml = "";
    generatedPlan.media.forEach((item) => {
      mediaListHtml += `<li style="font-size: 11pt; color: #334155; line-height: 1.5; margin-bottom: 4px;">${item}</li>`;
    });

    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>แผนการจัดการเรียนรู้ - ${generatedPlan.title}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif;
            font-size: 16px;
            color: #334155;
            line-height: 1.6;
          }
          .title {
            font-size: 18pt;
            font-weight: bold;
            color: #0f172a;
            text-align: center;
            margin-top: 10px;
          }
          .subtitle {
            font-size: 12pt;
            color: #475569;
            text-align: center;
            margin-top: 5px;
          }
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1e293b;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
          }
          .info-table td {
            padding: 6px;
            font-size: 11pt;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; font-size: 36px; color: #4f46e5;">⚜️</div>
        <h1 class="title">แผนการจัดการเรียนรู้เชิงรุก (Active Learning Plan)</h1>
        <p class="subtitle">หลักสูตรกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ)</p>

        <hr style="border: 1px solid #cbd5e1; margin: 20px 0;" />

        <h2 class="section-title">ข้อมูลทั่วไปของหน่วยการเรียนรู้</h2>
        <table class="info-table" style="width: 100%; border: none; border-collapse: collapse;">
          <tr>
            <td style="width: 150px; font-weight: bold;">รายวิชา:</td>
            <td>${selectedCourse?.title || "วิทยาการคำนวณ"} (${selectedCourse?.code || "ว14101"})</td>
            <td style="width: 150px; font-weight: bold;">ระดับชั้น:</td>
            <td>ระดับชั้น ${selectedCourse?.grade_level || "ป.4"}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">หน่วยการเรียนรู้:</td>
            <td>${generatedPlan.unitTitle}</td>
            <td style="font-weight: bold;">หัวข้อเรื่อง:</td>
            <td><strong>${generatedPlan.title}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold;">เวลาเรียนสะสม:</td>
            <td>${generatedPlan.durationHours} ชั่วโมง</td>
            <td style="font-weight: bold;">รูปแบบการจัดกิจกรรม:</td>
            <td>การจัดกิจกรรมเรียนรู้เชิงรุกแบบ ${generatedPlan.teachingMethod}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">มาตรฐานการเรียนรู้:</td>
            <td>มาตรฐาน ${generatedPlan.standardCode}</td>
            <td style="font-weight: bold;">ตัวชี้วัดหลัก:</td>
            <td>ตัวชี้วัดที่ ${generatedPlan.indicatorCode}</td>
          </tr>
        </table>

        <h2 class="section-title">1. จุดประสงค์การเรียนรู้ (KPA Objectives)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt; width: 140px; font-weight: bold; background-color: #f8fafc;">ด้านความรู้ (Knowledge - K)</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt;">${generatedPlan.objectives.k}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt; font-weight: bold; background-color: #f8fafc;">ด้านกระบวนการ (Process - P)</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt;">${generatedPlan.objectives.p}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt; font-weight: bold; background-color: #f8fafc;">ด้านคุณลักษณะ (Attitude - A)</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt;">${generatedPlan.objectives.a}</td>
          </tr>
        </table>

        <h2 class="section-title">2. สาระสำคัญ / ความคิดรวบยอด (Key Concepts)</h2>
        <p style="font-size: 11pt; line-height: 1.6; text-indent: 1.5cm; color: #334155;">${generatedPlan.keyConcept}</p>

        <h2 class="section-title">3. กิจกรรมการจัดการเรียนรู้ (Active Learning Process)</h2>
        <p style="font-size: 11pt; font-style: italic; color: #64748b; margin-bottom: 12px;">การดำเนินกิจกรรมตามรูปแบบกระบวนการสอนแบบ ${generatedPlan.teachingMethod}</p>
        ${stepsHtml}

        <h2 class="section-title">4. สื่อการเรียนรู้และแหล่งเรียนรู้ (Media & Materials)</h2>
        <ul style="padding-left: 20px; margin-top: 5px;">
          ${mediaListHtml}
        </ul>

        <h2 class="section-title">5. การวัดและประเมินผลการเรียนรู้ (Evaluation)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: left;">วิธีการวัดและประเมิน</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: left;">เครื่องมือวัดที่ใช้</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: left;">เกณฑ์ผ่านเกณฑ์ประเมิน</th>
            </tr>
          </thead>
          <tbody>
            ${evalRows}
          </tbody>
        </table>

        <br style="page-break-before: always; break-before: page;" />

        <h2 class="section-title">บันทึกข้อเสนอแนะและผลการประเมิน</h2>
        <table style="width: 100%; margin-top: 20px; border: none; border-collapse: collapse;">
          <tr>
            <td style="border: none; text-align: left; font-size: 11pt; width: 100%; padding-bottom: 25px;">
              ผลการจัดการเรียนรู้ประเมินโดยครูผู้สอน: .........................................................................................................................................
              <br/><br/>
              ปัญหา/อุปสรรคที่พบจากการทำกิจกรรม: ..........................................................................................................................................
              <br/><br/>
              ข้อเสนอแนะในการปรับปรุงแก้ไขแผนในอนาคต: .....................................................................................................................................
            </td>
          </tr>
        </table>

        <table style="width: 100%; margin-top: 40px; border: none; border-collapse: collapse;">
          <tr>
            <td style="border: none; text-align: center; font-size: 11pt; width: 50%;">
              ลงชื่อ..............................................................ครูผู้สอน
              <br/><br/>
              (..............................................................)
              <br/><br/>
              ตำแหน่ง ครูผู้สอนวิชาวิทยาการคำนวณ
            </td>
            <td style="border: none; text-align: center; font-size: 11pt; width: 50%;">
              ลงชื่อ..............................................................ผู้ตรวจประเมิน
              <br/><br/>
              (..............................................................)
              <br/><br/>
              ตำแหน่ง หัวหน้ากลุ่มสาระ/ผู้อำนวยการโรงเรียน
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + fileContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("ดาวน์โหลดแผนการสอน (.doc) เรียบร้อยแล้ว! เปิดแก้ต่อใน Microsoft Word ได้เลยครับ");
  };

  return (
    <div style={s.container}>
      <style>{`
        .generator-card { animation: fadeUp 0.3s ease both; }
        .tab-btn {
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: #eef2ff;
          color: #4f46e5;
        }
        .step-num {
          display: inline-block;
          background: #e0e7ff;
          color: #4f46e5;
          font-weight: 800;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-bottom: 6px;
        }
      `}</style>

      {/* Input controls form */}
      <div style={s.card} className="generator-card no-print">
        <h3 style={s.formHeading}>⚙️ ตัวเลือกการสร้างแผนการสอน</h3>
        
        <div style={s.formGrid}>
          <label style={s.label}>
            เลือกรายวิชาเรียน
            <select
              style={s.select}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} | {c.title} ({c.grade_level})
                </option>
              ))}
            </select>
          </label>

          <label style={s.label}>
            ชื่อหน่วยการเรียนรู้
            <input
              type="text"
              style={s.input}
              placeholder="เช่น หน่วยที่ 1 แนวคิดเชิงคำนวณ"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
            />
          </label>

          <label style={s.label}>
            หัวข้อบทเรียน (Topic)
            <input
              type="text"
              style={s.input}
              placeholder="เช่น การแยกย่อยปัญหาเชิงตรรกะ"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={s.label}>
              เวลาสอน (ชม.)
              <input
                type="number"
                min="1"
                max="10"
                style={s.input}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              />
            </label>

            <label style={s.label}>
              รูปแบบการจัดการสอน
              <select
                style={s.select}
                value={teachingMethod}
                onChange={(e) => setTeachingMethod(e.target.value as any)}
              >
                <option value="active6">Active Learning (6 ขั้น)</option>
                <option value="5e">Inquiry Model (5E)</option>
                <option value="pbl">Problem-based (PBL)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Indicator target checklist */}
        <div style={{ marginTop: "10px" }}>
          <span style={s.fieldLabel}>ตัวชี้วัดเป้าหมาย วPA ที่ต้องการบูรณาการ:</span>
          <div style={s.checkboxGrid}>
            <label style={s.checkboxLabel}>
              <input
                type="checkbox"
                checked={alignments.includes("1.1")}
                onChange={() => handleIndicatorChange("1.1")}
              />
              <span>วPA 1.1 พัฒนาหลักสูตร</span>
            </label>
            <label style={s.checkboxLabel}>
              <input
                type="checkbox"
                checked={alignments.includes("1.2")}
                onChange={() => handleIndicatorChange("1.2")}
              />
              <span>วPA 1.2 ออกแบบแผนสอน</span>
            </label>
            <label style={s.checkboxLabel}>
              <input
                type="checkbox"
                checked={alignments.includes("1.3")}
                onChange={() => handleIndicatorChange("1.3")}
              />
              <span>วPA 1.3 จัดกิจกรรมเชิงรุก</span>
            </label>
            <label style={s.checkboxLabel}>
              <input
                type="checkbox"
                checked={alignments.includes("1.4")}
                onChange={() => handleIndicatorChange("1.4")}
              />
              <span>วPA 1.4 สื่อและนวัตกรรม</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          style={s.generateBtn}
          disabled={isGenerating}
        >
          {isGenerating ? "🤖 กำลังสร้างแผนการสอนอัจฉริยะ..." : "🤖 สร้างแผนการสอนด้วย AI"}
        </button>
      </div>

      {/* Generating stage loader overlay */}
      {isGenerating && (
        <div style={s.loaderBox}>
          <div style={s.spinner} />
          <strong style={{ marginTop: "12px", color: "#4f46e5", fontSize: "14px" }}>
            {loadingStage}
          </strong>
          <span style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
            กำลังเรียบเรียงเนื้อหาเชิงตรรกะสอดคล้องมาตรฐาน ว 4.2
          </span>
        </div>
      )}

      {/* Generated output visualization panel */}
      {generatedPlan && !isGenerating && (
        <div style={s.resultWrapper} className="generator-card">
          
          {/* Action Row & Tabs Header */}
          <div style={s.resultHeader} className="no-print">
            <div style={{ display: "flex", gap: "6px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === "plan" ? "active" : ""}`}
                onClick={() => setActiveTab("plan")}
              >
                📝 แผนการสอน (Lesson Plan)
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "pa" ? "active" : ""}`}
                onClick={() => setActiveTab("pa")}
              >
                📊 ตัวชี้วัด วPA (KPI Alignment)
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleSave}
                style={s.saveBtn}
                disabled={isSaving}
              >
                {isSaving ? "บันทึก..." : "💾 บันทึกแผนการสอน & บูรณาการ วPA"}
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                style={s.wordBtn}
              >
                📝 ส่งออก Word (.doc)
              </button>
            </div>
          </div>

          {saveMessage && (
            <div style={{
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "12.5px",
              background: saveMessage.includes("❌") ? "#fee2e2" : "#dcfce7",
              color: saveMessage.includes("❌") ? "#991b1b" : "#166534",
              fontWeight: "bold",
              marginTop: "10px"
            }} className="no-print">
              {saveMessage}
            </div>
          )}

          {/* TAB 1: Printable Lesson Plan View */}
          {activeTab === "plan" && (
            <div style={s.documentSheet}>
              {/* Document Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <span style={s.docEyebrow}>แผนการจัดการเรียนรู้หลักสูตรแกนกลางขั้นพื้นฐาน</span>
                  <h2 style={s.docTitle}>{generatedPlan.title}</h2>
                  <p style={s.docSubtitle}>
                    วิชา: {selectedCourse?.title} ({selectedCourse?.code}) | ห้องเรียน: {selectedCourse?.grade_level} | เวลา: {generatedPlan.durationHours} ชั่วโมง
                  </p>
                </div>
                <div style={{ fontSize: "2.5rem", color: "#6366f1" }}>⚜️</div>
              </div>

              <div style={s.divider} />

              {/* General Metadata Table */}
              <div style={s.metaDataBox}>
                <div style={s.metaItem}><strong>หน่วยการเรียนรู้:</strong> {generatedPlan.unitTitle}</div>
                <div style={s.metaItem}><strong>วิธีจัดการสอน:</strong> active learning ({generatedPlan.teachingMethod})</div>
                <div style={s.metaItem}><strong>มาตรฐานหลัก:</strong> {generatedPlan.standardCode}</div>
                <div style={s.metaItem}><strong>ตัวชี้วัดเชิงลึก:</strong> ตัวชี้วัด {generatedPlan.indicatorCode}</div>
              </div>

              {/* KPA Objectives */}
              <div style={s.docSection}>
                <h4 style={s.docSectionTitle}>1. จุดประสงค์การเรียนรู้ (Objectives)</h4>
                <div style={s.objectiveGrid}>
                  <div style={s.objCard}>
                    <strong>Knowledge (ด้านความรู้ - K)</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>{generatedPlan.objectives.k}</p>
                  </div>
                  <div style={s.objCard}>
                    <strong>Process (ด้านทักษะกระบวนการ - P)</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>{generatedPlan.objectives.p}</p>
                  </div>
                  <div style={s.objCard}>
                    <strong>Attitude (ด้านเจตคติ - A)</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>{generatedPlan.objectives.a}</p>
                  </div>
                </div>
              </div>

              {/* Key Concepts */}
              <div style={s.docSection}>
                <h4 style={s.docSectionTitle}>2. สาระสำคัญ / ความคิดรวบยอด</h4>
                <p style={s.docText}>{generatedPlan.keyConcept}</p>
              </div>

              {/* Active Learning Activities */}
              <div style={s.docSection}>
                <h4 style={s.docSectionTitle}>3. กิจกรรมการเรียนรู้ (Active Learning Steps)</h4>
                <div style={s.activitiesContainer}>
                  {generatedPlan.steps.map((step, idx) => (
                    <div key={idx} style={s.activityRow}>
                      <span className="step-num">{step.name}</span>
                      <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", textIndent: "1rem" }}>
                        {step.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media & Materials */}
              <div style={s.docSection}>
                <h4 style={s.docSectionTitle}>4. สื่อการสอนและอุปกรณ์การเรียนรู้</h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  {generatedPlan.media.map((item, idx) => (
                    <li key={idx} style={{ fontSize: "12.5px", color: "#334155" }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Evaluation criteria */}
              <div style={s.docSection}>
                <h4 style={s.docSectionTitle}>5. การวัดและประเมินผลการเรียนรู้</h4>
                <div style={s.tableWrapper}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>วิธีการประเมิน</th>
                        <th style={s.th}>เครื่องมือที่ใช้วัด</th>
                        <th style={s.th}>เกณฑ์การผ่าน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedPlan.evaluation.map((evalItem, idx) => (
                        <tr key={idx} style={s.tr}>
                          <td style={s.td}>{evalItem.method}</td>
                          <td style={s.td}>{evalItem.tool}</td>
                          <td style={s.td}>{evalItem.criteria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PA Indicators mapping & Analytics Gauges */}
          {activeTab === "pa" && (
            <div style={s.paSheet}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>
                📊 การวิเคราะห์ความสอดคล้องตามตัวชี้วัด วPA (ด้านการจัดการเรียนรู้)
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 1rem" }}>
                ประเมินความสอดคล้องของแผนการจัดการเรียนรู้รายชั่วโมง เพื่อประกอบการจัดทำไฟล์แนบ วPA (ตัวชี้วัด 1.1 - 1.4)
              </p>

              <div style={s.paGrid}>
                {/* SVG Gauge block */}
                <div style={s.paGaugeCard}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#4f46e5" }}>คะแนนประเมินโดยเฉลี่ย</span>
                  
                  {(() => {
                    const r = 45;
                    const c = 2 * Math.PI * r; // 282.74
                    const percent = generatedPlan.paAlignmentScore / 100;
                    const dashOffset = (1 - percent) * c;
                    
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1rem" }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r={r} fill="transparent" stroke="#e0e7ff" strokeWidth="12" />
                          <circle
                            cx="60"
                            cy="60"
                            r={r}
                            fill="transparent"
                            stroke="url(#paGrad)"
                            strokeWidth="12"
                            strokeDasharray={`${c}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                          />
                          <defs>
                            <linearGradient id="paGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                          </defs>
                          <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="#4f46e5">
                            {generatedPlan.paAlignmentScore}%
                          </text>
                        </svg>
                        <span style={s.gaugeBadge}>ระดับความสอดคล้อง: ยอดเยี่ยม</span>
                      </div>
                    );
                  })()}
                </div>

                {/* PA Indicators list alignment */}
                <div style={s.paDetailsCard}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>การบูรณาการตามตัวชี้วัด วPA รายข้อ:</span>
                  <div style={s.paList}>
                    <div style={{ ...s.paItem, opacity: alignments.includes("1.1") ? 1 : 0.4 }}>
                      <span style={{ ...s.paDot, background: "#10b981" }}>✓</span>
                      <div>
                        <strong>วPA 1.1 สร้างและหรือพัฒนาหลักสูตร</strong>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                          มีการวิเคราะห์มาตรฐาน สาระสำคัญ เพื่อปรับกิจกรรมให้เข้ากับระดับชั้น {selectedCourse?.grade_level}
                        </p>
                      </div>
                    </div>

                    <div style={{ ...s.paItem, opacity: alignments.includes("1.2") ? 1 : 0.4 }}>
                      <span style={{ ...s.paDot, background: "#10b981" }}>✓</span>
                      <div>
                        <strong>วPA 1.2 ออกแบบการจัดการเรียนรู้</strong>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                          ใช้แผนการสอนรูปแบบ {generatedPlan.teachingMethod} ส่งเสริมศักยภาพกระบวนการคิดและทักษะปฏิบัติ
                        </p>
                      </div>
                    </div>

                    <div style={{ ...s.paItem, opacity: alignments.includes("1.3") ? 1 : 0.4 }}>
                      <span style={{ ...s.paDot, background: "#10b981" }}>✓</span>
                      <div>
                        <strong>วPA 1.3 จัดกิจกรรมการเรียนรู้</strong>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                          สร้างกิจกรรมกลุ่ม Think-Pair-Share/5E เน้นการเรียนรู้แบบแก้ปัญหาด้วยสถานการณ์ชีวิตจริง
                        </p>
                      </div>
                    </div>

                    <div style={{ ...s.paItem, opacity: alignments.includes("1.4") ? 1 : 0.4 }}>
                      <span style={{ ...s.paDot, background: "#10b981" }}>✓</span>
                      <div>
                        <strong>วPA 1.4 พัฒนาสื่อนวัตกรรม เทคโนโลยี</strong>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                          ใช้ระบบ Smart Digital Learning Platform และโจทย์ความท้าทายสร้างทักษะเทคโนโลยียุคใหม่
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis remarks list */}
              <div style={s.remarksBox}>
                <strong style={{ fontSize: "12px", color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  💡 ความเห็นผลการวิเคราะห์สอดคล้องเชิงลึก:
                </strong>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {generatedPlan.paAlignmentRemarks.map((rem, idx) => (
                    <li key={idx} style={{ fontSize: "11.5px", color: "#475569" }}>{rem}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    fontFamily: "'Sarabun', sans-serif"
  },
  card: {
    background: "#ffffff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 16px rgba(99,102,241,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  formHeading: {
    fontSize: "14.5px",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontWeight: 700,
    fontSize: "12.5px",
    color: "#475569"
  },
  select: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    background: "#fff",
    fontSize: "13.5px",
    outline: "none"
  },
  input: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13.5px",
    outline: "none"
  },
  fieldLabel: {
    display: "block",
    fontWeight: 700,
    fontSize: "12.5px",
    color: "#475569",
    marginBottom: "6px"
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "6px",
    marginTop: "4px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12.5px",
    color: "#334155",
    fontWeight: 500,
    cursor: "pointer"
  },
  generateBtn: {
    width: "100%",
    minHeight: "44px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
    marginTop: "6px",
    transition: "all 0.2s ease"
  },
  loaderBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "3rem 1.5rem",
    textAlign: "center"
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  resultWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  saveBtn: {
    padding: "0.55rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "12.5px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79,70,229,0.2)"
  },
  wordBtn: {
    padding: "0.55rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "12.5px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16,185,129,0.2)"
  },
  documentSheet: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "2rem 1.5rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  docEyebrow: {
    fontSize: "11px",
    color: "#4f46e5",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  },
  docTitle: {
    fontSize: "18px",
    color: "#0f172a",
    margin: "2px 0 0",
    fontWeight: 800
  },
  docSubtitle: {
    fontSize: "12.5px",
    color: "#475569",
    margin: "4px 0 0"
  },
  divider: {
    height: "2px",
    background: "linear-gradient(90deg, transparent, #cbd5e1 50%, transparent)",
    margin: 0
  },
  metaDataBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "12px",
    color: "#475569"
  },
  metaItem: {
    lineHeight: 1.4
  },
  docSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  docSectionTitle: {
    fontSize: "13.5px",
    fontWeight: 800,
    color: "#0f172a",
    borderLeft: "4px solid #4f46e5",
    paddingLeft: "8px",
    margin: 0
  },
  objectiveGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px"
  },
  objCard: {
    background: "#fafafa",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#334155"
  },
  docText: {
    fontSize: "12.5px",
    color: "#334155",
    lineHeight: 1.5,
    margin: 0,
    textAlign: "justify"
  },
  activitiesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  activityRow: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "10px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px"
  },
  th: {
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: 700,
    padding: "8px 10px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9"
  },
  td: {
    padding: "8px 10px",
    color: "#334155"
  },
  paSheet: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.03)"
  },
  paGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginTop: "0.5rem"
  },
  paGaugeCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  gaugeBadge: {
    marginTop: "12px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#15803d",
    background: "#dcfce7",
    padding: "4px 10px",
    borderRadius: "12px"
  },
  paDetailsCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "1.25rem"
  },
  paList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px"
  },
  paItem: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    fontSize: "12px"
  },
  paDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px"
  },
  remarksBox: {
    marginTop: "1.25rem",
    padding: "12px",
    background: "#eff6ff",
    border: "1.5px solid #bfdbfe",
    borderRadius: "12px"
  }
};
