import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const attemptId = String(body.attemptId || "").slice(0, 80);
  if (!attemptId) return Response.json({ error: "Tentativa inválida." }, { status: 400 });
  const result = await env.DB.prepare("UPDATE attempts SET status = 'completed', completed_at = ? WHERE id = ?")
    .bind(Date.now(), attemptId).run();
  if (!result.meta.changes) return Response.json({ error: "Tentativa não encontrada." }, { status: 404 });
  return Response.json({ ok: true });
}
