import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const studentId = String(body.studentId || "").slice(0, 80);
  const name = String(body.name || "").trim().slice(0, 100);
  const className = String(body.className || "").trim().slice(0, 80);
  const grade = String(body.grade || "").slice(0, 10);
  const game = String(body.game || "").trim().slice(0, 160);
  const totalQuestions = Number(body.totalQuestions);
  if (!studentId || !name || !className || !grade || !game || !Number.isInteger(totalQuestions) || totalQuestions < 1 || totalQuestions > 100) {
    return Response.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const now = Date.now();
  const attemptId = crypto.randomUUID();
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM attempts WHERE student_id = ? AND game = ?")
    .bind(studentId, game).first<{ total: number }>();
  const attemptNumber = Number(count?.total || 0) + 1;

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO students (id, name, class_name, grade, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, class_name = excluded.class_name,
      grade = excluded.grade, updated_at = excluded.updated_at`)
      .bind(studentId, name, className, grade, now, now),
    env.DB.prepare(`INSERT INTO attempts
      (id, student_id, grade, game, attempt_number, total_questions, correct_answers, wrong_answers, status, started_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'started', ?)`)
      .bind(attemptId, studentId, grade, game, attemptNumber, totalQuestions, now),
  ]);

  return Response.json({ attemptId, attemptNumber });
}
