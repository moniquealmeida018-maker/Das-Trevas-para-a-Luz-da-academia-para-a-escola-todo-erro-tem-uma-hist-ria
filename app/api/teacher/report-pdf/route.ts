import { authorizeTeacher, loadTeacherReport, teacherFilters } from "../../../../lib/report-data";
import { teacherDocument } from "../../../../lib/report-content";
import { pdfResponse } from "../../../../lib/report-pdf";

export async function GET(request: Request) {
  const authorization = await authorizeTeacher(request);
  if (!authorization.ok) return authorization.response;
  const filters = teacherFilters(request);
  const document = teacherDocument(await loadTeacherReport(filters), filters);
  return pdfResponse(document.filename, document.blocks);
}
