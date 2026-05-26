"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CourseListItem } from "@/lib/queries/courses";
import type { CourseReportData, ReportStudentOutcomes } from "@/lib/queries/reports";
import { getStudentAttendanceDetail } from "./actions";
import type { StudentAttendanceDetail } from "./actions";
import { fetchBehaviorLogs } from "../students/behavior/actions";
import type { BehaviorLogItem } from "../students/behavior/actions";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "ไม่ระบุ";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getBehaviorCategoryDetails(category: string) {
  switch (category) {
    case "positive":
      return { label: "พฤติกรรมเชิงบวก", color: "#10b981", icon: "⭐" };
    case "negative":
      return { label: "พฤติกรรมควรปรับปรุง", color: "#ef4444", icon: "⚠️" };
    case "home_visit":
      return { label: "การเยี่ยมบ้าน", color: "#3b82f6", icon: "🏠" };
    case "counseling":
      return { label: "การแนะแนวช่วยเหลือ", color: "#8b5cf6", icon: "🤝" };
    case "parent_contact":
      return { label: "การประสานผู้ปกครอง", color: "#6366f1", icon: "📞" };
    default:
      return { label: category, color: "#64748b", icon: "📝" };
  }
}

type Props = {
  courses: CourseListItem[];
  selectedCourseId: string;
  reportData: CourseReportData;
};

