"use client";

import {
  api,
  fetchApiBlob,
  fetchProtectedMedia,
  type ReportArtifactDescriptor,
  type SignedPdfReceiptResponse,
} from "@/lib/api";
import { blobToPdfImage } from "./images";
import { renderReportPdf } from "./render";
import { stampSignedReportPdf } from "./stamp";
import {
  REPORT_PDF_RENDERER_VERSION,
  type ImmutableReportPdfSource,
  type ReportPdfFonts,
  type ReportPdfProgress,
} from "./types";

export type PdfArtifactProgress =
  | { phase: "source"; message: string }
  | { phase: "images"; completed: number; total: number; message: string }
  | { phase: "render"; progress: ReportPdfProgress; message: string }
  | { phase: "upload"; percent: number; message: string }
  | { phase: "ready"; message: string };

let fontPromise: Promise<ReportPdfFonts> | null = null;

async function fetchStaticBytes(path: string): Promise<Uint8Array> {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`PDF 한글 글꼴을 불러오지 못했습니다 (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function loadReportPdfFonts(): Promise<ReportPdfFonts> {
  fontPromise ??= Promise.all([
    fetchStaticBytes("/fonts/NanumGothic-Regular.ttf"),
    fetchStaticBytes("/fonts/NanumGothic-Bold.ttf"),
  ])
    .then(([regular, semibold]) => ({ regular, semibold }))
    .catch((error) => {
      fontPromise = null;
      throw error;
    });
  return fontPromise;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const owned = bytes.slice().buffer;
  const digest = await crypto.subtle.digest("SHA-256", owned);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice().buffer], { type: "application/pdf" });
}

function dataUrlToPngBytes(dataUrl: string): Uint8Array {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/u.exec(dataUrl);
  if (!match) throw new Error("고객 서명 이미지 형식이 올바르지 않습니다");
  const decoded = atob(match[1]!.replace(/\s/gu, ""));
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

function renderProgressMessage(progress: ReportPdfProgress): string {
  switch (progress.stage) {
    case "font":
      return "한글 글꼴을 포함하는 중";
    case "content":
      return "보고서 본문을 배치하는 중";
    case "photos":
      return "현장 사진을 배치하는 중";
    case "approval-page":
      return "고객 승인 페이지를 만드는 중";
    case "save":
      return "불변 PDF 파일을 저장하는 중";
  }
}

export async function generateApprovalPdfArtifact(
  workOrderId: string,
  version: number,
  onProgress?: (progress: PdfArtifactProgress) => void,
): Promise<ReportArtifactDescriptor> {
  onProgress?.({ phase: "source", message: "확정 보고서 스냅샷을 확인하는 중" });
  const { reportVersion } = await api.workOrders.reportVersion(
    workOrderId,
    version,
  );
  const artifact = reportVersion.artifacts.approval;
  if (!artifact) throw new Error("승인 PDF 산출물 정보가 없습니다");
  if (artifact.status === "ready") return artifact;
  if (!reportVersion.context) {
    throw new Error("보고서의 불변 고객·현장 스냅샷이 없습니다");
  }
  if (artifact.rendererVersion !== REPORT_PDF_RENDERER_VERSION) {
    throw new Error(
      `지원하지 않는 PDF 렌더러 버전입니다: ${artifact.rendererVersion}`,
    );
  }

  try {
    const fonts = await loadReportPdfFonts();
    const imageTotal =
      reportVersion.photos.length + (reportVersion.context.org.logo ? 1 : 0);
    let imageCompleted = 0;
    const notifyImage = (message: string) => {
      imageCompleted += 1;
      onProgress?.({
        phase: "images",
        completed: imageCompleted,
        total: imageTotal,
        message,
      });
    };

    const logo = reportVersion.context.org.logo
      ? await fetchProtectedMedia(reportVersion.context.org.logo.url)
          .then((blob) =>
            blobToPdfImage(blob, {
              id: reportVersion.context!.org.logo!.id,
              kind: "logo",
              caption: reportVersion.context!.org.name,
            }),
          )
          .then((image) => {
            notifyImage("회사 로고를 준비했습니다");
            return image;
          })
      : null;

    const photos = [];
    for (const photo of reportVersion.photos) {
      const blob = await fetchProtectedMedia(photo.url);
      photos.push(
        await blobToPdfImage(blob, {
          id: photo.id,
          kind: photo.kind,
          caption: photo.caption,
          createdAt: photo.createdAt,
        }),
      );
      notifyImage(`현장 사진 ${imageCompleted + 1}/${imageTotal} 준비`);
    }

    const source: ImmutableReportPdfSource = {
      reportVersionId: reportVersion.id,
      workOrderId: reportVersion.workOrderId,
      reportNumber: reportVersion.reportNumber,
      version: reportVersion.version,
      templateVersion: reportVersion.templateVersion,
      rendererVersion: REPORT_PDF_RENDERER_VERSION,
      sourceSha256: artifact.sourceSha256,
      createdAt: reportVersion.createdAt,
      createdBy: reportVersion.createdBy,
      context: {
        ...reportVersion.context,
        org: {
          ...reportVersion.context.org,
          logo,
        },
      },
      structured: reportVersion.structured,
      photos,
    };
    const rendered = await renderReportPdf(source, {
      fonts,
      onProgress: (progress) =>
        onProgress?.({
          phase: "render",
          progress,
          message: renderProgressMessage(progress),
        }),
    });
    const checksumSha256 = await sha256Hex(rendered.bytes);
    const upload = await api.workOrders.uploadReportArtifact(
      workOrderId,
      version,
      "approval",
      {
        blob: bytesToPdfBlob(rendered.bytes),
        checksumSha256,
        onProgress: (percent) =>
          onProgress?.({
            phase: "upload",
            percent,
            message: `비공개 저장소에 PDF 업로드 중 ${percent}%`,
          }),
      },
    );
    onProgress?.({
      phase: "ready",
      message: `${rendered.pageCount}쪽 승인 PDF가 준비되었습니다`,
    });
    return upload.artifact;
  } catch (error) {
    await api.workOrders
      .failReportArtifact(workOrderId, version, "approval", {
        code: "browser_render_failed",
        message:
          error instanceof Error ? error.message : "브라우저 PDF 생성 실패",
      })
      .catch(() => undefined);
    throw error;
  }
}

async function stampAndUploadSignedPdf(args: {
  receipt: SignedPdfReceiptResponse;
  signatureDataUrl: string;
  basePdfUrl: string;
  auth: boolean;
  upload: (
    blob: Blob,
    checksumSha256: string,
    onProgress?: (percent: number) => void,
  ) => Promise<{ artifact: ReportArtifactDescriptor }>;
  onProgress?: (progress: PdfArtifactProgress) => void;
}): Promise<ReportArtifactDescriptor> {
  args.onProgress?.({
    phase: "source",
    message: "승인 원본 PDF와 서버 승인 증빙을 확인하는 중",
  });
  const [basePdf, fonts] = await Promise.all([
    fetchApiBlob(args.basePdfUrl, { auth: args.auth }),
    loadReportPdfFonts(),
  ]);
  const stamped = await stampSignedReportPdf(
    new Uint8Array(await basePdf.arrayBuffer()),
    {
      ...args.receipt,
      signaturePng: dataUrlToPngBytes(args.signatureDataUrl),
    },
    fonts,
  );
  const checksumSha256 = await sha256Hex(stamped.bytes);
  const result = await args.upload(
    bytesToPdfBlob(stamped.bytes),
    checksumSha256,
    (percent) =>
      args.onProgress?.({
        phase: "upload",
        percent,
        message: `서명 PDF 저장 중 ${percent}%`,
      }),
  );
  args.onProgress?.({
    phase: "ready",
    message: `${stamped.pageCount}쪽 서명 PDF가 준비되었습니다`,
  });
  return result.artifact;
}

export async function recoverSignedPdfArtifact(
  workOrderId: string,
  version: number,
  onProgress?: (progress: PdfArtifactProgress) => void,
): Promise<ReportArtifactDescriptor> {
  const prepared = await api.workOrders.prepareSignedArtifact(
    workOrderId,
    version,
  );
  if (prepared.artifact.status === "ready") return prepared.artifact;
  return stampAndUploadSignedPdf({
    receipt: prepared.receipt,
    signatureDataUrl: prepared.receipt.signatureDataUrl,
    basePdfUrl: prepared.basePdfUrl,
    auth: true,
    onProgress,
    upload: (blob, checksumSha256, uploadProgress) =>
      api.workOrders.uploadReportArtifact(
        workOrderId,
        version,
        "signed",
        {
          blob,
          checksumSha256,
          onProgress: uploadProgress,
        },
      ),
  });
}
