import { env } from "cloudflare:workers";
import { authorizeTeacher } from "../../../../lib/report-data";

export async function GET(request: Request) {
  const authorization = await authorizeTeacher(request);
  if (!authorization.ok) {
    return Response.json({ error: "Entre com a senha do professor para consultar o painel." }, { status: 401 });
  }

  const attempts = await env.DB.prepare(`SELECT a.id, a.student_id AS studentId, s.name, s.class_name AS className,
    a.grade, a.game, a.attempt_number AS attemptNumber, a.total_questions AS totalQuestions,
    a.correct_answers AS correctAnswers, a.wrong_answers AS wrongAnswers, a.status,
    a.started_at AS startedAt, a.completed_at AS completedAt
    FROM attempts a JOIN students s ON s.id = a.student_id
    ORDER BY s.class_name, s.name, a.started_at DESC`).all();
  const answers = await env.DB.prepare(`SELECT attempt_id AS attemptId, question_index AS questionIndex,
    question, selected_answer AS selectedAnswer, correct_answer AS correctAnswer,
    is_correct AS isCorrect FROM answers ORDER BY question_index`).all();
  return Response.json({ attempts: attempts.results, answers: answers.results, generatedAt: Date.now() });
}