export function ReportsClient({ courses, selectedCourseId, reportData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<ReportStudentOutcomes | null>(null);
  const [attendanceDetail, setAttendanceDetail] = useState<StudentAttendanceDetail | null>(null);
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLogItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleStudentClick = async (student: ReportStudentOutcomes) => {
    setSelectedStudent(student);
    setIsLoadingDetails(true);
    setAttendanceDetail(null);
    setBehaviorLogs([]);
    try {
      const [attRes, behaviorRes] = await Promise.all([
        getStudentAttendanceDetail(student.studentId),
        fetchBehaviorLogs([student.studentId])
      ]);
      setAttendanceDetail(attRes);
      setBehaviorLogs(behaviorRes);
    } catch (err) {
      console.error("Error loading student details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleExportStudentDoc = (
    student: ReportStudentOutcomes,
    attendance: StudentAttendanceDetail | null,
    logs: BehaviorLogItem[]
  ) => {
    const title = `รายงานสารสนเทศผู้เรียนรายบุคคล_${student.fullName}_วPA_2.1`;

    let scoresRowsHtml = "";
    reportData.assignments.forEach(a => {
      const score = student.scores[a.id];
      const scoreStr = score !== null && score !== undefined ? `${score} / ${a.maxScore}` : "ขาดส่ง";
      const percentStr = score !== null && score !== undefined ? `${Math.round((score / a.maxScore) * 100)}%` : "0%";
      scoresRowsHtml += `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${a.title}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt;">${a.type === "pre" ? "สอบก่อนเรียน" : a.type === "post" ? "สอบหลังเรียน" : "ใบงาน/แบบฝึกหัด"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt; font-weight: bold;">${scoreStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt;">${percentStr}</td>
        </tr>
      `;
    });

    let attendanceHtml = "";
    if (attendance) {
      attendanceHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">มาเรียน (วัน)</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">ลากิจ/ลาป่วย (วัน)</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">เข้าเรียนสาย (วัน)</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">ขาดเรียน (วัน)</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">อัตราเข้าเรียนสุทธิ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt; color: #15803d; font-weight: bold;">${attendance.present} วัน</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt; color: #1d4ed8;">${attendance.leave} วัน</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt; color: #a16207;">${attendance.late} วัน</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt; color: #b91c1c;">${attendance.absent} วัน</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12pt; font-weight: bold; background-color: #f0fdf4;">${student.attendanceRate}%</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      attendanceHtml = `<p style="font-size: 11pt; color: #94a3b8; font-style: italic;">ไม่มีสถิติการเข้าเรียนสะสม</p>`;
    }

    let behaviorRowsHtml = "";
    if (logs.length > 0) {
      logs.forEach(log => {
        const catLabel = getBehaviorCategoryDetails(log.category).label;
        const pts = log.points >= 0 ? `+${log.points}` : `${log.points}`;
        const parentStatus = log.parent_acknowledged 
          ? `รับทราบแล้วเมื่อ ${formatDate(log.parent_acknowledged_at)} ${log.parent_comment ? `(ความเห็น: ${log.parent_comment})` : ""}`
          : "รอดำเนินการลงชื่อ";
        behaviorRowsHtml += `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">${formatDate(log.log_date)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; font-weight: bold;">${log.title}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${catLabel}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">${log.description || "-"}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center; font-weight: bold;">${pts} คะแนน</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; color: ${log.parent_acknowledged ? "#16a34a" : "#b45309"}">${parentStatus}</td>
          </tr>
        `;
      });
    } else {
      behaviorRowsHtml = `
        <tr>
          <td colspan="6" style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">
            ยังไม่มีรายการบันทึกพฤติกรรมสะสมสำหรับผู้เรียนรายนี้
          </td>
        </tr>
      `;
    }

    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>รายงานรายบุคคล - ${student.fullName}</title>
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
        <h1 class="title">รายงานสารสนเทศผลการเรียนรู้และพฤติกรรมรายบุคคล</h1>
        <p class="subtitle">เอกสารประกอบการประเมินวิทยฐานะ วPA (ด้านผลลัพธ์ผู้เรียน ตัวชี้วัด 2.1 และ 2.2)</p>

        <hr style="border: 1px solid #cbd5e1; margin: 20px 0;" />

        <h2 class="section-title">ข้อมูลส่วนตัวผู้เรียน</h2>
        <table class="info-table" style="width: 100%; border: none; border-collapse: collapse;">
          <tr>
            <td style="width: 120px; font-weight: bold;">ชื่อ - นามสกุล:</td>
            <td>${student.fullName}</td>
            <td style="width: 120px; font-weight: bold;">รหัสประจำตัว:</td>
            <td>${student.studentCode}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">วิชาเรียน:</td>
            <td>${reportData.courseTitle} (${reportData.courseCode})</td>
            <td style="font-weight: bold;">ห้องเรียน:</td>
            <td>${reportData.classroomName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">คะแนนเฉลี่ยสะสม:</td>
            <td><strong>${student.averageScorePercent}%</strong></td>
            <td style="font-weight: bold;">อัตราเข้าเรียนสะสม:</td>
            <td><strong>${student.attendanceRate}%</strong></td>
          </tr>
        </table>

        <h2 class="section-title">1. สรุปผลสัมฤทธิ์ทางการเรียนและคะแนนการเก็บสะสม</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: left;">ชิ้นงาน / แบบทดสอบ</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">ประเภทชิ้นงาน</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">คะแนนที่ได้ / คะแนนเต็ม</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt; text-align: center;">ร้อยละสัมฤทธิผล</th>
            </tr>
          </thead>
          <tbody>
            ${scoresRowsHtml}
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt; text-align: right;">สรุปค่าเฉลี่ยร้อยละสะสม:</td>
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 10px; font-size: 12pt; text-align: center; color: #1d4ed8; background-color: #eff6ff;">${student.averageScorePercent}%</td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-title">2. ข้อมูลสถิติการเข้าเรียนสะสม (วPA 2.1)</h2>
        ${attendanceHtml}

        <h2 class="section-title">3. ประวัติพฤติกรรมและการช่วยเหลือผู้เรียนสะสม (วPA 2.2)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: center; width: 90px;">วันที่</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left;">พฤติกรรม / กิจกรรม</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; width: 100px;">ประเภท</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left;">รายละเอียด</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: center; width: 80px;">คะแนน</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; width: 150px;">สถานะผู้ปกครอง</th>
            </tr>
          </thead>
          <tbody>
            ${behaviorRowsHtml}
          </tbody>
        </table>

        <br style="page-break-before: always; break-before: page;" />

        <table style="width: 100%; margin-top: 60px; border: none; border-collapse: collapse;">
          <tr>
            <td style="border: none; text-align: center; font-size: 11pt; width: 50%;">
              ลงชื่อ..............................................................ครูผู้สอน
              <br/><br/>
              (..............................................................)
              <br/><br/>
              ครูประจำวิชา/ครูที่ปรึกษา
            </td>
            <td style="border: none; text-align: center; font-size: 11pt; width: 50%;">
              ลงชื่อ..............................................................ผู้ปกครอง
              <br/><br/>
              (..............................................................)
              <br/><br/>
              ผู้ปกครองรับรอง/ร่วมมือแก้ไขพฤติกรรม
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
    
    alert("ดาวน์โหลดไฟล์รายงานรายบุคคล (.doc) เรียบร้อยแล้ว!");
  };

  // Find pre and post test averages
  const preTest = reportData.assignments.find(a => a.type === "pre");
  const postTest = reportData.assignments.find(a => a.type === "post");
  const growthRate = preTest && postTest ? postTest.averagePercent - preTest.averagePercent : 0;

  // Calculate score distribution
  const distribution = useMemo(() => {
    const counts = { excellent: 0, good: 0, fair: 0, poor: 0 };
    reportData.students.forEach(s => {
      if (s.averageScorePercent >= 80) counts.excellent++;
      else if (s.averageScorePercent >= 60) counts.good++;
      else if (s.averageScorePercent >= 40) counts.fair++;
      else counts.poor++;
    });
    return counts;
  }, [reportData.students]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reportData.students;
    return reportData.students.filter(
      s => s.fullName.toLowerCase().includes(q) || s.studentCode.includes(q)
    );
  }, [searchQuery, reportData.students]);

  // Total points average across all students
  const overallClassAveragePercent = useMemo(() => {
    if (!reportData.students.length) return 0;
    const sum = reportData.students.reduce((acc, s) => acc + s.averageScorePercent, 0);
    return Math.round(sum / reportData.students.length);
  }, [reportData.students]);

  function handleCourseChange(courseId: string) {
    startTransition(() => {
      router.push(`/app/reports?courseId=${courseId}` as any);
    });
  }

  return (
    <div style={s.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .report-section { animation: fadeUp 0.3s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .dist-bar-item:hover { filter: brightness(0.93); cursor: pointer; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Sarabun", sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .phone-shell {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .print-card {
            border: 1px solid #000000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 1.5cm !important;
            background: transparent !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* Course Select Dropdown Card — Hidden on printing */}
      <div style={s.card} className="no-print">
        <label style={s.label}>
          เลือกรายวิชาที่ต้องการวิเคราะห์ผล
          <select
            style={s.select}
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            disabled={isPending}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} | {c.title} ({c.grade_level})
              </option>
            ))}
          </select>
        </label>
        
        <button type="button" onClick={() => window.print()} style={s.printBtn}>
          🖨️ พิมพ์รายงาน/บันทึก PDF แนบ วPA
        </button>
      </div>

      {/* Printable Report Document Sheet */}
      <div style={s.reportSheet} className="print-card report-section">
        {/* Header Cover Sheet */}
        <div style={s.documentHeader}>
          <div style={s.documentTitleBlock}>
            <span style={s.docEyebrow}>หลักฐานประกอบการประเมินวิทยฐานะ วPA (ด้านผลลัพธ์ผู้เรียน)</span>
            <h2 style={s.docTitle}>รายงานสรุปผลการวิเคราะห์และพัฒนาการเรียนรู้รายบุคคล</h2>
            <p style={s.docSubtitle}>
              วิชา: {reportData.courseTitle} ({reportData.courseCode}) | ห้องเรียน: {reportData.classroomName} | จำนวนนักเรียน: {reportData.studentCount} คน
            </p>
          </div>
          <div style={s.garudaBadge} className="print-only">⚜️</div>
        </div>

        <div style={s.divider} />

        {/* Stats Grid */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <span style={s.statEmoji}>👥</span>
            <div>
              <p style={s.statVal}>{reportData.studentCount}</p>
              <p style={s.statLabel}>นักเรียนทั้งหมด</p>
            </div>
          </div>

          <div style={s.statCard}>
            <span style={s.statEmoji}>✅</span>
            <div>
              <p style={s.statVal}>{reportData.overallAttendanceRate}%</p>
              <p style={s.statLabel}>เข้าชั้นเรียนเฉลี่ย</p>
            </div>
          </div>

          <div style={s.statCard}>
            <span style={s.statEmoji}>📈</span>
            <div>
              <p style={s.statVal}>{overallClassAveragePercent}%</p>
              <p style={s.statLabel}>คะแนนเฉลี่ยทั้งห้อง</p>
            </div>
          </div>

          {preTest && postTest && (
            <div style={{ ...s.statCard, borderLeft: "4px solid #10b981" }}>
              <span style={{ ...s.statEmoji, color: "#10b981" }}>🔥</span>
              <div>
                <p style={{ ...s.statVal, color: "#10b981" }}>+{growthRate}%</p>
                <p style={s.statLabel}>พัฒนาการผู้เรียน</p>
              </div>
            </div>
          )}
        </div>

        {/* Pre vs Post Test Growth comparison */}
        {preTest && postTest && (
          <div style={s.growthSection}>
            <h3 style={s.sectionTitle}>1. ผลการวิเคราะห์พัฒนาการเรียนรู้ (Pre-test vs Post-test)</h3>
            <p style={s.sectionDesc}>
              เปรียบเทียบสถิติคะแนนสอบก่อนเรียนและหลังเรียนเพื่อแสดงผลการจัดกิจกรรมการเรียนรู้เชิงประจักษ์ (ตามตัวชี้วัด วPA 1.5)
            </p>

            <div style={s.growthChartContainer}>
              <div style={s.chartColumn}>
                <div style={s.chartColumnHeader}>
                  <strong>สอบก่อนเรียน (Pre-test)</strong>
                  <span>เฉลี่ย {preTest.averageScore}/{preTest.maxScore} คะแนน</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${preTest.averagePercent}%`, background: "#f59e0b" }}>
                    {preTest.averagePercent}%
                  </div>
                </div>
              </div>

              <div style={s.chartColumn}>
                <div style={s.chartColumnHeader}>
                  <strong>สอบหลังเรียน (Post-test)</strong>
                  <span>เฉลี่ย {postTest.averageScore}/{postTest.maxScore} คะแนน</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${postTest.averagePercent}%`, background: "#10b981" }}>
                    {postTest.averagePercent}%
                  </div>
                </div>
              </div>

              <div style={s.growthSummaryBox}>
                <span style={s.growthBadge}>พัฒนาการเชิงสถิติเฉลี่ยเพิ่มขึ้น +{growthRate}%</span>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>
                  สะท้อนความสัมฤทธิผลของการจัดหน่วยเรียนรู้นวัตกรรมในการกระตุ้นทักษะแนวคิดเชิงคำนวณและการแก้ปัญหาอย่างเป็นระบบ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Distribution */}
        <div style={s.distSection}>
          <h3 style={s.sectionTitle}>2. การกระจายตัวระดับผลสัมฤทธิ์ของผู้เรียน (Score Distribution)</h3>
          <p style={s.sectionDesc}>สัดส่วนการผ่านเกณฑ์ประเมินชิ้นงานสะสมและแบบฝึกหัดในหน่วยการเรียนรู้</p>
          
          {/* Distribution Stacked Bar */}
          <div style={s.stackedBar}>
            {distribution.excellent > 0 && (
              <div
                className="dist-bar-item"
                style={{ ...s.stackedBarItem, width: `${(distribution.excellent / reportData.students.length) * 100}%`, background: "#10b981" }}
                title={`ดีเยี่ยม ${distribution.excellent} คน`}
              >
                {Math.round((distribution.excellent / reportData.students.length) * 100)}%
              </div>
            )}
            {distribution.good > 0 && (
              <div
                className="dist-bar-item"
                style={{ ...s.stackedBarItem, width: `${(distribution.good / reportData.students.length) * 100}%`, background: "#3b82f6" }}
                title={`ดี ${distribution.good} คน`}
              >
                {Math.round((distribution.good / reportData.students.length) * 100)}%
              </div>
            )}
            {distribution.fair > 0 && (
              <div
                className="dist-bar-item"
                style={{ ...s.stackedBarItem, width: `${(distribution.fair / reportData.students.length) * 100}%`, background: "#f59e0b" }}
                title={`พอใช้ ${distribution.fair} คน`}
              >
                {Math.round((distribution.fair / reportData.students.length) * 100)}%
              </div>
            )}
            {distribution.poor > 0 && (
              <div
                className="dist-bar-item"
                style={{ ...s.stackedBarItem, width: `${(distribution.poor / reportData.students.length) * 100}%`, background: "#ef4444" }}
                title={`ปรับปรุง ${distribution.poor} คน`}
              >
                {Math.round((distribution.poor / reportData.students.length) * 100)}%
              </div>
            )}
          </div>

          {/* Distribution Legends */}
          <div style={s.legendsGrid}>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: "#10b981" }} /> <span>ดีเยี่ยม (80-100%): <strong>{distribution.excellent} คน</strong></span></div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: "#3b82f6" }} /> <span>ดี (60-79%): <strong>{distribution.good} คน</strong></span></div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: "#f59e0b" }} /> <span>พอใช้ (40-59%): <strong>{distribution.fair} คน</strong></span></div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: "#ef4444" }} /> <span>ปรับปรุง (&lt;40%): <strong>{distribution.poor} คน</strong></span></div>
          </div>
        </div>

        <div className="page-break" />

        {/* Student Outcomes Listing */}
        <div style={s.tableSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ ...s.sectionTitle, margin: 0 }}>3. ผลการเรียนรู้และสถิติรายบุคคล (Individual Student Outcomes)</h3>
            
            {/* Search Filter input */}
            <input
              type="text"
              style={s.tableSearchInput}
              className="no-print"
              placeholder="🔍 ค้นหานักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>รหัส</th>
                  <th style={{ ...s.th, textAlign: "left" }}>ชื่อ - นามสกุล</th>
                  <th style={s.th}>เข้าเรียน</th>
                  <th style={s.th}>ส่งงาน</th>
                  {reportData.assignments.map(a => (
                    <th key={a.id} style={s.th} title={a.title}>
                      {a.title.length > 10 ? a.title.slice(0, 10) + ".." : a.title}
                    </th>
                  ))}
                  <th style={s.th}>คะแนนสะสม</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.studentId} style={s.tr}>
                    <td style={s.tdCenter}>{student.studentCode}</td>
                    <td style={{ ...s.td, fontWeight: "bold" }}>
                      <button
                        onClick={() => handleStudentClick(student)}
                        style={s.studentLink}
                        title={`ดูสารสนเทศรายบุคคลของ ${student.fullName}`}
                        type="button"
                      >
                        {student.fullName}
                      </button>
                    </td>
                    <td style={s.tdCenter}>
                      <span style={{
                        color: student.attendanceRate >= 80 ? "#10b981" : "#ef4444",
                        fontWeight: 700
                      }}>
                        {student.attendanceRate}%
                      </span>
                    </td>
                    <td style={s.tdCenter}>{student.submittedCount}/{student.totalAssignments}</td>
                    {reportData.assignments.map(a => {
                      const score = student.scores[a.id];
                      return (
                        <td key={a.id} style={s.tdCenter}>
                          {score !== null && score !== undefined ? (
                            <strong style={{ color: "#334155" }}>{score}/{a.maxScore}</strong>
                          ) : (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>ขาดส่ง</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={s.tdCenter}>
                      <span style={{
                        ...s.avgBadge,
                        background:
                          student.averageScorePercent >= 80 ? "#dcfce7" :
                          student.averageScorePercent >= 60 ? "#dbeafe" :
                          student.averageScorePercent >= 40 ? "#fef9c3" : "#fee2e2",
                        color:
                          student.averageScorePercent >= 80 ? "#15803d" :
                          student.averageScorePercent >= 60 ? "#1d4ed8" :
                          student.averageScorePercent >= 40 ? "#a16207" : "#b91c1c"
                      }}>
                        {student.averageScorePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Document Certification */}
        <div style={s.documentFooter} className="page-break print-only">
          <div style={s.approvalSection}>
            <p>ลงชื่อ..............................................................ครูผู้สอน</p>
            <p style={{ marginRight: "1.2cm" }}>(..............................................................)</p>
            <p style={{ marginRight: "0.2cm" }}>ตำแหน่ง ครูผู้สอนวิชาวิทยาการคำนวณ</p>
          </div>
          <div style={s.approvalSection}>
            <p>ลงชื่อ..............................................................ผู้รับรองผล</p>
            <p style={{ marginRight: "1.2cm" }}>(..............................................................)</p>
            <p style={{ marginRight: "0.2cm" }}>ผู้อำนวยการสถานศึกษา</p>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div style={s.modalOverlay} className="no-print">
          <div style={s.modalContainer}>
            {/* Modal Header */}
            <div style={s.modalHeader}>
              <div>
                <span style={s.modalEyebrow}>ข้อมูลสารสนเทศผู้เรียนรายบุคคล (วPA 2.1)</span>
                <h3 style={s.modalTitle}>{selectedStudent.fullName}</h3>
                <p style={s.modalSubtitle}>รหัสนักเรียน: {selectedStudent.studentCode} | ห้องเรียน: {reportData.classroomName}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={s.modalCloseBtn}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={s.modalBody}>
              {isLoadingDetails ? (
                <div style={s.loadingContainer}>
                  <div className="spinner" style={s.spinner} />
                  <p style={{ marginTop: "12px", color: "#64748b", fontSize: "14px" }}>กำลังโหลดข้อมูลพฤติกรรมและสถิติการเข้าเรียน...</p>
                </div>
              ) : (
                <div style={s.modalGrid}>
                  
                  {/* Left Column: Academic & Attendance */}
                  <div style={s.modalLeftCol}>
                    {/* Pre/Post Test Comparative Chart */}
                    <div style={s.modalCard}>
                      <h4 style={s.modalCardTitle}>📊 ผลการสอบเปรียบเทียบ Pre-Test vs Post-Test</h4>
                      
                      {(() => {
                        const preTestAssignment = reportData.assignments.find(a => a.type === "pre");
                        const postTestAssignment = reportData.assignments.find(a => a.type === "post");
                        const preScore = preTestAssignment ? selectedStudent.scores[preTestAssignment.id] : null;
                        const postScore = postTestAssignment ? selectedStudent.scores[postTestAssignment.id] : null;

                        if (preTestAssignment && postTestAssignment && preScore !== null && postScore !== null) {
                          const preMax = preTestAssignment.maxScore || 10;
                          const postMax = postTestAssignment.maxScore || 10;
                          const prePercent = Math.round((preScore / preMax) * 100);
                          const postPercent = Math.round((postScore / postMax) * 100);
                          const growth = postPercent - prePercent;

                          // SVG coordinates
                          const preHeight = (prePercent / 100) * 110;
                          const postHeight = (postPercent / 100) * 110;

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                              <svg viewBox="0 0 320 180" width="100%" height="150" style={{ overflow: "visible" }}>
                                <defs>
                                  <linearGradient id="preGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#d97706" />
                                  </linearGradient>
                                  <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                  </linearGradient>
                                </defs>

                                {/* Grid lines */}
                                <line x1="40" y1="30" x2="280" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="40" y1="85" x2="280" y2="85" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="40" y1="140" x2="280" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />

                                <text x="30" y="34" textAnchor="end" fontSize="10" fill="#94a3b8">100%</text>
                                <text x="30" y="89" textAnchor="end" fontSize="10" fill="#94a3b8">50%</text>
                                <text x="30" y="144" textAnchor="end" fontSize="10" fill="#94a3b8">0%</text>

                                {/* Pre Bar */}
                                <rect x="75" y={140 - preHeight} width="40" height={preHeight} rx="4" fill="url(#preGrad)" />
                                <text x="95" y={135 - preHeight} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#d97706">
                                  {preScore}/{preMax}
                                </text>
                                <text x="95" y={155} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">Pre-test</text>
                                <text x="95" y={170} textAnchor="middle" fontSize="10" fill="#94a3b8">({prePercent}%)</text>

                                {/* Post Bar */}
                                <rect x="205" y={140 - postHeight} width="40" height={postHeight} rx="4" fill="url(#postGrad)" />
                                <text x="225" y={135 - postHeight} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#059669">
                                  {postScore}/{postMax}
                                </text>
                                <text x="225" y={155} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">Post-test</text>
                                <text x="225" y={170} textAnchor="middle" fontSize="10" fill="#94a3b8">({postPercent}%)</text>

                                {/* Growth Indicator line */}
                                <path d={`M 115 ${140 - preHeight} Q 160 ${Math.min(140 - preHeight, 140 - postHeight) - 30} 205 ${140 - postHeight}`} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 3" />
                                <circle cx="205" cy={140 - postHeight} r="3" fill="#6366f1" />
                                <rect x="135" y={Math.min(140 - preHeight, 140 - postHeight) - 40} width="50" height="18" rx="9" fill="#eef2ff" stroke="#e0e7ff" strokeWidth="1" />
                                <text x="160" y={Math.min(140 - preHeight, 140 - postHeight) - 27} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4f46e5">
                                  +{growth}%
                                </text>
                              </svg>
                              <div style={s.growthBadgeBox}>
                                <span style={s.modalGrowthBadge}>พัฒนาการเพิ่มขึ้น {growth > 0 ? `+${growth}` : growth}%</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <p style={s.noChartData}>⚠️ ไม่มีข้อมูลคะแนนสอบเปรียบเทียบ Pre/Post test สำหรับผู้เรียนรายนี้</p>
                          );
                        }
                      })()}
                    </div>

                    {/* Attendance rate donut chart */}
                    <div style={s.modalCard}>
                      <h4 style={s.modalCardTitle}>🕒 อัตราการเข้าเรียนและสถิติสะสม</h4>
                      {attendanceDetail ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                          {(() => {
                            const total = attendanceDetail.total || 1;
                            const r = 40;
                            const c = 2 * Math.PI * r; // 251.32

                            const pPercent = attendanceDetail.present / total;
                            const latePercent = attendanceDetail.late / total;
                            const leavePercent = attendanceDetail.leave / total;
                            const absPercent = attendanceDetail.absent / total;

                            const pDash = pPercent * c;
                            const lateDash = latePercent * c;
                            const leaveDash = leavePercent * c;
                            const absDash = absPercent * c;

                            const pOffset = 0;
                            const lateOffset = -pDash;
                            const leaveOffset = -(pDash + lateDash);
                            const absOffset = -(pDash + lateDash + leaveDash);

                            return (
                              <div style={{ display: "flex", gap: "24px", alignItems: "center", width: "100%", justifyContent: "center" }}>
                                {/* SVG Donut */}
                                <svg width="110" height="110" viewBox="0 0 110 110" style={{ overflow: "visible" }}>
                                  <circle cx="55" cy="55" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                  {attendanceDetail.present > 0 && (
                                    <circle cx="55" cy="55" r={r} fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={`${pDash} ${c}`} strokeDashoffset={pOffset} transform="rotate(-90 55 55)" />
                                  )}
                                  {attendanceDetail.late > 0 && (
                                    <circle cx="55" cy="55" r={r} fill="transparent" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${lateDash} ${c}`} strokeDashoffset={lateOffset} transform="rotate(-90 55 55)" />
                                  )}
                                  {attendanceDetail.leave > 0 && (
                                    <circle cx="55" cy="55" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray={`${leaveDash} ${c}`} strokeDashoffset={leaveOffset} transform="rotate(-90 55 55)" />
                                  )}
                                  {attendanceDetail.absent > 0 && (
                                    <circle cx="55" cy="55" r={r} fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${absDash} ${c}`} strokeDashoffset={absOffset} transform="rotate(-90 55 55)" />
                                  )}
                                  <text x="55" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e293b">
                                    {selectedStudent.attendanceRate}%
                                  </text>
                                  <text x="55" y="66" textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748b">
                                    เข้าเรียน
                                  </text>
                                </svg>

                                {/* Donut Legends */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={s.donutLegendItem}>
                                    <span style={{ ...s.legendDot, background: "#10b981" }} />
                                    <span style={{ fontSize: "11.5px" }}>มาเรียน: <strong>{attendanceDetail.present} วัน</strong></span>
                                  </div>
                                  <div style={s.donutLegendItem}>
                                    <span style={{ ...s.legendDot, background: "#f59e0b" }} />
                                    <span style={{ fontSize: "11.5px" }}>สาย: <strong>{attendanceDetail.late} วัน</strong></span>
                                  </div>
                                  <div style={s.donutLegendItem}>
                                    <span style={{ ...s.legendDot, background: "#3b82f6" }} />
                                    <span style={{ fontSize: "11.5px" }}>ลา: <strong>{attendanceDetail.leave} วัน</strong></span>
                                  </div>
                                  <div style={s.donutLegendItem}>
                                    <span style={{ ...s.legendDot, background: "#ef4444" }} />
                                    <span style={{ fontSize: "11.5px" }}>ขาด: <strong>{attendanceDetail.absent} วัน</strong></span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <p style={s.noChartData}>ไม่มีข้อมูลการเข้าเรียนสำหรับผู้เรียนรายนี้</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Behavior logs timeline */}
                  <div style={s.modalRightCol}>
                    <div style={{ ...s.modalCard, height: "100%", display: "flex", flexDirection: "column", minHeight: "300px" }}>
                      <h4 style={s.modalCardTitle}>📜 ประวัติพฤติกรรมและระบบดูแลช่วยเหลือ (วPA 2.2)</h4>
                      
                      <div style={s.timelineContainer}>
                        {behaviorLogs.length === 0 ? (
                          <div style={s.emptyTimelineBox}>
                            <span style={{ fontSize: "2rem" }}>🕊️</span>
                            <p style={{ margin: "6px 0 0", fontWeight: 600, color: "#64748b", fontSize: "12.5px" }}>ยังไม่มีรายการบันทึกพฤติกรรม</p>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>สามารถบันทึกพฤติกรรมได้ที่หน้าระบบดูแลช่วยเหลือ</p>
                          </div>
                        ) : (
                          <div style={s.timelineList}>
                            {behaviorLogs.map((log) => {
                              const categoryDetails = getBehaviorCategoryDetails(log.category);
                              return (
                                <div key={log.id} style={s.timelineItem}>
                                  <div style={s.timelineConnector} />
                                  <div style={{ ...s.timelineDot, background: categoryDetails.color }}>
                                    {categoryDetails.icon}
                                  </div>

                                  <div style={s.timelineContent}>
                                    <div style={s.timelineHeader}>
                                      <strong style={{ color: "#1e293b", fontSize: "12.5px" }}>{log.title}</strong>
                                      <span style={{
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        color: log.points >= 0 ? "#16a34a" : "#b91c1c",
                                        background: log.points >= 0 ? "#dcfce7" : "#fee2e2",
                                        padding: "1px 5px",
                                        borderRadius: "4px",
                                        whiteSpace: "nowrap"
                                      }}>
                                        {log.points >= 0 ? `+${log.points}` : log.points} คะแนน
                                      </span>
                                    </div>

                                    {log.description && (
                                      <p style={s.timelineDesc}>{log.description}</p>
                                    )}

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center", marginTop: "4px" }}>
                                      <span style={s.timelineDate}>
                                        📅 {formatDate(log.log_date)}
                                      </span>

                                      {log.is_exported_to_pa && (
                                        <span style={s.paBadge} title="ข้อมูลนี้ได้รับการบันทึกเป็นหลักฐานตัวชี้วัด วPA 2.2 แล้ว">
                                          📂 หลักฐาน วPA 2.2
                                        </span>
                                      )}

                                      {log.parent_acknowledged ? (
                                        <span style={s.parentAcknowledgeBadge} title={`ผู้ปกครองลงชื่อรับทราบแล้วเมื่อ ${formatDate(log.parent_acknowledged_at)}`}>
                                          ✓ ผู้ปกครองรับทราบ
                                        </span>
                                      ) : (
                                        <span style={s.parentWaitBadge}>
                                          ⏳ รอผู้ปกครองลงชื่อ
                                        </span>
                                      )}
                                    </div>
                                    
                                    {log.parent_comment && (
                                      <div style={s.parentCommentBox}>
                                        <strong>💬 ความเห็นผู้ปกครอง:</strong> "{log.parent_comment}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={s.modalFooter}>
              <button
                onClick={() => handleExportStudentDoc(selectedStudent, attendanceDetail, behaviorLogs)}
                style={s.exportDocBtn}
                disabled={isLoadingDetails}
                type="button"
              >
                📝 ส่งออกเป็นเอกสารสารสนเทศรายบุคคล (.doc)
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                style={s.modalCloseActionBtn}
                type="button"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
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
    padding: "1.25rem",
    boxShadow: "0 4px 16px rgba(99,102,241,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontWeight: 700,
    fontSize: "13px",
    color: "#475569"
  },
  select: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    background: "#fff",
    fontSize: "14px"
  },
  printBtn: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "14.5px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
  },
  reportSheet: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "2rem 1.5rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  documentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem"
  },
  documentTitleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  docEyebrow: {
    fontSize: "11.5px",
    color: "#6366f1",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  },
  docTitle: {
    fontSize: "19px",
    color: "#0f172a",
    margin: 0,
    fontWeight: 800,
    lineHeight: 1.3
  },
  docSubtitle: {
    fontSize: "13px",
    color: "#475569",
    margin: "4px 0 0"
  },
  garudaBadge: {
    fontSize: "3rem",
    color: "#6366f1"
  },
  divider: {
    height: "2px",
    background: "linear-gradient(90deg, transparent, #cbd5e1 50%, transparent)",
    margin: "0"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px"
  },
  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  statEmoji: {
    fontSize: "1.75rem",
    color: "#6366f1"
  },
  statVal: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
    lineHeight: 1.1
  },
  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0
  },
  growthSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  sectionTitle: {
    fontSize: "14.5px",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px"
  },
  sectionDesc: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0
  },
  growthChartContainer: {
    background: "#fafafa",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  chartColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  chartColumnHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12.5px"
  },
  barTrack: {
    height: "26px",
    background: "#e2e8f0",
    borderRadius: "6px",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: "8px",
    color: "#fff",
    fontSize: "11.5px",
    fontWeight: "bold",
    borderRadius: "6px",
    transition: "width 0.8s ease"
  },
  growthSummaryBox: {
    background: "#ecfdf5",
    border: "1.5px solid #a7f3d0",
    borderRadius: "10px",
    padding: "10px",
    textAlign: "center"
  },
  growthBadge: {
    fontSize: "13.5px",
    fontWeight: "bold",
    color: "#047857",
    background: "#d1fae5",
    padding: "2px 10px",
    borderRadius: "20px"
  },
  distSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  stackedBar: {
    height: "28px",
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    marginTop: "4px"
  },
  stackedBarItem: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
    transition: "all 0.3s ease"
  },
  legendsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "6px",
    marginTop: "4px"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11.5px",
    color: "#475569"
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%"
  },
  tableSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "0.5rem"
  },
  tableSearchInput: {
    width: "200px",
    minHeight: "36px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "12.5px"
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "12px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12.5px"
  },
  th: {
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: 700,
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "center"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9"
  },
  td: {
    padding: "10px",
    color: "#334155"
  },
  tdCenter: {
    padding: "10px",
    textAlign: "center",
    color: "#334155"
  },
  avgBadge: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block"
  },
  approvalSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "12.5px"
  }
};

// Add standard documentCertifier footer style for print layouts
s.documentFooter = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "4cm",
  width: "100%",
  padding: "0 1cm"
};

s.studentLink = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  fontFamily: "inherit",
  fontSize: "inherit",
  fontWeight: "bold",
  color: "#4f46e5",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  cursor: "pointer",
  textAlign: "left",
  transition: "color 0.2s ease"
};

s.modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  padding: "1rem",
  boxSizing: "border-box"
};

s.modalContainer = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  borderRadius: "20px",
  width: "100%",
  maxWidth: "840px",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
  overflow: "hidden",
  boxSizing: "border-box"
};

s.modalHeader = {
  padding: "1.25rem 1.5rem",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
};

s.modalEyebrow = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6366f1",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: "2px"
};

s.modalTitle = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#0f172a",
  margin: 0
};

