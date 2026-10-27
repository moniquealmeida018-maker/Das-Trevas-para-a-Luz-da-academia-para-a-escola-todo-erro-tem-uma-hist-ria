export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function reportHtmlResponse(options: {
  title: string;
  subtitle: string;
  body: string;
  pdfHref: string;
}): Response {
  const document = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <style>
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{max-width:900px;margin:0 auto;padding:24px;color:#111;background:#fff;font:15px/1.45 Arial,sans-serif}
    h1{margin:0 0 4px;font:700 28px/1.15 Georgia,serif}h2{margin:24px 0 8px;font:700 19px/1.2 Georgia,serif}
    p{margin:5px 0}.subtitle{margin:0 0 22px;color:#444}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}
    .metric{padding:10px;border:1px solid #999}.metric b{display:block;font-size:20px}.entry{break-inside:avoid;margin:12px 0;padding-top:10px;border-top:1px solid #999}
    .errors{margin:7px 0 0;padding-left:22px}.muted{color:#555}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 22px;padding:12px;border:1px solid #777;background:#f7f7f7}
    .toolbar a,.toolbar button{padding:9px 13px;border:1px solid #111;border-radius:7px;background:#111;color:#fff;font:700 14px Arial,sans-serif;text-decoration:none;cursor:pointer}.toolbar a.secondary{background:#fff;color:#111}
    table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:6px;border:1px solid #888;text-align:left;vertical-align:top}th{background:#eee}
    @media(max-width:650px){body{padding:14px}.summary{grid-template-columns:1fr 1fr}.toolbar>*{width:100%;text-align:center}table{font-size:11px}}
    @media print{body{max-width:none;padding:0;font-size:10pt}.toolbar{display:none}.summary{display:flex;gap:18pt}.metric{padding:0;border:0}.metric b{display:inline;font-size:10pt;margin-right:3pt}h1{font-size:18pt}h2{font-size:12pt}.entry{margin:7pt 0;padding-top:5pt}table{font-size:8pt}th,td{padding:3pt}}
  </style>
</head>
<body>
  <div class="toolbar" aria-label="Ações do documento">
    <a href="${escapeHtml(options.pdfHref)}" target="_blank" rel="noopener">Abrir PDF</a>
    <button type="button" onclick="window.print()">Imprimir ou salvar como PDF</button>
    <a class="secondary" href="/">Voltar ao site</a>
    <span class="muted">Se a impressão não abrir, use Ctrl+P no computador ou a opção Imprimir do navegador.</span>
  </div>
  <h1>${escapeHtml(options.title)}</h1>
  <p class="subtitle">${escapeHtml(options.subtitle)}</p>
  ${options.body}
</body>
</html>`;

  return new Response(document, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'self'",
    },
  });
}
