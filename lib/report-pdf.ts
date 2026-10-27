export type PdfBlock = {
  text: string;
  style?: "title" | "heading" | "body" | "small";
  indent?: number;
};

const WIN_1252: Record<string, number> = {
  "€": 128, "‚": 130, "ƒ": 131, "„": 132, "…": 133, "†": 134,
  "‡": 135, "ˆ": 136, "‰": 137, "Š": 138, "‹": 139, "Œ": 140,
  "Ž": 142, "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149,
  "–": 150, "—": 151, "˜": 152, "™": 153, "š": 154, "›": 155,
  "œ": 156, "ž": 158, "Ÿ": 159,
};

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/↔/g, "<->")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/⇒/g, "=>")
    .replace(/\s+/g, " ")
    .trim();
}

function toBytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of value) {
    const code = character.codePointAt(0) ?? 63;
    if (WIN_1252[character] !== undefined) bytes.push(WIN_1252[character]);
    else if (code <= 255) bytes.push(code);
    else bytes.push(63);
  }
  return new Uint8Array(bytes);
}

function joinBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }
  return joined;
}

function escapePdfText(value: unknown): string {
  return cleanText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value: unknown, limit: number): string[] {
  const words = cleanText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (let word of words) {
    while (word.length > limit) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > limit) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [" "];
}

export function buildTextPdf(blocks: PdfBlock[]): Uint8Array {
  const top = 790;
  const bottom = 48;
  const left = 42;
  const styles = {
    title: { font: "F2", size: 16, leading: 22, limit: 60, after: 8 },
    heading: { font: "F2", size: 12, leading: 17, limit: 76, after: 4 },
    body: { font: "F1", size: 9.5, leading: 13, limit: 94, after: 3 },
    small: { font: "F1", size: 8, leading: 11, limit: 108, after: 3 },
  } as const;
  const pages: Array<Array<{ text: string; font: string; size: number; x: number; y: number }>> = [[]];
  let y = top;

  const nextPage = () => {
    pages.push([]);
    y = top;
  };

  for (const block of blocks) {
    const styleName = block.style ?? "body";
    const style = styles[styleName];
    if (styleName === "heading" && y < bottom + 55) nextPage();
    const paragraphs = String(block.text ?? "").split(/\n+/);

    paragraphs.forEach((paragraph, paragraphIndex) => {
      for (const line of wrapText(paragraph, style.limit)) {
        if (y - style.leading < bottom) nextPage();
        pages[pages.length - 1].push({
          text: line,
          font: style.font,
          size: style.size,
          x: left + (block.indent ?? 0),
          y,
        });
        y -= style.leading;
      }
      if (paragraphIndex < paragraphs.length - 1) y -= style.leading / 2;
    });
    y -= style.after;
  }

  const objects: Array<string | null> = [null];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const commands = ["0 g"];
    for (const line of page) {
      commands.push(`BT /${line.font} ${line.size} Tf 1 0 0 1 ${line.x} ${line.y} Tm (${escapePdfText(line.text)}) Tj ET`);
    }
    commands.push(`BT /F1 8 Tf 1 0 0 1 42 26 Tm (${escapePdfText(`Das trevas para a luz - Página ${index + 1} de ${pages.length}`)}) Tj ET`);
    const stream = commands.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${toBytes(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  const chunks = [toBytes("%PDF-1.4\n%âãÏÓ\n")];
  const offsets = [0];
  let offset = chunks[0].length;

  for (let id = 1; id < objects.length; id++) {
    const bytes = toBytes(`${id} 0 obj\n${objects[id]}\nendobj\n`);
    offsets[id] = offset;
    chunks.push(bytes);
    offset += bytes.length;
  }

  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  chunks.push(toBytes(xref));
  return joinBytes(chunks);
}

export function pdfResponse(filename: string, blocks: PdfBlock[]): Response {
  const pdf = buildTextPdf(blocks);
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
