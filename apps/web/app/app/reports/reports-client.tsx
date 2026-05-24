"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CourseListItem } from "@/lib/queries/courses";
import type { CourseReportData } from "@/lib/queries/reports";

type Props = {
  courses: CourseListItem[];
  selectedCourseId: string;
  reportData: CourseReportData;
};

export function ReportsClient({ courses, selectedCourseId, reportData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

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
                    <td style={{ ...s.td, fontWeight: "bold" }}>{student.fullName}</td>
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
