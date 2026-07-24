import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
} from "pdf-lib";
import {
  A4_HEIGHT,
  A4_WIDTH,
  APPROVAL_NAME_WIDTH,
  APPROVAL_NAME_X,
  APPROVAL_NAME_Y,
  APPROVAL_PAGE_MARKER,
  APPROVAL_SIGNATURE_HEIGHT,
  APPROVAL_SIGNATURE_WIDTH,
  APPROVAL_SIGNATURE_X,
  APPROVAL_SIGNATURE_Y,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  CONTENT_WIDTH,
  PAGE_MARGIN,
  blockHeight,
  fitInside,
  formatKoreanDateTime,
  printablePdfText,
  safePdfDate,
  wrapPdfText,
} from "./layout";
import {
  REPORT_PDF_RENDERER_VERSION,
  type ImmutableReportPdfSource,
  type RenderedReportPdf,
  type RenderReportPdfOptions,
  type ReportPdfBinaryImage,
} from "./types";

const COLORS = {
  ink: rgb(0.07, 0.12, 0.16),
  muted: rgb(0.34, 0.4, 0.44),
  line: rgb(0.79, 0.82, 0.82),
  pale: rgb(0.95, 0.97, 0.96),
  brand: rgb(0.03, 0.31, 0.33),
  accent: rgb(0.91, 0.3, 0.08),
  white: rgb(1, 1, 1),
} as const;

const BODY_SIZE = 9.2;
const BODY_LINE_HEIGHT = 14;
const SMALL_SIZE = 7.6;
const SECTION_SIZE = 11.2;

function photoKindLabel(kind: ReportPdfBinaryImage["kind"]): string {
  switch (kind) {
    case "before":
      return "작업 전";
    case "after":
      return "작업 후";
    case "other":
      return "기타";
    case "logo":
      return "회사 로고";
  }
}

function rightAlignedX(font: PDFFont, text: string, size: number, right: number): number {
  return Math.max(PAGE_MARGIN, right - font.widthOfTextAtSize(text, size));
}

function ellipsizeText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const suffix = "…";
  let end = text.length;
  while (
    end > 0 &&
    font.widthOfTextAtSize(`${text.slice(0, end)}${suffix}`, size) > maxWidth
  ) {
    end -= 1;
  }
  return `${text.slice(0, end)}${suffix}`;
}

function drawLines(args: {
  page: PDFPage;
  lines: string[];
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  lineHeight: number;
  color?: ReturnType<typeof rgb>;
}): number {
  let y = args.y;
  for (const line of args.lines) {
    if (line) {
      args.page.drawText(line, {
        x: args.x,
        y,
        size: args.size,
        font: args.font,
        color: args.color ?? COLORS.ink,
      });
    }
    y -= args.lineHeight;
  }
  return y;
}

async function embedImage(
  document: PDFDocument,
  image: ReportPdfBinaryImage,
): Promise<PDFImage> {
  if (image.mimeType === "image/jpeg") return document.embedJpg(image.bytes);
  if (image.mimeType === "image/png") return document.embedPng(image.bytes);
  throw new Error(`PDF에서 지원하지 않는 사진 형식입니다: ${image.mimeType satisfies never}`);
}

class ReportLayout {
  readonly pages: PDFPage[] = [];
  private page!: PDFPage;
  private cursorY = CONTENT_TOP;

  constructor(
    private readonly document: PDFDocument,
    private readonly source: ImmutableReportPdfSource,
    private readonly regular: PDFFont,
    private readonly semibold: PDFFont,
  ) {}

