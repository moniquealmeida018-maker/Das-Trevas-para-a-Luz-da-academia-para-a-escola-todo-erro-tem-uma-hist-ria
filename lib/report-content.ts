import type { PdfBlock } from "./report-pdf";
import type { AnswerRow, AttemptRow, StudentReportData, TeacherFilters } from "./report-data";
import { escapeHtml } from "./report-html";

const GRADES: Record<string, string> = {
  "6": "6º ano",
  "9": "9º ano",
  "3": "3º ano do Ensino Médio",
};

const GAMES: Record<string, string[]> = {
  "6": ["Antes e Depois", "A Língua Varia", "Isso é erro?"],
  "9": ["Mito ou fato?", "Isso é erro?", "Batalha contra o preconceito linguístico", "Do passado ao presente"],
  "3": ["Debate linguístico", "Isso é erro?", "Oficina ENEM"],
};

export type ReportDocument = {
  title: string;
  subtitle: string;
  filename: string;
  blocks: PdfBlock[];
  bodyHtml: string;
};

function formatDate(value: number | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(Number(value)));
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function slug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "documento";
}

function attemptsSummary(attempts: AttemptRow[]) {
  const completed = attempts.filter((attempt) => attempt.status === "completed");
  const answered = completed.reduce((total, attempt) => total + Number(attempt.correctAnswers) + Number(attempt.wrongAnswers), 0);
  const correct = completed.reduce((total, attempt) => total + Number(attempt.correctAnswers), 0);
  return {
    completed,
    answered,
    correct,
    accuracy: answered ? Math.round(correct / answered * 100) : 0,
  };
}

function errorsForAttempt(answers: AnswerRow[], attemptId: string): AnswerRow[] {
  return answers.filter((answer) => answer.attemptId === attemptId && !Boolean(answer.isCorrect));
}