s.modalSubtitle = {
  fontSize: "12.5px",
  color: "#64748b",
  margin: "2px 0 0"
};

s.modalCloseBtn = {
  background: "#f1f5f9",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

s.modalBody = {
  padding: "1.5rem",
  overflowY: "auto",
  flex: 1,
  backgroundColor: "#f8fafc"
};

s.loadingContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "4rem 0"
};

s.spinner = {
  width: "36px",
  height: "36px",
  border: "3px solid #e2e8f0",
  borderTop: "3px solid #6366f1",
  borderRadius: "50%"
};

s.modalGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.25rem",
  alignItems: "stretch"
};

s.modalLeftCol = {
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem"
};

s.modalRightCol = {
  display: "flex",
  flexDirection: "column"
};

s.modalCard = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "1.25rem",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
};

s.modalCardTitle = {
  fontSize: "13.5px",
  fontWeight: 800,
  color: "#1e293b",
  margin: "0 0 1rem",
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

s.growthBadgeBox = {
  marginTop: "8px",
  textAlign: "center"
};

s.modalGrowthBadge = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#047857",
  background: "#d1fae5",
  padding: "3px 10px",
  borderRadius: "12px",
  display: "inline-block"
};

s.noChartData = {
  fontSize: "12px",
  color: "#94a3b8",
  fontStyle: "italic",
  textAlign: "center",
  padding: "2rem 1rem",
  margin: 0
};