  private drawPageHeader(page: PDFPage): void {
    const reportId = `${this.source.reportNumber} · v${this.source.version}`;
    const reportIdX = rightAlignedX(
      this.regular,
      reportId,
      SMALL_SIZE,
      A4_WIDTH - PAGE_MARGIN,
    );
    page.drawText(
      ellipsizeText(
        this.semibold,
        printablePdfText(this.source.context.org.name),
        SMALL_SIZE,
        Math.max(60, reportIdX - PAGE_MARGIN - 12),
      ),
      {
        x: PAGE_MARGIN,
        y: A4_HEIGHT - PAGE_MARGIN + 4,
        size: SMALL_SIZE,
        font: this.semibold,
        color: COLORS.brand,
      },
    );
    page.drawText(reportId, {
      x: reportIdX,
      y: A4_HEIGHT - PAGE_MARGIN + 4,
      size: SMALL_SIZE,
      font: this.regular,
      color: COLORS.muted,
    });
    page.drawLine({
      start: { x: PAGE_MARGIN, y: A4_HEIGHT - PAGE_MARGIN - 7 },
      end: { x: A4_WIDTH - PAGE_MARGIN, y: A4_HEIGHT - PAGE_MARGIN - 7 },
      thickness: 0.7,
      color: COLORS.line,
    });
  }

  addPage(): PDFPage {
    this.page = this.document.addPage([A4_WIDTH, A4_HEIGHT]);
    this.pages.push(this.page);
    this.drawPageHeader(this.page);
    this.cursorY = CONTENT_TOP;
    return this.page;
  }

  ensureSpace(height: number): void {
    if (!this.page || this.cursorY - height < CONTENT_BOTTOM) this.addPage();
  }

  private availableLines(lineHeight: number, verticalPadding: number): number {
    return Math.max(
      0,
      Math.floor(
        (this.cursorY - CONTENT_BOTTOM - verticalPadding * 2) / lineHeight,
      ),
    );
  }

  gap(height: number): void {
    this.cursorY -= height;
  }

  drawTitle(logo: PDFImage | null): void {
    this.ensureSpace(86);
    if (logo) {
      const fitted = fitInside(logo.width, logo.height, 92, 42);
      this.page.drawImage(logo, {
        x: PAGE_MARGIN,
        y: this.cursorY - fitted.height,
        width: fitted.width,
        height: fitted.height,
      });
    } else {
      this.page.drawRectangle({
        x: PAGE_MARGIN,
        y: this.cursorY - 28,
        width: 7,
        height: 28,
        color: COLORS.accent,
      });
    }
    const textX = logo ? PAGE_MARGIN + 108 : PAGE_MARGIN + 17;
    this.page.drawText("작업완료보고서", {
      x: textX,
      y: this.cursorY - 3,
      size: 22,
      font: this.semibold,
      color: COLORS.ink,
    });
    this.page.drawText("FIELD SERVICE COMPLETION REPORT", {
      x: textX,
      y: this.cursorY - 22,
      size: 7.4,
      font: this.regular,
      color: COLORS.muted,
    });
    const created = `확정 ${formatKoreanDateTime(this.source.createdAt)}`;
    this.page.drawText(created, {
      x: rightAlignedX(this.regular, created, SMALL_SIZE, A4_WIDTH - PAGE_MARGIN),
      y: this.cursorY - 3,
      size: SMALL_SIZE,
      font: this.regular,
      color: COLORS.muted,
    });
    this.page.drawText(`보고서 ${this.source.reportNumber}`, {
      x: rightAlignedX(
        this.semibold,
        `보고서 ${this.source.reportNumber}`,
        BODY_SIZE,
        A4_WIDTH - PAGE_MARGIN,
      ),
      y: this.cursorY - 19,
      size: BODY_SIZE,
      font: this.semibold,
      color: COLORS.brand,
    });
    this.cursorY -= 65;
  }

