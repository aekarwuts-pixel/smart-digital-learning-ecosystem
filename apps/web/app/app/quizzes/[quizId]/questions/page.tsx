import { notFound } from "next/navigation";
import { getQuizDetails, getQuizQuestions } from "@/lib/queries/quizzes";
import { QuestionsClient } from "./questions-client";

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizQuestionsPage({ params }: Props) {
  const { quizId } = await params;
  const quiz = await getQuizDetails(quizId);

  if (!quiz) {
    notFound();
  }

  const initialQuestions = await getQuizQuestions(quizId);

  return (
    <main className="phone-shell" style={{ maxWidth: "650px" }}>
      <section className="auth-screen is-active" aria-labelledby="questions-title">
        <p className="eyebrow">คลังข้อสอบ</p>
        <h1 id="questions-title">สร้างและจัดการคำถาม</h1>
        <p className="lead" style={{ marginBottom: "1rem" }}>
          แบบทดสอบ: <strong>{quiz.title}</strong> (คะแนนเต็มเป้าหมาย: {quiz.max_score} คะแนน)
        </p>

        <QuestionsClient quizId={quiz.id} initialQuestions={initialQuestions} maxScore={quiz.max_score} />
      </section>
    </main>
  );
}
