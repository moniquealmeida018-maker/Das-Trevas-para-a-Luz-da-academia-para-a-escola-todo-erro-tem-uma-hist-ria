import { env } from "cloudflare:workers";
import { isTeacherAuthenticated } from "./teacher-auth";

export type StudentRow = {
  id: string;
  name: string;
  className: string;
  grade: string;
};

export type AttemptRow = {
  id: string;
  studentId: string;
  name: string;
  className: string;
  grade: string;
  game: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  status: string;
  startedAt: number;
  completedAt: number | null;
};

export type AnswerRow = {
  attemptId: string;
  questionIndex: number;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | number;
};

export type StudentReportData = {
  student: StudentRow | null;
  attempts: AttemptRow[];
  answers: AnswerRow[];
  generatedAt: number;
};

export type TeacherFilters = {
  className: string;
  game: string;
  status: "" | "completed" | "started";
};

export function reportStartAt(request: Request): number {
  const value = Number(new URL(request.url).searchParams.get("startAt") || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, Date.now() + 60_000);
}

export function teacherFilters(request: Request): TeacherFilters {
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  return {
    className: String(params.get("className") || "").slice(0, 80),
    game: String(params.get("game") || "").slice(0, 160),
    status: status === "completed" || status === "started" ? status : "",
  };
}

export async function loadStudentReport(studentId: string, startAt: number): Promise<StudentReportData> {
  const student = await env.DB.prepare("SELECT id, name, class_name AS className, grade FROM students WHERE id = ?")
    .bind(studentId).first<StudentRow>();
  if (!student) return { student: null, attempts: [], answers: [], generatedAt: Date.now() };

  const attempts = await env.DB.prepare(`SELECT id, student_id AS studentId, ? AS name, ? AS className,
    grade, game, attempt_number AS attemptNumber, total_questions AS totalQuestions,
    correct_answers AS correctAnswers, wrong_answers AS wrongAnswers, status,
    started_at AS startedAt, completed_at AS completedAt
    FROM attempts WHERE student_id = ? AND started_at > ? ORDER BY started_at DESC`)
    .bind(student.name, student.className, studentId, startAt).all<AttemptRow>();

  const answers = await env.DB.prepare(`SELECT ans.attempt_id AS attemptId, ans.question_index AS questionIndex,
    ans.question, ans.selected_answer AS selectedAnswer, ans.correct_answer AS correctAnswer,
    ans.is_correct AS isCorrect
    FROM answers ans JOIN attempts a ON a.id = ans.attempt_id
    WHERE a.student_id = ? AND a.started_at > ? ORDER BY a.started_at DESC, ans.question_index`)
    .bind(studentId, startAt).all<AnswerRow>();

  return {
    student,
    attempts: attempts.results,
    answers: answers.results,
    generatedAt: Date.now(),
  };
}

export async function authorizeTeacher(request: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  if (!(await isTeacherAuthenticated(request))) {
    return { ok: false, response: new Response("Entre com a senha do professor para acessar este documento.", { status: 401 }) };
  }
  return { ok: true };
}

export async function loadTeacherReport(filters: TeacherFilters): Promise<{ attempts: AttemptRow[]; answers: AnswerRow[]; generatedAt: number }> {
  const attemptsResult = await env.DB.prepare(`SELECT a.id, a.student_id AS studentId, s.name, s.class_name AS className,
    a.grade, a.game, a.attempt_number AS attemptNumber, a.total_questions AS totalQuestions,
    a.correct_answers AS correctAnswers, a.wrong_answers AS wrongAnswers, a.status,
    a.started_at AS startedAt, a.completed_at AS completedAt
    FROM attempts a JOIN students s ON s.id = a.student_id
    ORDER BY s.class_name, s.name, a.started_at DESC`).all<AttemptRow>();
  const answersResult = await env.DB.prepare(`SELECT attempt_id AS attemptId, question_index AS questionIndex,
    question, selected_answer AS selectedAnswer, correct_answer AS correctAnswer,
    is_correct AS isCorrect FROM answers ORDER BY question_index`).all<AnswerRow>();

  const attempts = attemptsResult.results.filter((attempt) =>
    (!filters.className || attempt.className === filters.className) &&
    (!filters.game || attempt.game === filters.game) &&
    (!filters.status || attempt.status === filters.status)
  );
  const attemptIds = new Set(attempts.map((attempt) => attempt.id));
  const answers = answersResult.results.filter((answer) => attemptIds.has(answer.attemptId));
  return { attempts, answers, generatedAt: Date.now() };
}