  drawInfoRows(rows: Array<[string, string, string, string]>): void {
    const half = CONTENT_WIDTH / 2;
    const labelWidth = 58;
    for (const [leftLabel, leftValue, rightLabel, rightValue] of rows) {
      const leftLines = wrapPdfText(leftValue || "-", this.regular, BODY_SIZE, half - labelWidth - 18);
      const rightLines = wrapPdfText(rightValue || "-", this.regular, BODY_SIZE, half - labelWidth - 18);
      const totalLines = Math.max(leftLines.length, rightLines.length);
      let offset = 0;
      while (offset < totalLines) {
        if (
          this.cursorY - CONTENT_BOTTOM < 28 ||
          this.availableLines(BODY_LINE_HEIGHT, 6) < 1
        ) {
          this.addPage();
        }
        const lineCount = Math.min(
          totalLines - offset,
          this.availableLines(BODY_LINE_HEIGHT, 6),
        );
        const leftChunk = leftLines.slice(offset, offset + lineCount);
        const rightChunk = rightLines.slice(offset, offset + lineCount);
        const height = Math.max(
          28,
          blockHeight(lineCount, BODY_LINE_HEIGHT, 6),
        );
        this.page.drawRectangle({
          x: PAGE_MARGIN,
          y: this.cursorY - height,
          width: CONTENT_WIDTH,
          height,
          borderColor: COLORS.line,
          borderWidth: 0.5,
        });
        this.page.drawRectangle({
          x: PAGE_MARGIN,
          y: this.cursorY - height,
          width: labelWidth,
          height,
          color: COLORS.pale,
        });
        this.page.drawRectangle({
          x: PAGE_MARGIN + half,
          y: this.cursorY - height,
          width: labelWidth,
          height,
          color: COLORS.pale,
        });
        this.page.drawLine({
          start: { x: PAGE_MARGIN + half, y: this.cursorY },
          end: { x: PAGE_MARGIN + half, y: this.cursorY - height },
          thickness: 0.5,
          color: COLORS.line,
        });
        this.page.drawText(leftLabel, {
          x: PAGE_MARGIN + 8,
          y: this.cursorY - 18,
          size: SMALL_SIZE,
          font: this.semibold,
          color: COLORS.muted,
        });
        this.page.drawText(rightLabel, {
          x: PAGE_MARGIN + half + 8,
          y: this.cursorY - 18,
          size: SMALL_SIZE,
          font: this.semibold,
          color: COLORS.muted,
        });
        drawLines({
          page: this.page,
          lines: leftChunk,
          x: PAGE_MARGIN + labelWidth + 8,
          y: this.cursorY - 17,
          font: this.regular,
          size: BODY_SIZE,
          lineHeight: BODY_LINE_HEIGHT,
        });
        drawLines({
          page: this.page,
          lines: rightChunk,
          x: PAGE_MARGIN + half + labelWidth + 8,
          y: this.cursorY - 17,
          font: this.regular,
          size: BODY_SIZE,
          lineHeight: BODY_LINE_HEIGHT,
        });
        this.cursorY -= height;
        offset += lineCount;
      }
    }
  }

  drawFullInfoRow(label: string, value: string): void {
    const labelWidth = 58;
    const lines = wrapPdfText(value || "-", this.regular, BODY_SIZE, CONTENT_WIDTH - labelWidth - 16);
    let offset = 0;
    while (offset < lines.length) {
      if (
        this.cursorY - CONTENT_BOTTOM < 28 ||
        this.availableLines(BODY_LINE_HEIGHT, 6) < 1
      ) {
        this.addPage();
      }
      const lineCount = Math.min(
        lines.length - offset,
        this.availableLines(BODY_LINE_HEIGHT, 6),
      );
      const chunk = lines.slice(offset, offset + lineCount);
      const height = Math.max(
        28,
        blockHeight(chunk.length, BODY_LINE_HEIGHT, 6),
      );
      this.page.drawRectangle({
        x: PAGE_MARGIN,
        y: this.cursorY - height,
        width: CONTENT_WIDTH,
        height,
        borderColor: COLORS.line,
        borderWidth: 0.5,
      });
      this.page.drawRectangle({
        x: PAGE_MARGIN,
        y: this.cursorY - height,
        width: labelWidth,
        height,
        color: COLORS.pale,
      });
      this.page.drawText(label, {
        x: PAGE_MARGIN + 8,
        y: this.cursorY - 18,
        size: SMALL_SIZE,
        font: this.semibold,
        color: COLORS.muted,
      });
      drawLines({
        page: this.page,
        lines: chunk,
        x: PAGE_MARGIN + labelWidth + 8,
        y: this.cursorY - 17,
        font: this.regular,
        size: BODY_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
      });
      this.cursorY -= height;
      offset += lineCount;
    }
  }