s.donutLegendItem = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  color: "#334155"
};

s.timelineContainer = {
  position: "relative",
  flex: 1,
  overflowY: "auto",
  maxHeight: "350px",
  paddingRight: "4px"
};

s.emptyTimelineBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "3rem 1rem",
  textAlign: "center"
};

s.timelineList = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  position: "relative",
  paddingLeft: "1.75rem",
  marginTop: "4px"
};

s.timelineItem = {
  position: "relative",
  display: "flex",
  flexDirection: "column"
};

s.timelineConnector = {
  position: "absolute",
  left: "-1.35rem",
  top: "0.75rem",
  bottom: "-1.5rem",
  width: "2px",
  backgroundColor: "#e2e8f0",
  zIndex: 1
};

s.timelineDot = {
  position: "absolute",
  left: "-1.75rem",
  top: "0px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: "11px",
  zIndex: 2,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

s.timelineContent = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  cursor: "default"
};

s.timelineHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "8px"
};

s.timelineDesc = {
  fontSize: "12px",
  color: "#475569",
  margin: "2px 0 0",
  whiteSpace: "pre-wrap",
  lineHeight: 1.4
};

s.timelineDate = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: 500
};

s.paBadge = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#6366f1",
  background: "#eef2ff",
  border: "1px solid #e0e7ff",
  padding: "1px 6px",
  borderRadius: "4px",
  cursor: "help"
};

s.parentAcknowledgeBadge = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#16a34a",
  background: "#dcfce7",
  padding: "1px 6px",
  borderRadius: "4px"
};

s.parentWaitBadge = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#b45309",
  background: "#fef3c7",
  padding: "1px 6px",
  borderRadius: "4px"
};

s.parentCommentBox = {
  marginTop: "6px",
  padding: "6px 8px",
  backgroundColor: "#f1f5f9",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#475569",
  borderLeft: "3px solid #94a3b8"
};

s.modalFooter = {
  padding: "1rem 1.5rem",
  borderTop: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  background: "#ffffff"
};

s.exportDocBtn = {
  padding: "0.6rem 1.25rem",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  transition: "all 0.2s ease"
};

s.modalCloseActionBtn = {
  padding: "0.6rem 1.25rem",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#475569",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s ease"
};
