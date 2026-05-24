"use client";

import { useState, useMemo } from "react";
import type { ClassroomStudentItem } from "@/lib/queries/classroom-students";
import { saveBehaviorLog, deleteBehaviorLog, fetchBehaviorLogs } from "./actions";
import type { BehaviorLogItem } from "./actions";

type Props = {
  students: ClassroomStudentItem[];
  classroomId: string;
  initialLogs: BehaviorLogItem[];
};

export function BehaviorClient({ students, classroomId, initialLogs }: Props) {
  const [logs, setLogs] = useState<BehaviorLogItem[]>(initialLogs);
  const [selectedStudent, setSelectedStudent] = useState<ClassroomStudentItem | null>(null);
  
  // Search query for student list
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [category, setCategory] = useState<"positive" | "negative" | "home_visit" | "counseling" | "parent_contact">("positive");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(0);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isExportedToPa, setIsExportedToPa] = useState(false);
  
  // Loading & Toast states
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(msg: string, type: typeof toastType = "success") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  }

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      return name.includes(q) || s.student_code.toLowerCase().includes(q);
    });
  }, [students, searchQuery]);

  // Selected student's logs
  const selectedStudentLogs = useMemo(() => {
    if (!selectedStudent) return [];
    return logs.filter((l) => l.student_id === selectedStudent.id);
  }, [logs, selectedStudent]);

  // Selected student's statistics
  const stats = useMemo(() => {
    const list = selectedStudentLogs;
    const positiveCount = list.filter((l) => l.category === "positive").length;
    const negativeCount = list.filter((l) => l.category === "negative").length;
    const homeVisits = list.filter((l) => l.category === "home_visit").length;
    const counselings = list.filter((l) => l.category === "counseling").length;
    const parentContacts = list.filter((l) => l.category === "parent_contact").length;
    const totalPoints = list.reduce((sum, l) => sum + l.points, 0);

    return { positiveCount, negativeCount, homeVisits, counselings, parentContacts, totalPoints };
  }, [selectedStudentLogs]);

  // Category change side-effect: set default points
  function handleCategoryChange(cat: any) {
    setCategory(cat);
    if (cat === "positive") setPoints(10);
    else if (cat === "negative") setPoints(-10);
    else setPoints(0);

    // Auto check Export to PA for Home Visits or Counselings (core PA 2.2 indicators!)
    if (cat === "home_visit" || cat === "counseling" || cat === "parent_contact") {
      setIsExportedToPa(true);
    } else {
      setIsExportedToPa(false);
    }
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!title.trim()) {
      showToast("กรุณากรอกหัวข้อพฤติกรรม / กิจกรรม", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await saveBehaviorLog({
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        category,
        title,
        description,
        points,
        logDate,
        isExportedToPa
      });

      if (res.success) {
        showToast(res.message, "success");
        // Re-fetch logs to update UI
        const studentIds = students.map((s) => s.id);
        const updatedLogs = await fetchBehaviorLogs(studentIds);
        setLogs(updatedLogs);

        // Reset form
        setTitle("");
        setDescription("");
        setPoints(0);
        setCategory("positive");
        setIsExportedToPa(false);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + (err?.message ?? String(err)), "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Delete Log
  async function handleDelete(logId: string, paEvidenceId: string | null) {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกประวัตินี้? (หากประวัตินี้มีการเชื่อมต่อ วPA หลักฐานนั้นจะถูกลบไปด้วย)")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await deleteBehaviorLog(logId, paEvidenceId);
      if (res.success) {
        showToast(res.message, "success");
        setLogs((prev) => prev.filter((l) => l.id !== logId));
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("ลบข้อมูลไม่สำเร็จ: " + (err?.message ?? String(err)), "error");
    } finally {
      setIsLoading(false);
    }
  }

  const categoryLabel: Record<string, string> = {
    positive: "พฤติกรรมเชิงบวก 👍",
    negative: "พฤติกรรมควรปรับปรุง ⚠️",
    home_visit: "เยี่ยมบ้านนักเรียน 🏠",
    counseling: "ให้คำปรึกษาแนะแนว 💬",
    parent_contact: "ประสานงานผู้ปกครอง 📞"
  };

  const categoryColor: Record<string, string> = {
    positive: "#10b981", // green
    negative: "#f59e0b", // yellow/orange
    home_visit: "#3b82f6", // blue
    counseling: "#8b5cf6", // purple
    parent_contact: "#06b6d4" // cyan
  };

  return (
    <div style={style.container}>
      {/* ── Student list picker ── */}
      <div style={style.studentPickerBox}>
        <h3 style={style.sectionTitle}>👥 รายชื่อนักเรียนในชั้นเรียน ({filteredStudents.length} คน)</h3>
        
        <input
          type="text"
          style={style.searchBar}
          placeholder="🔍 ค้นหานักเรียนด้วยชื่อ หรือรหัส..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={style.studentList}>
          {filteredStudents.map((s) => {
            const isSelected = selectedStudent?.id === s.id;
            const studentLogs = logs.filter((l) => l.student_id === s.id);
            const totalPoints = studentLogs.reduce((sum, l) => sum + l.points, 0);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStudent(s)}
                style={{
                  ...style.studentButton,
                  background: isSelected ? "#eef2ff" : "#fff",
                  border: isSelected ? "1px solid #6366f1" : "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ textAlign: "left" }}>
                    <strong style={{ fontSize: "13px", color: isSelected ? "#4f46e5" : "#1e293b" }}>
                      {s.first_name} {s.last_name}
                    </strong>
                    <span style={style.studentCodeText}>รหัส: {s.student_code}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span
                      style={{
                        ...style.badge,
                        background: totalPoints >= 0 ? "#dcfce7" : "#fee2e2",
                        color: totalPoints >= 0 ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {totalPoints >= 0 ? "+" : ""}{totalPoints} คะแนน
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {studentLogs.length} รายการ
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Student Details, Logs, and Recording Form ── */}
      {selectedStudent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "fadeUp 0.25s ease" }}>
          
          {/* Student Profile & Summary Stats */}
          <div style={style.profileCard}>
            <div style={style.avatar}>{selectedStudent.first_name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                {selectedStudent.first_name} {selectedStudent.last_name}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                รหัสนักเรียน: <strong>{selectedStudent.student_code}</strong> · ชั้น {selectedStudent.grade_level} ห้อง {selectedStudent.room}
              </p>
            </div>
          </div>

          {/* Stat Badges Grid */}
          <div style={style.statsGrid}>
            <div style={{ ...style.statBadgeItem, borderLeft: "3px solid #10b981" }}>
              <span style={{ fontSize: "13px", color: "#10b981", fontWeight: 800 }}>{stats.positiveCount} ครั้ง</span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>เชิงบวก</span>
            </div>
            <div style={{ ...style.statBadgeItem, borderLeft: "3px solid #f59e0b" }}>
              <span style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 800 }}>{stats.negativeCount} ครั้ง</span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>ปรับปรุง</span>
            </div>
            <div style={{ ...style.statBadgeItem, borderLeft: "3px solid #3b82f6" }}>
              <span style={{ fontSize: "13px", color: "#3b82f6", fontWeight: 800 }}>{stats.homeVisits} ครั้ง</span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>เยี่ยมบ้าน</span>
            </div>
            <div style={{ ...style.statBadgeItem, borderLeft: "3px solid #8b5cf6" }}>
              <span style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: 800 }}>{stats.counselings + stats.parentContacts} ครั้ง</span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>ปรึกษา/ติดต่อ</span>
            </div>
          </div>

          {/* Form: Record Behavior Log */}
          <form onSubmit={handleSubmit} style={style.formCard}>
            <h4 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
              ✍️ บันทึกพฤติกรรมและการดูแลช่วยเหลือ
            </h4>

            {/* Category Dropdown */}
            <div style={style.formField}>
              <label style={style.formLabelText}>หมวดหมู่การประเมิน (ดรอปดาวน์)</label>
              <select
                style={style.select}
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as any)}
                disabled={isLoading}
              >
                <option value="positive">พฤติกรรมเชิงบวก (+คะแนน)</option>
                <option value="negative">พฤติกรรมควรปรับปรุง (-คะแนน)</option>
                <option value="home_visit">การเยี่ยมบ้านนักเรียน (บันทึกสารสนเทศ)</option>
                <option value="counseling">การให้คำปรึกษาแนะแนว (ช่วยเหลือรายคน)</option>
                <option value="parent_contact">การติดต่อประสานงานผู้ปกครอง</option>
              </select>
            </div>

            {/* Title */}
            <div style={style.formField}>
              <label style={style.formLabelText}>หัวข้อ / พฤติกรรมที่เกิดขึ้น</label>
              <input
                type="text"
                required
                style={style.formInput}
                placeholder="ตัวอย่าง: มีจิตสาธารณะช่วยครูถือของ, ไม่ส่งการบ้าน 3 ครั้ง..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div style={style.formField}>
              <label style={style.formLabelText}>รายละเอียดเหตุการณ์เพิ่มเติม</label>
              <textarea
                style={style.formTextarea}
                placeholder="ระบุข้อเท็จจริง คำแนะนำ วิธีการช่วยเหลือ หรือผลลัพธ์ที่ได้จากการพูดคุย..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Points & Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={style.formField}>
                <label style={style.formLabelText}>คะแนนพฤติกรรม</label>
                <input
                  type="number"
                  style={style.formInput}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div style={style.formField}>
                <label style={style.formLabelText}>วันที่เกิดเหตุ</label>
                <input
                  type="date"
                  required
                  style={style.formInput}
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Export to PA Checkbox */}
            <label style={style.checkboxLabel}>
              <input
                type="checkbox"
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                checked={isExportedToPa}
                onChange={(e) => setIsExportedToPa(e.target.checked)}
                disabled={isLoading}
              />
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#4f46e5" }}>
                ✨ ส่งออกเป็นหลักฐาน วPA ตัวชี้วัด 2.2 (ระบบดูแลช่วยเหลือผู้เรียน)
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...style.btnSubmit,
                background: isLoading ? "#cbd5e1" : "linear-gradient(135deg, #4f46e5, #6366f1)"
              }}
            >
              {isLoading ? "กำลังบันทึกประวัติ..." : "💾 บันทึกประวัติพฤติกรรมนักเรียน"}
            </button>
          </form>

          {/* Selected Student Logs List */}
          <div style={style.logsListCard}>
            <h4 style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
              📜 ประวัติบันทึกการดูแลและพฤติกรรม ({selectedStudentLogs.length} รายการ)
            </h4>

            {selectedStudentLogs.length === 0 ? (
              <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", padding: "16px 0" }}>
                ยังไม่มีข้อมูลการเยี่ยมบ้านหรือประวัติพฤติกรรมของนักเรียนคนนี้
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedStudentLogs.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      ...style.logItem,
                      borderLeft: `3px solid ${categoryColor[l.category] ?? "#ccc"}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span
                          style={{
                            ...style.catBadge,
                            backgroundColor: (categoryColor[l.category] ?? "#ccc") + "18",
                            color: categoryColor[l.category] ?? "#475569"
                          }}
                        >
                          {categoryLabel[l.category] ?? l.category}
                        </span>
                        <strong style={{ display: "block", fontSize: "13px", color: "#1e293b", marginTop: "4px" }}>
                          {l.title}
                        </strong>
                        {l.description && (
                          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b", whiteSpace: "pre-line" }}>
                            {l.description}
                          </p>
                        )}
                        <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "6px" }}>
                          📅 บันทึกเมื่อ: {new Date(l.log_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <span
                          style={{
                            ...style.badge,
                            background: l.points >= 0 ? "#e8f5e9" : "#ffe8e8",
                            color: l.points >= 0 ? "#2e7d32" : "#c53030",
                            fontWeight: "bold"
                          }}
                        >
                          {l.points >= 0 ? "+" : ""}{l.points} คะแนน
                        </span>

                        {l.is_exported_to_pa && (
                          <span style={style.paLinkedBadge}>🔗 ลิงก์ วPA 2.2</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(l.id, l.pa_evidence_id)}
                          style={style.btnDeleteLog}
                          disabled={isLoading}
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div style={style.emptyState}>
          👉 กรุณาเลือกนักเรียนจากรายชื่อด้านซ้าย/บน เพื่อเริ่มต้นบันทึกพฤติกรรมและเยี่ยมบ้านนักเรียน
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            ...style.toast,
            background: toastType === "success" ? "#15803d" : "#b91c1c"
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "1rem",
    marginTop: "1rem",
    alignItems: "flex-start",
    boxSizing: "border-box",
  },
  studentPickerBox: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    maxHeight: "80dvh",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "13.5px",
    fontWeight: 700,
    color: "#1e293b",
  },
  searchBar: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13px",
    marginBottom: "10px",
    fontFamily: "'Sarabun', sans-serif",
    boxSizing: "border-box",
  },
  studentList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    flex: 1,
    paddingRight: "4px",
  },
  studentButton: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    display: "flex",
    boxSizing: "border-box",
  },
  studentCodeText: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  badge: {
    fontSize: "10.5px",
    padding: "2px 6px",
    borderRadius: "6px",
  },
  emptyState: {
    background: "#f8fafc",
    border: "2px dashed #cbd5e1",
    borderRadius: "16px",
    padding: "3rem 1.5rem",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "bold",
  },
  profileCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  statBadgeItem: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  formLabelText: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
  },
  select: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 8px",
    fontSize: "13px",
    background: "#fff",
    fontFamily: "'Sarabun', sans-serif",
  },
  formInput: {
    minHeight: "38px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13px",
    fontFamily: "'Sarabun', sans-serif",
    boxSizing: "border-box",
  },
  formTextarea: {
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "8px 10px",
    fontSize: "13px",
    fontFamily: "'Sarabun', sans-serif",
    resize: "none",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "4px 0",
  },
  btnSubmit: {
    width: "100%",
    minHeight: "42px",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13.5px",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
  },
  logsListCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  logItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  catBadge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block",
  },
  paLinkedBadge: {
    fontSize: "9.5px",
    fontWeight: "bold",
    color: "#4f46e5",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    padding: "2px 6px",
    borderRadius: "4px",
    display: "inline-block",
  },
  btnDeleteLog: {
    background: "none",
    border: "none",
    color: "#dc2626",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "2px",
  },
  toast: {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#fff",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    fontFamily: "'Sarabun', sans-serif",
  }
};