  sectionTitle(title: string): void {
    this.ensureSpace(32);
    this.cursorY -= 14;
    this.page.drawRectangle({
      x: PAGE_MARGIN,
      y: this.cursorY - 2,
      width: 4,
      height: 13,
      color: COLORS.accent,
    });
    this.page.drawText(printablePdfText(title), {
      x: PAGE_MARGIN + 11,
      y: this.cursorY,
      size: SECTION_SIZE,
      font: this.semibold,
      color: COLORS.ink,
    });
    this.cursorY -= 19;
  }

  paragraph(value: string): void {
    const lines = wrapPdfText(value || "-", this.regular, BODY_SIZE, CONTENT_WIDTH - 12);
    let offset = 0;
    while (offset < lines.length) {
      if (this.availableLines(BODY_LINE_HEIGHT, 6) < 1) this.addPage();
      const lineCount = Math.min(
        lines.length - offset,
        this.availableLines(BODY_LINE_HEIGHT, 6),
      );
      const chunk = lines.slice(offset, offset + lineCount);
      const height = blockHeight(chunk.length, BODY_LINE_HEIGHT, 6);
      this.page.drawRectangle({
        x: PAGE_MARGIN,
        y: this.cursorY - height,
        width: CONTENT_WIDTH,
        height,
        color: COLORS.pale,
      });
      drawLines({
        page: this.page,
        lines: chunk,
        x: PAGE_MARGIN + 7,
        y: this.cursorY - 16,
        font: this.regular,
        size: BODY_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
      });
      this.cursorY -= height;
      offset += lineCount;
    }
  }

  bulletList(items: string[]): void {
    if (items.length === 0) {
      this.paragraph("-");
      return;
    }
    for (const item of items) {
      const lines = wrapPdfText(item, this.regular, BODY_SIZE, CONTENT_WIDTH - 25);
      let offset = 0;
      while (offset < lines.length) {
        if (this.availableLines(BODY_LINE_HEIGHT, 2) < 1) this.addPage();
        const lineCount = Math.min(
          lines.length - offset,
          this.availableLines(BODY_LINE_HEIGHT, 2),
        );
        const chunk = lines.slice(offset, offset + lineCount);
        const height = blockHeight(chunk.length, BODY_LINE_HEIGHT, 2);
        this.page.drawText("·", {
          x: PAGE_MARGIN + 4,
          y: this.cursorY - 12,
          size: 12,
          font: this.semibold,
          color: COLORS.brand,
        });
        drawLines({
          page: this.page,
          lines: chunk,
          x: PAGE_MARGIN + 17,
          y: this.cursorY - 12,
          font: this.regular,
          size: BODY_SIZE,
          lineHeight: BODY_LINE_HEIGHT,
        });
        this.cursorY -= height;
        offset += lineCount;
      }
    }
  }

  private drawTableHeader(columns: Array<{ label: string; width: number }>): void {
    const height = 24;
    this.ensureSpace(height);
    let x = PAGE_MARGIN;
    for (const column of columns) {
      this.page.drawRectangle({
        x,
        y: this.cursorY - height,
        width: column.width,
        height,
        color: COLORS.brand,
      });
      this.page.drawText(column.label, {
        x: x + 6,
        y: this.cursorY - 16,
        size: SMALL_SIZE,
        font: this.semibold,
        color: COLORS.white,
      });
      x += column.width;
    }
    this.cursorY -= height;
  }

