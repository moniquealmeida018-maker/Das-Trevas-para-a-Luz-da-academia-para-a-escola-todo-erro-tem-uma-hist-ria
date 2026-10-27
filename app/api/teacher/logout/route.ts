import { clearTeacherSessionCookie } from "../../../../lib/teacher-auth";

export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearTeacherSessionCookie(), "Cache-Control": "no-store" } },
  );
}
