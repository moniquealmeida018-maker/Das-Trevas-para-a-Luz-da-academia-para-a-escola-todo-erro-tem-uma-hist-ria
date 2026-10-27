import { authorizeTeacher, loadTeacherReport, teacherFilters } from "../../../../lib/report-data";
import { teacherDocument } from "../../../../lib/report-content";
import { reportHtmlResponse } from "../../../../lib/report-html";

export async function GET(request: Request) {
  const authorization = await authorizeTeacher(request);
  if (!authorization.ok) return authorization.response;
  const filters = teacherFilters(request);
  const document = teacherDocument(await loadTeacherReport(filters), filters);
  const params = new URLSearchParams();
  if (filters.className) params.set("className", filters.className);
  if (filters.game) params.set("game", filters.game);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return reportHtmlResponse({
    title: document.title,
    subtitle: document.subtitle,
    body: document.bodyHtml,
    pdfHref: `/api/teacher/report-pdf${query ? `?${query}` : ""}`,
  });
}