  drawPartsTable(): void {
    const parts = this.source.structured.usedParts;
    if (parts.length === 0) return;
    const columns = [
      { label: "품명", width: 172 },
      { label: "모델", width: 142 },
      { label: "수량", width: 66 },
      { label: "단위", width: CONTENT_WIDTH - 380 },
    ];
    this.drawTableHeader(columns);
    for (const part of parts) {
      const values = [
        part.name,
        part.model ?? "-",
        String(part.quantity),
        part.unit,
      ];
      const lines = values.map((value, index) =>
        wrapPdfText(value, this.regular, BODY_SIZE, columns[index]!.width - 12),
      );
      const totalLines = Math.max(...lines.map((row) => row.length));
      let offset = 0;
      while (offset < totalLines) {
        if (
          this.cursorY - CONTENT_BOTTOM < 25 ||
          this.availableLines(BODY_LINE_HEIGHT, 5) < 1
        ) {
          this.addPage();
          this.drawTableHeader(columns);
        }
        const lineCount = Math.min(
          totalLines - offset,
          this.availableLines(BODY_LINE_HEIGHT, 5),
        );
        const height = Math.max(
          25,
          blockHeight(lineCount, BODY_LINE_HEIGHT, 5),
        );
        let x = PAGE_MARGIN;
        for (let index = 0; index < columns.length; index += 1) {
          const column = columns[index]!;
          this.page.drawRectangle({
            x,
            y: this.cursorY - height,
            width: column.width,
            height,
            borderColor: COLORS.line,
            borderWidth: 0.5,
          });
          drawLines({
            page: this.page,
            lines: lines[index]!.slice(offset, offset + lineCount),
            x: x + 6,
            y: this.cursorY - 16,
            font: this.regular,
            size: BODY_SIZE,
            lineHeight: BODY_LINE_HEIGHT,
          });
          x += column.width;
        }
        this.cursorY -= height;
        offset += lineCount;
      }
    }
  }

  drawChecklist(): void {
    const checklist = this.source.structured.checklist;
    if (checklist.length === 0) return;
    for (const item of checklist) {
      const mark = item.checked ? "완료" : "미완료";
      const note = item.note ? ` · ${item.note}` : "";
      this.bulletList([`[${mark}] ${item.label}${note}`]);
    }
  }

  async drawPhotos(
    photos: ReportPdfBinaryImage[],
    onProgress?: RenderReportPdfOptions["onProgress"],
  ): Promise<void> {
    if (photos.length === 0) return;
    const gap = 12;
    const cellWidth = (CONTENT_WIDTH - gap) / 2;
    const imageHeight = 141;
    const captionHeight = 30;
    const rowHeight = imageHeight + captionHeight + 8;

    for (let index = 0; index < photos.length; index += 2) {
      this.ensureSpace(rowHeight);
      const row = photos.slice(index, index + 2);
      for (let column = 0; column < row.length; column += 1) {
        const photo = row[column]!;
        const embedded = await embedImage(this.document, photo);
        const x = PAGE_MARGIN + column * (cellWidth + gap);
        const imageBoxY = this.cursorY - imageHeight;
        this.page.drawRectangle({
          x,
          y: imageBoxY,
          width: cellWidth,
          height: imageHeight,
          color: COLORS.pale,
          borderColor: COLORS.line,
          borderWidth: 0.5,
        });
        const fitted = fitInside(embedded.width, embedded.height, cellWidth - 8, imageHeight - 8);
        this.page.drawImage(embedded, {
          x: x + (cellWidth - fitted.width) / 2,
          y: imageBoxY + (imageHeight - fitted.height) / 2,
          width: fitted.width,
          height: fitted.height,
        });
        const caption = `${photoKindLabel(photo.kind)}${photo.caption ? ` · ${photo.caption}` : ""}`;
        const lines = wrapPdfText(caption, this.regular, SMALL_SIZE, cellWidth - 4).slice(0, 2);
        drawLines({
          page: this.page,
          lines,
          x: x + 2,
          y: imageBoxY - 12,
          font: this.regular,
          size: SMALL_SIZE,
          lineHeight: 11,
          color: COLORS.muted,
        });
        onProgress?.({
          stage: "photos",
          completed: Math.min(index + column + 1, photos.length),
          total: photos.length,
        });
      }
      this.cursorY -= rowHeight;
    }
  }

