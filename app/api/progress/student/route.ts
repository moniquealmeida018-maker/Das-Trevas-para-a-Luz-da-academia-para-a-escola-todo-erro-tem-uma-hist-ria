import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId")?.slice(0, 80);
  if (!studentId) return Response.json({ error: "Aluno não identificado." }, { status: 400 });
  const student = await env.DB.prepare("SELECT id, name, class_name AS className, grade FROM students WHERE id = ?")
    .bind(studentId).first();
  if (!student) return Response.json({ student: null, attempts: [] });
  const attempts = await env.DB.prepare(`SELECT id, game, grade, attempt_number AS attemptNumber,
    total_questions AS totalQuestions, correct_answers AS correctAnswers,
    wrong_answers AS wrongAnswers, status, started_at AS startedAt, completed_at AS completedAt
    FROM attempts WHERE student_id = ? ORDER BY started_at DESC`).bind(studentId).all();
  return Response.json({ student, attempts: attempts.results });
}
