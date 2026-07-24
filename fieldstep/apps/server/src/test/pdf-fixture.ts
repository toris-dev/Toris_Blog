const encoder = new TextEncoder();
const decoder = new TextDecoder();

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function escapePdfLiteral(value: string): string {
  return value.replace(/([\\()])/gu, "\\$1");
}

/**
 * Creates a complete one-page PDF fixture with a catalog, page tree, content
 * stream, cross-reference table, trailer, and byte-accurate startxref pointer.
 * Keeping this local avoids making the Workers package depend on a PDF parser
 * solely for route tests.
 */
export function minimalParseablePdf(marker = "fieldstep"): Uint8Array {
  const header = "%PDF-1.7\n% Fieldstep deterministic test fixture\n";
  const objectBodies = [
    `<< /Type /Catalog /Pages 2 0 R /FieldstepMarker (${escapePdfLiteral(marker)}) >>`,
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\nendstream",
  ];
  const offsets: number[] = [];
  let body = header;

  objectBodies.forEach((objectBody, index) => {
    offsets.push(byteLength(body));
    body += `${index + 1} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefOffset = byteLength(body);
  const entries = offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  body +=
    `xref\n0 ${objectBodies.length + 1}\n` +
    "0000000000 65535 f \n" +
    entries +
    `trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return encoder.encode(body);
}

/**
 * A small independent structural check for the hand-built fixture. It verifies
 * the cross-reference offsets rather than merely accepting %PDF-/%%EOF framing.
 */
export function hasParseableMinimalPdfStructure(bytes: Uint8Array): boolean {
  const text = decoder.decode(bytes);
  if (!text.startsWith("%PDF-")) return false;

  const startXref = /startxref\n(\d+)\n%%EOF\s*$/u.exec(text);
  if (!startXref) return false;
  const xrefOffset = Number.parseInt(startXref[1] ?? "", 10);
  if (!Number.isSafeInteger(xrefOffset) || !text.startsWith("xref\n", xrefOffset)) {
    return false;
  }

  const xrefLines = text.slice(xrefOffset).split("\n");
  if (xrefLines[1] !== "0 5" || xrefLines[2] !== "0000000000 65535 f ") {
    return false;
  }
  for (let objectNumber = 1; objectNumber <= 4; objectNumber += 1) {
    const entry = /^(\d{10}) 00000 n $/u.exec(xrefLines[objectNumber + 2] ?? "");
    if (!entry) return false;
    const objectOffset = Number.parseInt(entry[1] ?? "", 10);
    if (!text.startsWith(`${objectNumber} 0 obj\n`, objectOffset)) return false;
  }

  return text.includes("trailer\n<< /Size 5 /Root 1 0 R >>");
}