  addApprovalPage(): number {
    this.addPage();
    const pageIndex = this.pages.length - 1;
    this.page.drawText("고객 확인 및 간편 승인", {
      x: PAGE_MARGIN,
      y: 710,
      size: 20,
      font: this.semibold,
      color: COLORS.ink,
    });
    this.page.drawText("CUSTOMER ACKNOWLEDGEMENT", {
      x: PAGE_MARGIN,
      y: 692,
      size: SMALL_SIZE,
      font: this.regular,
      color: COLORS.muted,
    });
    const statement = [
      "본 확인은 위 작업완료보고서의 내용과 작업 수행 사실을 확인하기 위한 간편 승인입니다.",
      "공인전자서명 또는 별도 계약 체결을 보증하지 않습니다.",
    ];
    drawLines({
      page: this.page,
      lines: statement.flatMap((line) =>
        wrapPdfText(line, this.regular, BODY_SIZE, CONTENT_WIDTH),
      ),
      x: PAGE_MARGIN,
      y: 645,
      font: this.regular,
      size: BODY_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: COLORS.muted,
    });
    this.page.drawRectangle({
      x: PAGE_MARGIN,
      y: 458,
      width: CONTENT_WIDTH,
      height: 112,
      color: COLORS.pale,
    });
    this.page.drawText("승인 대상", {
      x: PAGE_MARGIN + 16,
      y: 542,
      size: SMALL_SIZE,
      font: this.semibold,
      color: COLORS.muted,
    });
    this.page.drawText(`${this.source.reportNumber} · v${this.source.version}`, {
      x: PAGE_MARGIN + 16,
      y: 520,
      size: 13,
      font: this.semibold,
      color: COLORS.brand,
    });
    this.page.drawText(
      ellipsizeText(
        this.regular,
        `고객 ${printablePdfText(this.source.context.customer.name)}`,
        BODY_SIZE,
        218,
      ),
      {
        x: PAGE_MARGIN + 16,
        y: 493,
        size: BODY_SIZE,
        font: this.regular,
        color: COLORS.ink,
      },
    );
    this.page.drawText(
      ellipsizeText(
        this.regular,
        `현장 ${printablePdfText(this.source.context.site.name)}`,
        BODY_SIZE,
        218,
      ),
      {
        x: PAGE_MARGIN + 254,
        y: 493,
        size: BODY_SIZE,
        font: this.regular,
        color: COLORS.ink,
      },
    );

    this.page.drawText("승인자", {
      x: APPROVAL_NAME_X,
      y: 423,
      size: SMALL_SIZE,
      font: this.semibold,
      color: COLORS.muted,
    });
    this.page.drawRectangle({
      x: APPROVAL_NAME_X,
      y: APPROVAL_NAME_Y - 55,
      width: APPROVAL_NAME_WIDTH,
      height: 55,
      borderColor: COLORS.line,
      borderWidth: 0.7,
    });
    this.page.drawText("승인 시각", {
      x: APPROVAL_NAME_X,
      y: 313,
      size: SMALL_SIZE,
      font: this.semibold,
      color: COLORS.muted,
    });
    this.page.drawRectangle({
      x: APPROVAL_NAME_X,
      y: 257,
      width: APPROVAL_NAME_WIDTH,
      height: 42,
      borderColor: COLORS.line,
      borderWidth: 0.7,
    });
    this.page.drawText("서명", {
      x: APPROVAL_SIGNATURE_X,
      y: 423,
      size: SMALL_SIZE,
      font: this.semibold,
      color: COLORS.muted,
    });
    this.page.drawRectangle({
      x: APPROVAL_SIGNATURE_X,
      y: APPROVAL_SIGNATURE_Y,
      width: APPROVAL_SIGNATURE_WIDTH,
      height: APPROVAL_SIGNATURE_HEIGHT,
      borderColor: COLORS.line,
      borderWidth: 0.7,
    });
    this.page.drawText("고객 승인 링크에서 이름·동의·서명을 제출하면 이 슬롯에 승인 증빙이 고정됩니다.", {
      x: PAGE_MARGIN,
      y: 205,
      size: SMALL_SIZE,
      font: this.regular,
      color: COLORS.muted,
    });
    this.page.drawText(APPROVAL_PAGE_MARKER, {
      x: PAGE_MARGIN,
      y: 191,
      size: 1,
      font: this.regular,
      color: COLORS.white,
    });
    return pageIndex;
  }

