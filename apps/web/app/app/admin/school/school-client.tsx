"use client";

import { useActionState, useEffect, useState } from "react";
import { saveSchoolSettings } from "./actions";
import type { SchoolConfig } from "@/lib/school-config";

type Props = {
  initialConfig: SchoolConfig;
};

export function AdminSchoolClient({ initialConfig }: Props) {
  const [state, formAction, isPending] = useActionState(saveSchoolSettings, {
    success: false,
    message: ""
  });

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (state.message) {
      setToast(state.message);
      setToastType(state.success ? "success" : "error");
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
    "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
    "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
    "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
    "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก",
    "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร",
    "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
    "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว",
    "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
    "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธาน์"
  ];

  const years = [2567, 2568, 2569, 2570, 2571, 2572, 2573];

  return (
    <div style={style.container}>
      <form action={formAction} style={style.formCard}>
        <h3 style={style.formTitle}>🏫 ข้อมูลและระบบเทอมการศึกษา</h3>
        
        {/* School Name */}
        <div style={style.formField}>
          <label style={style.label}>ชื่อโรงเรียน</label>
          <input
            type="text"
            name="schoolName"
            required
            defaultValue={initialConfig.schoolName}
            style={style.input}
            placeholder="ตัวอย่าง: โรงเรียนเทศบาล ๑"
          />
        </div>

        {/* District & Province */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={style.formField}>
            <label style={style.label}>อำเภอ / เขต</label>
            <input
              type="text"
              name="district"
              required
              defaultValue={initialConfig.district}
              style={style.input}
              placeholder="ตัวอย่าง: เมือง"
            />
          </div>

          <div style={style.formField}>
            <label style={style.label}>จังหวัด (ดรอปดาวน์)</label>
            <select
              name="province"
              required
              defaultValue={initialConfig.province}
              style={style.select}
            >
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <hr style={style.divider} />

        <h3 style={style.formTitle}>📅 การตั้งค่าปีการศึกษาปัจจุบัน</h3>
        <p style={style.hintText}>
          ปีการศึกษาและภาคเรียนนี้จะใช้เป็นค่าเริ่มต้นควบคุมแผนการจัดการเรียนรู้ และหลักฐาน วPA ทั่วทั้งระบบ
        </p>

        {/* Semester & Year */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={style.formField}>
            <label style={style.label}>ภาคเรียนปัจจุบัน (ดรอปดาวน์)</label>
            <select
              name="semester"
              required
              defaultValue={initialConfig.semester}
              style={style.select}
            >
              <option value={1}>ภาคเรียนที่ 1</option>
              <option value={2}>ภาคเรียนที่ 2</option>
              <option value={3}>ภาคเรียนฤดูร้อน (Summer)</option>
            </select>
          </div>

          <div style={style.formField}>
            <label style={style.label}>ปีการศึกษา (ดรอปดาวน์)</label>
            <select
              name="academicYear"
              required
              defaultValue={initialConfig.academicYear}
              style={style.select}
            >
              {years.map((y) => (
                <option key={y} value={y}>ปีการศึกษา {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...style.btnSubmit,
            background: isPending ? "#64748b" : "linear-gradient(135deg, #1e293b, #334155)",
            cursor: isPending ? "not-allowed" : "pointer"
          }}
        >
          {isPending ? "กำลังบันทึกข้อมูล..." : "💾 บันทึกตั้งค่าโรงเรียน"}
        </button>
      </form>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            ...style.toast,
            background: toastType === "success" ? "#15803d" : "#b91c1c"
          }}
        >
          {toastType === "success" ? "✓" : "✗"} {toast}
        </div>
      )}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  container: {
    marginTop: "1.25rem",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  formTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },
  hintText: {
    margin: "-0.5rem 0 0.25rem",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.5",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "#475569",
  },
  input: {
    minHeight: "42px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "13.5px",
    fontFamily: "'Sarabun', sans-serif",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13.5px",
    fontFamily: "'Sarabun', sans-serif",
    background: "#fff",
  },
  divider: {
    border: 0,
    borderTop: "1px solid #e2e8f0",
    margin: "8px 0",
  },
  btnSubmit: {
    width: "100%",
    minHeight: "45px",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold",
    fontFamily: "'Sarabun', sans-serif",
    marginTop: "8px",
    boxShadow: "0 4px 12px rgba(30, 41, 59, 0.15)",
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
