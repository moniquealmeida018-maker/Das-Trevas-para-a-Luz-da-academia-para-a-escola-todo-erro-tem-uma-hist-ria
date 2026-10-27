import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const attemptId = String(body.attemptId || "").slice(0, 80);
  const questionIndex = Number(body.questionIndex);
  const question = String(body.question || "").slice(0, 600);
  const selectedAnswer = String(body.selectedAnswer || "").slice(0, 400);
  const correctAnswer = String(body.correctAnswer || "").slice(0, 400);
  const isCorrect = body.isCorrect === true;
  if (!attemptId || !Number.isInteger(questionIndex) || questionIndex < 0 || !question || !selectedAnswer || !correctAnswer) {
    return Response.json({ error: "Resposta inválida." }, { status: 400 });
  }

  const exists = await env.DB.prepare("SELECT id FROM attempts WHERE id = ?").bind(attemptId).first();
  if (!exists) return Response.json({ error: "Tentativa não encontrada." }, { status: 404 });

  await env.DB.prepare(`INSERT INTO answers
    (id, attempt_id, question_index, question, selected_answer, correct_answer, is_correct, answered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(attempt_id, question_index) DO UPDATE SET selected_answer = excluded.selected_answer,
    correct_answer = excluded.correct_answer, is_correct = excluded.is_correct, answered_at = excluded.answered_at`)
    .bind(crypto.randomUUID(), attemptId, questionIndex, question, selectedAnswer, correctAnswer, isCorrect ? 1 : 0, Date.now()).run();

  const totals = await env.DB.prepare(`SELECT
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
    SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong
    FROM answers WHERE attempt_id = ?`).bind(attemptId).first<{ correct: number; wrong: number }>();
  await env.DB.prepare("UPDATE attempts SET correct_answers = ?, wrong_answers = ? WHERE id = ?")
    .bind(Number(totals?.correct || 0), Number(totals?.wrong || 0), attemptId).run();
  return Response.json({ ok: true });
}