  drawFooters(): void {
    const total = this.pages.length;
    const company = [
      this.source.context.org.businessNo
        ? `사업자 ${this.source.context.org.businessNo}`
        : "",
      this.source.context.org.contactPhone ?? "",
      this.source.context.org.contactEmail ?? "",
    ]
      .filter(Boolean)
      .join(" · ");
    this.pages.forEach((page, index) => {
      page.drawLine({
        start: { x: PAGE_MARGIN, y: PAGE_MARGIN + 18 },
        end: { x: A4_WIDTH - PAGE_MARGIN, y: PAGE_MARGIN + 18 },
        thickness: 0.5,
        color: COLORS.line,
      });
      const left = `${this.source.reportNumber} · v${this.source.version}${
        company ? ` · ${company}` : ""
      }`;
      const count = `${index + 1} / ${total}`;
      const countX = rightAlignedX(
        this.semibold,
        count,
        SMALL_SIZE,
        A4_WIDTH - PAGE_MARGIN,
      );
      page.drawText(
        ellipsizeText(
          this.regular,
          left,
          6.8,
          Math.max(40, countX - PAGE_MARGIN - 12),
        ),
        {
          x: PAGE_MARGIN,
          y: PAGE_MARGIN + 5,
          size: 6.8,
          font: this.regular,
          color: COLORS.muted,
        },
      );
      page.drawText(count, {
        x: countX,
        y: PAGE_MARGIN + 5,
        size: SMALL_SIZE,
        font: this.semibold,
        color: COLORS.brand,
      });
    });
  }
}

function formatAsset(source: ImmutableReportPdfSource): string {
  const asset = source.context.asset;
  if (!asset) return "-";
  const detail = [asset.model, asset.serialNo].filter(Boolean).join(" / ");
  return detail ? `${asset.name} (${detail})` : asset.name;
}

function reportInfoRows(source: ImmutableReportPdfSource): Array<[string, string, string, string]> {
  const { context } = source;
  return [
    [
      "고객사",
      context.customer.name,
      "현장",
      context.site.name,
    ],
    [
      "작업일",
      `${context.workOrder.scheduledDate}${
        context.workOrder.scheduledTime ? ` ${context.workOrder.scheduledTime}` : ""
      }`,
      "작업유형",
      context.workOrder.workType,
    ],
    [
      "장비",
      formatAsset(source),
      "작업자",
      context.assigneeNames.join(", ") || "-",
    ],
  ];
}

