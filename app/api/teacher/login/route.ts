import {
  createTeacherSessionCookie,
  passwordIsConfigured,
  teacherPasswordMatches,
} from "../../../../lib/teacher-auth";

export async function POST(request: Request) {
  if (!passwordIsConfigured()) {
    return Response.json({ error: "A senha do professor ainda não foi configurada na Cloudflare." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!teacherPasswordMatches(String(body.password || ""))) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": await createTeacherSessionCookie(), "Cache-Control": "no-store" } },
  );
}
