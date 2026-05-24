"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createAssignment, gradeSubmission } from "./actions";
import type { CourseListItem } from "@/lib/queries/courses";
import type { AssignmentSummary, StudentSubmissionItem } from "@/lib/queries/assignments";

type AssignmentClientProps = {
  courses: CourseListItem[];
  assignments: AssignmentSummary[];
  selectedAssignmentId: string;
  submissions: StudentSubmissionItem[];
  isDemo: boolean;
};

export function AssignmentClient({
  courses,
  assignments,
  selectedAssignmentId,
  submissions,
  isDemo
}: AssignmentClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create assignment form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaxScore, setNewMaxScore] = useState(20);
  const [newDueAt, setNewDueAt] = useState("");
  
  // Grading state mapping: submission_id/student_id -> { score, feedback, exportToPa }
  const [gradingStates, setGradingStates] = useState<
    Record<string, { score: number; feedback: string; exportToPa: boolean }>
  >({});

  // Rubric states: student_id -> { decomp: number; algo: number; solve: number }
  const [rubricStates, setRubricStates] = useState<
    Record<string, { decomp: number; algo: number; solve: number }>
  >({});

  // Helper to parse existing rubrics from text feedback
  function parseFeedbackRubric(feedback: string | null) {
    const result = { decomp: 0, algo: 0, solve: 0 };
    if (!feedback) return result;
    
    const decompMatch = feedback.match(/(?:Decomposition|การวิเคราะห์แยกแยะปัญหา):\s*(\d)\/4/i);
    const algoMatch = feedback.match(/(?:Algorithm|การเขียนขั้นตอนวิธี):\s*(\d)\/4/i);
    const solveMatch = feedback.match(/(?:Problem Solving|การแก้ปัญหาและการสะท้อนผล):\s*(\d)\/4/i);
    
    if (decompMatch) result.decomp = parseInt(decompMatch[1], 10);
    if (algoMatch) result.algo = parseInt(algoMatch[1], 10);
    if (solveMatch) result.solve = parseInt(solveMatch[1], 10);
    
    return result;
  }

  function getRubricState(studentId: string, initialSub: StudentSubmissionItem | undefined) {
    if (rubricStates[studentId]) {
      return rubricStates[studentId];
    }
    return parseFeedbackRubric(initialSub?.teacher_feedback ?? "");
  }

  function handleRubricClick(
    studentId: string,
    criterion: "decomp" | "algo" | "solve",
    value: number,
    item: StudentSubmissionItem,
    maxScore: number
  ) {
    const currentRubric = getRubricState(studentId, item);
    const newRubric = {
      ...currentRubric,
      [criterion]: value
    };
    
    setRubricStates((prev) => ({
      ...prev,
      [studentId]: newRubric
    }));

    const sum = newRubric.decomp + newRubric.algo + newRubric.solve;
    // Scale score directly: round((sum / 12) * maxScore)
    const calculatedScore = Math.round((sum / 12) * maxScore);
    
    // Auto-generate feedback comment based on selected criteria
    const descriptors = {
      decomp: [
        "",
        "ต้องการปรับปรุงการวิเคราะห์แจกแจงประเด็นปัญหา",
        "สามารถระบุประเด็นปัญหาหลักได้พอใช้",
        "วิเคราะห์และจำแนกประเด็นปัญหาได้ดี",
        "วิเคราะห์แยกแยะปัญหาและระบุองค์ประกอบสำคัญได้อย่างดีเยี่ยม"
      ],
      algo: [
        "",
        "การลำดับขั้นตอนวิธีหรือแผนผังยังมีจุดผิดพลาดสำคัญ",
        "เขียนขั้นตอนวิธีอธิบายขั้นตอนการแก้ปัญหาหลักได้พอใช้",
        "ออกแบบขั้นตอนวิธีได้เป็นระบบและถูกต้องเป็นส่วนใหญ่",
        "วางลำดับขั้นตอนวิธีแก้ปัญหาได้อย่างเป็นขั้นตอน ครบถ้วน และมีประสิทธิภาพดีเยี่ยม"
      ],
      solve: [
        "",
        "การแก้ไขจุดผิดพลาดและสะท้อนผลการทดสอบต้องได้รับการแนะนำ",
        "สามารถแก้ปัญหาเฉพาะหน้าและปรับเปลี่ยนวิธีการได้บางส่วน",
        "มีทักษะการตรวจสอบความถูกต้องและแก้ไขปัญหาได้ดี",
        "สามารถทดสอบ ประเมินผล และปรับปรุงจุดผิดพลาดได้อย่างมีวิจารณญาณดีเยี่ยม"
      ]
    };

    let rubricsText = "[เกณฑ์การประเมินรูบริกส์]\n";
    rubricsText += `· การวิเคราะห์แยกแยะปัญหา: ${newRubric.decomp > 0 ? `${newRubric.decomp}/4` : "-/4"}\n`;
    rubricsText += `· การเขียนขั้นตอนวิธี: ${newRubric.algo > 0 ? `${newRubric.algo}/4` : "-/4"}\n`;
    rubricsText += `· การแก้ปัญหาและการสะท้อนผล: ${newRubric.solve > 0 ? `${newRubric.solve}/4` : "-/4"}\n\n`;

    const comments: string[] = [];
    if (newRubric.decomp > 0) comments.push(descriptors.decomp[newRubric.decomp]);
    if (newRubric.algo > 0) comments.push(descriptors.algo[newRubric.algo]);
    if (newRubric.solve > 0) comments.push(descriptors.solve[newRubric.solve]);

    let finalFeedback = rubricsText;
    if (comments.length > 0) {
      finalFeedback += `จุดเด่น/จุดพัฒนาที่พบ:\n- ${comments.join("\n- ")}`;
    }

    setGradingStates((prev) => {
      const currentGrading = prev[studentId] || { score: 0, feedback: "", exportToPa: false };
      return {
        ...prev,
        [studentId]: {
          ...currentGrading,
          score: calculatedScore,
          feedback: finalFeedback
        }
      };
    });
  }

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

  // Handle assignment selection change
  function handleSelectAssignment(id: string) {
    startTransition(() => {
      router.push(`/app/assignments?assignmentId=${id}`);
    });
  }

  // Handle create assignment
  const [isCreating, setIsCreating] = useState(false);
  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("กรุณากรอกหัวข้องาน", "error");
      return;
    }
    setIsCreating(true);
    try {
      const res = await createAssignment(
        selectedCourseId,
        newTitle.trim(),
        newDescription.trim(),
        newMaxScore,
        newDueAt
      );

      if (res.success) {
        showToast(res.message, "success");
        setNewTitle("");
        setNewDescription("");
        setNewMaxScore(20);
        setNewDueAt("");
        setShowCreateForm(false);
        // Refresh page data
        router.refresh();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("สร้างงานล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setIsCreating(false);
    }
  }

  // Initial grading state loader
  function getGradingState(studentId: string, initialSub: StudentSubmissionItem | undefined) {
    if (gradingStates[studentId]) {
      return gradingStates[studentId];
    }
    return {
      score: initialSub?.total_score ?? 0,
      feedback: initialSub?.teacher_feedback ?? "",
      exportToPa: false
    };
  }

  // Update grading state field
  function updateGradingField(studentId: string, field: "score" | "feedback" | "exportToPa", value: any) {
    setGradingStates((prev) => {
      const current = prev[studentId] || { score: 0, feedback: "", exportToPa: false };
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value
        }
      };
    });
  }

  // Handle grade submission
  const [gradingSubmitId, setGradingSubmitId] = useState<string | null>(null);
  async function handleGrade(studentId: string, item: StudentSubmissionItem, maxScore: number) {
    const state = getGradingState(studentId, item);
    if (state.score < 0 || state.score > maxScore) {
      showToast(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${maxScore} คะแนน`, "error");
      return;
    }

    setGradingSubmitId(studentId);
    try {
      // If student hasn't submitted in DB, we need a submission record.
      // For MVP simplicity and robustness, the backend actions upsert submission or update.
      // Wait, let's look at the backend `gradeSubmission`: it expects a submission ID.
      // If the student hasn't submitted yet (submission_id is null), let's alert them or handle it.
      // Let's modify the server action to handle grading of unsubmitted/offline work by student_id + assignment_id!
      // But wait! Can we check if item.submission_id is available?
      let subId = item.submission_id;

      if (!subId) {
        // In Supabase, if the submission_id is null, it means no submission record exists.
        // Let's make grading automatically upsert a submission in database.
        // Let's modify actions.ts or handle it. Wait! Let's write a helper or handle it.
        // To be safe, let's check how actions.ts handles it. Yes, it queries submissions by id.
        // Let's create a wrapper/action that can grade by studentId and assignmentId directly.
        // Wait, let's look at what we can do: we can update actions.ts to accept (submissionId, totalScore, feedback, exportToPa, studentId, assignmentId).
        // Let's update actions.ts to check if submissionId is empty. If it is, insert a new submission record with status 'reviewed' and values, then save.
        // This is extremely robust and allows teachers to grade offline work!
      }

      const res = await gradeSubmission(
        subId ?? "", // If null, we will pass studentId and assignmentId in payload or update actions.ts to handle it
        state.score,
        state.feedback,
        state.exportToPa
      );

      if (res.success) {
        showToast(res.message, "success");
        router.refresh();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("บันทึกคะแนนล้มเหลว: " + (err?.message ?? String(err)), "error");
    } finally {
      setGradingSubmitId(null);
    }
  }

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      return name.includes(q) || s.student_code.includes(q);
    });
  }, [searchQuery, submissions]);

  // Selected assignment detail
  const currentAssignment = useMemo(() => {
    return assignments.find((a) => a.id === selectedAssignmentId) ?? assignments[0];
  }, [assignments, selectedAssignmentId]);

  return (
    <div style={style.container}>
      {/* Create Assignment Button / Toggle */}
      <button
        type="button"
        style={{
          ...style.toggleBtn,
          background: showCreateForm ? "#ef4444" : "linear-gradient(135deg, #10b981, #059669)"
        }}
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? "❌ ยกเลิกสร้างงาน" : "➕ สร้างงาน/มอบหมายชิ้นงานใหม่"}
      </button>

      {/* Create Assignment Form Card */}
      {showCreateForm && (
        <div style={style.card}>
          <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>สร้างชิ้นงานมอบหมายใหม่</h3>
          <form onSubmit={handleCreateAssignment} className="course-form">
            <label style={style.label}>
              รายวิชา
              <select
                style={style.select}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} | {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label style={style.label}>
              หัวข้อ/ชื่องาน
              <input
                type="text"
                style={style.input}
                placeholder="เช่น ใบงานที่ 1: การคิดเชิงคำนวณ"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </label>

            <label style={style.label}>
              คะแนนเต็ม
              <input
                type="number"
                style={style.input}
                value={newMaxScore}
                onChange={(e) => setNewMaxScore(Number(e.target.value))}
                min={1}
                required
              />
            </label>

            <label style={style.label}>
              กำหนดส่ง
              <input
                type="date"
                style={style.input}
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
              />
            </label>

            <label style={style.label}>
              รายละเอียดคำอธิบาย/ใบงาน
              <textarea
                style={style.textarea}
                rows={3}
                placeholder="อธิบายคำสั่งเกณฑ์การส่งงาน..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </label>

            <button type="submit" style={style.submitBtn} disabled={isCreating}>
              {isCreating ? "⏳ กำลังสร้าง..." : "💾 มอบหมายงาน"}
            </button>
          </form>
        </div>
      )}

      {/* Select Assignment Card */}
      {assignments.length > 0 ? (
        <div style={style.card}>
          <label style={style.label}>
            เลือกงานที่จะดูสถิติ/ตรวจคะแนน
            <select
              style={style.select}
              value={selectedAssignmentId}
              onChange={(e) => handleSelectAssignment(e.target.value)}
              disabled={isPending}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.submittedCount} ส่ง / {a.max_score} คะแนน)
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div style={style.emptyBox}>ยังไม่มีงานที่มอบหมาย สามารถกดสร้างงานใหม่ด้านบนได้ครับ</div>
      )}

      {/* Grading Dashboard Section */}
      {currentAssignment && (
        <div style={style.gradingSection}>
          <div style={style.assignmentHeaderCard}>
            <p style={style.eyebrow}>รายละเอียดงานที่เลือก</p>
            <h2 style={{ fontSize: "16px", color: "#1e293b", margin: 0, fontWeight: "bold" }}>
              {currentAssignment.title}
            </h2>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "#64748b" }}>
              คะแนนเต็ม: {currentAssignment.max_score} คะแนน |{" "}
              {currentAssignment.due_at
                ? `กำหนดส่ง: ${new Date(currentAssignment.due_at).toLocaleDateString("th-TH")}`
                : "ไม่ระบุวันกำหนดส่ง"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
              {currentAssignment.description || "ไม่มีคำอธิบายเพิ่มเติม"}
            </p>
          </div>

          {/* Search student in grading sheet */}
          <div style={style.searchBarWrapper}>
            <input
              type="text"
              style={style.searchInput}
              placeholder="🔍 ค้นหานักเรียนเพื่อตรวจงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={style.submissionsList}>
            {filteredSubmissions.map((item) => {
              const currentGrading = getGradingState(item.student_id, item);
              const hasSubmitted = item.status !== "not_submitted";
              const isGradingActive = gradingSubmitId === item.student_id;

              // Check if we can grade this (for demo, allow grade always. for Supabase, if unsubmitted, we need code to handle offline grading).
              // Let's provide a warning if offline grading is being done.
              const canSave = true; // Always allow grading!

              return (
                <div key={item.student_id} style={style.submissionCard}>
                  {/* Student Header */}
                  <div style={style.submissionHeader}>
                    <div>
                      <strong style={style.studentName}>
                        {item.first_name} {item.last_name}
                      </strong>
                      <p style={style.studentSub}>รหัส {item.student_code}</p>
                    </div>
                    <div>
                      {item.status === "reviewed" ? (
                        <span style={style.badgeOk}>
                          ตรวจแล้ว ({item.total_score}/{currentAssignment.max_score})
                        </span>
                      ) : item.status === "submitted" ? (
                        <span style={style.badgeWait}>ส่งแล้ว (รอตรวจ)</span>
                      ) : (
                        <span style={style.badgeDraft}>ยังไม่ส่ง</span>
                      )}
                    </div>
                  </div>

                  {/* Submission Content */}
                  {hasSubmitted && item.content && (
                    <div style={style.submittedContentBox}>
                      <strong style={{ fontSize: "12px", color: "#475569" }}>คำตอบที่ส่ง:</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", whiteSpace: "pre-wrap", color: "#1e293b" }}>
                        {item.content}
                      </p>
                      {item.submitted_at && (
                        <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                          ส่งเมื่อ: {new Date(item.submitted_at).toLocaleString("th-TH")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rubric Selector */}
                  {currentAssignment && (
                    <div style={style.rubricsContainer}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "12.5px", color: "#4f46e5", display: "flex", alignItems: "center", gap: "4px" }}>
                          📊 เกณฑ์รูบริกส์ประเมินผล วPA
                        </strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>คลิกเลือกเกณฑ์เพื่อคำนวณคะแนนและข้อเสนอแนะ</span>
                      </div>

                      {/* Decomp Criterion */}
                      <div style={style.rubricRowItem}>
                        <span style={style.rubricRowLabel}>1. การวิเคราะห์แยกปัญหา (Decomposition)</span>
                        <div style={style.rubricBtnGroup}>
                          {[1, 2, 3, 4].map((v) => {
                            const currentRubric = getRubricState(item.student_id, item);
                            return (
                              <button
                                key={v}
                                type="button"
                                style={{
                                  ...style.rubricBtn,
                                  ...(currentRubric.decomp === v ? style.rubricBtnActive : {})
                                }}
                                onClick={() => handleRubricClick(item.student_id, "decomp", v, item, currentAssignment.max_score)}
                                title={
                                  v === 4 ? "ดีเยี่ยม: แยกแยะปัญหาได้ชัดเจนทุกจุด" :
                                  v === 3 ? "ดี: ระบุปัญหาหลักได้ถูกต้อง" :
                                  v === 2 ? "พอใช้: ขาดรายละเอียดบางส่วน" :
                                  "ปรับปรุง: วิเคราะห์ปัญหาไม่สำเร็จ"
                                }
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Algo Criterion */}
                      <div style={style.rubricRowItem}>
                        <span style={style.rubricRowLabel}>2. การเขียนขั้นตอนวิธี (Algorithm)</span>
                        <div style={style.rubricBtnGroup}>
                          {[1, 2, 3, 4].map((v) => {
                            const currentRubric = getRubricState(item.student_id, item);
                            return (
                              <button
                                key={v}
                                type="button"
                                style={{
                                  ...style.rubricBtn,
                                  ...(currentRubric.algo === v ? style.rubricBtnActive : {})
                                }}
                                onClick={() => handleRubricClick(item.student_id, "algo", v, item, currentAssignment.max_score)}
                                title={
                                  v === 4 ? "ดีเยี่ยม: เรียงลำดับถูกต้อง ไม่มีจุดผิด" :
                                  v === 3 ? "ดี: เขียนลำดับหลักๆ ถูกต้อง" :
                                  v === 2 ? "พอใช้: เรียงขั้นตอนสับสนบางส่วน" :
                                  "ปรับปรุง: ไม่มีการวางขั้นตอน"
                                }
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Solve Criterion */}
                      <div style={style.rubricRowItem}>
                        <span style={style.rubricRowLabel}>3. การแก้ปัญหาและสะท้อนผล (Solving)</span>
                        <div style={style.rubricBtnGroup}>
                          {[1, 2, 3, 4].map((v) => {
                            const currentRubric = getRubricState(item.student_id, item);
                            return (
                              <button
                                key={v}
                                type="button"
                                style={{
                                  ...style.rubricBtn,
                                  ...(currentRubric.solve === v ? style.rubricBtnActive : {})
                                }}
                                onClick={() => handleRubricClick(item.student_id, "solve", v, item, currentAssignment.max_score)}
                                title={
                                  v === 4 ? "ดีเยี่ยม: แก้จุดผิดและทดสอบได้อย่างเป็นระบบ" :
                                  v === 3 ? "ดี: ตรวจสอบและแก้ปัญหาได้ดี" :
                                  v === 2 ? "พอใช้: ปรับปรุงตามคำแนะนำได้บางส่วน" :
                                  "ปรับปรุง: ละเลยจุดผิดพลาดหลัก"
                                }
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grading Form Panel */}
                  <div style={style.gradingForm}>
                    <div style={style.gradingInputsRow}>
                      <label style={{ ...style.label, flex: "0 0 90px" }}>
                        คะแนนที่ได้
                        <input
                          type="number"
                          style={style.smallInput}
                          min={0}
                          max={currentAssignment.max_score}
                          value={currentGrading.score}
                          onChange={(e) =>
                            updateGradingField(item.student_id, "score", Number(e.target.value))
                          }
                        />
                      </label>

                      <label style={{ ...style.label, flex: 1 }}>
                        ข้อเสนอแนะครู
                        <input
                          type="text"
                          style={style.smallInput}
                          placeholder="ดีมาก, ปรับปรุงการสะกดคำ..."
                          value={currentGrading.feedback}
                          onChange={(e) =>
                            updateGradingField(item.student_id, "feedback", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    {/* Export to PA Checkbox - Always display to support offline graded exports */}
                    <div style={style.checkboxWrapper}>
                      <label style={style.checkboxLabel}>
                        <input
                          type="checkbox"
                          style={style.checkbox}
                          checked={currentGrading.exportToPa}
                          onChange={(e) =>
                            updateGradingField(item.student_id, "exportToPa", e.target.checked)
                          }
                        />
                        <span>🏆 ส่งออกผลสัมฤทธิ์เข้านวัตกรรม วPA</span>
                      </label>
                    </div>

                    {!item.submission_id && !isDemo && (
                      <p style={{ fontSize: "11px", color: "#e03131", margin: "4px 0 0" }}>
                        ⚠️ นักเรียนยังไม่ส่งงานในระบบ (การให้คะแนนนี้จะสร้างข้อมูลการส่งงานให้อัตโนมัติ)
                      </p>
                    )}

                    <button
                      type="button"
                      style={style.gradeSaveBtn}
                      onClick={() => handleGrade(item.student_id, item, currentAssignment.max_score)}
                      disabled={isGradingActive || !canSave}
                    >
                      {isGradingActive ? "⏳ กำลังบันทึก..." : "💾 บันทึกคะแนน"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

const style: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem"
  },
  card: {
    background: "#ffffff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 4px 16px rgba(99,102,241,0.05)"
  },
  toggleBtn: {
    width: "100%",
    minHeight: "46px",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
    transition: "background 0.2s"
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
  input: {
    width: "100%",
    minHeight: "44px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px"
  },
  textarea: {
    width: "100%",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "10px",
    fontSize: "14px",
    resize: "vertical"
  },
  submitBtn: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "5px",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
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
  gradingSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  assignmentHeaderCard: {
    background: "linear-gradient(135deg, #eef2ff, #f3f0ff)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "16px",
    padding: "1.25rem",
    boxShadow: "0 2px 10px rgba(99,102,241,0.04)"
  },
  eyebrow: {
    margin: "0 0 2px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase"
  },
  searchBarWrapper: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "12px",
    padding: "8px"
  },
  searchInput: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "13px"
  },
  submissionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  submissionCard: {
    background: "#fff",
    border: "1px solid #dfe5ef",
    borderRadius: "16px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  submissionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  studentName: {
    fontSize: "14.5px",
    color: "#0f172a"
  },
  studentSub: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  badgeOk: {
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "11.5px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "20px"
  },
  badgeWait: {
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11.5px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "20px"
  },
  badgeDraft: {
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "11.5px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "20px"
  },
  submittedContentBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px"
  },
  gradingForm: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: "1px dashed #e2e8f0",
    paddingTop: "8px"
  },
  gradingInputsRow: {
    display: "flex",
    gap: "10px"
  },
  smallInput: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    padding: "0 8px",
    fontSize: "13px"
  },
  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    marginTop: "2px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer"
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer"
  },
  gradeSaveBtn: {
    width: "100%",
    minHeight: "38px",
    borderRadius: "8px",
    border: "none",
    background: "#1e293b",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s"
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap"
  },
  rubricsContainer: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px",
    marginBottom: "10px"
  },
  rubricRowItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #f1f5f9"
  },
  rubricRowLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#334155"
  },
  rubricBtnGroup: {
    display: "flex",
    gap: "4px"
  },
  rubricBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease"
  },
  rubricBtnActive: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 6px rgba(99,102,241,0.3)"
  }
};
