"use client";

import { useActionState } from "react";
import { createPaEvidence, updatePaStatus, type PaActionState } from "@/app/app/pa/actions";
import type { PaEvidence } from "@/lib/database.types";

const initial: PaActionState = { message: "" };

type EvidenceRow = {
  id: string;
  title: string;
  category: string;
  academicYear: number;
  evidenceDate: string;
  status: string;
  reviewerComment: string;
};

function parseWorkflow(description: string | null): { reviewerComment: string; status: string } {
  if (!description) return { status: "draft", reviewerComment: "-" };
  const statusMatch = description.match(/status=([^\n\r]+)/);
  const commentMatch = description.match(/reviewer_comment=([^\n\r]*)/);
  return {
    status: statusMatch?.[1]?.trim() || "draft",
    reviewerComment: commentMatch?.[1]?.trim() || "-"
  };
}

function toRows(evidences: PaEvidence[]): EvidenceRow[] {
  return evidences.map((e) => {
    const workflow = parseWorkflow(e.description);
    return {
      id: e.id,
      title: e.title,
      category: e.category,
      academicYear: e.academic_year,
      evidenceDate: e.evidence_date,
      status: workflow.status,
      reviewerComment: workflow.reviewerComment
    };
  });
}

export function EvidenceForm({ evidences }: { evidences: PaEvidence[] }) {
  const [createState, createAction, createPending] = useActionState(createPaEvidence, initial);
  const [statusState, statusAction, statusPending] = useActionState(updatePaStatus, initial);
  const rows = toRows(evidences);

  return (
    <div className="import-export-grid">
      <article className="course-item">
        <h3>เพิ่มหลักฐาน วPA</h3>
        <p>คำแนะนำ: ใส่ผลลัพธ์ผู้เรียนที่วัดได้จริง พร้อมไฟล์หลักฐานที่ตรวจสอบย้อนหลังได้</p>
        <form action={createAction} className="course-form">
          <label>หมวดหลักฐาน
            <select name="category" defaultValue="learning_design">
              <option value="learning_design">แผนการสอน</option>
              <option value="learning_activity">กิจกรรมการเรียนรู้</option>
              <option value="student_outcome">ผลลัพธ์ผู้เรียน</option>
              <option value="student_support">การช่วยเหลือผู้เรียน</option>
              <option value="professional_development">พัฒนาวิชาชีพ</option>
            </select>
          </label>
          <label>ชื่อหลักฐาน<input name="title" required /></label>
          <label>ตัวชี้วัด วPA<input name="indicator_code" placeholder="เช่น วPA 1.2" /></label>
          <label>ปีการศึกษา<input name="academic_year" type="number" defaultValue={2569} required /></label>
          <label>คำแนะนำเพิ่มเติมสำหรับรายการนี้
            <input name="advice_note" placeholder="เช่น แนบ Before/After ของผู้เรียน" />
          </label>
          <label>รายละเอียดหลักฐาน<textarea name="description" rows={4} required /></label>
          <button className="landing-primary" type="submit" disabled={createPending}>บันทึกหลักฐาน</button>
          {createState.message ? <p className="form-message">{createState.message}</p> : null}
        </form>
      </article>

      <article className="course-item">
        <h3>ดูแลและอนุมัติหลักฐาน</h3>
        <p>Workflow: ร่าง {"->"} ส่งตรวจ {"->"} ต้องแก้ไข {"->"} อนุมัติแล้ว</p>
        <form action={statusAction} className="course-form">
          <label>เลือกรายการหลักฐาน
            <select name="evidence_id" required defaultValue="">
              <option value="" disabled>เลือกหลักฐาน</option>
              {rows.map((e) => <option value={e.id} key={e.id}>{e.title}</option>)}
            </select>
          </label>
          <label>สถานะถัดไป
            <select name="next_status" defaultValue="submitted">
              <option value="submitted">ส่งตรวจ</option>
              <option value="revision_required">ต้องแก้ไข</option>
              <option value="approved">อนุมัติแล้ว</option>
            </select>
          </label>
          <label>คอมเมนต์ผู้ตรวจ<textarea name="reviewer_comment" rows={3} /></label>
          <button className="landing-primary" type="submit" disabled={statusPending}>อัปเดตสถานะ</button>
          {statusState.message ? <p className="form-message">{statusState.message}</p> : null}
        </form>
      </article>

      <article className="course-item">
        <div className="course-item-header">
          <h3>ตารางรายการหลักฐาน</h3>
          <span>{rows.length} รายการ</span>
        </div>
        <div className="pa-table">
          <div className="pa-table-head">
            <span>หลักฐาน</span><span>สถานะ</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="pa-table-row">
              <div>
                <strong>{row.title}</strong>
                <p>{row.category} | ปี {row.academicYear} | {row.evidenceDate}</p>
              </div>
              <div>
                <span className={`pa-status ${row.status === "approved" ? "ok" : row.status === "submitted" ? "wait" : row.status === "revision_required" ? "fix" : "draft"}`}>
                  {row.status}
                </span>
                <p>{row.reviewerComment}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
