"use client";

import { useState, useMemo } from "react";
import { resetStudentPin, updateStudentDetails, deleteStudent } from "./actions";

type AdminStudentItem = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  room: string;
  school_id: string;
  school_name?: string;
  created_at: string;
  schools?: {
    name: string;
  } | null;
};

type Props = {
  initialStudents: AdminStudentItem[];
};

export function AdminStudentsClient({ initialStudents }: Props) {
  const [students, setStudents] = useState<AdminStudentItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  
  // Toast notifications
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  
  // Loading states
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Editing state
  const [editingStudent, setEditingStudent] = useState<AdminStudentItem | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editRoom, setEditRoom] = useState("");

  // PIN resetting state
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [customPin, setCustomPin] = useState("123456");

  function showToast(msg: string, type: typeof toastType = "success") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  }

  // Filter students
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGrade = filterGrade === "" || s.grade_level === filterGrade;
      const matchRoom = filterRoom === "" || s.room === filterRoom;

      return matchSearch && matchGrade && matchRoom;
    });
  }, [students, searchQuery, filterGrade, filterRoom]);

  // Unique grades and rooms for filter lists
  const availableGrades = useMemo(() => {
    const set = new Set(students.map((s) => s.grade_level));
    // Sort logically (Thai grade levels)
    return Array.from(set).sort();
  }, [students]);

  const availableRooms = useMemo(() => {
    const set = new Set(students.map((s) => s.room));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [students]);

  // Handle Edit Action
  function startEdit(student: AdminStudentItem) {
    setEditingStudent(student);
    setEditCode(student.student_code);
    setEditFirstName(student.first_name);
    setEditLastName(student.last_name);
    setEditGrade(student.grade_level);
    setEditRoom(student.room);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;

    setLoadingId(editingStudent.id);
    try {
      const res = await updateStudentDetails(
        editingStudent.id,
        editCode,
        editFirstName,
        editLastName,
        editGrade,
        editRoom
      );

      if (res.success) {
        showToast(res.message, "success");
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editingStudent.id
              ? {
                  ...s,
                  student_code: editCode,
                  first_name: editFirstName,
                  last_name: editLastName,
                  grade_level: editGrade,
                  room: editRoom,
                }
              : s
          )
        );
        setEditingStudent(null);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle Reset PIN
  async function handleResetPin(studentId: string, pin: string) {
    if (!pin.trim()) {
      showToast("กรุณากรอกรหัส PIN ใหม่", "error");
      return;
    }
    
    setLoadingId(studentId);
    try {
      const res = await resetStudentPin(studentId, pin.trim());
      if (res.success) {
        showToast(res.message, "success");
        setResettingId(null);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("ล้มเหลวในการรีเซ็ตรหัส PIN: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle Delete Student
  async function handleDelete(studentId: string, name: string) {
    if (
      !window.confirm(
        `⚠️ คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียน "${name}"? \nการลบนี้จะลบข้อมูลการเข้าเรียน เกรด และหลักฐานทั้งหมดของนักเรียนคนนี้ออกจากฐานข้อมูลโดยถาวร!`
      )
    ) {
      return;
    }

    setLoadingId(studentId);
    try {
      const res = await deleteStudent(studentId);
      if (res.success) {
        showToast(res.message, "success");
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        if (editingStudent?.id === studentId) {
          setEditingStudent(null);
        }
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการลบนักเรียน: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  const gradeOptions = ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6", "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  const roomOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <div style={style.container}>
      {/* Search and Filters */}
      <div style={style.filterCard}>
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "14px", color: "#1e293b", fontWeight: 700 }}>🔍 ตัวกรองและค้นหา</h3>
        
        <input
          type="text"
          style={style.searchInput}
          placeholder="พิมพ์ชื่อ นามสกุล หรือรหัสนักเรียน เพื่อค้นหา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={style.filterGrid}>
          <label style={style.filterLabel}>
            ระดับชั้น
            <select
              style={style.select}
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="">ทั้งหมด ({availableGrades.length})</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label style={style.filterLabel}>
            ห้องเรียน
            <select
              style={style.select}
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
            >
              <option value="">ทั้งหมด ({availableRooms.length})</option>
              {roomOptions.map((r) => (
                <option key={r} value={r}>ห้อง {r}</option>
              ))}
            </select>
          </label>
        </div>

        {(searchQuery || filterGrade || filterRoom) && (
          <button
            type="button"
            style={style.btnClearFilters}
            onClick={() => {
              setSearchQuery("");
              setFilterGrade("");
              setFilterRoom("");
            }}
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}

        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748b" }}>
          พบข้อมูลนักเรียนทั้งหมด {filtered.length} คน จาก {students.length} คน
        </p>
      </div>

      {/* Edit Form Modal (if open) */}
      {editingStudent && (
        <div style={style.modalOverlay}>
          <div style={style.modalContent}>
            <div style={style.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                ✏️ แก้ไขข้อมูลนักเรียน
              </h3>
              <button
                type="button"
                style={style.btnCloseModal}
                onClick={() => setEditingStudent(null)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdate} style={style.form}>
              <div style={style.formField}>
                <label style={style.formLabelText}>รหัสประจำตัวนักเรียน</label>
                <input
                  type="text"
                  required
                  style={style.formInput}
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={style.formField}>
                  <label style={style.formLabelText}>ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    style={style.formInput}
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div style={style.formField}>
                  <label style={style.formLabelText}>นามสกุล</label>
                  <input
                    type="text"
                    required
                    style={style.formInput}
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={style.formField}>
                  <label style={style.formLabelText}>ระดับชั้น (ดรอปดาวน์)</label>
                  <select
                    style={style.select}
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                  >
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div style={style.formField}>
                  <label style={style.formLabelText}>ห้องเรียน (ดรอปดาวน์)</label>
                  <select
                    style={style.select}
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                  >
                    {roomOptions.map((r) => (
                      <option key={r} value={r}>ห้อง {r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={style.modalActions}>
                <button
                  type="button"
                  style={style.btnCancel}
                  onClick={() => setEditingStudent(null)}
                  disabled={loadingId === editingStudent.id}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={style.btnSubmit}
                  disabled={loadingId === editingStudent.id}
                >
                  {loadingId === editingStudent.id ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student List */}
      <div style={style.list}>
        {filtered.length === 0 ? (
          <div style={style.emptyBox}>ไม่พบบัญชีรายชื่อนักเรียนตามตัวกรอง</div>
        ) : (
          filtered.map((s) => {
            const isLoading = loadingId === s.id;
            const isResetting = resettingId === s.id;

            return (
              <div key={s.id} style={style.card}>
                <div style={style.cardHeader}>
                  <div>
                    <strong style={style.nameText}>{s.first_name} {s.last_name}</strong>
                    <span style={style.codeBadge}>{s.student_code}</span>
                    <p style={style.infoText}>
                      ระดับชั้น: <strong>{s.grade_level}</strong> ห้อง: <strong>{s.room}</strong>
                    </p>
                    <p style={style.schoolText}>
                      🏫 {s.schools?.name ?? s.school_name ?? "โรงเรียนทั่วไป"}
                    </p>
                  </div>
                </div>

                <div style={style.actionsContainer}>
                  {/* Action Buttons Row */}
                  <div style={style.rowButtons}>
                    <button
                      type="button"
                      style={style.btnEdit}
                      onClick={() => startEdit(s)}
                      disabled={isLoading}
                    >
                      ✏️ แก้ไขข้อมูล
                    </button>

                    <button
                      type="button"
                      style={style.btnResetTrigger}
                      onClick={() => {
                        if (isResetting) {
                          setResettingId(null);
                        } else {
                          setResettingId(s.id);
                          setCustomPin("123456"); // Default standard pin value
                        }
                      }}
                      disabled={isLoading}
                    >
                      🔑 รีเซ็ต PIN เข้าสู่ระบบ
                    </button>
                  </div>

                  {/* Reset PIN form panel */}
                  {isResetting && (
                    <div style={style.resetPanel}>
                      <div style={style.resetPanelRow}>
                        <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", flex: 1 }}>
                          ตั้งรหัส PIN ใหม่ (ตัวเลข):
                          <input
                            type="text"
                            maxLength={8}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            style={style.pinInput}
                            value={customPin}
                            onChange={(e) => setCustomPin(e.target.value.replace(/[^0-9]/g, ""))}
                          />
                        </label>
                        <button
                          type="button"
                          style={style.btnResetConfirm}
                          onClick={() => handleResetPin(s.id, customPin)}
                          disabled={isLoading}
                        >
                          ยืนยันรีเซ็ต
                        </button>
                      </div>
                      <span style={{ fontSize: "10.5px", color: "#64748b", marginTop: "4px", display: "block" }}>
                        * แนะนำรหัสตัวเลข 6 หลัก (เช่น 123456) นักเรียนจะใช้รหัสนี้ร่วมกับรหัสนักเรียนในการล็อกอิน
                      </span>
                    </div>
                  )}

                  {/* Dangerous Delete Row */}
                  <div style={{ marginTop: "6px", borderTop: "1px dashed #f1f5f9", paddingTop: "8px" }}>
                    <button
                      type="button"
                      style={style.btnDelete}
                      onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                      disabled={isLoading}
                    >
                      🗑️ ลบนักเรียนคนนี้ออกจากฐานข้อมูล
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast notifications */}
      {toast && (
        <div
          style={{
            ...style.toast,
            background:
              toastType === "success"
                ? "#15803d"
                : toastType === "error"
                ? "#b91c1c"
                : "#0369a1",
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
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem",
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  searchInput: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: "14px",
    fontFamily: "'Sarabun', sans-serif",
    boxSizing: "border-box",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "10px",
  },
  filterLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
  },
  select: {
    width: "100%",
    minHeight: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13.5px",
    fontFamily: "'Sarabun', sans-serif",
    background: "#fff",
  },
  btnClearFilters: {
    marginTop: "10px",
    width: "100%",
    padding: "8px 0",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    color: "#475569",
    fontSize: "12.5px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameText: {
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: 700,
  },
  codeBadge: {
    fontSize: "10px",
    fontWeight: "bold",
    background: "#f1f5f9",
    color: "#475569",
    padding: "3px 8px",
    borderRadius: "6px",
    marginLeft: "8px",
    border: "1px solid #e2e8f0",
    display: "inline-block",
  },
  infoText: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#475569",
  },
  schoolText: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#94a3b8",
  },
  actionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: "1px dashed #e2e8f0",
    paddingTop: "10px",
  },
  rowButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  btnEdit: {
    flex: 1,
    minHeight: "36px",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#1e293b",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    textAlign: "center",
  },
  btnResetTrigger: {
    flex: 1.3,
    minHeight: "36px",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    textAlign: "center",
  },
  resetPanel: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px",
    marginTop: "4px",
  },
  resetPanelRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },
  pinInput: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    padding: "0 8px",
    fontSize: "14px",
    fontWeight: "bold",
    marginTop: "4px",
    letterSpacing: "0.15em",
    textAlign: "center",
  },
  btnResetConfirm: {
    padding: "8px 16px",
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    minHeight: "36px",
  },
  btnDelete: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "8px",
    border: "1px dashed #fee2e2",
    background: "#fff",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  emptyBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "2.5rem 1rem",
    textAlign: "center",
    color: "#64748b",
    fontWeight: "bold",
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
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    animation: "modalFadeIn 0.2s ease-out",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  btnCloseModal: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
  },
  form: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formLabelText: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
  },
  formInput: {
    minHeight: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "13.5px",
    fontFamily: "'Sarabun', sans-serif",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
  },
  btnCancel: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnSubmit: {
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#1e293b",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
