import { notFound, redirect } from "next/navigation";
import { getStudentSession } from "@/lib/supabase/student-session";
import { getQuizDetails, getQuizQuestions, getStudentQuizAttempt } from "@/lib/queries/quizzes";
import { TakeQuizClient } from "./take-quiz-client";

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function StudentQuizPage({ params }: Props) {
  const { quizId } = await params;
  const student = await getStudentSession();

  if (!student) {
    redirect("/login");
  }

  const quiz = await getQuizDetails(quizId);
  if (!quiz) {
    notFound();
  }

  const questions = await getQuizQuestions(quizId, true); // Securely fetch questions (correct options hidden)
  const existingAttempt = await getStudentQuizAttempt(quizId, student.id);

  return (
    <main className="phone-shell">
      <section className="auth-screen is-active" style={{ paddingBottom: "2rem" }} aria-labelledby="take-quiz-title">
        <TakeQuizClient
          quiz={quiz}
          questions={questions}
          attempt={existingAttempt}
          studentName={`${student.first_name} ${student.last_name}`}
        />
      </section>
    </main>
  );
}
