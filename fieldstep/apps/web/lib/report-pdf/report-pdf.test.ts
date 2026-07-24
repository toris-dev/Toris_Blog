import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  A4_HEIGHT,
  A4_WIDTH,
  APPROVAL_PAGE_MARKER,
} from "./layout";
import { renderReportPdf } from "./render";
import { stampSignedReportPdf } from "./stamp";
import {
  REPORT_PDF_RENDERER_VERSION,
  type ImmutableReportPdfSource,
  type ReportPdfFonts,
} from "./types";

const ONE_PIXEL_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlL8AAAAASUVORK5CYII=",
    "base64",
  ),
);

async function fonts(): Promise<ReportPdfFonts> {
  const fontRoot = new URL("../../public/fonts/", import.meta.url);
  const [regular, semibold] = await Promise.all([
    readFile(new URL("NanumGothic-Regular.ttf", fontRoot)),
    readFile(new URL("NanumGothic-Bold.ttf", fontRoot)),
  ]);
  return {
    regular: new Uint8Array(regular),
    semibold: new Uint8Array(semibold),
  };
}

function fixture(): ImmutableReportPdfSource {
  const longKorean =
    "산업용 냉동기 정기점검을 수행하고 압축기 진동, 냉매 압력, 전기 단자 체결 상태를 확인했습니다. ".repeat(
      18,
    );
  return {
    reportVersionId: "report-version-v2",
    workOrderId: "work-order-1",
    reportNumber: "FS-20260723-001",
    version: 2,
    templateVersion: 1,
    rendererVersion: REPORT_PDF_RENDERER_VERSION,
    sourceSha256: "a".repeat(64),
    createdAt: "2026-07-23T08:30:00.000Z",
    createdBy: "office-user-1",
    context: {
      org: {
        name: "토리스 산업현장 서비스 주식회사",
        businessNo: "123-45-67890",
        address: "서울특별시 영등포구 산업로 123",
        contactName: "박현장",
        contactPhone: "02-1234-5678",
        contactEmail: "field-service@example.com",
        logo: null,
      },
      workOrder: {
        id: "work-order-1",
        scheduledDate: "2026-07-23",
        scheduledTime: "14:30",
        workType: "산업용 냉동기 정기점검 및 예방정비",
        request: longKorean,
      },
      customer: {
        id: "customer-1",
        name: "대한산업 제1공장",
        businessNo: "987-65-43210",
        address: "경기도 화성시 산업단지로 987",
        contactName: "김승인",
        contactPhone: "010-1234-5678",
      },
      site: {
        id: "site-1",
        name: "제1공장 냉동기계실",
        address: "A동 지하 1층 기계실",
      },
      asset: {
        id: "asset-1",
        name: "터보 냉동기 1호기",
        model: "TRB-800K",
        serialNo: "SN-2026-0001",
      },
      assigneeNames: ["이기술", "최안전"],
    },
    structured: {
      workSummary: longKorean,
      actions: Array.from(
        { length: 18 },
        (_, index) => `${index + 1}. 예방정비 조치 — ${longKorean.slice(0, 120)}`,
      ),
      usedParts: Array.from({ length: 35 }, (_, index) => ({
        name: `산업용 교체부품 ${index + 1}`,
        model: `MODEL-${String(index + 1).padStart(3, "0")}`,
        quantity: index + 1,
        unit: "개",
      })),
      checklist: Array.from({ length: 30 }, (_, index) => ({
        id: `check-${index + 1}`,
        label: `안전·설비 점검 항목 ${index + 1}`,
        checked: index % 4 !== 0,
        note: index % 4 === 0 ? "추가 확인 및 후속 조치 필요" : undefined,
      })),
      fieldNotes: longKorean,
      issues: ["압축기 베어링 구간에서 기준치 이상의 미세 진동이 측정됨"],
      recommendations: [
        "다음 정기점검 전에 베어링 진동 추세를 재측정할 것을 권고함",
      ],
      nextInspectionDate: "2026-10-23",
    },
    photos: Array.from({ length: 20 }, (_, index) => ({
      id: `photo-${index + 1}`,
      kind:
        index < 7 ? ("before" as const) : index < 14 ? ("after" as const) : ("other" as const),
      bytes: ONE_PIXEL_PNG,
      mimeType: "image/png" as const,
      caption: `현장 증빙 사진 ${index + 1} — 냉동기 설비 상태`,
      createdAt: `2026-07-23T08:${String(index).padStart(2, "0")}:00.000Z`,
    })),
  };
}