export async function renderReportPdf(
  source: ImmutableReportPdfSource,
  options: RenderReportPdfOptions,
): Promise<RenderedReportPdf> {
  if (source.rendererVersion !== REPORT_PDF_RENDERER_VERSION) {
    throw new Error(`지원하지 않는 PDF 렌더러 버전입니다: ${source.rendererVersion}`);
  }
  if (!/^[a-f0-9]{64}$/u.test(source.sourceSha256)) {
    throw new Error("보고서 source hash가 올바르지 않습니다");
  }
  options.onProgress?.({ stage: "font", completed: 0, total: 1 });
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const regular = await document.embedFont(options.fonts.regular, {
    subset: true,
  });
  const semibold = options.fonts.semibold
    ? await document.embedFont(options.fonts.semibold, { subset: true })
    : regular;
  options.onProgress?.({ stage: "font", completed: 1, total: 1 });

  document.setTitle(`작업완료보고서 ${source.reportNumber}`);
  document.setAuthor(printablePdfText(source.context.org.name));
  document.setCreator(REPORT_PDF_RENDERER_VERSION);
  document.setProducer(`Fieldstep ${REPORT_PDF_RENDERER_VERSION}`);
  document.setKeywords([
    "fieldstep",
    "작업완료보고서",
    `report-version:${source.reportVersionId}`,
    `source-sha256:${source.sourceSha256}`,
  ]);
  document.setCreationDate(safePdfDate(source.createdAt));
  document.setModificationDate(safePdfDate(source.createdAt));
  document.setLanguage("ko-KR");

  const layout = new ReportLayout(document, source, regular, semibold);
  layout.addPage();
  const logo = source.context.org.logo
    ? await embedImage(document, source.context.org.logo)
    : null;
  layout.drawTitle(logo);
  layout.drawInfoRows(reportInfoRows(source));
  if (source.context.customer.address || source.context.site.address) {
    layout.drawFullInfoRow(
      "주소",
      [source.context.customer.address, source.context.site.address]
        .filter(Boolean)
        .join(" / "),
    );
  }
  if (source.context.workOrder.request) {
    layout.drawFullInfoRow("요청사항", source.context.workOrder.request);
  }

  options.onProgress?.({ stage: "content", completed: 0, total: 7 });
  layout.sectionTitle("작업 요약");
  layout.paragraph(source.structured.workSummary);
  options.onProgress?.({ stage: "content", completed: 1, total: 7 });

  layout.sectionTitle("조치 사항");
  layout.bulletList(source.structured.actions);
  options.onProgress?.({ stage: "content", completed: 2, total: 7 });

  if (source.structured.checklist.length > 0) {
    layout.sectionTitle("점검 체크리스트");
    layout.drawChecklist();
  }
  options.onProgress?.({ stage: "content", completed: 3, total: 7 });

  if (source.structured.usedParts.length > 0) {
    layout.sectionTitle("사용 부품");
    layout.drawPartsTable();
  }
  options.onProgress?.({ stage: "content", completed: 4, total: 7 });

  if (source.structured.issues.length > 0 || source.structured.fieldNotes) {
    layout.sectionTitle("특이사항 및 현장 메모");
    layout.bulletList([
      ...source.structured.issues,
      ...(source.structured.fieldNotes ? [source.structured.fieldNotes] : []),
    ]);
  }
  options.onProgress?.({ stage: "content", completed: 5, total: 7 });

  if (source.structured.recommendations.length > 0 || source.structured.nextInspectionDate) {
    layout.sectionTitle("권고 및 다음 점검");
    layout.bulletList([
      ...source.structured.recommendations,
      ...(source.structured.nextInspectionDate
        ? [`다음 점검일: ${source.structured.nextInspectionDate}`]
        : []),
    ]);
  }
  options.onProgress?.({ stage: "content", completed: 6, total: 7 });

  const photos = source.photos
    .filter((photo) => photo.kind !== "logo")
    .sort((left, right) => {
      const order = { before: 0, after: 1, other: 2, logo: 3 } as const;
      const kindOrder = order[left.kind] - order[right.kind];
      if (kindOrder !== 0) return kindOrder;
      return (left.createdAt ?? "").localeCompare(right.createdAt ?? "");
    });
  if (photos.length > 0) {
    layout.sectionTitle("현장 사진");
    await layout.drawPhotos(photos, options.onProgress);
  }
  options.onProgress?.({ stage: "content", completed: 7, total: 7 });

  options.onProgress?.({ stage: "approval-page", completed: 0, total: 1 });
  const approvalPageIndex = layout.addApprovalPage();
  document.setSubject(
    `reportVersionId=${source.reportVersionId};sourceSha256=${source.sourceSha256};templateVersion=${source.templateVersion};approvalPageIndex=${approvalPageIndex};approvalPageMarker=${APPROVAL_PAGE_MARKER}`,
  );
  layout.drawFooters();
  options.onProgress?.({ stage: "approval-page", completed: 1, total: 1 });

  options.onProgress?.({ stage: "save", completed: 0, total: 1 });
  const bytes = await document.save({
    addDefaultPage: false,
    objectsPerTick: 25,
    useObjectStreams: true,
  });
  options.onProgress?.({ stage: "save", completed: 1, total: 1 });
  return {
    bytes,
    pageCount: layout.pages.length,
    approvalPageIndex,
    sourceSha256: source.sourceSha256,
    rendererVersion: REPORT_PDF_RENDERER_VERSION,
  };
}
