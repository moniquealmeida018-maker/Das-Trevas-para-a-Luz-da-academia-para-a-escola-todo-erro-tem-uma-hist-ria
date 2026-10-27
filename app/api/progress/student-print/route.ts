import { loadStudentReport, reportStartAt } from "../../../../lib/report-data";
import { studentDocument } from "../../../../lib/report-content";
import { reportHtmlResponse } from "../../../../lib/report-html";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId")?.slice(0, 80);
  if (!studentId) return new Response("Aluno não identificado.", { status: 400 });
  const data = await loadStudentReport(studentId, reportStartAt(request));
  if (!data.student) return new Response("Nenhum resultado foi encontrado para este estudante.", { status: 404 });
  const document = studentDocument(data);
  const params = new URLSearchParams({ studentId });
  const startAt = url.searchParams.get("startAt");
  if (startAt) params.set("startAt", startAt);
  return reportHtmlResponse({
    title: document.title,
    subtitle: document.subtitle,
    body: document.bodyHtml,
    pdfHref: `/api/progress/student-pdf?${params.toString()}`,
  });
}
