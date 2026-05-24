"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherContext } from "@/lib/queries/courses";

export type PaActionState = { message: string };

const ok = (message: string): PaActionState => ({ message });

export async function createPaEvidence(_prev: PaActionState, formData: FormData): Promise<PaActionState> {
  if (!hasSupabaseEnv()) return ok("Demo mode: ยังไม่เชื่อมฐานข้อมูลจริง");
  const context = await getTeacherContext();
  if (!context) return ok("ไม่พบบัญชีครูในระบบ");

  const category = String(formData.get("category") ?? "learning_design");
  const title = String(formData.get("title") ?? "").trim();
  const indicator = String(formData.get("indicator_code") ?? "").trim();
  const academicYear = Number(formData.get("academic_year") ?? 2569);
  const advice = String(formData.get("advice_note") ?? "").trim();
  const detail = String(formData.get("description") ?? "").trim();

  if (!title) return ok("กรุณากรอกชื่อหลักฐาน");
  if (!detail) return ok("กรุณากรอกรายละเอียดหลักฐาน");

  const status = "draft";
  const reviewerComment = "";
  const mergedDescription = `${detail}\n\n[workflow]\nstatus=${status}\nreviewer_comment=${reviewerComment}\nadvice=${advice}`;

  const supabase = await createClient();
  const { error } = await supabase.from("pa_evidences").insert({
    teacher_id: context.teacherId,
    category,
    title,
    description: mergedDescription,
    indicator_code: indicator || null,
    academic_year: academicYear,
    evidence_date: new Date().toISOString().slice(0, 10)
  });
  if (error) return ok(error.message);

  revalidatePath("/app");
  revalidatePath("/app/pa");
  return ok("เพิ่มหลักฐานเรียบร้อย");
}

export async function updatePaStatus(_prev: PaActionState, formData: FormData): Promise<PaActionState> {
  if (!hasSupabaseEnv()) return ok("Demo mode: ยังไม่เชื่อมฐานข้อมูลจริง");
  const context = await getTeacherContext();
  if (!context) return ok("ไม่พบบัญชีครูในระบบ");

  const evidenceId = String(formData.get("evidence_id") ?? "");
  const nextStatus = String(formData.get("next_status") ?? "submitted");
  const comment = String(formData.get("reviewer_comment") ?? "").trim();
  if (!evidenceId) return ok("ไม่พบรหัสหลักฐาน");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("pa_evidences")
    .select("id, teacher_id, description")
    .eq("id", evidenceId)
    .maybeSingle<{ description: string | null; id: string; teacher_id: string }>();
  if (!row || row.teacher_id !== context.teacherId) return ok("ไม่พบหลักฐานหรือไม่มีสิทธิ์");

  const base = row.description ?? "";
  const cleaned = base.replace(/\n?\[workflow\][\s\S]*$/m, "").trim();
  const merged = `${cleaned}\n\n[workflow]\nstatus=${nextStatus}\nreviewer_comment=${comment}`;

  const { error } = await supabase.from("pa_evidences").update({ description: merged }).eq("id", evidenceId);
  if (error) return ok(error.message);

  revalidatePath("/app");
  revalidatePath("/app/pa");
  return ok("อัปเดตสถานะหลักฐานเรียบร้อย");
}
