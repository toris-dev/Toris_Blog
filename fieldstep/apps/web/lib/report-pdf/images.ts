import type {
  ReportPdfBinaryImage,
  ReportPdfImageKind,
  ReportPdfImageMimeType,
} from "./types";

const MAX_REPORT_IMAGE_EDGE = 1_280;
const REPORT_JPEG_QUALITY = 0.82;

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("보고서용 JPEG를 만들지 못했습니다"));
      },
      "image/jpeg",
      REPORT_JPEG_QUALITY,
    );
  });
}

async function loadHtmlImage(
  blob: Blob,
): Promise<{ image: HTMLImageElement; cleanup: () => void }> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("사진을 열지 못했습니다"));
      image.src = url;
    });
    return {
      image,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/**
 * Browser-only normalizer. It applies browser EXIF orientation and guarantees
 * a PDF-compatible, bounded JPEG without retaining the decoded bitmap.
 */
export async function normalizeReportImage(
  blob: Blob,
  args: {
    id: string;
    kind: ReportPdfImageKind;
    caption?: string | null;
    createdAt?: string;
    maxEdge?: number;
  },
): Promise<ReportPdfBinaryImage> {
  if (!blob.type.startsWith("image/")) {
    throw new Error("사진 파일만 보고서에 넣을 수 있습니다");
  }
  const maxEdge = args.maxEdge ?? MAX_REPORT_IMAGE_EDGE;
  let source: CanvasImageSource;
  let sourceWidth: number;
  let sourceHeight: number;
  let bitmap: ImageBitmap | null = null;
  let htmlImageCleanup: (() => void) | null = null;

  if (typeof createImageBitmap === "function") {
    try {
      bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      bitmap = null;
    }
  }
  if (bitmap) {
    source = bitmap;
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
  } else {
    const loaded = await loadHtmlImage(blob);
    source = loaded.image;
    sourceWidth = loaded.image.naturalWidth;
    sourceHeight = loaded.image.naturalHeight;
    htmlImageCleanup = loaded.cleanup;
  }

  try {
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error("사진 크기를 확인할 수 없습니다");
    }
    const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("사진 변환 기능을 사용할 수 없습니다");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    const jpeg = await canvasToJpeg(canvas);
    return {
      id: args.id,
      kind: args.kind,
      caption: args.caption ?? null,
      createdAt: args.createdAt,
      mimeType: "image/jpeg",
      bytes: new Uint8Array(await jpeg.arrayBuffer()),
    };
  } finally {
    bitmap?.close();
    htmlImageCleanup?.();
  }
}

export async function blobToPdfImage(
  blob: Blob,
  args: {
    id: string;
    kind: ReportPdfImageKind;
    caption?: string | null;
    createdAt?: string;
  },
): Promise<ReportPdfBinaryImage> {
  if (blob.type === "image/jpeg" || blob.type === "image/png") {
    return {
      id: args.id,
      kind: args.kind,
      caption: args.caption ?? null,
      createdAt: args.createdAt,
      mimeType: blob.type as ReportPdfImageMimeType,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    };
  }
  return normalizeReportImage(blob, args);
}
