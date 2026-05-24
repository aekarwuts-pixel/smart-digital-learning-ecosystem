"use client";

import { useState } from "react";
import type { ClassroomListItem } from "@/lib/queries/classrooms";
import {
  commitStudentImport,
  downloadStudentTemplateCsv,
  exportClassroomStudentsCsv,
  previewStudentImport
} from "@/app/app/import-export/actions";

type ImportExportClientProps = {
  classrooms: ClassroomListItem[];
};

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportExportClient({ classrooms }: ImportExportClientProps) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id ?? "");
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<
    { first_name: string; grade_level: string; last_name: string; room: string; student_code: string }[]
  >([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onDownloadTemplate() {
    const content = await downloadStudentTemplateCsv();
    downloadTextFile(content, "student_import_template.csv", "text/csv;charset=utf-8");
  }

  async function onPreviewImport(formData: FormData) {
    setBusy(true);
    const result = await previewStudentImport(formData);
    setBusy(false);
    setPreviewErrors(result.errors);
    setPreviewRows(result.parsedRows);
    setSelectedClassroomId(result.classroomId || selectedClassroomId);
    setMessage(
      result.errors.length
        ? `พบข้อผิดพลาด ${result.errors.length} รายการ`
        : `พร้อมนำเข้า ${result.parsedRows.length} รายการ`
    );
  }

  async function onCommitImport() {
    if (!previewRows.length) {
      setMessage("ยังไม่มีข้อมูล preview สำหรับนำเข้า");
      return;
    }
    setBusy(true);
    const formData = new FormData();
    formData.set("classroom_id", selectedClassroomId);
    formData.set("payload_json", JSON.stringify(previewRows));
    const result = await commitStudentImport(formData);
    setBusy(false);
    setMessage(result.message);
    if (result.successRows > 0) {
      setPreviewRows([]);
      setPreviewErrors([]);
    }
  }

  async function onExportCsv() {
    setBusy(true);
    const formData = new FormData();
    formData.set("classroom_id", selectedClassroomId);
    const result = await exportClassroomStudentsCsv(formData);
    setBusy(false);
    setMessage(result.message);
    if (result.content) {
      downloadTextFile(result.content, result.fileName, "text/csv;charset=utf-8");
    }
  }

  return (
    <div className="import-export-grid">
      <article className="course-item">
        <h2 className="setup-heading">นำเข้า (Import) รายชื่อนักเรียนจาก CSV</h2>
        <p>1) ดาวน์โหลด template 2) กรอกข้อมูล 3) อัปโหลด 4) Preview และยืนยันบันทึก</p>

        <div className="course-form">
          <label>
            เลือกห้องเรียนเป้าหมาย
            <select
              name="classroom_id"
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} | {c.course_title}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="landing-secondary" onClick={onDownloadTemplate}>
            ดาวน์โหลด template CSV
          </button>
        </div>

        <form
          className="course-form"
          action={async (formData) => {
            await onPreviewImport(formData);
          }}
        >
          <input type="hidden" name="classroom_id" value={selectedClassroomId} />
          <label>
            เลือกไฟล์ CSV
            <input name="csv_file" type="file" accept=".csv,text/csv" required />
          </label>
          <button className="wide-button" type="submit" disabled={busy}>
            {busy ? "กำลังตรวจไฟล์..." : "ตรวจไฟล์ (Preview)"}
          </button>
        </form>

        {previewErrors.length ? (
          <div className="error-box">
            {previewErrors.map((error, idx) => (
              <p key={`${error}-${idx}`}>{error}</p>
            ))}
          </div>
        ) : null}

        {previewRows.length ? (
          <div className="preview-box">
            <strong>ตัวอย่างข้อมูลที่พร้อมนำเข้า ({previewRows.length} รายการ)</strong>
            <ul>
              {previewRows.slice(0, 8).map((row) => (
                <li key={row.student_code}>
                  {row.student_code} | {row.first_name} {row.last_name} | {row.grade_level}/{row.room}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button className="wide-button" type="button" disabled={busy || !previewRows.length} onClick={onCommitImport}>
          {busy ? "กำลังบันทึก..." : "ยืนยันนำเข้าข้อมูล"}
        </button>
      </article>

      <article className="course-item">
        <h2 className="setup-heading">ส่งออก (Export) รายชื่อนักเรียนเป็น CSV</h2>
        <p>เลือกห้องเรียนแล้วกดส่งออกเพื่อดาวน์โหลดไฟล์รายชื่อได้ทันที</p>
        <button className="wide-button" type="button" disabled={busy || !selectedClassroomId} onClick={onExportCsv}>
          {busy ? "กำลังสร้างไฟล์..." : "ส่งออกรายชื่อนักเรียน (CSV)"}
        </button>
      </article>

      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
