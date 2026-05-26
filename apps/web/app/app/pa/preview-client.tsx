"use client";

import { useState, useMemo } from "react";
import type { TeacherPaProfile } from "@/lib/queries/pa";
import type { PaEvidence } from "@/lib/database.types";
import Link from "next/link";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "ไม่ระบุ";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

type Props = {
  profile: TeacherPaProfile;
  evidences: PaEvidence[];
};

type Indicator = {
  code: string;
  title: string;
};

type Section = {
  title: string;
  indicators: Indicator[];
};

export function PaPreviewClient({ profile, evidences }: Props) {
  const [academicYear, setAcademicYear] = useState(2569);

  // Group indicators by the 3 official areas of วPA
  const sections: Section[] = [
    {
      title: "ด้านที่ 1: ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)",
      indicators: [
        { code: "1.1", title: "สร้างและหรือพัฒนาหลักสูตร" },
        { code: "1.2", title: "ออกแบบการจัดการเรียนรู้" },
        { code: "1.3", title: "จัดกิจกรรมการเรียนรู้" },
        { code: "1.4", title: "สร้างและหรือพัฒนาสื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้" },
        { code: "1.5", title: "วัดและประเมินผลการเรียนรู้" },
        { code: "1.6", title: "ศึกษา วิเคราะห์ และสังเคราะห์ เพื่อแก้ปัญหาหรือพัฒนาการเรียนรู้" },
        { code: "1.7", title: "จัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน" },
        { code: "1.8", title: "อบรมและพัฒนาคุณลักษณะที่ดีของผู้เรียน" }
      ]
    },
    {
      title: "ด้านที่ 2: ด้านการส่งเสริมและสนับสนุนการเรียนรู้ (4 ตัวชี้วัด)",
      indicators: [
        { code: "2.1", title: "จัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา" },
        { code: "2.2", title: "ดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน" },
        { code: "2.3", title: "ปฏิบัติงานวิชาการ และงานอื่นๆ ของสถานศึกษา" },
        { code: "2.4", title: "ประสานความร่วมมือกับผู้ปกครอง ภาคีเครือข่าย และหรือสถานประกอบการ" }
      ]
    },
    {
      title: "ด้านที่ 3: ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)",
      indicators: [
        { code: "3.1", title: "พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง" },
        { code: "3.2", title: "มีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ทางวิชาชีพเพื่อพัฒนาการจัดการเรียนรู้ (PLC)" },
        { code: "3.3", title: "นำความรู้ ความสามารถ ทักษะที่ได้จากการพัฒนาตนเองและวิชาชีพมาใช้ในการพัฒนา" }
      ]
    }
  ];

  // Helper to normalize and check if evidence indicator matches (e.g. matches "1.5" with "วPA 1.5" or "1.5")
  function isIndicatorMatch(evidenceCode: string | null, targetCode: string): boolean {
    if (!evidenceCode) return false;
    const cleanEvidence = evidenceCode.replace(/[^\d.]/g, ""); // extract only digits and dots, e.g. "1.5"
    const cleanTarget = targetCode.replace(/[^\d.]/g, "");
    return cleanEvidence === cleanTarget;
  }

  // Filter and map evidences by indicator code
  const mappedEvidences = useMemo(() => {
    const map: Record<string, PaEvidence[]> = {};
    
    // Group all current academic year evidences
    const yearFiltered = evidences.filter(e => e.academic_year === academicYear);

    yearFiltered.forEach(e => {
      // Find matching indicator
      let matched = false;
      sections.forEach(sec => {
        sec.indicators.forEach(ind => {
          if (isIndicatorMatch(e.indicator_code, ind.code)) {
            if (!map[ind.code]) map[ind.code] = [];
            map[ind.code].push(e);
            matched = true;
          }
        });
      });

      // Default fallback grouping if indicator doesn't match perfectly, guess from category
      if (!matched) {
        let code = "";
        if (e.category === "learning_design") code = "1.2";
        else if (e.category === "learning_activity") code = "1.3";
        else if (e.category === "student_outcome") code = "1.5";
        else if (e.category === "student_support") code = "2.2";
        else if (e.category === "professional_development") code = "3.1";

        if (code) {
          if (!map[code]) map[code] = [];
          map[code].push(e);
        }
      }
    });

    return map;
  }, [evidences, academicYear]);

  // Clean description workflow tags
  function cleanDescription(description: string | null): string {
    if (!description) return "";
    return description.replace(/\n?\[workflow\][\s\S]*$/m, "").trim();
  }

  // Parse evidence status from workflow description
  function getStatusLabel(description: string | null): string {
    if (!description) return "ร่าง";
    const match = description.match(/status=([^\n\r]+)/);
    const status = match?.[1]?.trim() || "draft";
    
    const labels: Record<string, string> = {
      draft: "ร่าง",
      submitted: "ส่งตรวจ",
      revision_required: "ต้องแก้ไข",
      approved: "อนุมัติแล้ว"
    };

    return labels[status] ?? status;
  }

  function handleExportToWord() {
    const title = `รายงานสรุปผลการประเมินผลการพัฒนางานตามข้อตกลง_PA_${academicYear}`;
    
    const profileTable = `
      <table style="border: none; width: 100%; max-width: 600px; margin: 20px auto; border-collapse: collapse;">
        <tr>
          <td style="width: 150px; font-weight: bold; padding: 6px 0; border: none; font-size: 14pt;">ผู้รายงาน:</td>
          <td style="padding: 6px 0; border: none; font-size: 14pt;">${profile.fullName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0; border: none; font-size: 14pt;">ตำแหน่ง:</td>
          <td style="padding: 6px 0; border: none; font-size: 14pt;">${profile.positionName} วิทยฐานะ ${profile.academicRank}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0; border: none; font-size: 14pt;">กลุ่มสาระการเรียนรู้:</td>
          <td style="padding: 6px 0; border: none; font-size: 14pt;">${profile.subjectGroup}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0; border: none; font-size: 14pt;">สถานศึกษา:</td>
          <td style="padding: 6px 0; border: none; font-size: 14pt;">${profile.schoolName}</td>
        </tr>
      </table>
    `;

    let evidenceSectionsHtml = "";
    sections.forEach((sec) => {
      let secHtml = `
        <div style="margin-top: 30px; page-break-inside: avoid;">
          <h2 style="font-size: 16pt; font-weight: bold; background-color: #f1f5f9; padding: 8px 12px; border-bottom: 2px solid #6366f1; color: #1e293b;">
            ${sec.title}
          </h2>
      `;

      sec.indicators.forEach((ind) => {
        const matched = mappedEvidences[ind.code] || [];
        let matchedHtml = "";

        if (matched.length > 0) {
          matched.forEach((e) => {
            const desc = cleanDescription(e.description);
            const statusLabel = getStatusLabel(e.description);
            const dateStr = formatDate(e.evidence_date);
            matchedHtml += `
              <div style="margin-top: 10px; margin-bottom: 15px; padding: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 6px; page-break-inside: avoid;">
                <table style="width: 100%; border: none; border-collapse: collapse;">
                  <tr>
                    <td style="font-weight: bold; border: none; font-size: 12pt;">📌 ${e.title}</td>
                    <td style="text-align: right; font-weight: bold; color: #16a34a; border: none; font-size: 11pt;">สถานะ: ${statusLabel}</td>
                  </tr>
                </table>
                <p style="margin: 6px 0; font-size: 12pt; color: #334155; line-height: 1.5; white-space: pre-wrap;">${desc}</p>
                <span style="font-size: 10pt; color: #94a3b8;">วันที่แนบหลักฐาน: ${dateStr}</span>
              </div>
            `;
          });
        } else {
          matchedHtml = `<p style="font-size: 11pt; color: #94a3b8; font-style: italic; margin-top: 6px;">⚠️ ยังไม่มีเอกสารหลักฐานประกอบในระบบ</p>`;
        }

        secHtml += `
          <div style="margin-top: 20px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 15px; page-break-inside: avoid;">
            <p style="font-size: 13pt; margin: 0 0 10px;">
              <strong style="color: #4f46e5; background-color: #eef2ff; padding: 2px 6px; border-radius: 4px; font-size: 12pt;">ตัวชี้วัด ${ind.code}</strong>
              <strong style="color: #0f172a; margin-left: 8px;">${ind.title}</strong>
            </p>
            ${matchedHtml}
          </div>
        `;
      });

      secHtml += `</div>`;
      evidenceSectionsHtml += secHtml;
    });

    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>รายงาน วPA</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif;
            font-size: 16px;
            color: #334155;
            line-height: 1.6;
          }
          .title {
            font-size: 20pt;
            font-weight: bold;
            color: #0f172a;
            text-align: center;
            margin-top: 20px;
          }
          .subtitle {
            font-size: 13pt;
            color: #475569;
            text-align: center;
            margin-top: 5px;
          }
          .year-text {
            font-size: 15pt;
            font-weight: bold;
            color: #6366f1;
            text-align: center;
            margin-top: 5px;
          }
          .divider {
            border-bottom: 2px solid #cbd5e1;
            margin: 25px 0;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; font-size: 48px; color: #4f46e5; margin-bottom: 10px;">⚜️</div>
        <h1 class="title">รายงานสรุปผลการประเมินผลการพัฒนางานตามข้อตกลง (PA)</h1>
        <p class="subtitle">สำหรับข้าราชการครูและบุคลากรทางการศึกษา ตำแหน่ง ${profile.positionName} วิทยฐานะ ${profile.academicRank}</p>
        <p class="year-text">ประจำปีการศึกษา ${academicYear}</p>
        
        <div class="divider"></div>
        
        ${profileTable}
        
        <br style="page-break-before: always; break-before: page;" />
        
        <h1 style="font-size: 18pt; font-weight: bold; color: #1e293b; border-bottom: 3px solid #6366f1; padding-bottom: 8px; margin-top: 30px;">
          ส่วนที่ 1: ผลสัมฤทธิ์ของงานตามตัวชี้วัด (15 ตัวชี้วัด)
        </h1>
        
        ${evidenceSectionsHtml}
        
        <br style="page-break-before: always; break-before: page;" />
        
        <table style="width: 100%; margin-top: 50px; border: none; border-collapse: collapse;">
          <tr>
            <td style="border: none;"></td>
            <td style="text-align: right; padding-right: 50px; border: none; font-size: 14pt;">
              ลงชื่อ..............................................................ผู้รับรองผล
              <br/><br/>
              (..............................................................)
              <br/><br/>
              ตำแหน่ง ผู้อำนวยการ${profile.schoolName}
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
    
    alert("ดาวน์โหลดไฟล์ Word (.doc) เรียบร้อยแล้ว! คุณสามารถเปิดแก้ไขเพิ่มเติมใน Microsoft Word ได้เลยครับ");
  }

  return (
    <div style={s.container}>
      {/* Dynamic styles supporting A4 standard printing layouts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        
        .no-print {
          display: flex;
        }

        .print-only {
          display: none;
        }

        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Sarabun", sans-serif !important;
            font-size: 14pt !important;
            line-height: 1.6 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .phone-shell {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .report-card {
            border: 1px solid #000000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 1.5cm !important;
            margin-bottom: 2cm !important;
            background: transparent !important;
          }
          .indicator-box {
            border-bottom: 1px solid #333 !important;
            padding-bottom: 12px !important;
            margin-bottom: 16px !important;
          }
          .evidence-subcard {
            border: 1px dashed #666 !important;
            background: transparent !important;
            padding: 10px !important;
            margin-top: 8px !important;
          }
        }
      `}</style>

      {/* Action buttons - hidden on printing */}
      <div style={s.actionRow} className="no-print">
        <Link href="/app/pa" style={s.backBtn}>
          ← กลับหน้าจัดการหลักฐาน
        </Link>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => window.print()} style={s.printBtn}>
            🖨️ พิมพ์รายงาน / บันทึกเป็น PDF
          </button>
          <button type="button" onClick={handleExportToWord} style={{ ...s.printBtn, background: "linear-gradient(135deg, #10b981, #059669)" }}>
            📝 ดาวน์โหลดไฟล์ Word (.doc)
          </button>
        </div>
      </div>

      {/* Filters card - hidden on printing */}
      <div style={s.filterCard} className="no-print">
        <label style={s.label}>
          เลือกปีการศึกษาที่จัดทำรายงาน:
          <select
            style={s.select}
            value={academicYear}
            onChange={(e) => setAcademicYear(Number(e.target.value))}
          >
            <option value={2569}>ปีการศึกษา 2569</option>
            <option value={2568}>ปีการศึกษา 2568</option>
            <option value={2567}>ปีการศึกษา 2567</option>
          </select>
        </label>
      </div>

      {/* Main Report Document Card */}
      <div style={s.reportCard} className="report-card">
        {/* Cover Sheet */}
        <div style={s.coverSheet}>
          <div style={s.garudaSymbol}>⚜️</div>
          <h1 style={s.mainTitle}>รายงานสรุปผลการประเมินผลการพัฒนางานตามข้อตกลง (PA)</h1>
          <p style={s.subTitle}>สำหรับข้าราชการครูและบุคลากรทางการศึกษา ตำแหน่ง {profile.positionName} วิทยฐานะ {profile.academicRank}</p>
          <p style={s.yearText}>ประจำปีการศึกษา {academicYear}</p>

          <div style={s.divider} />

          {/* Teacher Profile Info Grid */}
          <div style={s.profileGrid}>
            <div style={s.profileLabel}>ผู้รายงาน:</div>
            <div style={s.profileValue}>{profile.fullName}</div>

            <div style={s.profileLabel}>ตำแหน่ง:</div>
            <div style={s.profileValue}>{profile.positionName} วิทยฐานะ {profile.academicRank}</div>

            <div style={s.profileLabel}>กลุ่มสาระการเรียนรู้:</div>
            <div style={s.profileValue}>{profile.subjectGroup}</div>

            <div style={s.profileLabel}>สถานศึกษา:</div>
            <div style={s.profileValue}>{profile.schoolName}</div>
          </div>
        </div>

        <div className="page-break" />

        {/* Evaluation Sections */}
        <div style={s.contentSheet}>
          <h2 style={s.sectionHeader}>ส่วนที่ 1: ผลสัมฤทธิ์ของงานตามตัวชี้วัด (15 ตัวชี้วัด)</h2>

          {sections.map((section, secIdx) => (
            <div key={secIdx} style={s.sectionBlock} className="avoid-break">
              <h3 style={s.sectionTitle}>{section.title}</h3>

              <div style={s.indicatorList}>
                {section.indicators.map((ind) => {
                  const matched = mappedEvidences[ind.code] || [];
                  
                  return (
                    <div key={ind.code} style={s.indicatorBox} className="indicator-box avoid-break">
                      <div style={s.indicatorHeader}>
                        <strong style={s.indicatorCode}>ตัวชี้วัด {ind.code}</strong>
                        <span style={s.indicatorTitle}>{ind.title}</span>
                      </div>

                      {/* Matched Evidences */}
                      {matched.length > 0 ? (
                        <div style={s.evidenceList}>
                          {matched.map((e) => (
                            <div key={e.id} style={s.evidenceSubcard} className="evidence-subcard">
                              <div style={s.evidenceHeaderRow}>
                                <span style={s.evidenceTitle}>📌 {e.title}</span>
                                <span style={s.statusBadge}>สถานะ: {getStatusLabel(e.description)}</span>
                              </div>
                              <p style={s.evidenceDesc}>
                                {cleanDescription(e.description)}
                              </p>
                              <span style={s.evidenceDate}>วันที่แนบหลักฐาน: {formatDate(e.evidence_date)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={s.emptyEvidence}>⚠️ ยังไม่มีเอกสารหลักฐานประกอบในระบบ</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Approval Sheet - visible mostly on printing */}
        <div style={s.approvalSheet} className="page-break print-only">
          <p style={{ textAlign: "right", marginTop: "3cm" }}>ลงชื่อ..............................................................ผู้รับรองผล</p>
          <p style={{ textAlign: "right", marginRight: "1cm" }}>(..............................................................)</p>
          <p style={{ textAlign: "right", marginRight: "0.5cm" }}>ตำแหน่ง ผู้อำนวยการ{profile.schoolName}</p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    fontFamily: "'Sarabun', sans-serif"
  },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  backBtn: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "13px"
  },
  printBtn: {
    padding: "0.6rem 1.25rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99,102,241,0.25)"
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontWeight: "bold",
    fontSize: "13px",
    color: "#475569"
  },
  select: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px",
    outline: "none"
  },
  reportCard: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "2rem 1.5rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
  },
  coverSheet: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "2rem 0 3rem"
  },
  garudaSymbol: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
    color: "#4f46e5"
  },
  mainTitle: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 0.5rem",
    lineHeight: 1.4
  },
  subTitle: {
    fontSize: "0.95rem",
    color: "#475569",
    margin: "0 0 0.5rem",
    lineHeight: 1.5
  },
  yearText: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#6366f1",
    margin: "0"
  },
  divider: {
    width: "100%",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #cbd5e1 50%, transparent)",
    margin: "2rem 0"
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: "10px 14px",
    width: "100%",
    maxWidth: "340px",
    textAlign: "left",
    fontSize: "13.5px"
  },
  profileLabel: {
    fontWeight: 700,
    color: "#64748b"
  },
  profileValue: {
    color: "#1e293b",
    fontWeight: 500
  },
  contentSheet: {
    marginTop: "1rem"
  },
  sectionHeader: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#1e293b",
    borderBottom: "2px solid #6366f1",
    paddingBottom: "8px",
    margin: "0 0 1.5rem"
  },
  sectionBlock: {
    marginBottom: "2rem"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    background: "#f1f5f9",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: "8px",
    margin: "0 0 1rem"
  },
  indicatorList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  indicatorBox: {
    padding: "0 4px 10px",
    borderBottom: "1px dashed #e2e8f0"
  },
  indicatorHeader: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    fontSize: "13.5px",
    lineHeight: 1.45,
    marginBottom: "8px"
  },
  indicatorCode: {
    color: "#6366f1",
    fontWeight: 800,
    whiteSpace: "nowrap",
    background: "#eef2ff",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  indicatorTitle: {
    fontWeight: 600,
    color: "#0f172a"
  },
  evidenceList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "6px"
  },
  evidenceSubcard: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  evidenceHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },
  evidenceTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#1e293b"
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#16a34a",
    background: "#dcfce7",
    padding: "1px 6px",
    borderRadius: "4px"
  },
  evidenceDesc: {
    margin: "2px 0 0",
    fontSize: "12.5px",
    color: "#475569",
    whiteSpace: "pre-wrap"
  },
  evidenceDate: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  emptyEvidence: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#94a3b8",
    fontStyle: "italic"
  },
  approvalSheet: {
    fontSize: "14pt"
  }
};
