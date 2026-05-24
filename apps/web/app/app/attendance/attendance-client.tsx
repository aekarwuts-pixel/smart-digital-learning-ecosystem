"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveAttendanceSession } from "./actions";
import type { ClassroomOption, ClassroomStudentItem } from "@/lib/queries/classroom-students";
import type { StudentAttendanceState } from "@/lib/queries/attendance";

type AttendanceClientProps = {
  classroomId: string;
  classroomOptions: ClassroomOption[];
  selectedDate: string;
  selectedPeriod: string;
  students: ClassroomStudentItem[];
  existingAttendance: Record<string, StudentAttendanceState>;
  isDemo: boolean;
};

type LocalRecord = {
  status: "present" | "late" | "leave" | "absent";
  note: string;
};

export function AttendanceClient({
  classroomId,
  classroomOptions,
  selectedDate,
  selectedPeriod,
  students,
  existingAttendance,
  isDemo
}: AttendanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected state for filters
  const [currentClassroomId, setCurrentClassroomId] = useState(classroomId);
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentPeriod, setCurrentPeriod] = useState(selectedPeriod);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Local state for attendance records
  // Mapping of student_id -> LocalRecord
  const [records, setRecords] = useState<Record<string, LocalRecord>>({});
  
  // Toast message
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  // Sync with classroom/date/period changes
  useEffect(() => {
    const initialRecords: Record<string, LocalRecord> = {};
    for (const s of students) {
      const match = existingAttendance[s.id];
      initialRecords[s.id] = {
        status: match?.status ?? "present", // Default to present
        note: match?.note ?? ""
      };
    }
    setRecords(initialRecords);
  }, [students, existingAttendance]);

  // Handle filter changes (trigger Next.js page navigation)
  function handleFilterChange(nextClassId: string, nextDate: string, nextPeriod: string) {
    setCurrentClassroomId(nextClassId);
    setCurrentDate(nextDate);
    setCurrentPeriod(nextPeriod);

    startTransition(() => {
      router.push(
        `/app/attendance?classroomId=${nextClassId}&date=${nextDate}&period=${encodeURIComponent(nextPeriod)}`
      );
    });
  }

  // Update status for a specific student
  function setStudentStatus(studentId: string, status: LocalRecord["status"]) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  }

  // Update note for a specific student
  function setStudentNote(studentId: string, note: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  }

  // Quick Action: Mark all students present
  function handleMarkAllPresent() {
    setRecords((prev) => {
      const updated = { ...prev };
      for (const id in updated) {
        updated[id] = { ...updated[id], status: "present" };
      }
      return updated;
    });
    showToast("เช็กชื่อเข้าเรียนให้ทุกคนแล้ว", "info");
  }

  // Quick Action: Reset status to default
  function handleResetAll() {
    const reset: Record<string, LocalRecord> = {};
    for (const s of students) {
      reset[s.id] = { status: "present", note: "" };
    }
    setRecords(reset);
    showToast("รีเซ็ตสถานะทั้งหมดเรียบร้อย", "info");
  }

  // Show status message / toast
  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

  // Handle Save
  const [isSaving, setIsSaving] = useState(false);
  async function handleSave() {
    if (!currentClassroomId) {
      showToast("กรุณาเลือกห้องเรียนก่อนบันทึก", "error");
      return;
    }

    setIsSaving(true);
    try {
      const recordsArray = Object.entries(records).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        note: data.note
      }));

      const res = await saveAttendanceSession(
        currentClassroomId,
        currentDate,
        currentPeriod,
        recordsArray
      );

      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("บันทึกข้อมูลล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  }

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      return fullName.includes(q) || s.student_code.includes(q);
    });
  }, [searchQuery, students]);

  // Statistics counters
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    
    Object.values(records).forEach((r) => {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "leave") leave++;
      else if (r.status === "absent") absent++;
    });

    return { present, late, leave, absent, total: students.length };
  }, [records, students]);

  // Period options
  const periodOptions = [
    "คาบที่ 1",
    "คาบที่ 2",
    "คาบที่ 3",
    "คาบที่ 4",
    "คาบที่ 5",
    "คาบที่ 6",
    "คาบที่ 7",
    "คาบที่ 8"
  ];

  return (
    <div style={style.container}>
      {/* Search and Filters Card */}
      <div style={style.filtersCard}>
        <div style={style.formGrid}>
          <label style={style.label}>
            ห้องเรียน
            <select
              style={style.select}
              value={currentClassroomId}
              onChange={(e) => handleFilterChange(e.target.value, currentDate, currentPeriod)}
              disabled={isPending || isSaving}
            >
              <option value="" disabled>เลือกห้องเรียน</option>
              {classroomOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} | {c.course_title}
                </option>
              ))}
            </select>
          </label>

          <label style={style.label}>
            วันที่
            <input
              type="date"
              style={style.input}
              value={currentDate}
              onChange={(e) => handleFilterChange(currentClassroomId, e.target.value, currentPeriod)}
              disabled={isPending || isSaving}
            />
          </label>

          <label style={style.label}>
            คาบเรียน
            <select
              style={style.select}
              value={currentPeriod}
              onChange={(e) => handleFilterChange(currentClassroomId, currentDate, e.target.value)}
              disabled={isPending || isSaving}
            >
              {periodOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isPending || isSaving) && (
        <div style={style.overlay}>
          <div style={style.spinner} />
          <span style={{ marginTop: "10px", fontWeight: "bold" }}>กำลังปรับปรุงข้อมูล...</span>
        </div>
      )}

      {/* Classroom Status Stats */}
      {students.length > 0 && (
        <div style={style.statsBar}>
          <div style={{ ...style.statBadge, borderLeft: "3px solid #2f9e44" }}>
            <span style={{ color: "#2f9e44", fontWeight: "bold" }}>{stats.present}</span> เข้าเรียน
          </div>
          <div style={{ ...style.statBadge, borderLeft: "3px solid #f59f00" }}>
            <span style={{ color: "#f59f00", fontWeight: "bold" }}>{stats.late}</span> สาย
          </div>
          <div style={{ ...style.statBadge, borderLeft: "3px solid #1f6feb" }}>
            <span style={{ color: "#1f6feb", fontWeight: "bold" }}>{stats.leave}</span> ลา
          </div>
          <div style={{ ...style.statBadge, borderLeft: "3px solid #e03131" }}>
            <span style={{ color: "#e03131", fontWeight: "bold" }}>{stats.absent}</span> ขาด
          </div>
        </div>
      )}

      {/* Student List & Search */}
      {students.length > 0 ? (
        <div style={style.listWrapper}>
          <div style={style.searchBarWrapper}>
            <input
              type="text"
              style={style.searchInput}
              placeholder="🔍 ค้นหานักเรียนในห้อง (ชื่อ หรือรหัส)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={style.quickActionWrapper}>
              <button type="button" style={style.quickBtn} onClick={handleMarkAllPresent}>
                ✅ เข้าเรียนทุกคน
              </button>
              <button type="button" style={{ ...style.quickBtn, ...style.resetBtn }} onClick={handleResetAll}>
                🔄 รีเซ็ตทั้งหมด
              </button>
            </div>
          </div>

          <p style={style.matchCount}>
            พบนักเรียน {filteredStudents.length} คน จากทั้งหมด {students.length} คน
          </p>

          <div style={style.studentList}>
            {filteredStudents.map((s, idx) => {
              const currentRecord = records[s.id] || { status: "present", note: "" };

              return (
                <div key={s.id} style={style.studentCard}>
                  {/* Name and Code Info */}
                  <div style={style.studentHeader}>
                    <div style={style.studentMeta}>
                      <span style={style.studentNumber}>#{idx + 1}</span>
                      <div>
                        <strong style={style.studentName}>
                          {s.first_name} {s.last_name}
                        </strong>
                        <p style={style.studentSub}>
                          รหัส {s.student_code} · ชั้น {s.grade_level}/{s.room}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Note input */}
                  <div style={style.noteWrapper}>
                    <input
                      type="text"
                      style={style.noteInput}
                      placeholder="📝 บันทึกข้อเสนอแนะ/เหตุผล (เช่น ป่วย, กิจกรรมโรงเรียน)..."
                      value={currentRecord.note}
                      onChange={(e) => setStudentNote(s.id, e.target.value)}
                    />
                  </div>

                  {/* Buttons group for status */}
                  <div style={style.statusButtonGroup}>
                    <button
                      type="button"
                      style={{
                        ...style.statusBtn,
                        ...(currentRecord.status === "present" ? style.btnPresentActive : style.btnInactive)
                      }}
                      onClick={() => setStudentStatus(s.id, "present")}
                    >
                      เข้าเรียน
                    </button>
                    <button
                      type="button"
                      style={{
                        ...style.statusBtn,
                        ...(currentRecord.status === "late" ? style.btnLateActive : style.btnInactive)
                      }}
                      onClick={() => setStudentStatus(s.id, "late")}
                    >
                      มาสาย
                    </button>
                    <button
                      type="button"
                      style={{
                        ...style.statusBtn,
                        ...(currentRecord.status === "leave" ? style.btnLeaveActive : style.btnInactive)
                      }}
                      onClick={() => setStudentStatus(s.id, "leave")}
                    >
                      ลาเรียน
                    </button>
                    <button
                      type="button"
                      style={{
                        ...style.statusBtn,
                        ...(currentRecord.status === "absent" ? style.btnAbsentActive : style.btnInactive)
                      }}
                      onClick={() => setStudentStatus(s.id, "absent")}
                    >
                      ขาดเรียน
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Actions/Save Bar */}
          <div style={style.saveBar}>
            <button
              type="button"
              style={style.saveBtn}
              onClick={handleSave}
              disabled={isSaving || isPending}
            >
              {isSaving ? "⏳ กำลังบันทึก..." : "💾 บันทึกการเข้าเรียนทั้งหมด"}
            </button>
          </div>
        </div>
      ) : (
        <div style={style.emptyBox}>
          ไม่พบรายชื่อนักเรียนในห้องเรียนนี้
          <p style={{ fontSize: "13px", fontWeight: "normal", color: "#64748b", marginTop: "5px" }}>
            กรุณาเลือกห้องเรียนอื่น หรือไปที่หน้าจัดการรายชื่อนักเรียนเพื่อนำเข้าผู้เรียน
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            ...style.toast,
            background:
              toastType === "success"
                ? "#0f5132"
                : toastType === "error"
                ? "#842029"
                : "#055160",
            color: "#fff"
          }}
        >
          {toastType === "success" ? "✅ " : toastType === "error" ? "❌ " : "ℹ️ "}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Inline styling supporting premium dark-mode/light harmonious aesthetics
const style: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem",
    position: "relative"
  },
  filtersCard: {
    background: "#ffffff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 4px 16px rgba(99,102,241,0.05)"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontWeight: 700,
    fontSize: "13px",
    color: "#475569"
  },
  select: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "10px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    background: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s"
  },
  input: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "10px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px",
    outline: "none",
    background: "#fff"
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(4px)",
    zIndex: 99,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid rgba(99,102,241,0.2)",
    borderTop: "4px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    background: "#fff",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #dfe5ef",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  statBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 2px",
    fontSize: "11px",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "6px"
  },
  listWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    paddingBottom: "80px"
  },
  searchBarWrapper: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  searchInput: {
    width: "100%",
    minHeight: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px"
  },
  quickActionWrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  quickBtn: {
    minHeight: "36px",
    border: "none",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  resetBtn: {
    background: "#f1f5f9",
    color: "#475569"
  },
  matchCount: {
    margin: "0 0 2px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 500
  },
  studentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  studentCard: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "transform 0.15s ease"
  },
  studentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  studentMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  studentNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: 700,
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  studentName: {
    color: "#0f172a",
    fontSize: "15px"
  },
  studentSub: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  noteWrapper: {
    marginTop: "2px"
  },
  noteInput: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "8px",
    border: "1.5px dashed #cbd5e1",
    padding: "0 10px",
    fontSize: "12.5px",
    color: "#334155",
    background: "#f8fafc"
  },
  statusButtonGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    marginTop: "4px"
  },
  statusBtn: {
    minHeight: "38px",
    border: "none",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  btnInactive: {
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid transparent"
  },
  btnPresentActive: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #86efac",
    boxShadow: "0 2px 6px rgba(34,197,94,0.15)"
  },
  btnLateActive: {
    background: "#fef9c3",
    color: "#a16207",
    border: "1px solid #fef08a",
    boxShadow: "0 2px 6px rgba(234,179,8,0.15)"
  },
  btnLeaveActive: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    boxShadow: "0 2px 6px rgba(59,130,246,0.15)"
  },
  btnAbsentActive: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    boxShadow: "0 2px 6px rgba(239,68,68,0.15)"
  },
  saveBar: {
    position: "fixed",
    bottom: "64px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(100%, 430px)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderTop: "1px solid #e2e8f0",
    padding: "12px 16px",
    zIndex: 90,
    display: "flex",
    justifyContent: "center"
  },
  saveBtn: {
    width: "100%",
    minHeight: "48px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "14.5px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
  },
  emptyBox: {
    background: "#ffffff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "center",
    color: "#475569",
    fontWeight: "bold",
    boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
  },
  toast: {
    position: "fixed",
    bottom: "130px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "bold",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
    animation: "fadeUp 0.25s ease both"
  }
};
