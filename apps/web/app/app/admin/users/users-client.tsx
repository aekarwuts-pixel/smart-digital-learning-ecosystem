"use client";

import { useState, useMemo } from "react";
import { updateUserStatus, updateUserRole, toggleUserActive, deleteUserProfile } from "./actions";

type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
  role: "teacher" | "admin" | "leader" | "student" | "parent";
  is_active: boolean;
  approval_status: "approved" | "rejected" | "pending";
  created_at: string;
};

type Props = {
  initialProfiles: UserProfile[];
};

export function AdminUsersClient({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function showToast(msg: string, type: typeof toastType = "success") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  }

  // Handle status update
  async function handleStatusUpdate(profileId: string, status: UserProfile["approval_status"]) {
    setLoadingId(profileId);
    try {
      const res = await updateUserStatus(profileId, status);
      if (res.success) {
        showToast(res.message, "success");
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, approval_status: status } : p))
        );
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("บันทึกล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle role change
  async function handleRoleChange(profileId: string, role: UserProfile["role"]) {
    setLoadingId(profileId);
    try {
      const res = await updateUserRole(profileId, role);
      if (res.success) {
        showToast(res.message, "success");
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, role } : p))
        );
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("เปลี่ยนสิทธิ์ล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle toggle active
  async function handleToggleActive(profileId: string, currentActive: boolean) {
    const nextActive = !currentActive;
    setLoadingId(profileId);
    try {
      const res = await toggleUserActive(profileId, nextActive);
      if (res.success) {
        showToast(res.message, "success");
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, is_active: nextActive } : p))
        );
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("ปรับปรุงล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle delete profile
  async function handleDelete(profileId: string, name: string) {
    if (!window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${name}" ออกจากระบบ? (การลบนี้จะลบสิทธิ์ Auth และบัญชีผู้ใช้ออกโดยสิ้นเชิง)`)) {
      return;
    }

    setLoadingId(profileId);
    try {
      const res = await deleteUserProfile(profileId);
      if (res.success) {
        showToast(res.message, "success");
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("ลบล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Filter profiles
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const name = p.full_name.toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [searchQuery, profiles]);

  const roleLabel: Record<string, string> = {
    teacher: "ครูผู้สอน",
    admin: "ผู้ดูแลระบบ",
    leader: "ผู้บริหาร",
    student: "นักเรียน",
    parent: "ผู้ปกครอง"
  };

  return (
    <div style={style.container}>
      {/* Search Input */}
      <div style={style.searchBox}>
        <input
          type="text"
          style={style.searchInput}
          placeholder="🔍 ค้นหาผู้ใช้ด้วย ชื่อ หรือ อีเมล..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#64748b" }}>
          พบผู้ใช้งานทั้งหมด {filtered.length} บัญชี
        </p>
      </div>

      {/* Directory List */}
      <div style={style.list}>
        {filtered.length === 0 ? (
          <div style={style.emptyBox}>ไม่พบรายชื่อบัญชีผู้ใช้ในระบบ</div>
        ) : (
          filtered.map((p) => {
            const isLoading = loadingId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  ...style.card,
                  opacity: p.is_active ? 1 : 0.65,
                  borderLeft:
                    p.approval_status === "approved"
                      ? "4px solid #10b981"
                      : p.approval_status === "rejected"
                      ? "4px solid #ef4444"
                      : "4px solid #f59f00"
                }}
              >
                {/* Header Information */}
                <div style={style.cardHeader}>
                  <div>
                    <strong style={style.nameText}>{p.full_name}</strong>
                    <span style={{ ...style.roleBadge, background: p.role === "admin" ? "#fee2e2" : "#e0e7ff", color: p.role === "admin" ? "#991b1b" : "#3730a3" }}>
                      {roleLabel[p.role] ?? p.role}
                    </span>
                    <p style={style.emailText}>{p.email ?? "ไม่มีอีเมล"}</p>
                  </div>
                  <span
                    style={{
                      ...style.statusBadge,
                      background:
                        p.approval_status === "approved"
                          ? "#dcfce7"
                          : p.approval_status === "rejected"
                          ? "#fee2e2"
                          : "#fef9c3",
                      color:
                        p.approval_status === "approved"
                          ? "#15803d"
                          : p.approval_status === "rejected"
                          ? "#b91c1c"
                          : "#a16207"
                    }}
                  >
                    {p.approval_status === "approved"
                      ? "อนุมัติแล้ว"
                      : p.approval_status === "rejected"
                      ? "ไม่อนุมัติ"
                      : "รออนุมัติ"}
                  </span>
                </div>

                {/* Operations form grid */}
                <div style={style.actionsForm}>
                  {/* Change Role dropdown */}
                  <label style={style.label}>
                    ปรับเปลี่ยนสิทธิ์ผู้ใช้
                    <select
                      style={style.select}
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as any)}
                      disabled={isLoading}
                    >
                      <option value="teacher">ครูผู้สอน</option>
                      <option value="leader">ผู้บริหาร</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                      <option value="student">นักเรียน</option>
                      <option value="parent">ผู้ปกครอง</option>
                    </select>
                  </label>

                  {/* Quick approvals toggle */}
                  <div style={style.rowButtons}>
                    {p.approval_status !== "approved" && (
                      <button
                        type="button"
                        style={style.btnApprove}
                        onClick={() => handleStatusUpdate(p.id, "approved")}
                        disabled={isLoading}
                      >
                        ✓ อนุมัติสิทธิ์
                      </button>
                    )}
                    {p.approval_status !== "rejected" && (
                      <button
                        type="button"
                        style={style.btnReject}
                        onClick={() => handleStatusUpdate(p.id, "rejected")}
                        disabled={isLoading}
                      >
                        ✗ ปฏิเสธสิทธิ์
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        ...style.btnToggle,
                        background: p.is_active ? "#ffe8e8" : "#e8f5e9",
                        color: p.is_active ? "#c53030" : "#2e7d32"
                      }}
                      onClick={() => handleToggleActive(p.id, p.is_active)}
                      disabled={isLoading}
                    >
                      {p.is_active ? "⏸ ระงับบัญชี" : "▶ เปิดใช้งาน"}
                    </button>
                  </div>

                  {/* Dangerous Profile deletion */}
                  <button
                    type="button"
                    style={style.btnDelete}
                    onClick={() => handleDelete(p.id, p.full_name)}
                    disabled={isLoading}
                  >
                    🗑️ ลบผู้ใช้งานออกจากระบบ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast message overlay */}
      {toast && (
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
    marginTop: "1rem"
  },
  searchBox: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  searchInput: {
    width: "100%",
    minHeight: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  card: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px"
  },
  nameText: {
    fontSize: "15px",
    color: "#0f172a"
  },
  roleBadge: {
    fontSize: "10.5px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "8px"
  },
  emailText: {
    margin: "4px 0 0",
    fontSize: "12.5px",
    color: "#64748b"
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "bold",
    padding: "3px 8px",
    borderRadius: "20px"
  },
  actionsForm: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: "1px dashed #e2e8f0",
    paddingTop: "10px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "11.5px",
    fontWeight: "bold",
    color: "#64748b"
  },
  select: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    padding: "0 8px",
    fontSize: "13px"
  },
  rowButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },
  btnApprove: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  btnReject: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  btnToggle: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  btnDelete: {
    width: "100%",
    minHeight: "36px",
    borderRadius: "6px",
    border: "1px dashed #fca5a5",
    background: "#fff",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "4px"
  },
  emptyBox: {
    background: "#ffffff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "center",
    color: "#64748b",
    fontWeight: "bold"
  },
  toast: {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "bold",
    zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
  }
};