describe("Korean A4 report PDF renderer", () => {
  it(
    "paginates long Korean content and 20 photos, then stamps the fixed approval page",
    async () => {
      const source = fixture();
      const reportFonts = await fonts();
      const rendered = await renderReportPdf(source, { fonts: reportFonts });
      expect(rendered.pageCount).toBeGreaterThan(5);
      expect(rendered.approvalPageIndex).toBe(rendered.pageCount - 1);
      expect(rendered.bytes.byteLength).toBeGreaterThan(10_000);

      const parsed = await PDFDocument.load(rendered.bytes);
      expect(parsed.getPageCount()).toBe(rendered.pageCount);
      expect(parsed.getTitle()).toContain("작업완료보고서");
      expect(parsed.getAuthor()).toBe(source.context.org.name);
      expect(parsed.getSubject()).toContain(
        `reportVersionId=${source.reportVersionId}`,
      );
      expect(parsed.getSubject()).toContain(
        `approvalPageMarker=${APPROVAL_PAGE_MARKER}`,
      );
      for (const page of parsed.getPages()) {
        const size = page.getSize();
        expect(size.width).toBeCloseTo(A4_WIDTH, 1);
        expect(size.height).toBeCloseTo(A4_HEIGHT, 1);
      }

      const signed = await stampSignedReportPdf(
        rendered.bytes,
        {
          reportVersionId: source.reportVersionId,
          approvalRequestId: "approval-request-1",
          sourceSha256: "b".repeat(64),
          signerName: "김승인",
          signerTitle: "공장장",
          approvedAt: "2026-07-23T09:00:00.000Z",
          agreementVersion: "approval-consent-v1",
          signaturePng: ONE_PIXEL_PNG,
        },
        reportFonts,
      );
      expect(signed.pageCount).toBe(rendered.pageCount);
      expect(signed.approvalPageIndex).toBe(rendered.pageCount - 1);
      const signedParsed = await PDFDocument.load(signed.bytes);
      expect(signedParsed.getPageCount()).toBe(rendered.pageCount);
      expect(signedParsed.getSubject()).toContain(
        "approvalRequestId=approval-request-1",
      );
      expect(signedParsed.getSubject()).toContain(
        `signedSourceSha256=${"b".repeat(64)}`,
      );
    },
    30_000,
  );

  it("refuses to stamp a different immutable report version", async () => {
    const reportFonts = await fonts();
    const rendered = await renderReportPdf(fixture(), { fonts: reportFonts });
    await expect(
      stampSignedReportPdf(
        rendered.bytes,
        {
          reportVersionId: "different-report-version",
          approvalRequestId: "approval-request-2",
          sourceSha256: "c".repeat(64),
          signerName: "김승인",
          signerTitle: null,
          approvedAt: "2026-07-23T09:00:00.000Z",
          agreementVersion: "approval-consent-v1",
          signaturePng: ONE_PIXEL_PNG,
        },
        reportFonts,
      ),
    ).rejects.toThrow("보고서 버전이 다릅니다");
  });

  it("paginates one oversized Korean paragraph instead of clipping it", async () => {
    const source = fixture();
    const oversized =
      "설비 점검 결과와 계측값, 안전 확인 사항을 고객에게 빠짐없이 설명합니다. ".repeat(
        300,
      );
    source.context.workOrder.request = null;
    source.structured = {
      ...source.structured,
      workSummary: oversized,
      actions: [],
      usedParts: [],
      checklist: [],
      fieldNotes: "",
      issues: [],
      recommendations: [],
      nextInspectionDate: null,
    };
    source.photos = [];

    const rendered = await renderReportPdf(source, {
      fonts: await fonts(),
    });

    expect(rendered.pageCount).toBeGreaterThan(4);
    expect(rendered.approvalPageIndex).toBe(rendered.pageCount - 1);
  });

  it("refuses a same-version PDF without the fixed approval-page marker", async () => {
    const source = fixture();
    const reportFonts = await fonts();
    const rendered = await renderReportPdf(source, { fonts: reportFonts });
    const tampered = await PDFDocument.load(rendered.bytes);
    tampered.setSubject(`reportVersionId=${source.reportVersionId}`);

    await expect(
      stampSignedReportPdf(
        await tampered.save(),
        {
          reportVersionId: source.reportVersionId,
          approvalRequestId: "approval-request-3",
          sourceSha256: "d".repeat(64),
          signerName: "김승인",
          signerTitle: null,
          approvedAt: "2026-07-23T09:00:00.000Z",
          agreementVersion: "approval-consent-v1",
          signaturePng: ONE_PIXEL_PNG,
        },
        reportFonts,
      ),
    ).rejects.toThrow("고정 고객 확인 페이지");
  });
});
