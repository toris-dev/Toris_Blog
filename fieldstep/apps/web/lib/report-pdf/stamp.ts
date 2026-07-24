import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import {
  A4_HEIGHT,
  A4_WIDTH,
  APPROVAL_PAGE_MARKER,
  APPROVAL_NAME_WIDTH,
  APPROVAL_NAME_X,
  APPROVAL_NAME_Y,
  APPROVAL_SIGNATURE_HEIGHT,
  APPROVAL_SIGNATURE_WIDTH,
  APPROVAL_SIGNATURE_X,
  APPROVAL_SIGNATURE_Y,
  fitInside,
  formatKoreanDateTime,
  printablePdfText,
  safePdfDate,
  wrapPdfText,
} from "./layout";
import {
  REPORT_PDF_RENDERER_VERSION,
  type ReportPdfFonts,
  type SignedPdfReceipt,
  type StampedSignedPdf,
} from "./types";

const INK = rgb(0.07, 0.12, 0.16);
const MUTED = rgb(0.34, 0.4, 0.44);
const BRAND = rgb(0.03, 0.31, 0.33);
const WHITE = rgb(1, 1, 1);

function subjectField(subject: string, key: string): string | null {
  const prefix = `${key}=`;
  const field = subject
    .split(";")
    .find((candidate) => candidate.startsWith(prefix));
  return field ? field.slice(prefix.length) : null;
}

export async function stampSignedReportPdf(
  approvalPdfBytes: Uint8Array,
  receipt: SignedPdfReceipt,
  fonts: ReportPdfFonts,
): Promise<StampedSignedPdf> {
  if (!/^[a-f0-9]{64}$/u.test(receipt.sourceSha256)) {
    throw new Error("서명 PDF source hash가 올바르지 않습니다");
  }
  const document = await PDFDocument.load(approvalPdfBytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const subject = document.getSubject() ?? "";
  if (subjectField(subject, "reportVersionId") !== receipt.reportVersionId) {
    throw new Error("승인 PDF와 서버 승인 증빙의 보고서 버전이 다릅니다");
  }
  if (
    subjectField(subject, "approvalPageMarker") !== APPROVAL_PAGE_MARKER ||
    subjectField(subject, "approvalPageIndex") !==
      String(Math.max(0, document.getPageCount() - 1))
  ) {
    throw new Error("승인 PDF의 고정 고객 확인 페이지를 검증하지 못했습니다");
  }
  document.registerFontkit(fontkit);
  const regular = await document.embedFont(fonts.regular, { subset: true });
  const semibold = fonts.semibold
    ? await document.embedFont(fonts.semibold, { subset: true })
    : regular;
  const pages = document.getPages();
  const approvalPageIndex = pages.length - 1;
  const page = pages[approvalPageIndex];
  if (!page) throw new Error("승인 PDF에 고객 확인 페이지가 없습니다");
  const { width, height } = page.getSize();
  if (Math.abs(width - A4_WIDTH) > 0.5 || Math.abs(height - A4_HEIGHT) > 0.5) {
    throw new Error("승인 PDF의 마지막 페이지가 A4 형식이 아닙니다");
  }

  page.drawRectangle({
    x: APPROVAL_NAME_X + 1,
    y: APPROVAL_NAME_Y - 54,
    width: APPROVAL_NAME_WIDTH - 2,
    height: 53,
    color: WHITE,
  });
  const signer = receipt.signerTitle
    ? `${receipt.signerName} (${receipt.signerTitle})`
    : receipt.signerName;
  const signerLines = wrapPdfText(
    signer,
    semibold,
    11,
    APPROVAL_NAME_WIDTH - 16,
  ).slice(0, 2);
  let signerY = APPROVAL_NAME_Y - 20;
  for (const line of signerLines) {
    page.drawText(printablePdfText(line), {
      x: APPROVAL_NAME_X + 8,
      y: signerY,
      size: 11,
      font: semibold,
      color: INK,
    });
    signerY -= 14;
  }

  page.drawRectangle({
    x: APPROVAL_NAME_X + 1,
    y: 258,
    width: APPROVAL_NAME_WIDTH - 2,
    height: 40,
    color: WHITE,
  });
  page.drawText(formatKoreanDateTime(receipt.approvedAt), {
    x: APPROVAL_NAME_X + 8,
    y: 273,
    size: 9.2,
    font: regular,
    color: INK,
  });

  page.drawRectangle({
    x: APPROVAL_SIGNATURE_X + 1,
    y: APPROVAL_SIGNATURE_Y + 1,
    width: APPROVAL_SIGNATURE_WIDTH - 2,
    height: APPROVAL_SIGNATURE_HEIGHT - 2,
    color: WHITE,
  });
  const signature = await document.embedPng(receipt.signaturePng);
  const fitted = fitInside(
    signature.width,
    signature.height,
    APPROVAL_SIGNATURE_WIDTH - 16,
    APPROVAL_SIGNATURE_HEIGHT - 16,
  );
  page.drawImage(signature, {
    x: APPROVAL_SIGNATURE_X + (APPROVAL_SIGNATURE_WIDTH - fitted.width) / 2,
    y: APPROVAL_SIGNATURE_Y + (APPROVAL_SIGNATURE_HEIGHT - fitted.height) / 2,
    width: fitted.width,
    height: fitted.height,
  });
  page.drawText("승인 완료", {
    x: APPROVAL_SIGNATURE_X + 7,
    y: APPROVAL_SIGNATURE_Y + 6,
    size: 6.8,
    font: semibold,
    color: BRAND,
  });
  page.drawText(`동의문 ${printablePdfText(receipt.agreementVersion)}`, {
    x: APPROVAL_NAME_X,
    y: 235,
    size: 7.4,
    font: regular,
    color: MUTED,
  });

  document.setSubject(
    `reportVersionId=${receipt.reportVersionId};approvalRequestId=${receipt.approvalRequestId};signedSourceSha256=${receipt.sourceSha256}`,
  );
  document.setKeywords([
    "fieldstep",
    "작업완료보고서",
    "고객승인",
    `report-version:${receipt.reportVersionId}`,
    `approval-request:${receipt.approvalRequestId}`,
    `source-sha256:${receipt.sourceSha256}`,
  ]);
  document.setModificationDate(safePdfDate(receipt.approvedAt));
  document.setProducer(`Fieldstep ${REPORT_PDF_RENDERER_VERSION} signed-stamp`);

  const bytes = await document.save({
    addDefaultPage: false,
    objectsPerTick: 25,
    useObjectStreams: true,
  });
  return {
    bytes,
    pageCount: pages.length,
    approvalPageIndex,
    sourceSha256: receipt.sourceSha256,
    rendererVersion: REPORT_PDF_RENDERER_VERSION,
  };
}