export function studentDocument(data: StudentReportData): ReportDocument {
  const student = data.student!;
  const summary = attemptsSummary(data.attempts);
  const games = GAMES[student.grade] ?? [...new Set(data.attempts.map((attempt) => attempt.game))];
  const byGame = games.map((game) => {
    const all = data.attempts.filter((attempt) => attempt.game === game);
    const completed = all.filter((attempt) => attempt.status === "completed");
    const answered = completed.reduce((total, attempt) => total + Number(attempt.correctAnswers) + Number(attempt.wrongAnswers), 0);
    const correct = completed.reduce((total, attempt) => total + Number(attempt.correctAnswers), 0);
    return { game, attempts: all.length, completed: completed.length, accuracy: answered ? Math.round(correct / answered * 100) : 0 };
  });
  const title = "Resultado individual do estudante";
  const subtitle = `Gerado em ${formatDateTime(data.generatedAt)} - Das trevas para a luz`;
  const blocks: PdfBlock[] = [
    { style: "title", text: title },
    { style: "small", text: subtitle },
    { style: "heading", text: "Identificação" },
    { text: `Estudante: ${student.name}` },
    { text: `Turma: ${student.className} | Etapa: ${GRADES[student.grade] ?? student.grade}` },
    { style: "heading", text: "Resumo" },
    { text: `Jogos iniciados: ${new Set(data.attempts.map((attempt) => attempt.game)).size} | Tentativas: ${data.attempts.length} | Concluídas: ${summary.completed.length}` },
    { text: `Questões respondidas: ${summary.answered} | Acertos: ${summary.correct} | Aproveitamento: ${summary.accuracy}%` },
    { style: "heading", text: "Desempenho por missão" },
    ...byGame.map((item) => ({ text: `${item.game}: ${item.attempts} tentativa(s), ${item.completed} concluída(s), ${item.accuracy}% de acertos.` })),
    { style: "heading", text: "Tentativas e respostas" },
  ];

  if (!data.attempts.length) blocks.push({ text: "Nenhuma tentativa registrada neste percurso." });
  for (const [index, attempt] of data.attempts.entries()) {
    const errors = errorsForAttempt(data.answers, attempt.id);
    blocks.push(
      { style: "heading", text: `${index + 1}. ${attempt.game} - tentativa ${attempt.attemptNumber}` },
      { text: `Situação: ${attempt.status === "completed" ? "Concluída" : "Iniciada"} | Data: ${formatDate(attempt.completedAt || attempt.startedAt)} | Acertos: ${attempt.correctAnswers}/${attempt.totalQuestions} | Erros: ${attempt.wrongAnswers}` },
    );
    if (!errors.length) blocks.push({ text: "Nenhum erro registrado nesta tentativa.", indent: 10 });
    for (const [errorIndex, error] of errors.entries()) {
      blocks.push({ text: `Erro ${errorIndex + 1}: ${error.question} | Resposta marcada: ${error.selectedAnswer} | Resposta correta: ${error.correctAnswer}`, indent: 10 });
    }
  }

  const summaryHtml = `<div class="summary">
    <div class="metric"><b>${new Set(data.attempts.map((attempt) => attempt.game)).size}</b> jogos iniciados</div>
    <div class="metric"><b>${data.attempts.length}</b> tentativas</div>
    <div class="metric"><b>${summary.correct}</b> acertos</div>
    <div class="metric"><b>${summary.accuracy}%</b> aproveitamento</div>
  </div>`;
  const gamesHtml = byGame.map((item) => `<p><b>${escapeHtml(item.game)}:</b> ${item.attempts} tentativa(s), ${item.completed} concluída(s), ${item.accuracy}% de acertos.</p>`).join("");
  const attemptsHtml = data.attempts.length ? data.attempts.map((attempt, index) => {
    const errors = errorsForAttempt(data.answers, attempt.id);
    const errorsHtml = errors.length ? `<ul class="errors">${errors.map((error) => `<li><b>${escapeHtml(error.question)}</b><br>Marcou: ${escapeHtml(error.selectedAnswer)}<br>Correta: ${escapeHtml(error.correctAnswer)}</li>`).join("")}</ul>` : "<p>Nenhum erro registrado nesta tentativa.</p>";
    return `<section class="entry"><h2>${index + 1}. ${escapeHtml(attempt.game)} - tentativa ${attempt.attemptNumber}</h2><p>Situação: ${attempt.status === "completed" ? "Concluída" : "Iniciada"} | Data: ${formatDate(attempt.completedAt || attempt.startedAt)} | Acertos: ${attempt.correctAnswers}/${attempt.totalQuestions} | Erros: ${attempt.wrongAnswers}</p>${errorsHtml}</section>`;
  }).join("") : "<p>Nenhuma tentativa registrada neste percurso.</p>";
  const bodyHtml = `<h2>Identificação</h2><p><b>Estudante:</b> ${escapeHtml(student.name)}<br><b>Turma:</b> ${escapeHtml(student.className)}<br><b>Etapa:</b> ${escapeHtml(GRADES[student.grade] ?? student.grade)}</p>${summaryHtml}<h2>Desempenho por missão</h2>${gamesHtml}<h2>Tentativas e respostas</h2>${attemptsHtml}`;

  return {
    title,
    subtitle,
    filename: `resultado-${slug(student.name)}.pdf`,
    blocks,
    bodyHtml,
  };
}

