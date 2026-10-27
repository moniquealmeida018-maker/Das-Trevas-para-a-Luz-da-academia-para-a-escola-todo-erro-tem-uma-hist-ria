import { loadStudentReport, reportStartAt } from "../../../../lib/report-data";
import { studentDocument } from "../../../../lib/report-content";
import { pdfResponse } from "../../../../lib/report-pdf";

export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId")?.slice(0, 80);
  if (!studentId) return new Response("Aluno não identificado.", { status: 400 });
  const data = await loadStudentReport(studentId, reportStartAt(request));
  if (!data.student) return new Response("Nenhum resultado foi encontrado para este estudante.", { status: 404 });
  const document = studentDocument(data);
  return pdfResponse(document.filename, document.blocks);
}
