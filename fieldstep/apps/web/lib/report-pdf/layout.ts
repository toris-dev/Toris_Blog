import type { PDFFont } from "pdf-lib";

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;
export const PAGE_MARGIN = 39.7; // 14 mm
export const HEADER_HEIGHT = 34;
export const FOOTER_HEIGHT = 24;
export const CONTENT_TOP = A4_HEIGHT - PAGE_MARGIN - HEADER_HEIGHT;
export const CONTENT_BOTTOM = PAGE_MARGIN + FOOTER_HEIGHT;
export const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2;
export const APPROVAL_PAGE_MARKER = "FIELDSTEP_APPROVAL_PAGE_V1";
export const APPROVAL_NAME_X = 74;
export const APPROVAL_NAME_Y = 392;
export const APPROVAL_NAME_WIDTH = 190;
export const APPROVAL_SIGNATURE_X = 318;
export const APPROVAL_SIGNATURE_Y = 326;
export const APPROVAL_SIGNATURE_WIDTH = 198;
export const APPROVAL_SIGNATURE_HEIGHT = 96;

const CONTROL_CHARACTER_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;

export function printablePdfText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .replace(CONTROL_CHARACTER_RE, "")
    .replace(EMOJI_RE, "□");
}

function splitLongToken(token: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const result: string[] = [];
  let current = "";
  for (const character of Array.from(token)) {
    const candidate = `${current}${character}`;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      result.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) result.push(current);
  return result.length > 0 ? result : [""];
}

function wordSegments(text: string): string[] {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ko", { granularity: "word" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }
  return text.split(/(\s+)/u).filter(Boolean);
}

export function wrapPdfText(
  value: unknown,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const text = printablePdfText(value);
  if (!text) return [""];
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const segment of wordSegments(paragraph)) {
      const candidate = `${current}${segment}`;
      if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current.trim()) lines.push(current.trimEnd());
      const trimmed = segment.trimStart();
      if (!trimmed) {
        current = "";
        continue;
      }
      if (font.widthOfTextAtSize(trimmed, size) <= maxWidth) {
        current = trimmed;
        continue;
      }
      const pieces = splitLongToken(trimmed, font, size, maxWidth);
      lines.push(...pieces.slice(0, -1));
      current = pieces.at(-1) ?? "";
    }
    if (current || paragraph) lines.push(current.trimEnd());
  }
  return lines.length > 0 ? lines : [""];
}

export function blockHeight(lineCount: number, lineHeight: number, padding = 0): number {
  return Math.max(1, lineCount) * lineHeight + padding * 2;
}

export function fitInside(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}

export function formatKoreanDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return printablePdfText(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function safePdfDate(value: string | null | undefined): Date {
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}