export function teacherDocument(data: { attempts: AttemptRow[]; answers: AnswerRow[]; generatedAt: number }, filters: TeacherFilters): ReportDocument {
  const summary = attemptsSummary(data.attempts);
  const title = "Relatório de progresso dos estudantes";
  const filterText = `Turma: ${filters.className || "Todas"} | Jogo: ${filters.game || "Todos"} | Situação: ${filters.status === "completed" ? "Concluídos" : filters.status === "started" ? "Iniciados" : "Todas"}`;
  const subtitle = `Gerado em ${formatDateTime(data.generatedAt)} - ${filterText}`;
  const blocks: PdfBlock[] = [
    { style: "title", text: title },
    { style: "small", text: subtitle },
    { style: "heading", text: "Resumo" },
    { text: `Estudantes: ${new Set(data.attempts.map((attempt) => attempt.studentId)).size} | Tentativas: ${data.attempts.length} | Concluídas: ${summary.completed.length} | Acertos: ${summary.accuracy}%` },
    { style: "heading", text: "Tentativas e erros" },
  ];

  if (!data.attempts.length) blocks.push({ text: "Nenhum resultado corresponde aos filtros selecionados." });
  for (const [index, attempt] of data.attempts.entries()) {
    const errors = errorsForAttempt(data.answers, attempt.id);
    blocks.push(
      { style: "heading", text: `${index + 1}. ${attempt.name} - ${attempt.game}` },
      { text: `Turma: ${attempt.className} | Etapa: ${GRADES[attempt.grade] ?? attempt.grade} | Tentativa: ${attempt.attemptNumber} | Situação: ${attempt.status === "completed" ? "Concluída" : "Iniciada"} | Data: ${formatDate(attempt.completedAt || attempt.startedAt)}` },
      { text: `Acertos: ${attempt.correctAnswers}/${attempt.totalQuestions} | Erros: ${attempt.wrongAnswers}` },
    );
    for (const [errorIndex, error] of errors.entries()) {
      blocks.push({ text: `Erro ${errorIndex + 1}: ${error.question} | Marcou: ${error.selectedAnswer} | Correta: ${error.correctAnswer}`, indent: 10 });
    }
  }

  const summaryHtml = `<div class="summary">
    <div class="metric"><b>${new Set(data.attempts.map((attempt) => attempt.studentId)).size}</b> estudantes</div>
    <div class="metric"><b>${data.attempts.length}</b> tentativas</div>
    <div class="metric"><b>${summary.completed.length}</b> concluídas</div>
    <div class="metric"><b>${summary.accuracy}%</b> acertos</div>
  </div>`;
  const rows = data.attempts.map((attempt) => `<tr><td>${escapeHtml(attempt.name)}</td><td>${escapeHtml(attempt.className)}</td><td>${escapeHtml(GRADES[attempt.grade] ?? attempt.grade)}</td><td>${escapeHtml(attempt.game)}</td><td>${attempt.attemptNumber}</td><td>${attempt.correctAnswers}/${attempt.totalQuestions}</td><td>${attempt.wrongAnswers}</td><td>${attempt.status === "completed" ? "Concluída" : "Iniciada"}</td><td>${formatDate(attempt.completedAt || attempt.startedAt)}</td></tr>`).join("");
  const tableHtml = data.attempts.length ? `<table><thead><tr><th>Aluno</th><th>Turma</th><th>Etapa</th><th>Jogo</th><th>Tent.</th><th>Acertos</th><th>Erros</th><th>Situação</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>Nenhum resultado corresponde aos filtros selecionados.</p>";
  const errorsHtml = data.attempts.map((attempt) => {
    const errors = errorsForAttempt(data.answers, attempt.id);
    if (!errors.length) return "";
    return `<section class="entry"><h2>${escapeHtml(attempt.name)} - ${escapeHtml(attempt.game)} - tentativa ${attempt.attemptNumber}</h2><ul class="errors">${errors.map((error) => `<li><b>${escapeHtml(error.question)}</b><br>Marcou: ${escapeHtml(error.selectedAnswer)}<br>Correta: ${escapeHtml(error.correctAnswer)}</li>`).join("")}</ul></section>`;
  }).join("");
  const bodyHtml = `<p><b>Filtros:</b> ${escapeHtml(filterText)}</p>${summaryHtml}<h2>Tentativas</h2>${tableHtml}<h2>Erros registrados</h2>${errorsHtml || "<p>Nenhum erro registrado nos resultados selecionados.</p>"}`;

  return {
    title,
    subtitle,
    filename: `relatorio-progresso-${new Date(data.generatedAt).toISOString().slice(0, 10)}.pdf`,
    blocks,
    bodyHtml,
  };
}
